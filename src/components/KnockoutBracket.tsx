"use client";
import { useMemo, useState } from "react";
import type { BracketMatch, MatchScore } from "@/types";
import { TEAMS } from "@/lib/matches";
import { R32_TEMPLATE, resolveSlot, teamSlotSig, thirdTeamFor } from "@/lib/standings";
import { useT } from "@/contexts/LangContext";
import type { Translations } from "@/lib/translations";

// Rondas que tienen pestaña propia (la del 3er puesto se muestra junto a la final).
const STAGE_ORDER = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"];
const NEXT: Record<string, string> = {
  LAST_32: "LAST_16",
  LAST_16: "QUARTER_FINALS",
  QUARTER_FINALS: "SEMI_FINALS",
  SEMI_FINALS: "FINAL",
};

// Orden de maquetado del cuadro, en la MISMA secuencia vertical que Google.
// Cada entrada: `l` = los dos índices de la ronda ACTUAL (en orden de plantilla
// M73→M88) que forman la llave; `r` = índice de la ronda SIGUIENTE (ordenada por
// nº de partido) a la que alimenta. Para 16avos es el orden EXACTO de Google
// (agrupa por llave e intercala las dos mitades del cuadro).
//   R16: M89=W74+W77, M90=W73+W75, M91=W76+W78, M92=W79+W80,
//        M93=W83+W84, M94=W81+W82, M95=W86+W88, M96=W85+W87
const BRACKET_ORDER: Record<string, { l: [number, number]; r: number }[]> = {
  LAST_32: [
    { l: [0, 2], r: 1 },   // M73–M75 → M90
    { l: [1, 4], r: 0 },   // M74–M77 → M89
    { l: [9, 8], r: 5 },   // M82–M81 → M94
    { l: [11, 10], r: 4 }, // M84–M83 → M93
    { l: [3, 5], r: 2 },   // M76–M78 → M91
    { l: [6, 7], r: 3 },   // M79–M80 → M92
    { l: [12, 14], r: 7 }, // M85–M87 → M96
    { l: [15, 13], r: 6 }, // M88–M86 → M95
  ],
  LAST_16: [{ l: [0, 1], r: 0 }, { l: [2, 3], r: 1 }, { l: [4, 5], r: 2 }, { l: [6, 7], r: 3 }],
  QUARTER_FINALS: [{ l: [0, 1], r: 0 }, { l: [2, 3], r: 1 }],
  SEMI_FINALS: [{ l: [0, 1], r: 0 }],
};

const LINE = "bg-tw-grey/45";

// Calendario oficial de los 16avos (UTC), en el orden de la plantilla (M73→M88).
// La UI lo pasa a hora peninsular. Si el proveedor publica el partido con su
// horario, ese tiene prioridad (ver buildR32).
const R32_DATES = [
  "2026-06-28T19:00:00Z", // 73  Sudáfrica–Canadá
  "2026-06-29T20:30:00Z", // 74  Alemania–Paraguay
  "2026-06-30T01:00:00Z", // 75  Países Bajos–Marruecos
  "2026-06-29T17:00:00Z", // 76  Brasil–Japón
  "2026-06-30T21:00:00Z", // 77  Francia–Suecia
  "2026-06-30T17:00:00Z", // 78  C. de Marfil–Noruega
  "2026-07-01T01:00:00Z", // 79  México–Ecuador
  "2026-07-01T16:00:00Z", // 80  Inglaterra–RD Congo
  "2026-07-02T00:00:00Z", // 81  EE.UU.–Bosnia
  "2026-07-01T20:00:00Z", // 82  Bélgica–Senegal
  "2026-07-02T23:00:00Z", // 83  Portugal–Croacia
  "2026-07-02T19:00:00Z", // 84  España–Austria
  "2026-07-03T03:00:00Z", // 85  Suiza–Argelia
  "2026-07-03T22:00:00Z", // 86  Argentina–Cabo Verde
  "2026-07-04T01:30:00Z", // 87  Colombia–Ghana
  "2026-07-03T18:00:00Z", // 88  Australia–Egipto
];

// Etiqueta de un slot de grupo ("1A" → "1.º A", "3" → "3.º (mejor)").
function slotLabel(slot: string | undefined, t: Translations): string {
  if (!slot) return "";
  if (slot === "3") return t.koThird;
  return `${t.koPos[Number(slot[0])]} ${slot.slice(1)}`;
}

