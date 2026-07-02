"use client";
import { useMemo, useState } from "react";
import type { BracketMatch, MatchScore } from "@/types";
import { TEAMS } from "@/lib/matches";
import { NEXT, BRACKET_ORDER, buildFullBracket } from "@/lib/bracket";
import { useT } from "@/contexts/LangContext";
import type { Translations } from "@/lib/translations";

// Rondas que tienen pestaña propia (la del 3er puesto se muestra junto a la final).
const STAGE_ORDER = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "FINAL"];

const LINE = "bg-tw-grey/45";

// Etiqueta de un slot de grupo ("1A" → "1.º A", "3" → "3.º (mejor)").
function slotLabel(slot: string | undefined, t: Translations): string {
  if (!slot) return "";
  if (slot === "3") return t.koThird;
  return `${t.koPos[Number(slot[0])]} ${slot.slice(1)}`;
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

function Row({ code, name, slot, goals, won, shown, t, compact = false }: {
  code: string | null; name: string; slot?: string; goals: number | null; won: boolean; shown: boolean; t: Translations; compact?: boolean;
}) {
  const flag = code ? TEAMS[code]?.flag : null;
  const hasTeam = !!name;
  const label = name || slotLabel(slot, t) || t.koTBD;
  return (
    <div className={`flex items-center justify-between gap-1 ${won ? "font-bold" : ""}`}>
      <div className="flex items-center gap-1 min-w-0">
        <span className={`${compact ? "text-xs" : "text-base"} shrink-0`}>{flag ?? "🛡️"}</span>
        <span className={`truncate ${compact ? "text-[10px] leading-tight" : "text-xs sm:text-sm"} ${hasTeam ? "text-tw-navy" : "text-tw-grey italic"}`}>
          {label}
        </span>
      </div>
      <span className={`shrink-0 font-bold tabular-nums text-tw-navy ${compact ? "text-[11px]" : "text-sm"}`}>
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
  const width = compact ? "w-28" : big ? "w-60 sm:w-72" : "w-40 sm:w-52";
  return (
    <div className={`${width} shrink-0 bg-white rounded-lg border border-tw-grey/25 shadow-sm overflow-hidden`}>
      <div className={`${compact ? "px-1.5 pt-1 pb-0.5 text-[9px]" : "px-2.5 pt-2 pb-1 text-[11px] sm:text-xs"} text-tw-grey flex items-center justify-between gap-1 min-h-[1rem]`}>
        <span className="truncate">{fmtHeader(m.utcDate, t)}</span>
        {isLive && <span className="text-red-600 font-bold animate-pulse shrink-0">●{compact ? "" : ` ${t.koLive}`}</span>}
      </div>
      <div className={compact ? "px-1.5 pb-1 space-y-0.5" : "px-2.5 pb-2 space-y-1"}>
        <Row code={m.home} name={m.homeName} slot={m.homeSlot} goals={m.homeGoals} won={m.winner === "HOME_TEAM"} shown={shown} t={t} compact={compact} />
        <Row code={m.away} name={m.awayName} slot={m.awaySlot} goals={m.awayGoals} won={m.winner === "AWAY_TEAM"} shown={shown} t={t} compact={compact} />
      </div>
      {isFinished && hasPen && !compact && (
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
    <div className="flex flex-col w-4 lg:w-5 shrink-0 self-stretch">
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

// Cuadro a DOS LADOS con las mitades oficiales. Izquierda = mitad de la final
// M101 (R32 73,74,75,77,81,82,83,84); derecha = mitad M102 (76,78,79,80,85..88),
// espejada. Así España/Argentina y Francia/Inglaterra van en lados opuestos.
function TwoSidedBracket({ rounds, t }: { rounds: Record<string, BracketMatch[]>; t: Translations }) {
  const L32 = rounds.LAST_32 ?? [], L16 = rounds.LAST_16 ?? [], QF = rounds.QUARTER_FINALS ?? [];
  const SF = rounds.SEMI_FINALS ?? [], FIN = rounds.FINAL ?? [], TP = rounds.THIRD_PLACE ?? [];
  const pick = (arr: BracketMatch[], idx: number[]) => idx.map(i => arr[i]);
  return (
    <div className="overflow-x-auto pb-3">
      <div className="flex items-stretch min-h-[720px] w-max mx-auto text-tw-navy">
        {/* Mitad izquierda (M101) */}
        <BCol cards={pick(L32, [1, 4, 0, 2, 10, 11, 8, 9])} t={t} />
        <BConn n={4} dir="ltr" />
        <BCol cards={pick(L16, [0, 1, 4, 5])} t={t} />
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
        {/* Mitad derecha (M102), espejada */}
        <BConn n={1} dir="rtl" />
        <BCol cards={pick(SF, [1])} t={t} />
        <BConn n={1} dir="rtl" />
        <BCol cards={pick(QF, [2, 3])} t={t} />
        <BConn n={2} dir="rtl" />
        <BCol cards={pick(L16, [2, 3, 6, 7])} t={t} />
        <BConn n={4} dir="rtl" />
        <BCol cards={pick(L32, [3, 5, 6, 7, 13, 15, 12, 14])} t={t} />
      </div>
    </div>
  );
}

export default function KnockoutBracket({ bracket, scores }: { bracket?: BracketMatch[]; scores?: (MatchScore | null)[] }) {
  const { t } = useT();
  const apiMatches = useMemo(() => bracket ?? [], [bracket]);
  const rounds = useMemo(() => buildFullBracket(apiMatches, scores ?? []), [apiMatches, scores]);
  const [round, setRound] = useState<string>("LAST_32");
  const [view, setView] = useState<"list" | "bracket">("bracket");

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

  const listView = (
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
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-tw-navy">{t.koTitle}</h2>
          <p className="text-sm text-tw-grey mt-1">{t.koSubtitle}</p>
        </div>
        {/* Selector de vista — solo desktop */}
        <div className="hidden lg:flex gap-1 bg-tw-light border border-tw-grey/20 rounded-lg p-1 shrink-0">
          {([["bracket", "🗂️ Cuadro"], ["list", "📋 Lista"]] as const).map(([v, label]) => (
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

      {/* Cuadro a dos lados: solo desktop y a ancho completo (rompe el margen) */}
      {view === "bracket" && (
        <div className="hidden lg:block relative left-1/2 -translate-x-1/2 w-screen px-4">
          <TwoSidedBracket rounds={rounds} t={t} />
        </div>
      )}

      {/* Lista: siempre en móvil; en desktop solo si está elegida */}
      <div className={view === "bracket" ? "lg:hidden" : ""}>
        {listView}
      </div>
    </div>
  );
}
