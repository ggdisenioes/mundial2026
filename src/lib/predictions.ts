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

export interface PendingPick {
  fase: string;   // etiqueta legible ("Campeón", "Octavos", "Bota de Oro"…)
  equipo: string; // equipo o jugador predicho
  pts: number;
}

export interface PredictionRow {
  id: string;
  nombre: string;
  current: number;
  best: number;
  potentialExtra: number;
  canWin: boolean; // best >= mejor puntaje actual → aún puede alcanzar al líder
  currentBreakdown: { p1: number; p2: number; p3: number; p4: number };
  pending: PendingPick[]; // los aciertos que le faltan para llegar a `best`
}

// Aciertos PENDIENTES de un participante: picks que todavía pueden cumplirse y
// aún no se cumplieron. El puntaje máximo es exactamente actual + su suma, así
// el detalle y el número nunca se contradicen.
export function pendingPicks(p: Participant, results: Results): PendingPick[] {
  const rounds = buildFullBracket(results.knockout?._bracket ?? [], results.scores ?? []);
  const status = buildTeamStatus(rounds);
  const pk = p.picks?.p3 ?? ({} as Partial<Participant["picks"]["p3"]>);
  const kn = results.knockout;
  const out: PendingPick[] = [];

  const achievedIn = (arr: string[] | undefined, team: string) =>
    (arr ?? []).some(a => a && norm(a) === norm(team));

  const check = (
    team: string | undefined, target: Target, fase: string, pts: number, achieved: boolean,
  ) => {
    if (!team || !team.trim() || achieved) return;
    if (canAchieve(team, target, status, rounds)) out.push({ fase, equipo: team.trim(), pts });
  };

  check(pk.winner, "champion", "Campeón", 50, !!kn.winner && norm(kn.winner) === norm(pk.winner ?? ""));
  check(pk.runnerUp, "runnerUp", "Subcampeón", 30, !!kn.runnerUp && norm(kn.runnerUp) === norm(pk.runnerUp ?? ""));
  for (const t of pk.semis ?? []) check(t, "SF", "Semis", 15, achievedIn(kn.semis, t));
  for (const t of pk.qf ?? []) check(t, "QF", "Cuartos", 6, achievedIn(kn.qf, t));
  for (const t of pk.r16 ?? []) check(t, "R16", "Octavos", 3, achievedIn(kn.r16, t));
  for (const t of pk.r32 ?? []) check(t, "R32", "16avos", 2, achievedIn(kn.r32, t));

  // P4: los bonus de grupos ya están fijados (si acertó, ya está en el actual).
  // Los de jugadores siguen abiertos hasta el final del torneo.
  const eb = effectiveBonus(results);
  if (p.picks.p4?.goldenBoot && !(eb.goldenBoot && norm(eb.goldenBoot) === norm(p.picks.p4.goldenBoot))) {
    out.push({ fase: "Bota de Oro", equipo: p.picks.p4.goldenBoot, pts: 10 });
  }
  if (p.picks.p4?.topEspScorer && !(eb.topEspScorer && norm(eb.topEspScorer) === norm(p.picks.p4.topEspScorer))) {
    out.push({ fase: "Goleador 🇪🇸", equipo: p.picks.p4.topEspScorer, pts: 10 });
  }

  return out;
}

export function predictionRanking(participants: Participant[], results: Results): PredictionRow[] {
  const raw = participants.map(p => {
    const cur = scoreParticipant(p, results);
    const pending = pendingPicks(p, results);
    const best = cur.total + pending.reduce((s, x) => s + x.pts, 0);
    return {
      id: p.id, nombre: p.nombre,
      current: cur.total, best, potentialExtra: best - cur.total,
      canWin: false,
      currentBreakdown: { p1: cur.p1, p2: cur.p2, p3: cur.p3, p4: cur.p4 },
      pending,
    };
  });
  const leaderCurrent = raw.reduce((mx, r) => Math.max(mx, r.current), 0);
  for (const r of raw) r.canWin = r.best >= leaderCurrent;
  raw.sort((a, b) => b.best - a.best || b.current - a.current || a.nombre.localeCompare(b.nombre));
  return raw;
}
