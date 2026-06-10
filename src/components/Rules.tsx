"use client";

interface Props {
  spainMode: "replace" | "add";
}

export default function Rules({ spainMode }: Props) {
  const replace = spainMode === "replace";
  return (
    <div className="max-w-2xl mx-auto space-y-6 text-sm text-slate-700">
      <h2 className="text-xl font-bold text-slate-800">📖 Reglas del Prode</h2>

      <section className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-bold text-base mb-3 text-emerald-700">P1 — Pronósticos 1X2 ({replace ? "69" : "72"} partidos)</h3>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>3 puntos</strong> por cada resultado correcto (1, X, 2)</li>
          {replace && <li>Los 3 partidos de España <strong>no cuentan</strong> en P1 (reemplazados por P2)</li>}
          {!replace && <li>Los partidos de España también cuentan en P1 <strong>y</strong> en P2</li>}
        </ul>
      </section>

      <section className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-bold text-base mb-3 text-emerald-700">P2 — Marcadores exactos España (3 partidos)</h3>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>10 puntos</strong> por marcador exacto (ej: 2-1)</li>
          {replace && <li><strong>3 puntos</strong> por acertar solo el resultado 1X2</li>}
          {!replace && <li>Solo puntúa el marcador exacto (10 pts). El 1X2 ya puntúa en P1.</li>}
        </ul>
      </section>

      <section className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-bold text-base mb-3 text-emerald-700">P3 — Fase eliminatoria</h3>
        <div className="space-y-1">
          <div className="flex justify-between"><span>Campeón</span><strong>50 pts</strong></div>
          <div className="flex justify-between"><span>Subcampeón</span><strong>30 pts</strong></div>
          <div className="flex justify-between"><span>Semifinalistas (c/u)</span><strong>15 pts</strong></div>
          <div className="flex justify-between"><span>Cuartos de final (c/u)</span><strong>6 pts</strong></div>
          <div className="flex justify-between"><span>Ronda de 16 (c/u)</span><strong>3 pts</strong></div>
          <div className="flex justify-between"><span>Ronda de 32 (c/u)</span><strong>2 pts</strong></div>
        </div>
        <p className="mt-3 text-xs text-slate-500">* Se puntúa por equipo eliminado en cada ronda, sin importar el orden.</p>
      </section>

      <section className="bg-white rounded-xl p-5 shadow-sm border">
        <h3 className="font-bold text-base mb-3 text-emerald-700">P4 — Bonus especiales</h3>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>10 pts</strong> — Equipo con más goles en fase de grupos</li>
          <li><strong>10 pts</strong> — Equipo con más goles encajados en grupos</li>
          <li><strong>10 pts</strong> — Bota de Oro (máximo goleador del torneo)</li>
          <li><strong>10 pts</strong> — Máximo goleador español</li>
        </ul>
      </section>
    </div>
  );
}
