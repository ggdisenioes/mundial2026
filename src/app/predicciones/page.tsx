"use client";
import { useEffect, useState } from "react";
import type { Participant, Results } from "@/types";
import Projections from "@/components/Projections";

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
      <div className="min-h-screen flex items-center justify-center bg-tw-light">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-tw-green border-t-transparent rounded-full animate-spin" />
          <span className="text-tw-grey text-base">Cargando…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-tw-light">
      <header className="bg-tw-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-7">
          <p className="text-tw-green text-xs font-bold uppercase tracking-widest">Porra del Mundial 2026</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">🔮 ¿Quién puede ganar la porra?</h1>
          <p className="text-white/60 text-sm mt-2 max-w-xl">
            Cada barra muestra los puntos <strong className="text-white/90">asegurados</strong> y hasta dónde puede
            llegar con los aciertos marcados. Tocá los aciertos para simular escenarios.
          </p>
        </div>
      </header>
      <Projections participants={participants} results={results} />
    </div>
  );
}
