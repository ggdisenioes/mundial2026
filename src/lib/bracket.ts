import type { BracketMatch, MatchScore } from "@/types";
import { TEAMS } from "./matches";
import { R32_TEMPLATE, resolveSlot, teamSlotSig, thirdTeamFor } from "./standings";

// Ronda siguiente de cada una.
export const NEXT: Record<string, string> = {
  LAST_32: "LAST_16",
  LAST_16: "QUARTER_FINALS",
  QUARTER_FINALS: "SEMI_FINALS",
  SEMI_FINALS: "FINAL",
};

// Árbol del cuadro. `l` = índices de la ronda actual que forman la llave;
// `r` = índice de la ronda siguiente que alimentan.
//   R16: M89=W74+W77, M90=W73+W75, M91=W76+W78, M92=W79+W80,
//        M93=W83+W84, M94=W81+W82, M95=W86+W88, M96=W85+W87
//   Cuartos: M97=W89+W90, M98=W93+W94, M99=W91+W92, M100=W95+W96.
export const BRACKET_ORDER: Record<string, { l: [number, number]; r: number }[]> = {
  LAST_32: [
    { l: [0, 2], r: 1 }, { l: [1, 4], r: 0 }, { l: [9, 8], r: 5 }, { l: [11, 10], r: 4 },
    { l: [3, 5], r: 2 }, { l: [6, 7], r: 3 }, { l: [12, 14], r: 7 }, { l: [15, 13], r: 6 },
  ],
  LAST_16: [{ l: [0, 1], r: 0 }, { l: [4, 5], r: 1 }, { l: [2, 3], r: 2 }, { l: [6, 7], r: 3 }],
  QUARTER_FINALS: [{ l: [0, 1], r: 0 }, { l: [2, 3], r: 1 }],
  SEMI_FINALS: [{ l: [0, 1], r: 0 }],
};

// Calendario oficial de los 16avos (UTC), en orden de plantilla (M73→M88).
export const R32_DATES = [
  "2026-06-28T19:00:00Z", "2026-06-29T20:30:00Z", "2026-06-30T01:00:00Z", "2026-06-29T17:00:00Z",
  "2026-06-30T21:00:00Z", "2026-06-30T17:00:00Z", "2026-07-01T01:00:00Z", "2026-07-01T16:00:00Z",
  "2026-07-02T00:00:00Z", "2026-07-01T20:00:00Z", "2026-07-02T23:00:00Z", "2026-07-02T19:00:00Z",
  "2026-07-03T03:00:00Z", "2026-07-03T22:00:00Z", "2026-07-04T01:30:00Z", "2026-07-03T18:00:00Z",
];

export function buildR32(api: BracketMatch[], scores: (MatchScore | null)[]): BracketMatch[] {
  const realR32 = api.filter(m => m.stage === "LAST_32");
  const sig = (c: string | null) => (c ? teamSlotSig(c, scores) : null);

  return R32_TEMPLATE.map(([hs, as_], i) => {
    let home = resolveSlot(hs, scores);
    let away = resolveSlot(as_, scores);
    if (!away && as_ === "3" && hs !== "3") away = thirdTeamFor(hs.slice(1), scores);
    if (!home && hs === "3" && as_ !== "3") home = thirdTeamFor(as_.slice(1), scores);
    let homeGoals: number | null = null, awayGoals: number | null = null;
    let winner: BracketMatch["winner"] = null;
    let penHome: number | null = null, penAway: number | null = null;
    let status = "TIMED", utcDate = R32_DATES[i] ?? "";

    const fits = (s: string | null) => !!s && s !== "3" && (s === hs || s === as_);
    const real = realR32.find(m => fits(sig(m.home)) || fits(sig(m.away)));

    if (real) {
      const swap = !!real.away && sig(real.away) === hs && hs !== "3";
      const ph = swap ? real.away : real.home;
      const pa = swap ? real.home : real.away;
      if (ph) home = ph;
      if (pa) away = pa;
      homeGoals = swap ? real.awayGoals : real.homeGoals;
      awayGoals = swap ? real.homeGoals : real.awayGoals;
      winner = swap
        ? (real.winner === "HOME_TEAM" ? "AWAY_TEAM" : real.winner === "AWAY_TEAM" ? "HOME_TEAM" : real.winner)
        : real.winner;
      penHome = swap ? real.penAway : real.penHome;
      penAway = swap ? real.penHome : real.penAway;
      status = real.status;
      utcDate = real.utcDate;
    }

    return {
      id: 73 + i, stage: "LAST_32", utcDate, status,
      home: home ?? null, away: away ?? null,
      homeName: home ? (TEAMS[home]?.name ?? "") : "",
      awayName: away ? (TEAMS[away]?.name ?? "") : "",
      homeGoals, awayGoals, winner, penHome, penAway, duration: null,
      homeSlot: hs, awaySlot: as_,
    };
  });
}

