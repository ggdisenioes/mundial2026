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
  af_at?: string | null; // última llamada a API-Football (throttle de cuota)
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

// ── API-Football (api-sports.io) — fuente secundaria, sólo para el cuadro ───
// Resuelve los equipos de las llaves (sobre todo los terceros) más rápido que
// football-data.org. Es best-effort: si falta la key, falla o se agota la
// cuota, simplemente no se usa y se cae en football-data.
const AF_BASE = "https://v3.football.api-sports.io";
const AF_THROTTLE_MS = 20 * 60_000; // máx. 1 llamada cada 20 min (cuota free 100/día)

const AF_ROUND_TO_STAGE: Record<string, string> = {
  "Round of 32": "LAST_32",
  "Round of 16": "LAST_16",
  "Quarter-finals": "QUARTER_FINALS",
  "Semi-finals": "SEMI_FINALS",
  "3rd Place Final": "THIRD_PLACE",
  "Final": "FINAL",
};
const AF_FINISHED = new Set(["FT", "AET", "PEN", "AWD", "WO"]);
const AF_LIVE = new Set(["1H", "2H", "HT", "ET", "BT", "P", "LIVE", "INT", "SUSP"]);
// Nombres de equipos en API-Football que no estén ya en FDORG_NAME_TO_CODE.
const AF_EXTRAS: Record<string, string> = {
  "IR Iran": "IRN", "Korea Republic": "KOR", "Czechia": "CZE",
  "Cape Verde": "CPV", "Congo DR": "CGO",
};

function afCode(name: string | null | undefined): string | null {
  if (!name) return null;
  return FDORG_NAME_TO_CODE[name] ?? AF_EXTRAS[name] ?? null;
}

interface AfFixture {
  fixture?: { id?: number; date?: string; status?: { short?: string } };
  league?: { round?: string };
  teams?: {
    home?: { name?: string | null; winner?: boolean | null };
    away?: { name?: string | null; winner?: boolean | null };
  };
  goals?: { home?: number | null; away?: number | null };
  score?: { penalty?: { home?: number | null; away?: number | null } };
}

