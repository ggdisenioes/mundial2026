import { TEAMS } from "./matches";
import { buildFullBracket, winnerCode, loserCode } from "./bracket";
import { scoreParticipant, effectiveBonus, norm } from "./scoring";
import type { Participant, Results, BracketMatch } from "@/types";

type Phase = "R32" | "R16" | "QF" | "SF" | "F";

interface TeamStatus {
  code: string;
  name: string;
  stillAlive: boolean;
  eliminatedAt: Phase | null; // ronda en que perdió
  isChampion: boolean;
  isRunnerUp: boolean;
}

const STAGE_TO_PHASE: [string, Phase][] = [
  ["LAST_32", "R32"], ["LAST_16", "R16"], ["QUARTER_FINALS", "QF"],
  ["SEMI_FINALS", "SF"], ["FINAL", "F"],
];

// Estado por equipo a partir del cuadro calculado.
function buildTeamStatus(rounds: Record<string, BracketMatch[]>): Record<string, TeamStatus> {
  const byNorm: Record<string, TeamStatus> = {};
  const teams = new Set<string>();

  for (const [stage] of STAGE_TO_PHASE) {
    for (const m of rounds[stage] ?? []) {
      if (m.home) teams.add(m.home);
      if (m.away) teams.add(m.away);
    }
  }
  teams.forEach(code => {
    const name = TEAMS[code]?.name ?? code;
    byNorm[norm(name)] = {
      code, name, stillAlive: true, eliminatedAt: null, isChampion: false, isRunnerUp: false,
    };
  });

  for (const [stage, phase] of STAGE_TO_PHASE) {
    for (const m of rounds[stage] ?? []) {
      const loser = loserCode(m);
      if (loser) {
        const key = norm(TEAMS[loser]?.name ?? loser);
        if (byNorm[key]) {
          byNorm[key].stillAlive = false;
          byNorm[key].eliminatedAt = phase;
          if (phase === "F") byNorm[key].isRunnerUp = true;
        }
      }
    }
  }
  const champ = winnerCode(rounds.FINAL?.[0]);
  if (champ) {
    const key = norm(TEAMS[champ]?.name ?? champ);
    if (byNorm[key]) { byNorm[key].stillAlive = false; byNorm[key].isChampion = true; }
  }
  return byNorm;
}

// Ronda MÁS AVANZADA en la que aparece el equipo (o sea, la que está por jugar
// si aún vive, o la que perdió si ya cayó).
function currentPhaseOf(teamCode: string, rounds: Record<string, BracketMatch[]>): Phase | null {
  let last: Phase | null = null;
  for (const [stage, phase] of STAGE_TO_PHASE) {
    if ((rounds[stage] ?? []).some(m => m.home === teamCode || m.away === teamCode)) last = phase;
  }
  return last;
}

type Target = Phase | "champion" | "runnerUp";

// ¿El equipo predicho aún puede terminar en la posición X?
function canAchieve(pick: string, target: Target, status: Record<string, TeamStatus>, rounds: Record<string, BracketMatch[]>): boolean {
  if (!pick) return false;
  const s = status[norm(pick)];
  if (!s) return false;

  // Destino ya definido
  if (s.isChampion) return target === "champion";
  if (s.isRunnerUp) return target === "runnerUp";
  if (s.eliminatedAt) return target === s.eliminatedAt;

  // Aún vivo: puede caer en cualquier ronda desde la actual, o ser campeón / subcampeón.
  const cur = currentPhaseOf(s.code, rounds);
  if (!cur) return false;
  if (target === "champion" || target === "runnerUp") return true;

  const order: Phase[] = ["R32", "R16", "QF", "SF", "F"];
  const curIdx = order.indexOf(cur);
  const posIdx = order.indexOf(target);
  return posIdx >= curIdx;
}

export interface PredictionRow {
  id: string;
  nombre: string;
  current: number;
  best: number;
  potentialExtra: number;
  canWin: boolean; // best >= mejor puntaje actual → aún puede alcanzar al líder
  currentBreakdown: { p1: number; p2: number; p3: number; p4: number };
}

// Puntaje máximo alcanzable por un participante: P1/P2 ya están fijos, P3 y P4
// se calculan como "todo lo que aún puede acertar, acierta".
export function bestCaseScore(p: Participant, results: Results): number {
  const rounds = buildFullBracket(results.knockout?._bracket ?? [], results.scores ?? []);
  const status = buildTeamStatus(rounds);
  const pk = p.picks?.p3 ?? {} as Partial<Participant["picks"]["p3"]>;
  const cur = scoreParticipant(p, results);

  let p3 = 0;
  if (canAchieve(pk.winner ?? "", "champion", status, rounds)) p3 += 50;
  if (canAchieve(pk.runnerUp ?? "", "runnerUp", status, rounds)) p3 += 30;
  for (const t of pk.semis ?? []) if (canAchieve(t, "SF", status, rounds)) p3 += 15;
  for (const t of pk.qf ?? []) if (canAchieve(t, "QF", status, rounds)) p3 += 6;
  for (const t of pk.r16 ?? []) if (canAchieve(t, "R16", status, rounds)) p3 += 3;
  for (const t of pk.r32 ?? []) if (canAchieve(t, "R32", status, rounds)) p3 += 2;

  // P4: los bonus de grupos ya están fijados; los de jugadores aún son abiertos.
  const eb = effectiveBonus(results);
  let p4 = 0;
  if (p.picks.p4?.topScorerTeam && norm(p.picks.p4.topScorerTeam) === norm(eb.topTeam)) p4 += 10;
  if (p.picks.p4?.mostConceded && norm(p.picks.p4.mostConceded) === norm(eb.mostConceded)) p4 += 10;
  if (p.picks.p4?.goldenBoot) p4 += 10;    // aún abierto → mejor caso: acierta
  if (p.picks.p4?.topEspScorer) p4 += 10;  // idem

  return cur.p1 + cur.p2 + p3 + p4;
}

export function predictionRanking(participants: Participant[], results: Results): PredictionRow[] {
  const raw = participants.map(p => {
    const cur = scoreParticipant(p, results);
    const best = bestCaseScore(p, results);
    return {
      id: p.id, nombre: p.nombre,
      current: cur.total, best, potentialExtra: best - cur.total,
      canWin: false,
      currentBreakdown: { p1: cur.p1, p2: cur.p2, p3: cur.p3, p4: cur.p4 },
    };
  });
  const leaderCurrent = raw.reduce((mx, r) => Math.max(mx, r.current), 0);
  for (const r of raw) r.canWin = r.best >= leaderCurrent;
  raw.sort((a, b) => b.best - a.best || b.current - a.current || a.nombre.localeCompare(b.nombre));
  return raw;
}
