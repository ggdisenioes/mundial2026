"use client";
import { useState } from "react";
import type { BracketMatch } from "@/types";
import { TEAMS } from "@/lib/matches";
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

// Árbol oficial del cuadro FIFA 2026. Para cada partido de la ronda SIGUIENTE
// (índice k, ordenada por nº de partido), los dos índices de la ronda ACTUAL
// (también por nº de partido) que lo alimentan.
//   R16: M89=W74+W77, M90=W73+W75, M91=W76+W78, M92=W79+W80,
//        M93=W83+W84, M94=W81+W82, M95=W86+W88, M96=W85+W87
//   QF/SF/Final: pares consecutivos.
const FEEDERS: Record<string, number[][]> = {
  LAST_32: [[1, 4], [0, 2], [3, 5], [6, 7], [10, 11], [8, 9], [13, 15], [12, 14]],
  LAST_16: [[0, 1], [2, 3], [4, 5], [6, 7]],
  QUARTER_FINALS: [[0, 1], [2, 3]],
  SEMI_FINALS: [[0, 1]],
};

const LINE = "bg-tw-grey/45";

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

function Row({ code, name, goals, won, shown, t }: {
  code: string | null; name: string; goals: number | null; won: boolean; shown: boolean; t: Translations;
}) {
  const flag = code ? TEAMS[code]?.flag : null;
  const isTBD = !name;
  return (
    <div className={`flex items-center justify-between gap-1.5 ${won ? "font-bold" : ""}`}>
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="text-base shrink-0">{flag ?? "🛡️"}</span>
        <span className={`truncate text-xs sm:text-sm ${isTBD ? "text-tw-grey italic" : "text-tw-navy"}`}>
          {name || t.koTBD}
        </span>
      </div>
      <span className="shrink-0 text-sm font-bold tabular-nums text-tw-navy">
        {shown && goals != null ? goals : ""}
      </span>
    </div>
  );
}

function Card({ m, t, big = false }: { m: BracketMatch; t: Translations; big?: boolean }) {
  const isFinished = m.status === "FINISHED" || m.status === "AWARDED";
  const isLive = m.status === "IN_PLAY" || m.status === "PAUSED";
  const shown = isFinished || isLive;
  const hasPen = m.penHome != null && m.penAway != null;
  return (
    <div className={`${big ? "w-60 sm:w-72" : "w-40 sm:w-52"} shrink-0 bg-white rounded-xl border border-tw-grey/25 shadow-sm overflow-hidden`}>
      <div className="px-2.5 pt-2 pb-1 text-[11px] sm:text-xs text-tw-grey flex items-center justify-between gap-1">
        <span className="truncate">{fmtHeader(m.utcDate, t)}</span>
        {isLive && <span className="text-red-600 font-bold animate-pulse shrink-0">● {t.koLive}</span>}
      </div>
      <div className="px-2.5 pb-2 space-y-1">
        <Row code={m.home} name={m.homeName} goals={m.homeGoals} won={m.winner === "HOME_TEAM"} shown={shown} t={t} />
        <Row code={m.away} name={m.awayName} goals={m.awayGoals} won={m.winner === "AWAY_TEAM"} shown={shown} t={t} />
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

export default function KnockoutBracket({ bracket }: { bracket?: BracketMatch[] }) {
  const { t } = useT();
  const matches = bracket ?? [];
  const [round, setRound] = useState<string>("LAST_32");

  const stageLabel: Record<string, string> = {
    LAST_32: t.koStageL32, LAST_16: t.koStageL16, QUARTER_FINALS: t.koStageQF,
    SEMI_FINALS: t.koStageSF, THIRD_PLACE: t.koStage3P, FINAL: t.koStageFinal,
  };

  // Ordenadas por id (≈ nº de partido FIFA) para casar con el árbol FEEDERS.
  const byStage = (s: string) =>
    matches.filter(m => m.stage === s).slice().sort((a, b) => a.id - b.id);

  const header = (
    <div>
      <h2 className="text-2xl sm:text-3xl font-extrabold text-tw-navy">{t.koTitle}</h2>
      <p className="text-sm text-tw-grey mt-1">{t.koSubtitle}</p>
    </div>
  );

  if (matches.length === 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {header}
        <div className="bg-white rounded-2xl p-8 text-center text-tw-grey border-2 border-tw-grey/20 shadow-sm">
          ⏳ {t.koEmpty}
        </div>
      </div>
    );
  }

  const tabs = STAGE_ORDER.filter(s => matches.some(m => m.stage === s));
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
  function RoundView() {
    const left = byStage(active);
    const right = byStage(NEXT[active]);
    const map = FEEDERS[active];
    const valid =
      !!map && right.length === map.length &&
      map.every(pair => pair.every(idx => idx < left.length));

    if (!valid) {
      // Fallback: la ronda siguiente todavía no está completa en la API → lista simple.
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
          {right.map((r, k) => {
            const [i, j] = map[k];
            return (
              <div key={k} className="flex items-stretch">
                <div className="flex flex-col gap-3 sm:gap-4 justify-center">
                  <Card m={left[i]} t={t} />
                  <Card m={left[j]} t={t} />
                </div>
                <Connector />
                <div className="flex flex-col justify-center">
                  <Card m={r} t={t} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {header}

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
    </div>
  );
}
