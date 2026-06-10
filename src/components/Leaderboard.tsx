"use client";
import { useMemo } from "react";
import type { Participant, Results } from "@/types";
import { scoreParticipant } from "@/lib/scoring";

interface Props {
  participants: Participant[];
  results: Results;
  onSelect: (p: Participant) => void;
  onRefresh: () => void;
}

export default function Leaderboard({ participants, results, onSelect, onRefresh }: Props) {
  const ranked = useMemo(() =>
    participants
      .map(p => ({ p, score: scoreParticipant(p, results) }))
      .sort((a, b) => b.score.total - a.score.total),
    [participants, results]
  );

  const lastUpdate = results.updated_at
    ? new Date(results.updated_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
    : null;

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-tw-navy">Clasificación</h2>
          {lastUpdate && <p className="text-sm text-tw-grey mt-1">Actualizado: {lastUpdate}</p>}
        </div>
        <button onClick={onRefresh}
          className="shrink-0 text-sm sm:text-base border-2 border-tw-navy/20 text-tw-navy px-4 py-2 rounded-xl hover:border-tw-green hover:text-tw-navy font-semibold transition-all">
          ↻ Actualizar
        </button>
      </div>

      {ranked.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-tw-grey">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-base sm:text-lg text-tw-grey">Aún no hay participantes.<br className="sm:hidden" /> Subí los Excel en Participantes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map(({ p, score }, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            const isTop3 = i < 3;
            return (
              <button key={p.id} onClick={() => onSelect(p)}
                className={`w-full text-left rounded-2xl border-2 transition-all active:scale-[0.99] p-4 sm:p-5 flex items-center gap-3 sm:gap-5 ${
                  isTop3
                    ? "bg-white border-tw-navy/10 hover:border-tw-green shadow-sm hover:shadow-md"
                    : "bg-white border-tw-grey/30 hover:border-tw-green hover:shadow-sm"
                }`}>
                {/* Pos */}
                <div className="shrink-0 w-10 sm:w-12 flex items-center justify-center">
                  {medal
                    ? <span className="text-2xl sm:text-3xl">{medal}</span>
                    : <span className="text-base sm:text-lg font-bold text-tw-grey">{i + 1}</span>
                  }
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base sm:text-xl text-tw-navy truncate">{p.nombre}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {[
                      { k: "P1",      v: score.p1 },
                      { k: "P2 🇪🇸", v: score.p2 },
                      { k: "P3",      v: score.p3 },
                      { k: "P4",      v: score.p4 },
                    ].map(({ k, v }) => (
                      <span key={k} className="text-xs sm:text-sm text-tw-grey">
                        {k}: <strong className="text-tw-navy/80">{v}</strong>
                      </span>
                    ))}
                  </div>
                </div>
                {/* Score */}
                <div className="shrink-0 text-right">
                  <div className={`font-extrabold leading-none ${isTop3 ? "text-4xl sm:text-5xl text-tw-navy" : "text-3xl sm:text-4xl text-tw-navy/80"}`}>
                    {score.total}
                  </div>
                  <div className="text-xs text-tw-grey mt-0.5">pts</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