// Construye la Ronda de 32 (16 partidos) con la plantilla oficial FIFA 2026.
// Cada partido del proveedor se coloca en su llave por IDENTIDAD del equipo
// (grupo + posición), NO por orden de índice — así no se mezclan cruces. Los
// lados que el proveedor aún no resolvió se completan con la proyección
// (posición asegurada / clasificación), y los terceros con lo que traiga la API.
function buildR32(api: BracketMatch[], scores: (MatchScore | null)[]): BracketMatch[] {
  const realR32 = api.filter(m => m.stage === "LAST_32");
  const sig = (c: string | null) => (c ? teamSlotSig(c, scores) : null);

  return R32_TEMPLATE.map(([hs, as_], i) => {
    let home = resolveSlot(hs, scores);
    let away = resolveSlot(as_, scores);
    // Completar el 3.º (slot "3") con la asignación oficial, cerrados los grupos.
    if (!away && as_ === "3" && hs !== "3") away = thirdTeamFor(hs.slice(1), scores);
    if (!home && hs === "3" && as_ !== "3") home = thirdTeamFor(as_.slice(1), scores);
    let homeGoals: number | null = null, awayGoals: number | null = null;
    let winner: BracketMatch["winner"] = null;
    let penHome: number | null = null, penAway: number | null = null;
    let status = "TIMED", utcDate = R32_DATES[i] ?? "";

    // El partido del proveedor cuyo equipo (con posición definida) cae en una de
    // las dos posiciones de grupo de esta llave. "3" es genérico → no empareja.
    const fits = (s: string | null) => !!s && s !== "3" && (s === hs || s === as_);
    const real = realR32.find(m => fits(sig(m.home)) || fits(sig(m.away)));

    if (real) {
      // Orientar: el equipo que corresponde al slot HOME queda de local.
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
      id: 73 + i,
      stage: "LAST_32",
      utcDate,
      status,
      home: home ?? null,
      away: away ?? null,
      homeName: home ? (TEAMS[home]?.name ?? "") : "",
      awayName: away ? (TEAMS[away]?.name ?? "") : "",
      homeGoals,
      awayGoals,
      winner,
      penHome,
      penAway,
      duration: null,
      homeSlot: hs,
      awaySlot: as_,
    };
  });
}

// Ganador / perdedor de un partido (si ya terminó y tiene resultado).
function winnerCode(m?: BracketMatch | null): string | null {
  if (!m) return null;
  return m.winner === "HOME_TEAM" ? m.home : m.winner === "AWAY_TEAM" ? m.away : null;
}
function loserCode(m?: BracketMatch | null): string | null {
  if (!m) return null;
  return m.winner === "HOME_TEAM" ? m.away : m.winner === "AWAY_TEAM" ? m.home : null;
}

