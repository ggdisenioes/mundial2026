import { supabaseAdmin } from "./supabase-admin";
import { MATCHES, TEAMS, FDORG_NAME_TO_CODE } from "./matches";
import type { MatchScore, KnockoutResults, BracketMatch } from "@/types";

const BASE = "https://api.football-data.org/v4";
const THROTTLE_MS = 10 * 60_000; // 10 min

// Rondas eliminatorias, en orden cronológico de disputa.
const KO_STAGES = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];

interface FdMatch {
  id: number;
  status: string;
  stage: string;
  utcDate: string;
  homeTeam: { name: string | null };
  awayTeam: { name: string | null };
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    duration?: string | null;
    fullTime: { home: number | null; away: number | null };
    penalties?: { home: number | null; away: number | null } | null;
  };
}

interface SyncMeta {
  last_at: string | null;
  ok: boolean | null;
  msg: string;
  played: number;
}

function teamCode(name: string | null): string | null {
  return name ? FDORG_NAME_TO_CODE[name] ?? null : null;
}

function teamName(fdName: string | null): string {
  if (!fdName) return "";
  const code = teamCode(fdName);
  return code ? TEAMS[code]?.name ?? fdName : fdName;
}

// Construye el cuadro de eliminatorias a partir de los partidos de la API.
// Se ordena por id (≈ nº de partido FIFA) para que el armado de las llaves
// en la UI use el orden oficial del cuadro.
function buildBracket(matches: FdMatch[]): BracketMatch[] {
  return matches
    .filter(m => KO_STAGES.includes(m.stage))
    .map(m => {
      const hCode = teamCode(m.homeTeam?.name ?? null);
      const aCode = teamCode(m.awayTeam?.name ?? null);
      return {
        id: m.id,
        stage: m.stage,
        utcDate: m.utcDate,
        status: m.status,
        home: hCode,
        away: aCode,
        homeName: hCode ? TEAMS[hCode].name : (m.homeTeam?.name ?? ""),
        awayName: aCode ? TEAMS[aCode].name : (m.awayTeam?.name ?? ""),
        homeGoals: m.score?.fullTime?.home ?? null,
        awayGoals: m.score?.fullTime?.away ?? null,
        winner: m.score?.winner ?? null,
        penHome: m.score?.penalties?.home ?? null,
        penAway: m.score?.penalties?.away ?? null,
        duration: m.score?.duration ?? null,
      };
    })
    .sort((a, b) => a.id - b.id);
}

const pad = (arr: string[], n: number) =>
  Array.from({ length: n }, (_, i) => arr[i] ?? "");

function mergeRound(api: string[], existing: string[] | undefined, n: number): string[] {
  const a = pad(api, n), e = pad(existing ?? [], n);
  return a.filter(Boolean).length >= e.filter(Boolean).length ? a : e;
}

async function saveMeta(meta: SyncMeta) {
  await supabaseAdmin
    .from("settings")
    .update({ sync_meta: meta })
    .eq("id", 1);
}

export async function isThrottled(): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("settings")
    .select("sync_meta")
    .eq("id", 1)
    .single();
  const last = (data?.sync_meta as SyncMeta | null)?.last_at;
  if (!last) return false;
  return Date.now() - new Date(last).getTime() < THROTTLE_MS;
}

export interface SyncSummary {
  played: number;
  knockout_matches: number;
}

export async function runSync(): Promise<SyncSummary> {
  const key = process.env.FOOTBALLDATA_KEY;
  if (!key) throw new Error("FOOTBALLDATA_KEY no configurada");

  // Fetch – filter by season to avoid mixing 2022 data
  const res = await fetch(`${BASE}/competitions/WC/matches?season=2026`, {
    headers: { "X-Auth-Token": key },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API football-data ${res.status}: ${text}`);
  }

  const data = await res.json();
  const matches: FdMatch[] = data.matches ?? [];

  // Load current row so sync never wipes manually-entered data
  const { data: cur, error: curErr } = await supabaseAdmin
    .from("resultados")
    .select("scores, knockout")
    .eq("id", 1)
    .single();
  if (curErr) throw new Error(curErr.message);

  const curScores: (MatchScore | null)[] = Array.isArray(cur?.scores) ? cur.scores : [];
  const curKO: Partial<KnockoutResults> = cur?.knockout ?? {};

  // ── Group stage scores ──────────────────────────────────────────────────
  const scores: (MatchScore | null)[] = MATCHES.map(([home, away], idx) => {
    const fix = matches.find(m =>
      (m.status === "FINISHED" || m.status === "AWARDED") &&
      m.stage === "GROUP_STAGE" &&
      (
        (teamCode(m.homeTeam.name) === home && teamCode(m.awayTeam.name) === away) ||
        (teamCode(m.homeTeam.name) === away && teamCode(m.awayTeam.name) === home)
      ),
    );
    if (fix) {
      const normalOrder = teamCode(fix.homeTeam.name) === home;
      return {
        h: normalOrder ? (fix.score.fullTime.home ?? 0) : (fix.score.fullTime.away ?? 0),
        a: normalOrder ? (fix.score.fullTime.away ?? 0) : (fix.score.fullTime.home ?? 0),
      };
    }
    return curScores[idx] ?? null;
  });

  // ── Knockout ────────────────────────────────────────────────────────────
  const finished = matches.filter(
    m => m.status === "FINISHED" && m.stage !== "GROUP_STAGE" && m.stage !== "THIRD_PLACE",
  );

  const r32losers: string[] = [], r16losers: string[] = [],
    qfLosers: string[] = [], sfLosers: string[] = [];
  let winner = "", runnerUp = "";

  for (const m of finished) {
    const w = m.score.winner;
    if (!w || w === "DRAW") continue;
    const loser = teamName(w === "HOME_TEAM" ? m.awayTeam.name : m.homeTeam.name);
    const champ = teamName(w === "HOME_TEAM" ? m.homeTeam.name : m.awayTeam.name);
    switch (m.stage) {
      case "LAST_32":         r32losers.push(loser); break;
      case "LAST_16":         r16losers.push(loser); break;
      case "QUARTER_FINALS":  qfLosers.push(loser);  break;
      case "SEMI_FINALS":     sfLosers.push(loser);  break;
      case "FINAL":           winner = champ; runnerUp = loser; break;
    }
  }

  const knockout: KnockoutResults = {
    winner:   winner   || curKO.winner   || "",
    runnerUp: runnerUp || curKO.runnerUp || "",
    semis: mergeRound(sfLosers,  curKO.semis, 2),
    qf:    mergeRound(qfLosers,  curKO.qf,    4),
    r16:   mergeRound(r16losers, curKO.r16,   8),
    r32:   mergeRound(r32losers, curKO.r32,  16),
    // El cuadro va embebido dentro de knockout: así no requiere columna nueva.
    _bracket: buildBracket(matches),
  };

  // ── Persist ─────────────────────────────────────────────────────────────
  const { error } = await supabaseAdmin
    .from("resultados")
    .update({ scores, knockout, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new Error(error.message);

  const summary: SyncSummary = { played: scores.filter(Boolean).length, knockout_matches: finished.length };

  // Store result in settings.sync_meta for visibility
  await saveMeta({
    last_at: new Date().toISOString(),
    ok: true,
    msg: `${summary.played} partidos cargados, ${summary.knockout_matches} eliminatoria`,
    played: summary.played,
  });

  return summary;
}
