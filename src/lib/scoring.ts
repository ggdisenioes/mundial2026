import { MATCHES, SPAIN_IDX, TEAMS } from "./matches";
import type { Participant, Results, ParticipantScore, PhaseScore } from "@/types";

export const norm = (s: unknown): string =>
  String(s ?? "").trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export const deriveResult = (h: number, a: number): "1" | "X" | "2" =>
  h > a ? "1" : h < a ? "2" : "X";

export const parseScore = (str: string): { h: number; a: number } | null => {
  const m = String(str ?? "").match(/(\d+)\s*[-–:]\s*(\d+)/);
  return m ? { h: +m[1], a: +m[2] } : null;
};

export function hashPin(pin: string): string {
  let h = 5381;
  for (let i = 0; i < pin.length; i++) h = ((h << 5) + h + pin.charCodeAt(i)) >>> 0;
  return String(h);
}

export function computeAutoBonus(scores: (null | { h: number; a: number })[]): {
  topTeam: string;
  mostConceded: string;
} {
  const gf: Record<string, number> = {};
  const ga: Record<string, number> = {};
  MATCHES.forEach(([h, a], i) => {
    const s = scores[i];
    if (!s) return;
    gf[h] = (gf[h] || 0) + s.h; ga[h] = (ga[h] || 0) + s.a;
    gf[a] = (gf[a] || 0) + s.a; ga[a] = (ga[a] || 0) + s.h;
  });
  const top = (obj: Record<string, number>) => {
    let k: string | null = null, v = -1;
    for (const x in obj) if (obj[x] > v) { v = obj[x]; k = x; }
    return k;
  };
  const t = top(gf), c = top(ga);
  return { topTeam: t ? TEAMS[t].name : "", mostConceded: c ? TEAMS[c].name : "" };
}

export function liveGroupStats(scores: (null | { h: number; a: number })[]): {
  topTeam: string; topTeamGoals: number;
  mostConceded: string; mostConcededGoals: number;
  matchesPlayed: number;
} {
  const gf: Record<string, number> = {};
  const ga: Record<string, number> = {};
  let played = 0;
  MATCHES.forEach(([h, a], i) => {
    const s = scores[i];
    if (!s) return;
    played++;
    gf[h] = (gf[h] || 0) + s.h; ga[h] = (ga[h] || 0) + s.a;
    gf[a] = (gf[a] || 0) + s.a; ga[a] = (ga[a] || 0) + s.h;
  });
  const best = (obj: Record<string, number>) => {
    let k: string | null = null, v = 0;
    for (const x in obj) if (obj[x] > v) { v = obj[x]; k = x; }
    return k ? { name: TEAMS[k]?.name ?? k, goals: v } : { name: "", goals: 0 };
  };
  const top = best(gf), con = best(ga);
  return { topTeam: top.name, topTeamGoals: top.goals, mostConceded: con.name, mostConcededGoals: con.goals, matchesPlayed: played };
}

// P4 auto-bonus solo se activa cuando terminan los 72 partidos de fase de grupos.
// Antes de eso, solo puntúan los overrides manuales del admin.
export function effectiveBonus(results: Results) {
  const scores = Array.isArray(results.scores) ? results.scores : [];
  const allGroupsDone =
    scores.length >= MATCHES.length &&
    scores.slice(0, MATCHES.length).every(s => s !== null);
  const auto = allGroupsDone
    ? computeAutoBonus(scores)
    : { topTeam: "", mostConceded: "" };
  return {
    topTeam: results.bonus.topTeamOverride || auto.topTeam,
    mostConceded: results.bonus.mostConcededOverride || auto.mostConceded,
    goldenBoot: results.bonus.goldenBoot || "",
    topEspScorer: results.bonus.topEspScorer || "",
  };
}

function tierScore(predArr: string[], actualArr: string[], pts: number): PhaseScore {
  const aset = new Set((actualArr || []).filter(Boolean).map(norm));
  const pset = new Set((predArr || []).filter(Boolean).map(norm));
  let c = 0;
  pset.forEach(t => { if (aset.has(t)) c++; });
  return { pts: c * pts, hits: c };
}

// P1: los 72 partidos de fase de grupos (incluyendo los de España), 3 pts por 1X2 correcto.
// P2: marcador exacto de los 3 partidos de España, 10 pts adicionales por acierto exacto.
export function scoreParticipant(p: Participant, results: Results): ParticipantScore {
  let p1 = 0, p1ok = 0, p1n = 0, p2 = 0;

  MATCHES.forEach(([, ,], i) => {
    const s = results.scores[i];
    if (!s) return;
    p1n++;
    if (p.picks.p1[i] === deriveResult(s.h, s.a)) { p1 += 3; p1ok++; }
  });

  const p2detail = SPAIN_IDX.map((mi, k) => {
    const s = results.scores[mi];
    if (!s) return null;
    const pred = parseScore(p.picks.p2[k]);
    const exact = !!pred && pred.h === s.h && pred.a === s.a;
    const pts = exact ? 10 : 0;
    const label: "exacto" | "fallo" = exact ? "exacto" : "fallo";
    p2 += pts;
    return { pts, label };
  });

  const kn = results.knockout, pk = p.picks.p3;
  const champ = !!kn.winner && norm(pk.winner) === norm(kn.winner);
  const ru = !!kn.runnerUp && norm(pk.runnerUp) === norm(kn.runnerUp);
  const sem = tierScore(pk.semis, kn.semis, 15);
  const qf = tierScore(pk.qf, kn.qf, 6);
  const r16 = tierScore(pk.r16, kn.r16, 3);
  const r32 = tierScore(pk.r32, kn.r32, 2);
  const p3 = (champ ? 50 : 0) + (ru ? 30 : 0) + sem.pts + qf.pts + r16.pts + r32.pts;

  const eb = effectiveBonus(results);
  const b = [
    !!eb.topTeam && norm(p.picks.p4.topScorerTeam) === norm(eb.topTeam),
    !!eb.mostConceded && norm(p.picks.p4.mostConceded) === norm(eb.mostConceded),
    !!eb.goldenBoot && norm(p.picks.p4.goldenBoot) === norm(eb.goldenBoot),
    !!eb.topEspScorer && norm(p.picks.p4.topEspScorer) === norm(eb.topEspScorer),
  ];
  const p4 = b.filter(Boolean).length * 10;

  return {
    p1, p2, p3, p4,
    total: p1 + p2 + p3 + p4,
    bd: { p1ok, p1n, p2detail, champ, ru, sem, qf, r16, r32, b },
  };
}