export function winnerCode(m?: BracketMatch | null): string | null {
  if (!m) return null;
  return m.winner === "HOME_TEAM" ? m.home : m.winner === "AWAY_TEAM" ? m.away : null;
}
export function loserCode(m?: BracketMatch | null): string | null {
  if (!m) return null;
  return m.winner === "HOME_TEAM" ? m.away : m.winner === "AWAY_TEAM" ? m.home : null;
}

function makeMatch(stage: string, home: string | null, away: string | null, prov: BracketMatch | undefined, dateFallback: string): BracketMatch {
  let homeGoals: number | null = null, awayGoals: number | null = null;
  let winner: BracketMatch["winner"] = null;
  let penHome: number | null = null, penAway: number | null = null;
  let status = "TIMED";
  let utcDate = prov?.utcDate || dateFallback || "";
  if (prov && home && away) {
    const swap = prov.home !== home;
    homeGoals = swap ? prov.awayGoals : prov.homeGoals;
    awayGoals = swap ? prov.homeGoals : prov.awayGoals;
    winner = swap
      ? (prov.winner === "HOME_TEAM" ? "AWAY_TEAM" : prov.winner === "AWAY_TEAM" ? "HOME_TEAM" : prov.winner)
      : prov.winner;
    penHome = swap ? prov.penAway : prov.penHome;
    penAway = swap ? prov.penHome : prov.penAway;
    status = prov.status;
    utcDate = prov.utcDate || utcDate;
  }
  return {
    id: 0, stage, utcDate, status, home, away,
    homeName: home ? (TEAMS[home]?.name ?? "") : "",
    awayName: away ? (TEAMS[away]?.name ?? "") : "",
    homeGoals, awayGoals, winner, penHome, penAway, duration: null,
  };
}

const sameTeams = (m: BracketMatch, h: string, a: string) =>
  (m.home === h && m.away === a) || (m.home === a && m.away === h);

function advanceRound(cur: BracketMatch[], curStage: string, api: BracketMatch[]): BracketMatch[] {
  const order = BRACKET_ORDER[curStage];
  const nextStage = NEXT[curStage];
  const prov = api.filter(m => m.stage === nextStage).slice().sort((a, b) => a.id - b.id);
  const next: BracketMatch[] = order.map(() => makeMatch(nextStage, null, null, undefined, ""));
  for (const o of order) {
    const home = winnerCode(cur[o.l[0]]);
    const away = winnerCode(cur[o.l[1]]);
    const matched = home && away ? prov.find(m => sameTeams(m, home, away)) : undefined;
    next[o.r] = makeMatch(nextStage, home, away, matched, prov[o.r]?.utcDate ?? "");
  }
  return next;
}

export function buildFullBracket(api: BracketMatch[], scores: (MatchScore | null)[]): Record<string, BracketMatch[]> {
  const LAST_32 = buildR32(api, scores);
  const LAST_16 = advanceRound(LAST_32, "LAST_32", api);
  const QUARTER_FINALS = advanceRound(LAST_16, "LAST_16", api);
  const SEMI_FINALS = advanceRound(QUARTER_FINALS, "QUARTER_FINALS", api);
  const FINAL = advanceRound(SEMI_FINALS, "SEMI_FINALS", api);
  const tHome = loserCode(SEMI_FINALS[0]);
  const tAway = loserCode(SEMI_FINALS[1]);
  const prov3 = api.filter(m => m.stage === "THIRD_PLACE").slice().sort((a, b) => a.id - b.id);
  const m3 = tHome && tAway ? prov3.find(m => sameTeams(m, tHome, tAway)) : undefined;
  const THIRD_PLACE = [makeMatch("THIRD_PLACE", tHome, tAway, m3, prov3[0]?.utcDate ?? "")];
  return { LAST_32, LAST_16, QUARTER_FINALS, SEMI_FINALS, FINAL, THIRD_PLACE };
}

// Próximos `n` partidos por jugarse (no terminados), ordenados por horario.
export function upcomingMatches(api: BracketMatch[], scores: (MatchScore | null)[], nowMs: number, n: number): BracketMatch[] {
  const rounds = buildFullBracket(api, scores);
  const all: BracketMatch[] = [];
  for (const arr of Object.values(rounds)) all.push(...arr);
  return all
    .filter(m => {
      if (!m.utcDate || m.status === "FINISHED" || m.status === "AWARDED") return false;
      const ts = new Date(m.utcDate).getTime();
      return !isNaN(ts) && ts >= nowMs - 2.5 * 3600 * 1000; // incluye en juego / recién empezado
    })
    .sort((a, b) => (a.utcDate < b.utcDate ? -1 : a.utcDate > b.utcDate ? 1 : 0))
    .slice(0, n);
}
