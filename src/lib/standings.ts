import { MATCHES, GROUPS } from "./matches";
import type { MatchScore } from "@/types";

export interface TeamStanding {
  code: string;
  played: number;
  pts: number;
  gf: number;
  ga: number;
  gd: number;
}

interface PlayedMatch { h: string; a: string; hs: number; as: number; }

// Desempate H2H (pairwise) entre dos equipos empatados.
function headToHead(x: string, y: string, played: PlayedMatch[]): number {
  let xp = 0, yp = 0, xgf = 0, ygf = 0;
  for (const m of played) {
    if ((m.h === x && m.a === y) || (m.h === y && m.a === x)) {
      const xIsHome = m.h === x;
      const xg = xIsHome ? m.hs : m.as;
      const yg = xIsHome ? m.as : m.hs;
      xgf += xg; ygf += yg;
      if (xg > yg) xp += 3; else if (xg < yg) yp += 3; else { xp++; yp++; }
    }
  }
  if (yp !== xp) return yp - xp;
  if (ygf !== xgf) return ygf - xgf;
  return 0;
}

// Clasificación de un grupo a partir de los marcadores ya sincronizados.
// Orden FIFA: puntos → dif. de goles → goles a favor → enfrentamiento directo.
export function groupStandings(group: string, scores: (MatchScore | null)[]): TeamStanding[] {
  const tbl: Record<string, TeamStanding> = {};
  const ensure = (c: string) => (tbl[c] ??= { code: c, played: 0, pts: 0, gf: 0, ga: 0, gd: 0 });
  const played: PlayedMatch[] = [];

  MATCHES.forEach((m, i) => {
    if (m[2] !== group) return;
    const s = scores[i];
    if (!s) return;
    const [h, a] = m;
    const H = ensure(h), A = ensure(a);
    H.played++; A.played++;
    H.gf += s.h; H.ga += s.a; A.gf += s.a; A.ga += s.h;
    if (s.h > s.a) H.pts += 3; else if (s.h < s.a) A.pts += 3; else { H.pts++; A.pts++; }
    played.push({ h, a, hs: s.h, as: s.a });
  });

  const arr = Object.values(tbl);
  arr.forEach(t => { t.gd = t.gf - t.ga; });
  arr.sort((x, y) => {
    if (y.pts !== x.pts) return y.pts - x.pts;
    if (y.gd !== x.gd) return y.gd - x.gd;
    if (y.gf !== x.gf) return y.gf - x.gf;
    const h2h = headToHead(x.code, y.code, played);
    if (h2h !== 0) return h2h;
    return x.code < y.code ? -1 : 1;
  });
  return arr;
}

// Un grupo está cerrado cuando se jugaron sus 6 partidos.
export function groupComplete(group: string, scores: (MatchScore | null)[]): boolean {
  let total = 0, withScore = 0;
  MATCHES.forEach((m, i) => {
    if (m[2] !== group) return;
    total++;
    if (scores[i]) withScore++;
  });
  return total > 0 && withScore === total;
}

// Plantilla oficial del cuadro FIFA 2026 — partidos 73 a 88 (Ronda de 32), en
// orden. Cada slot: "1X"/"2X" = 1.º/2.º del grupo X · "3" = mejor tercero
// (se conoce sólo al cerrar todos los grupos → lo completa la API).
export const R32_TEMPLATE: [string, string][] = [
  ["2A", "2B"], // 73
  ["1E", "3"],  // 74
  ["1F", "2C"], // 75
  ["1C", "2F"], // 76
  ["1I", "3"],  // 77
  ["2E", "2I"], // 78
  ["1A", "3"],  // 79
  ["1L", "3"],  // 80
  ["1D", "3"],  // 81
  ["1G", "3"],  // 82
  ["2K", "2L"], // 83
  ["1H", "2J"], // 84
  ["1B", "3"],  // 85
  ["1J", "2H"], // 86
  ["1K", "3"],  // 87
  ["2D", "2G"], // 88
];

