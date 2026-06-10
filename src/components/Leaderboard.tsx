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
          <h2 className="text-2xl sm:text-3xl font-bold">Clasificación</h2>
          {lastUpdate && <p className="text-sm text-slate-400 mt-1">Actualizado: {lastUpdate}</p>}
        </div>
        <button onClick={onRefresh}
          className="shrink-0 text-sm sm:text-base text-emerald-600 hover:text-emerald-800 border border-emerald-200 px-4 py-2 rounded-xl hover:bg-emerald-50 font-medium transition-colors">
          ↻ Actualizar
        </button>
      </div>

      {ranked.length === 0 ? (
        <div className="text-center py-16 sm:py-24 text-slate-400 bg-white rounded-2xl border">
          <p className="text-5xl sm:text-6xl mb-4">📋</p>
          <p className="text-base sm:text-lg">Aún no hay participantes.<br className="sm:hidden" /> Subí los Excel en la pestaña Participantes.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ranked.map(({ p, score }, i) => {
            const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
            return (
              <button key={p.id} onClick={() => onSelect(p)}
                className="w-full text-left bg-white rounded-2xl shadow-sm border-2 border-transparent hover:border-emerald-300 hover:shadow-md active:scale-[0.99] transition-all p-4 sm:p-5 flex items-center gap-3 sm:gap-5">
                {/* Posición */}
                <div className="shrink-0 w-10 sm:w-12 text-center">
                  {medal
                    ? <span className="text-2xl sm:text-3xl">{medal}</span>
                    : <span className="text-lg sm:text-xl font-bold text-slate-400">{i + 1}</span>
                  }
                </div>
                {/* Nombre + desglose */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base sm:text-xl truncate">{p.nombre}</div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {[
                      { k: "P1", v: score.p1 },
                      { k: "P2 🇪🇸", v: score.p2 },
                      { k: "P3", v: score.p3 },
                      { k: "P4", v: score.p4 },
                    ].map(({ k, v }) => (
                      <span key={k} className="text-xs sm:text-sm text-slate-400">
                        {k}: <strong className="text-slate-600">{v}</strong>
                      </span>
                    ))}
                  </div>
                </div>
                {/* Total */}
                <div className="shrink-0 text-right">
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700 leading-none">{score.total}</div>
                  <div className="text-xs text-slate-400 mt-0.5">pts</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