// Construye un partido de una ronda avanzada con dos equipos ya conocidos (o
// null = "Por definir"). El marcador/estado/fecha sale del partido del
// proveedor que coincida por equipos; si no, usa la fecha posicional.
function makeMatch(stage: string, home: string | null, away: string | null, prov: BracketMatch | undefined, dateFallback: string): BracketMatch {
  let homeGoals: number | null = null, awayGoals: number | null = null;
  let winner: BracketMatch["winner"] = null;
  let penHome: number | null = null, penAway: number | null = null;
  let status = "TIMED";
  let utcDate = prov?.utcDate || dateFallback || "";
  if (prov && home && away) {
    const swap = prov.home !== home; // equipos coinciden pero quizá invertidos
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

// Avanza una ronda a la siguiente: cada partido de la ronda siguiente lo juegan
// los GANADORES de sus dos partidos de origen (según el árbol del cuadro).
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

// Cuadro completo: 16avos (plantilla) y de ahí, avanzando ganadores, octavos →
// cuartos → semis → final, más el partido por el 3.º puesto (perdedores semis).
function buildFullBracket(api: BracketMatch[], scores: (MatchScore | null)[]): Record<string, BracketMatch[]> {
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

// Horario UTC de la API → encabezado estilo Google en hora peninsular (CEST = UTC+2).
function fmtHeader(utc: string, t: Translations): string {
  const d = new Date(utc);
  if (isNaN(d.getTime())) return "";
  const cest = new Date(d.getTime() + 2 * 60 * 60 * 1000);
  const nowCest = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const tomorrow = new Date(nowCest.getTime() + 24 * 60 * 60 * 1000);
  const sameDay = (a: Date, b: Date) =>
    a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
  const time = `${cest.getUTCHours()}:${String(cest.getUTCMinutes()).padStart(2, "0")}`;
  if (sameDay(cest, nowCest)) return `${t.koToday}, ${time}`;
  if (sameDay(cest, tomorrow)) return `${t.koTomorrow}, ${time}`;
  return `${t.koWeekdays[cest.getUTCDay()]} ${cest.getUTCDate()}/${cest.getUTCMonth() + 1}, ${time}`;
}

function Row({ code, name, slot, goals, won, shown, t }: {
  code: string | null; name: string; slot?: string; goals: number | null; won: boolean; shown: boolean; t: Translations;
}) {
  const flag = code ? TEAMS[code]?.flag : null;
  const hasTeam = !!name;
  const label = name || slotLabel(slot, t) || t.koTBD;
  return (
    <div className={`flex items-center justify-between gap-1.5 ${won ? "font-bold" : ""}`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-base shrink-0">{flag ?? "🛡️"}</span>
        <span className={`truncate text-xs sm:text-sm ${hasTeam ? "text-tw-navy" : "text-tw-grey italic"}`}>
          {label}
        </span>
      </div>
      <span className="shrink-0 text-sm font-bold tabular-nums text-tw-navy">
        {shown && goals != null ? goals : ""}
      </span>
    </div>
  );
}

function Card({ m, t, big = false, compact = false }: { m: BracketMatch; t: Translations; big?: boolean; compact?: boolean }) {
  const isFinished = m.status === "FINISHED" || m.status === "AWARDED";
  const isLive = m.status === "IN_PLAY" || m.status === "PAUSED";
  const shown = isFinished || isLive;
  const hasPen = m.penHome != null && m.penAway != null;
  const width = compact ? "w-36" : big ? "w-60 sm:w-72" : "w-40 sm:w-52";
  return (
    <div className={`${width} shrink-0 bg-white rounded-xl border border-tw-grey/25 shadow-sm overflow-hidden`}>
      <div className="px-2.5 pt-2 pb-1 text-[11px] sm:text-xs text-tw-grey flex items-center justify-between gap-1 min-h-[1.25rem]">
        <span className="truncate">{fmtHeader(m.utcDate, t)}</span>
        {isLive && <span className="text-red-600 font-bold animate-pulse shrink-0">● {t.koLive}</span>}
      </div>
      <div className="px-2.5 pb-2 space-y-1">
        <Row code={m.home} name={m.homeName} slot={m.homeSlot} goals={m.homeGoals} won={m.winner === "HOME_TEAM"} shown={shown} t={t} />
        <Row code={m.away} name={m.awayName} slot={m.awaySlot} goals={m.awayGoals} won={m.winner === "AWAY_TEAM"} shown={shown} t={t} />
      </div>
      {isFinished && hasPen && (
        <div className="px-2.5 pb-1.5 text-[10px] text-tw-grey text-right">{t.koPens(m.penHome!, m.penAway!)}</div>
      )}
    </div>
  );
}

// Conector "llave": une el par de la izquierda con el partido de la ronda siguiente.
function Connector() {
  return (
    <div className="relative w-5 sm:w-9 shrink-0 self-stretch">
      <span className={`absolute top-1/4 left-0 right-1/2 h-px ${LINE}`} />
      <span className={`absolute bottom-1/4 left-0 right-1/2 h-px ${LINE}`} />
      <span className={`absolute top-1/4 bottom-1/4 left-1/2 w-px ${LINE}`} />
      <span className={`absolute top-1/2 left-1/2 right-0 h-px ${LINE}`} />
    </div>
  );
}

// ── Vista de cuadro a dos lados (estilo llave clásica, solo desktop) ───────
const EMPTY_M: BracketMatch = {
  id: 0, stage: "", utcDate: "", status: "TIMED", home: null, away: null,
  homeName: "", awayName: "", homeGoals: null, awayGoals: null, winner: null,
  penHome: null, penAway: null, duration: null,
};

function BCol({ cards, t }: { cards: (BracketMatch | undefined)[]; t: Translations }) {
  return (
    <div className="flex flex-col justify-around shrink-0">
      {cards.map((m, i) => <Card key={i} m={m ?? EMPTY_M} t={t} compact />)}
    </div>
  );
}

// Columna de conectores: n llaves, apuntando a la derecha (ltr) o izquierda (rtl).
function BConn({ n, dir }: { n: number; dir: "ltr" | "rtl" }) {
  const feed = dir === "ltr" ? "left-0 right-1/2" : "left-1/2 right-0";
  const out = dir === "ltr" ? "left-1/2 right-0" : "left-0 right-1/2";
  return (
    <div className="flex flex-col w-5 lg:w-7 shrink-0 self-stretch">
      {Array.from({ length: n }).map((_, k) => (
        <div key={k} className="flex-1 relative">
          <span className={`absolute top-1/4 h-px ${LINE} ${feed}`} />
          <span className={`absolute bottom-1/4 h-px ${LINE} ${feed}`} />
          <span className={`absolute top-1/4 bottom-1/4 w-px ${LINE} left-1/2`} />
          <span className={`absolute top-1/2 h-px ${LINE} ${out}`} />
        </div>
      ))}
    </div>
  );
}

function TwoSidedBracket({ rounds, t }: { rounds: Record<string, BracketMatch[]>; t: Translations }) {
  const L32 = rounds.LAST_32 ?? [], L16 = rounds.LAST_16 ?? [], QF = rounds.QUARTER_FINALS ?? [];
  const SF = rounds.SEMI_FINALS ?? [], FIN = rounds.FINAL ?? [], TP = rounds.THIRD_PLACE ?? [];
  const pick = (arr: BracketMatch[], idx: number[]) => idx.map(i => arr[i]);
  return (
    <div className="overflow-x-auto pb-3">
      <div className="flex items-stretch min-h-[700px] w-max mx-auto text-tw-navy">
        {/* Mitad izquierda */}
        <BCol cards={pick(L32, [1, 4, 0, 2, 3, 5, 6, 7])} t={t} />
        <BConn n={4} dir="ltr" />
        <BCol cards={pick(L16, [0, 1, 2, 3])} t={t} />
        <BConn n={2} dir="ltr" />
        <BCol cards={pick(QF, [0, 1])} t={t} />
        <BConn n={1} dir="ltr" />
        <BCol cards={pick(SF, [0])} t={t} />
        <BConn n={1} dir="ltr" />
        {/* Centro: final + 3.º puesto */}
        <div className="relative flex flex-col justify-center items-center px-2 shrink-0">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs font-extrabold text-tw-navy">🏆 {t.koStageFinal}</span>
            <Card m={FIN[0] ?? EMPTY_M} t={t} compact />
          </div>
          <div className="absolute bottom-1 flex flex-col items-center gap-1">
            <span className="text-[11px] font-semibold text-tw-grey">{t.koStage3P}</span>
            <Card m={TP[0] ?? EMPTY_M} t={t} compact />
          </div>
        </div>
        {/* Mitad derecha (espejada) */}
        <BConn n={1} dir="rtl" />
        <BCol cards={pick(SF, [1])} t={t} />
        <BConn n={1} dir="rtl" />
        <BCol cards={pick(QF, [2, 3])} t={t} />
        <BConn n={2} dir="rtl" />
        <BCol cards={pick(L16, [4, 5, 6, 7])} t={t} />
        <BConn n={4} dir="rtl" />
        <BCol cards={pick(L32, [10, 11, 8, 9, 13, 15, 12, 14])} t={t} />
      </div>
    </div>
  );
}

export default function KnockoutBracket({ bracket, scores }: { bracket?: BracketMatch[]; scores?: (MatchScore | null)[] }) {
  const { t } = useT();
  const apiMatches = useMemo(() => bracket ?? [], [bracket]);
  const rounds = useMemo(() => buildFullBracket(apiMatches, scores ?? []), [apiMatches, scores]);
  const [round, setRound] = useState<string>("LAST_32");
  const [view, setView] = useState<"list" | "bracket">("list");

  const stageLabel: Record<string, string> = {
    LAST_32: t.koStageL32, LAST_16: t.koStageL16, QUARTER_FINALS: t.koStageQF,
    SEMI_FINALS: t.koStageSF, THIRD_PLACE: t.koStage3P, FINAL: t.koStageFinal,
  };

  // Todas las rondas salen del cuadro calculado (16avos + avance de ganadores).
  const byStage = (s: string) => rounds[s] ?? [];

  const tabs = STAGE_ORDER;
  const active = tabs.includes(round) ? round : tabs[0];

  // ── Vista de la final (final + 3er puesto, sin conectores) ────────────────
  function FinalView() {
    const fin = byStage("FINAL")[0];
    const third = byStage("THIRD_PLACE")[0];
    const champCode = fin && (fin.winner === "HOME_TEAM" ? fin.home : fin.winner === "AWAY_TEAM" ? fin.away : null);
    const champName = fin && (fin.winner === "HOME_TEAM" ? fin.homeName : fin.winner === "AWAY_TEAM" ? fin.awayName : "");
    return (
      <div className="flex flex-col items-center gap-5">
        {champCode && (
          <div className="flex items-center gap-2 bg-tw-green/15 border-2 border-tw-green/40 rounded-2xl px-5 py-3">
            <span className="text-3xl">{TEAMS[champCode]?.flag ?? "🏆"}</span>
            <span className="font-extrabold text-tw-navy text-lg">{t.koChampion}: {champName}</span>
          </div>
        )}
        {fin && (
          <div className="space-y-1.5 w-full flex flex-col items-center">
            <h3 className="font-bold text-tw-navy">{t.koStageFinal}</h3>
            <Card m={fin} t={t} big />
          </div>
        )}
        {third && (
          <div className="space-y-1.5 w-full flex flex-col items-center">
            <h3 className="font-bold text-tw-navy">{t.koStage3P}</h3>
            <Card m={third} t={t} big />
          </div>
        )}
      </div>
    );
  }

  // ── Vista de ronda con conectores (ronda activa → ronda siguiente) ─────────
  // Ordena por el árbol del cuadro (pares que se enfrentan, juntos), como Google.
  function RoundView() {
    const left = byStage(active);
    const order = BRACKET_ORDER[active];
    let right = byStage(NEXT[active]);
    const maxR = order ? Math.max(...order.map(o => o.r)) : -1;
    const maxL = order ? Math.max(...order.flatMap(o => o.l)) : -1;

    // Si la ronda siguiente todavía no existe, generamos "Por definir" para
    // mostrar siempre la estructura del cuadro (conectores incluidos), como Google.
    if (order && right.length < maxR + 1 && left.length > maxL) {
      const filled = right.slice();
      for (let k = 0; k <= maxR; k++) {
        filled[k] ??= {
          id: -1 - k, stage: NEXT[active], utcDate: "", status: "TIMED",
          home: null, away: null, homeName: "", awayName: "",
          homeGoals: null, awayGoals: null, winner: null,
          penHome: null, penAway: null, duration: null,
        } as BracketMatch;
      }
      right = filled;
    }

    const valid = !!order && right.length > maxR && left.length > maxL;

    if (!valid) {
      return (
        <div className="overflow-x-auto pb-2">
          <div className="grid gap-3 sm:grid-cols-2 w-max sm:w-auto">
            {left.map((m, i) => <Card key={i} m={m} t={t} />)}
          </div>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto pb-2">
        <div className="flex flex-col gap-5 sm:gap-7 w-max">
          {order.map((o, k) => {
            const [i, j] = o.l;
            return (
              <div key={k} className="flex items-stretch">
                <div className="flex flex-col gap-3 sm:gap-4 justify-center">
                  <Card m={left[i]} t={t} />
                  <Card m={left[j]} t={t} />
                </div>
                <Connector />
                <div className="flex flex-col justify-center">
                  <Card m={right[o.r]} t={t} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={`${view === "bracket" ? "max-w-[1700px]" : "max-w-4xl"} mx-auto space-y-5`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-tw-navy">{t.koTitle}</h2>
          <p className="text-sm text-tw-grey mt-1">{t.koSubtitle}</p>
        </div>
        {/* Selector de vista — solo desktop */}
        <div className="hidden lg:flex gap-1 bg-tw-light border border-tw-grey/20 rounded-lg p-1 shrink-0">
          {([["list", "📋 Lista"], ["bracket", "🗂️ Cuadro"]] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                view === v ? "bg-white text-tw-navy shadow-sm" : "text-tw-grey hover:text-tw-navy"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {view === "bracket" ? (
        <TwoSidedBracket rounds={rounds} t={t} />
      ) : (
        <>
          {/* Sub-pestañas por ronda */}
          <div className="flex gap-1 overflow-x-auto scrollbar-hide border-b border-tw-grey/20">
            {tabs.map(s => (
              <button
                key={s}
                onClick={() => setRound(s)}
                className={`shrink-0 px-3 sm:px-4 py-2 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${
                  active === s ? "border-tw-green text-tw-navy" : "border-transparent text-tw-grey hover:text-tw-navy"
                }`}
              >
                {stageLabel[s]}
              </button>
            ))}
          </div>

          {active === "FINAL" ? <FinalView /> : <RoundView />}
        </>
      )}
    </div>
  );
}