async function fetchApiFootballBracket(): Promise<BracketMatch[] | null> {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return null;
  const res = await fetch(`${AF_BASE}/fixtures?league=1&season=2026`, {
    headers: { "x-apisports-key": key },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const data = await res.json();
  const arr = (data?.response ?? []) as AfFixture[];
  if (!Array.isArray(arr) || arr.length === 0) return null;

  const out: BracketMatch[] = [];
  for (const f of arr) {
    const stage = AF_ROUND_TO_STAGE[f.league?.round ?? ""];
    if (!stage) continue;
    const hCode = afCode(f.teams?.home?.name);
    const aCode = afCode(f.teams?.away?.name);
    const short = f.fixture?.status?.short ?? "";
    const status = AF_FINISHED.has(short) ? "FINISHED" : AF_LIVE.has(short) ? "IN_PLAY" : "TIMED";
    const hg = f.goals?.home ?? null;
    const ag = f.goals?.away ?? null;
    let winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null = null;
    if (f.teams?.home?.winner === true) winner = "HOME_TEAM";
    else if (f.teams?.away?.winner === true) winner = "AWAY_TEAM";
    else if (status === "FINISHED" && hg != null && ag != null) winner = hg > ag ? "HOME_TEAM" : hg < ag ? "AWAY_TEAM" : "DRAW";
    out.push({
      id: Number(f.fixture?.id ?? 0),
      stage,
      utcDate: f.fixture?.date ?? "",
      status,
      home: hCode,
      away: aCode,
      homeName: hCode ? TEAMS[hCode].name : "",
      awayName: aCode ? TEAMS[aCode].name : "",
      homeGoals: hg,
      awayGoals: ag,
      winner,
      penHome: f.score?.penalty?.home ?? null,
      penAway: f.score?.penalty?.away ?? null,
      duration: null,
    });
  }
  return out;
}

const byUtc = (a: BracketMatch, b: BracketMatch) => (a.utcDate < b.utcDate ? -1 : a.utcDate > b.utcDate ? 1 : 0);

// Combina el cuadro de football-data (base, con marcadores en vivo) con una
// fuente secundaria (API-Football o el cuadro previo), rellenando SÓLO los
// equipos/marcadores que falten. Empareja por ronda + orden de fecha.
function mergeBracket(fd: BracketMatch[], src: BracketMatch[] | null | undefined): BracketMatch[] {
  if (!src || !src.length) return fd;
  const stages = Array.from(new Set([...fd, ...src].map(m => m.stage)));
  const out: BracketMatch[] = [];
  for (const st of stages) {
    const fdS = fd.filter(m => m.stage === st).sort(byUtc);
    const srcS = src.filter(m => m.stage === st).sort(byUtc);
    if (!fdS.length) { out.push(...srcS); continue; }
    fdS.forEach((m, i) => {
      const s = srcS[i];
      if (s) {
        if (!m.home && s.home) { m.home = s.home; m.homeName = s.homeName; }
        if (!m.away && s.away) { m.away = s.away; m.awayName = s.awayName; }
        if (m.homeGoals == null && s.homeGoals != null) {
          m.homeGoals = s.homeGoals; m.awayGoals = s.awayGoals;
          m.winner = s.winner; m.status = s.status;
          m.penHome = s.penHome; m.penAway = s.penAway;
        }
      }
      out.push(m);
    });
  }
  return out;
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

// Diagnóstico (read-only): por qué API-Football devuelve (o no) datos.
export async function debugApiFootball() {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) return { ok: false, reason: "API_FOOTBALL_KEY no configurada" };
  try {
    const res = await fetch(`${AF_BASE}/fixtures?league=1&season=2026`, {
      headers: { "x-apisports-key": key }, cache: "no-store",
    });
    const text = await res.text();
    let json: { errors?: unknown; results?: number; response?: unknown[] } | null = null;
    try { json = JSON.parse(text); } catch { json = null; }
    const resp = Array.isArray(json?.response) ? json!.response : [];
    return {
      ok: res.ok,
      http_status: res.status,
      errors: json?.errors ?? null,
      results: json?.results ?? null,
      response_count: resp.length,
      sample: resp.slice(0, 1),
      raw_head: text.slice(0, 400),
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "error" };
  }
}

// Diagnóstico (read-only): devuelve el cuadro de cada fuente para comparar.
export async function debugBracketSources() {
  const key = process.env.FOOTBALLDATA_KEY;
  let fd: BracketMatch[] = [];
  if (key) {
    const res = await fetch(`${BASE}/competitions/WC/matches?season=2026`, {
      headers: { "X-Auth-Token": key }, cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      fd = buildBracket((data.matches ?? []) as FdMatch[]);
    }
  }
  let af: BracketMatch[] | null = null;
  try { af = await fetchApiFootballBracket(); } catch { af = null; }
  const merged = mergeBracket(fd, af);
  return { hasAfKey: !!process.env.API_FOOTBALL_KEY, fd, af, merged };
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
  // Una vez cargado un resultado, queda CONGELADO: el sync no lo reescribe. Así
  // P1/P2 y el bonus (más goleador/goleado) no fluctúan si el proveedor ajusta
  // los goles más tarde. (El admin sigue pudiendo editarlo a mano en el panel.)
  const scores: (MatchScore | null)[] = MATCHES.map(([home, away], idx) => {
    if (curScores[idx]) return curScores[idx];
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
    return null;
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

  // ── Cuadro: football-data como base + API-Football para resolver equipos ──
  const fdBracket = buildBracket(matches);
  let bracket = fdBracket;
  let afAtToSave: string | null = null;
  try {
    const { data: setRow } = await supabaseAdmin
      .from("settings").select("sync_meta").eq("id", 1).single();
    const meta = (setRow?.sync_meta as SyncMeta | null) ?? null;
    const afFresh = !meta?.af_at || Date.now() - new Date(meta.af_at).getTime() > AF_THROTTLE_MS;
    const af = (process.env.API_FOOTBALL_KEY && afFresh) ? await fetchApiFootballBracket() : null;
    // Si no llamamos a API-Football, arrastramos los equipos ya resueltos antes.
    bracket = mergeBracket(fdBracket, af ?? curKO._bracket ?? null);
    afAtToSave = af ? new Date().toISOString() : (meta?.af_at ?? null);
  } catch (e) {
    console.warn("sync: API-Football no disponible, uso football-data:", e);
    bracket = mergeBracket(fdBracket, curKO._bracket ?? null);
  }

  const knockout: KnockoutResults = {
    winner:   winner   || curKO.winner   || "",
    runnerUp: runnerUp || curKO.runnerUp || "",
    semis: mergeRound(sfLosers,  curKO.semis, 2),
    qf:    mergeRound(qfLosers,  curKO.qf,    4),
    r16:   mergeRound(r16losers, curKO.r16,   8),
    r32:   mergeRound(r32losers, curKO.r32,  16),
    // El cuadro va embebido dentro de knockout: así no requiere columna nueva.
    _bracket: bracket,
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
    af_at: afAtToSave,
  });

  return summary;
}
