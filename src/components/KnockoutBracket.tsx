"use client";
import type { BracketMatch } from "@/types";
import { TEAMS } from "@/lib/matches";
import { useT } from "@/contexts/LangContext";
import type { Translations } from "@/lib/translations";

const STAGE_ORDER = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];

// Pasa el horario UTC de la API a hora peninsular española (CEST = UTC+2).
function fmtKickoff(utc: string): string {
  const d = new Date(utc);
  if (isNaN(d.getTime())) return "";
  const cest = new Date(d.getTime() + 2 * 60 * 60 * 1000);
  const dd = String(cest.getUTCDate()).padStart(2, "0");
  const mo = String(cest.getUTCMonth() + 1).padStart(2, "0");
  const hh = String(cest.getUTCHours()).padStart(2, "0");
  const mm = String(cest.getUTCMinutes()).padStart(2, "0");
  return `${dd}/${mo} · ${hh}:${mm}`;
}

function TeamRow({ code, name, goals, won, shown, t }: {
  code: string | null; name: string; goals: number | null; won: boolean; shown: boolean; t: Translations;
}) {
  const flag = code ? TEAMS[code]?.flag : null;
  const isTBD = !name;
  return (
    <div className={`flex items-center justify-between gap-2 ${won ? "font-extrabold text-tw-navy" : "text-tw-navy/80"}`}>
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xl shrink-0">{flag ?? "⚪"}</span>
        <span className={`truncate text-sm sm:text-base ${isTBD ? "italic text-tw-grey" : ""}`}>
          {name || t.koTBD}
        </span>
        {won && <span className="text-tw-green text-xs shrink-0">▶</span>}
      </div>
      <span className="shrink-0 text-base sm:text-lg font-bold tabular-nums">
        {shown && goals != null ? goals : "–"}
      </span>
    </div>
  );
}

function MatchCard({ m, t }: { m: BracketMatch; t: Translations }) {
  const isFinished = m.status === "FINISHED" || m.status === "AWARDED";
  const isLive = m.status === "IN_PLAY" || m.status === "PAUSED";
  const hasPens = m.penHome != null && m.penAway != null;
  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-tw-grey/20 overflow-hidden">
      <div className="p-3 sm:p-4 space-y-1.5">
        <TeamRow code={m.home} name={m.homeName} goals={m.homeGoals} won={m.winner === "HOME_TEAM"} shown={isFinished || isLive} t={t} />
        <TeamRow code={m.away} name={m.awayName} goals={m.awayGoals} won={m.winner === "AWAY_TEAM"} shown={isFinished || isLive} t={t} />
      </div>
      <div className="px-3 sm:px-4 py-2 bg-tw-light/60 border-t border-tw-grey/10 flex items-center justify-between text-xs">
        <span className="text-tw-grey">{fmtKickoff(m.utcDate)}</span>
        {isLive ? (
          <span className="font-bold text-red-600 animate-pulse">● {t.koLive}</span>
        ) : isFinished && hasPens ? (
          <span className="text-tw-grey">{t.koPens(m.penHome!, m.penAway!)}</span>
        ) : isFinished ? (
          <span className="text-tw-green font-semibold">{t.koFT}</span>
        ) : null}
      </div>
    </div>
  );
}

export default function KnockoutBracket({ bracket }: { bracket?: BracketMatch[] }) {
  const { t } = useT();
  const matches = bracket ?? [];

  const stageLabel: Record<string, string> = {
    LAST_32: t.koStageL32, LAST_16: t.koStageL16, QUARTER_FINALS: t.koStageQF,
    SEMI_FINALS: t.koStageSF, THIRD_PLACE: t.koStage3P, FINAL: t.koStageFinal,
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-tw-navy">{t.koTitle}</h2>
        <p className="text-sm text-tw-grey mt-1">{t.koSubtitle}</p>
      </div>

      {matches.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-tw-grey border-2 border-tw-grey/20 shadow-sm">
          ⏳ {t.koEmpty}
        </div>
      ) : (
        STAGE_ORDER.filter(s => matches.some(m => m.stage === s)).map(stage => {
          const ms = matches.filter(m => m.stage === stage);
          return (
            <section key={stage} className="space-y-3">
              <h3 className="font-bold text-base sm:text-lg text-tw-navy flex items-center gap-2">
                <span className="inline-block w-1.5 h-5 rounded bg-tw-green" />
                {stageLabel[stage] ?? stage}
                <span className="text-xs font-normal text-tw-grey">({ms.length})</span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {ms.map((m, i) => <MatchCard key={`${stage}-${i}`} m={m} t={t} />)}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
