"use client";
import { useMemo, useState } from "react";
import type { Participant, Results } from "@/types";
import { scoreParticipant } from "@/lib/scoring";
import { useT } from "@/contexts/LangContext";

interface Props {
  participants: Participant[];
  results: Results;
  onSelect: (p: Participant) => void;
  onRefresh: () => void;
}

const normSearch = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function Leaderboard({ participants, results, onSelect, onRefresh }: Props) {
  const { t } = useT();
  const [query, setQuery] = useState("");

  const ranked = useMemo(() =>
    participants
      .map(p => ({ p, score: scoreParticipant(p, results) }))
      .sort((a, b) => b.score.total - a.score.total),
    [participants, results]
  );

  const filtered = useMemo(() => {
    const q = normSearch(query.trim());
    if (!q) return ranked.map((item, i) => ({ ...item, rank: i }));
    return ranked
      .map((item, i) => ({ ...item, rank: i }))
      .filter(({ p }) => normSearch(p.nombre).includes(q));
  }, [ranked, query]);

  const lastUpdate = results.updated_at
    ? new Date(results.updated_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
    : null;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-tw-navy">{t.leaderboardTitle}</h2>
          {lastUpdate && <p className="text-sm text-tw-grey mt-1">{t.updatedAt(lastUpdate)}</p>}
        </div>
        <button onClick={onRefresh}
          className="shrink-0 text-sm sm:text-base border-2 border-tw-navy/20 text-tw-navy px-4 py-2 rounded-xl hover:border-tw-green font-semibold transition-all">
          {t.refresh}
        </button>
      </div>

      {ranked.length > 0 && (
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tw-grey pointer-events-none">🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-tw-grey/30 focus:border-tw-green focus:outline-none text-sm sm:text-base text-tw-navy placeholder:text-tw-grey/60 transition-colors"
          />
        </div>
      )}

      {ranked.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-tw-grey">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-base sm:text-lg text-tw-grey">{t.noParticipantsTitle}.<br className="sm:hidden" /> {t.noParticipantsDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ p, score, rank }) => {
            const medal = rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : null;
            const isTop3 = rank < 3;
            return (
              <button key={p.id} onClick={() => onSelect(p)}
                className={`w-full text-left rounded-2xl border-2 transition-all active:scale-[0.99] p-4 sm:p-5 flex items-center gap-3 sm:gap-5 ${
                  isTop3 ? "bg-white border-tw-navy/10 hover:border-tw-green shadow-sm hover:shadow-md"
                         : "bg-white border-tw-grey/30 hover:border-tw-green hover:shadow-sm"
                }`}>
                <div className="shrink-0 w-10 sm:w-12 flex items-center justify-center">
                  {medal ? <span className="text-2xl sm:text-3xl">{medal}</span>
                         : <span className="text-base sm:text-lg font-bold text-tw-grey">{rank + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base sm:text-xl text-tw-navy truncate">{p.nombre}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {[
                      { k: "P1", v: score.p1 }, { k: t.p2Label, v: score.p2 },
                      { k: "P3", v: score.p3 }, { k: "P4",       v: score.p4 },
                    ].map(({ k, v }) => (
                      <span key={k} className="text-xs sm:text-sm text-tw-grey">
                        {k}: <strong className="text-tw-navy/80">{v}</strong>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`font-extrabold leading-none ${isTop3 ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"} text-tw-navy`}>{score.total}</div>
                  <div className="text-xs text-tw-grey mt-0.5">{t.pts}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
