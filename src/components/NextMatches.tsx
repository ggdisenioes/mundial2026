"use client";
import { useMemo } from "react";
import type { Results, BracketMatch } from "@/types";
import { TEAMS } from "@/lib/matches";
import { upcomingMatches } from "@/lib/bracket";
import { useT } from "@/contexts/LangContext";

// Fecha/hora en hora peninsular (CEST = UTC+2), estilo "Sáb 4/7 · 21:00".
function fmt(utc: string, weekdays: string[], today: string, tomorrow: string): string {
  const d = new Date(utc);
  if (isNaN(d.getTime())) return "";
  const cest = new Date(d.getTime() + 2 * 60 * 60 * 1000);
  const nowCest = new Date(Date.now() + 2 * 60 * 60 * 1000);
  const tmr = new Date(nowCest.getTime() + 24 * 60 * 60 * 1000);
  const same = (a: Date, b: Date) =>
    a.getUTCFullYear() === b.getUTCFullYear() && a.getUTCMonth() === b.getUTCMonth() && a.getUTCDate() === b.getUTCDate();
  const time = `${cest.getUTCHours()}:${String(cest.getUTCMinutes()).padStart(2, "0")}`;
  if (same(cest, nowCest)) return `${today} · ${time}`;
  if (same(cest, tmr)) return `${tomorrow} · ${time}`;
  return `${weekdays[cest.getUTCDay()]} ${cest.getUTCDate()}/${cest.getUTCMonth() + 1} · ${time}`;
}

function Side({ code, name }: { code: string | null; name: string }) {
  const flag = code ? TEAMS[code]?.flag : null;
  return (
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="text-lg shrink-0">{flag ?? "🛡️"}</span>
      <span className={`truncate text-sm ${name ? "text-tw-navy font-semibold" : "text-tw-grey italic"}`}>
        {name || "Por definir"}
      </span>
    </div>
  );
}

export default function NextMatches({ results }: { results: Results }) {
  const { t } = useT();
  const next = useMemo<BracketMatch[]>(
    () => upcomingMatches(results.knockout?._bracket ?? [], results.scores ?? [], Date.now(), 3),
    [results],
  );

  if (next.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 bg-tw-navy/5 border-b border-tw-grey/15">
        <h3 className="text-sm font-bold text-tw-navy">📅 {t.nextMatchesTitle}</h3>
      </div>
      <div className="divide-y divide-tw-light">
        {next.map((m, i) => (
          <div key={i} className="px-4 py-2.5 flex items-center gap-3">
            <span className="text-[11px] text-tw-grey w-24 shrink-0">{fmt(m.utcDate, t.koWeekdays, t.koToday, t.koTomorrow)}</span>
            <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 min-w-0">
              <Side code={m.home} name={m.homeName} />
              <span className="text-xs font-bold text-tw-grey shrink-0">vs</span>
              <div className="justify-self-end min-w-0"><Side code={m.away} name={m.awayName} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
