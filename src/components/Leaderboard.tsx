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
  const ranked = useMemo(() => {
    return participants
      .map(p => ({ p, score: scoreParticipant(p, results) }))
      .sort((a, b) => b.score.total - a.score.total);
  }, [participants, results]);

  const lastUpdate = results.updated_at
    ? new Date(results.updated_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
    : null;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Clasificación</h2>
          {lastUpdate && <p className="text-sm text-slate-400 mt-1">Actualizado: {lastUpdate}</p>}
        </div>
        <button onClick={onRefresh}
          className="text-sm text-emerald-600 hover:text-emerald-800 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-50 font-medium">
          Actualizar
        </button>
      </div>

      {ranked.length === 0 && (
        <div className="text-center py-16 text-slate-400">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-lg">Aún no hay participantes. Subí los archivos Excel en la pestaña Participantes.</p>
        </div>
      )}

      <div className="space-y-3">
        {ranked.map(({ p, score }, i) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
          return (
            <button key={p.id} onClick={() => onSelect(p)}
              className="w-full text-left bg-white rounded-xl shadow-sm border hover:border-emerald-300 hover:shadow-md transition p-5 flex items-center gap-5">
              <div className="text-2xl w-10 text-center shrink-0 font-bold">{medal}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-lg truncate">{p.nombre}</div>
                <div className="text-sm text-slate-400 flex gap-4 mt-1">
                  <span>P1: <strong className="text-slate-600">{score.p1}</strong></span>
                  <span>P2: <strong className="text-slate-600">{score.p2}</strong></span>
                  <span>P3: <strong className="text-slate-600">{score.p3}</strong></span>
                  <span>P4: <strong className="text-slate-600">{score.p4}</strong></span>
                </div>
              </div>
              <div className="text-3xl font-extrabold text-emerald-700 shrink-0">{score.total}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
