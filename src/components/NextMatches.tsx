"use client";
import { useMemo, useState } from "react";
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

function Row({ m, t }: { m: BracketMatch; t: ReturnType<typeof useT>["t"] }) {
  return (
    <div className="px-4 py-2.5 flex items-center gap-3">
      <span className="text-[11px] text-tw-grey w-24 shrink-0">{fmt(m.utcDate, t.koWeekdays, t.koToday, t.koTomorrow)}</span>
      <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 min-w-0">
        <Side code={m.home} name={m.homeName} />
        <span className="text-xs font-bold text-tw-grey shrink-0">vs</span>
        <div className="justify-self-end min-w-0"><Side code={m.away} name={m.awayName} /></div>
      </div>
    </div>
  );
}

const PER_PAGE = 3;

export default function NextMatches({ results }: { results: Results }) {
  const { t } = useT();
  const [page, setPage] = useState(0);

  const matches = useMemo<BracketMatch[]>(
    () => upcomingMatches(results.knockout?._bracket ?? [], results.scores ?? [], Date.now(), 6),
    [results],
  );

  if (matches.length === 0) return null;

  const pages = Math.ceil(matches.length / PER_PAGE);
  const cur = Math.min(page, pages - 1);
  const shown = matches.slice(cur * PER_PAGE, cur * PER_PAGE + PER_PAGE);

  return (
    <div className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm overflow-hidden">
      <div className="px-4 py-2.5 bg-tw-navy/5 border-b border-tw-grey/15 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-tw-navy">📅 {t.nextMatchesTitle}</h3>
        {pages > 1 && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: pages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  aria-label={`Página ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${i === cur ? "w-4 bg-tw-green" : "w-1.5 bg-tw-grey/40"}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => (p - 1 + pages) % pages)}
                className="w-6 h-6 rounded-md text-tw-navy hover:bg-tw-navy/10 flex items-center justify-center text-sm"
                aria-label="Anterior"
              >‹</button>
              <button
                onClick={() => setPage(p => (p + 1) % pages)}
                className="w-6 h-6 rounded-md text-tw-navy hover:bg-tw-navy/10 flex items-center justify-center text-sm"
                aria-label="Siguiente"
              >›</button>
            </div>
          </div>
        )}
      </div>
      <div className="divide-y divide-tw-light">
        {shown.map((m, i) => <Row key={cur * PER_PAGE + i} m={m} t={t} />)}
      </div>
    </div>
  );
}
