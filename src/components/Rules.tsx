"use client";

export default function Rules() {
  return (
    <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6">
      <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">📖 Reglas del Prode</h2>

      {[
        {
          title: "P1 — Pronósticos 1X2 · 69 partidos",
          color: "emerald",
          items: [
            "<strong>3 puntos</strong> por cada resultado correcto (1, X o 2)",
            "Los 3 partidos de España <strong>no cuentan</strong> en P1 — se puntúan en P2",
          ],
        },
        {
          title: "P2 — Marcadores exactos España · 3 partidos",
          color: "blue",
          items: [
            "<strong>10 puntos</strong> por marcador exacto (ej: 2-1)",
            "<strong>0 puntos</strong> si el marcador no es exacto",
          ],
        },
      ].map(({ title, color, items }) => (
        <section key={title} className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border">
          <h3 className={`font-bold text-base sm:text-lg mb-3 text-${color}-700`}>{title}</h3>
          <ul className="space-y-2">
            {items.map((item, i) => (
              <li key={i} className="flex gap-2 text-sm sm:text-base text-slate-700">
                <span className="text-emerald-500 mt-0.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: item }} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border">
        <h3 className="font-bold text-base sm:text-lg mb-4 text-purple-700">P3 — Fase eliminatoria</h3>
        <div className="space-y-0 divide-y divide-slate-100">
          {[
            ["🏆 Campeón", "50 pts"],
            ["🥈 Subcampeón", "30 pts"],
            ["🎽 Semifinalistas (c/u)", "15 pts"],
            ["⚡ Cuartos de final (c/u)", "6 pts"],
            ["Ronda de 16 (c/u)", "3 pts"],
            ["Ronda de 32 (c/u)", "2 pts"],
          ].map(([label, pts]) => (
            <div key={label} className="flex justify-between items-center py-2.5">
              <span className="text-sm sm:text-base text-slate-700">{label}</span>
              <strong className="text-sm sm:text-base text-emerald-700">{pts}</strong>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs sm:text-sm text-slate-400">* Se puntúa por equipo eliminado en cada ronda, sin importar el orden.</p>
      </section>

      <section className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border">
        <h3 className="font-bold text-base sm:text-lg mb-3 text-orange-600">P4 — Bonus especiales · 10 pts c/u</h3>
        <ul className="space-y-2">
          {[
            "⚽ Equipo con más goles en fase de grupos",
            "🥅 Equipo con más goles encajados en grupos",
            "🥇 Bota de Oro (máximo goleador del torneo)",
            "🇪🇸 Máximo goleador español",
          ].map(item => (
            <li key={item} className="flex gap-2 text-sm sm:text-base text-slate-700">
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
