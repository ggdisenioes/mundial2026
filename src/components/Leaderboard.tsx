"use client";
import { useMemo } from "react";
import type { Participant, Results, Settings } from "@/types";
import { scoreParticipant } from "@/lib/scoring";

interface Props {
  participants: Participant[];
  results: Results;
  settings: Settings;
  onSelect: (p: Participant) => void;
  onRefresh: () => void;
}

export default function Leaderboard({ participants, results, settings, onSelect, onRefresh }: Props) {
  const ranked = useMemo(() => {
    return participants
      .map(p => ({ p, score: scoreParticipant(p, results, settings.spainMode) }))
      .sort((a, b) => b.score.total - a.score.total);
  }, [participants, results, settings]);

  const lastUpdate = results.updated_at
    ? new Date(results.updated_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Clasificación</h2>
          {lastUpdate && <p className="text-xs text-slate-400">Actualizado: {lastUpdate}</p>}
        </div>
        <button onClick={onRefresh}
          className="text-xs text-emerald-600 hover:text-emerald-800 border border-emerald-200 px-3 py-1 rounded-lg hover:bg-emerald-50">
          Actualizar
        </button>
      </div>

      {ranked.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-3">📋</p>
          <p>Aún no hay participantes. Subí los archivos Excel en la pestaña Participantes.</p>
        </div>
      )}

      <div className="space-y-2">
        {ranked.map(({ p, score }, i) => {
          const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}.`;
          return (
            <button key={p.id} onClick={() => onSelect(p)}
              className="w-full text-left bg-white rounded-xl shadow-sm border hover:border-emerald-300 hover:shadow-md transition p-4 flex items-center gap-4">
              <div className="text-xl w-8 text-center shrink-0">{medal}</div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{p.nombre}</div>
                <div className="text-xs text-slate-400 flex gap-3 mt-0.5">
                  <span>P1: {score.p1}</span>
                  <span>P2: {score.p2}</span>
                  <span>P3: {score.p3}</span>
                  <span>P4: {score.p4}</span>
                </div>
              </div>
              <div className="text-2xl font-extrabold text-emerald-700 shrink-0">{score.total}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
