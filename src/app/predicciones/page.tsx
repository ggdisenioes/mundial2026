"use client";
import { useEffect, useState } from "react";
import type { Participant, Results } from "@/types";
import { predictionRanking } from "@/lib/predictions";

export default function PrediccionesPage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [results, setResults] = useState<Results | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/participants", { cache: "no-store" }).then(r => r.json()),
      fetch("/api/results", { cache: "no-store" }).then(r => r.json()),
    ])
      .then(([p, r]) => {
        setParticipants(p.participants ?? []);
        setResults(r.results ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tw-light text-tw-navy">
        Cargando…
      </div>
    );
  }

  const rows = predictionRanking(participants, results);
  const leaderCurrent = rows.reduce((mx, r) => Math.max(mx, r.current), 0);
  const contenders = rows.filter(r => r.canWin);

  return (
    <div className="min-h-screen bg-tw-light text-tw-navy">
      <header className="bg-tw-navy text-white px-4 sm:px-6 py-5">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-extrabold">🔮 Potenciales ganadores</h1>
          <p className="text-sm text-white/70 mt-1">
            Escenario según el estado actual del torneo · {rows.length} participantes
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <section className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-tw-grey/20 shadow-sm">
          <h2 className="font-bold text-base sm:text-lg mb-2">Cómo leerlo</h2>
          <ul className="text-sm text-tw-navy/80 space-y-1 list-disc pl-5">
            <li><strong>Actual</strong>: puntaje garantizado — grupos y bonus de grupo ya están fijados, más lo que ya acertó de eliminatorias.</li>
            <li><strong>Máx.</strong>: puntaje si TODO lo que aún puede acertar (equipos aún vivos que puede predecir) se cumple.</li>
            <li><strong>Puede ganar</strong>: si su Máx. alcanza al líder actual ({leaderCurrent} pts). Los que ya no pueden alcanzarlo quedan grises.</li>
          </ul>
          <p className="text-xs text-tw-grey mt-2">
            El Máx. es una cota superior teórica: dos participantes pueden tener escenarios óptimos incompatibles (ej. dos campeones distintos), pero solo uno se cumplirá.
          </p>
        </section>

        <section className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm overflow-hidden">
          <div className="px-4 py-3 bg-tw-navy/5 border-b border-tw-grey/15 flex items-center justify-between">
            <h2 className="font-bold">Ranking por Máx. posible</h2>
            <span className="text-xs text-tw-grey">
              {contenders.length}/{rows.length} aún pueden alcanzar al líder
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-tw-light/60 text-tw-grey uppercase text-[10px] tracking-wide">
                <tr>
                  <th className="text-left px-3 py-2">#</th>
                  <th className="text-left px-3 py-2">Participante</th>
                  <th className="text-right px-3 py-2">Actual</th>
                  <th className="text-right px-3 py-2">Máx.</th>
                  <th className="text-right px-3 py-2 whitespace-nowrap">Potencial (+)</th>
                  <th className="text-center px-3 py-2">Ganar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tw-light">
                {rows.map((r, i) => (
                  <tr key={r.id} className={r.canWin ? "bg-white" : "bg-tw-light/30 text-tw-grey"}>
                    <td className="px-3 py-2 tabular-nums">{i + 1}</td>
                    <td className="px-3 py-2">
                      <div className={r.canWin ? "font-semibold text-tw-navy" : ""}>{r.nombre}</div>
                      <div className="text-[10px] text-tw-grey">
                        P1 {r.currentBreakdown.p1} · P2 {r.currentBreakdown.p2} · P3 {r.currentBreakdown.p3} · P4 {r.currentBreakdown.p4}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.current}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{r.best}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-tw-green">+{r.potentialExtra}</td>
                    <td className="px-3 py-2 text-center">{r.canWin ? "✅" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
