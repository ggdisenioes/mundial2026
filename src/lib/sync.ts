import { supabaseAdmin } from "./supabase-admin";
import { MATCHES, TEAMS, FDORG_NAME_TO_CODE } from "./matches";
import type { MatchScore, KnockoutResults } from "@/types";

const BASE = "https://api.football-data.org/v4";
const THROTTLE_MS = 10 * 60_000; // 10 min

interface FdMatch {
  status: string;
  stage: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    fullTime: { home: number | null; away: number | null };
  };
}

interface SyncMeta {
  last_at: string | null;
  ok: boolean | null;
  msg: string;
  played: number;
}

function teamCode(name: string): string | null {
  return FDORG_NAME_TO_CODE[name] ?? null;
}

function teamName(fdName: string): string {
  const code = teamCode(fdName);
  return code ? TEAMS[code]?.name ?? fdName : fdName;
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
    next: { revalidate: 0 },
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
      m.status === "FINISHED" &&
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