// Posiciones "aseguradas" (clinched) de un grupo que TODAVÍA no terminó.
// Enumera todos los resultados posibles de los partidos que faltan; un equipo
// queda fijado en una posición sólo si la ocupa en TODOS los escenarios.
// Conservador a propósito: ante un posible empate de puntos no fija (lo
// resolverá el desempate al cerrar el grupo, o la API antes).
export function clinchedPositions(group: string, scores: (MatchScore | null)[]): { first: string | null; second: string | null } {
  const teams = new Set<string>();
  const curPts: Record<string, number> = {};
  const remaining: [string, string][] = [];

  MATCHES.forEach((m, i) => {
    if (m[2] !== group) return;
    const [h, a] = m;
    teams.add(h); teams.add(a);
    curPts[h] ??= 0; curPts[a] ??= 0;
    const s = scores[i];
    if (!s) { remaining.push([h, a]); return; }
    if (s.h > s.a) curPts[h] += 3; else if (s.h < s.a) curPts[a] += 3; else { curPts[h]++; curPts[a]++; }
  });

  const teamList = [...teams];
  const R = remaining.length;
  if (R === 0 || R > 8) return { first: null, second: null };

  const ranks: Record<string, Set<number>> = {};
  teamList.forEach(t => { ranks[t] = new Set(); });

  for (let mask = 0; mask < 3 ** R; mask++) {
    const pts = { ...curPts };
    let x = mask;
    for (let k = 0; k < R; k++) {
      const o = x % 3; x = Math.floor(x / 3);
      const [h, a] = remaining[k];
      if (o === 0) pts[h] += 3; else if (o === 1) pts[a] += 3; else { pts[h]++; pts[a]++; }
    }
    for (const t of teamList) {
      const more = teamList.filter(u => u !== t && pts[u] > pts[t]).length;
      const eq = teamList.filter(u => u !== t && pts[u] === pts[t]).length;
      for (let r = more + 1; r <= more + eq + 1; r++) ranks[t].add(r);
    }
  }

  const only = (t: string, r: number) => ranks[t].size === 1 && ranks[t].has(r);
  return {
    first: teamList.find(t => only(t, 1)) ?? null,
    second: teamList.find(t => only(t, 2)) ?? null,
  };
}

// Equipo de una posición de grupo: si el grupo terminó usa la clasificación
// final (con desempates); si no, usa la posición ya asegurada (clinched).
export function positionTeam(group: string, pos: number, scores: (MatchScore | null)[]): string | null {
  if (groupComplete(group, scores)) {
    return groupStandings(group, scores)[pos - 1]?.code ?? null;
  }
  const c = clinchedPositions(group, scores);
  return pos === 1 ? c.first : pos === 2 ? c.second : null;
}

// Resuelve un slot ("1A","2C","3") a un código de equipo cuando ya está fijado.
export function resolveSlot(slot: string, scores: (MatchScore | null)[]): string | null {
  if (slot === "3") return null;
  return positionTeam(slot.slice(1), Number(slot[0]), scores);
}

// Asignación oficial FIFA (Anexo C) de los 8 mejores terceros a las llaves
// "1.º vs 3.º", por combinación de los grupos cuyos terceros clasifican.
// Clave: grupos clasificados ordenados alfabéticamente. Valor: grupo del
// ganador → grupo del 3.º rival. (Se añade la combinación vigente, verificada
// con el cuadro oficial publicado.)
const THIRD_ALLOCATIONS: Record<string, Record<string, string>> = {
  // Terceros clasificados: B, D, E, F, I, J, K, L
  BDEFIJKL: { E: "D", I: "F", A: "E", L: "K", D: "B", G: "I", B: "J", K: "L" },
};

// 3.º que enfrenta al ganador de un grupo, una vez cerrados los 12 grupos.
// Ordena los 12 terceros (pts → dif. gol → goles a favor), toma los 8 mejores y
// aplica la tabla oficial. Devuelve null si aún no se puede determinar.
export function thirdTeamFor(winnerGroup: string, scores: (MatchScore | null)[]): string | null {
  const thirds = GROUPS
    .filter(g => groupComplete(g, scores))
    .map(g => ({ group: g, t: groupStandings(g, scores)[2] }))
    .filter((x): x is { group: string; t: TeamStanding } => !!x.t);
  if (thirds.length < GROUPS.length) return null; // faltan grupos por cerrar
  thirds.sort((a, b) =>
    b.t.pts - a.t.pts || b.t.gd - a.t.gd || b.t.gf - a.t.gf || (a.group < b.group ? -1 : 1));
  const combo = thirds.slice(0, 8).map(x => x.group).sort().join("");
  const thirdGroup = THIRD_ALLOCATIONS[combo]?.[winnerGroup];
  if (!thirdGroup) return null;
  return groupStandings(thirdGroup, scores)[2]?.code ?? null;
}

// Grupo (A–L) de cada equipo, derivado del calendario.
export const GROUP_OF: Record<string, string> = (() => {
  const g: Record<string, string> = {};
  MATCHES.forEach(m => { g[m[0]] = m[2]; g[m[1]] = m[2]; });
  return g;
})();

// Firma de slot de un equipo según su posición ACTUAL en su grupo: "1X"/"2X"/"3".
// Sirve para colocar cada partido que el proveedor YA trae en su llave por
// IDENTIDAD (grupo + posición), no por orden de índice. Usa la posición actual
// (no el clinch estricto) para reflejar lo que el proveedor ya colocó, igual
// que Google. Devuelve null si el equipo aún no jugó.
export function teamSlotSig(code: string, scores: (MatchScore | null)[]): string | null {
  const g = GROUP_OF[code];
  if (!g) return null;
  const idx = groupStandings(g, scores).findIndex(t => t.code === code);
  if (idx < 0) return null;
  return idx === 0 ? "1" + g : idx === 1 ? "2" + g : "3";
}
