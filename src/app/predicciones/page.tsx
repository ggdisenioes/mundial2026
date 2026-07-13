"use client";
import { useEffect, useState } from "react";
import type { Participant, Results } from "@/types";
import { predictionRanking, type PredictionRow } from "@/lib/predictions";

const MEDALS = ["🥇", "🥈", "🥉"];

function StatTile({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-tw-grey">{icon} {label}</p>
      <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-tw-navy tabular-nums leading-tight truncate">{value}</p>
      {sub && <p className="text-xs text-tw-grey mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

// Barra de rango: asegurado (navy) + potencial (mint) sobre track, con la
// línea del líder como referencia vertical alineada entre todas las filas.
function RangeBar({ row, scaleMax, leader, muted }: {
  row: PredictionRow; scaleMax: number; leader: number; muted: boolean;
}) {
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / scaleMax) * 100))}%`;
  return (
    <div className="relative h-3.5 rounded-full bg-tw-navy/[0.06] overflow-visible">
      {/* asegurado */}
      <div
        className={`absolute inset-y-0 left-0 rounded-full ${muted ? "bg-tw-grey" : "bg-tw-navy"}`}
        style={{ width: pct(row.current) }}
      />
      {/* potencial (arranca con 2px de aire sobre el asegurado) */}
      {row.potentialExtra > 0 && (
        <div
          className={`absolute inset-y-0 rounded-full border ${
            muted ? "bg-tw-grey/30 border-tw-grey/60" : "bg-tw-green border-emerald-500/70"
          }`}
          style={{ left: `calc(${pct(row.current)} + 2px)`, width: `calc(${pct(row.potentialExtra)} - 2px)` }}
        />
      )}
      {/* línea de referencia: puntaje del líder */}
      <div
        className="absolute -inset-y-1 w-0 border-l-2 border-dashed border-tw-navy/30"
        style={{ left: pct(leader) }}
        aria-hidden
      />
    </div>
  );
}

function RowCard({ row, i, scaleMax, leader, muted }: {
  row: PredictionRow; i: number; scaleMax: number; leader: number; muted: boolean;
}) {
  const bd = row.currentBreakdown;
  return (
    <div className={`group relative px-4 sm:px-5 py-3.5 ${muted ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        {/* posición */}
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          !muted && i < 3 ? "bg-tw-green/20 text-base" : "bg-tw-navy/5 text-tw-grey"
        }`}>
          {!muted && i < 3 ? MEDALS[i] : i + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* nombre + números */}
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <span className={`truncate text-sm sm:text-base font-semibold ${muted ? "text-tw-grey" : "text-tw-navy"}`}>
              {row.nombre}
            </span>
            <span className="shrink-0 tabular-nums text-sm">
              <span className={`font-bold ${muted ? "text-tw-grey" : "text-tw-navy"}`}>{row.current}</span>
              <span className="text-tw-grey mx-1">→</span>
              <span className={`font-extrabold ${muted ? "text-tw-grey" : "text-tw-navy"}`}>{row.best}</span>
              <span className={`ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md align-middle ${
                muted ? "bg-tw-grey/15 text-tw-grey" : "bg-tw-green/25 text-emerald-800"
              }`}>
                +{row.potentialExtra}
              </span>
            </span>
          </div>

          <RangeBar row={row} scaleMax={scaleMax} leader={leader} muted={muted} />

          {/* desglose */}
          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-tw-grey tabular-nums">
            <span>Grupos <strong className="text-tw-navy/70">{bd.p1}</strong></span>
            <span>España <strong className="text-tw-navy/70">{bd.p2}</strong></span>
            <span>Eliminatorias <strong className="text-tw-navy/70">{bd.p3}</strong></span>
            <span>Bonus <strong className="text-tw-navy/70">{bd.p4}</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
}

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

  const rows = predictionRanking(participants, results);
  const leaderCurrent = rows.reduce((mx, r) => Math.max(mx, r.current), 0);
  const scaleMax = Math.max(1, ...rows.map(r => r.best));
  const alive = rows.filter(r => r.canWin);
  const out = rows.filter(r => !r.canWin);
  const leaderRow = rows.find(r => r.current === leaderCurrent);
  const topCeiling = rows[0];

  return (
    <div className="min-h-screen bg-tw-light">
      {/* Header */}
      <header className="bg-tw-navy">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-7">
          <p className="text-tw-green text-xs font-bold uppercase tracking-widest">Porra del Mundial 2026</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">🔮 ¿Quién puede ganar la porra?</h1>
          <p className="text-white/60 text-sm mt-2 max-w-xl">
            Cada barra muestra los puntos <strong className="text-white/90">asegurados</strong> y hasta dónde puede
            llegar si acierta todo lo que aún tiene vivo. Para seguir en carrera hay que poder cruzar la línea del líder.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Stat tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <StatTile icon="🏆" label="Líder actual" value={`${leaderCurrent} pts`} sub={leaderRow?.nombre ?? "—"} />
          <StatTile icon="🎯" label="Siguen en carrera" value={`${alive.length} / ${rows.length}`} sub="pueden alcanzar al líder" />
          <StatTile icon="🚀" label="Techo más alto" value={`${topCeiling?.best ?? 0} pts`} sub={topCeiling?.nombre ?? "—"} />
        </div>

        {/* Leyenda */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-tw-navy/80 px-1">
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-tw-navy inline-block" /> Puntos asegurados
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded bg-tw-green border border-emerald-500/70 inline-block" /> Potencial restante
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3.5 border-l-2 border-dashed border-tw-navy/40 inline-block" /> Líder actual ({leaderCurrent} pts)
          </span>
        </div>

        {/* En carrera */}
        <section className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 bg-tw-navy/5 border-b border-tw-grey/15 flex items-center justify-between">
            <h2 className="font-bold text-tw-navy text-sm sm:text-base">🎯 En carrera</h2>
            <span className="text-xs text-tw-grey">{alive.length} participante{alive.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y divide-tw-light">
            {alive.map((r, i) => (
              <RowCard key={r.id} row={r} i={i} scaleMax={scaleMax} leader={leaderCurrent} muted={false} />
            ))}
            {alive.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-tw-grey">Sin datos todavía.</p>
            )}
          </div>
        </section>

        {/* Sin opciones */}
        {out.length > 0 && (
          <section className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm overflow-hidden">
            <div className="px-4 sm:px-5 py-3 bg-tw-navy/5 border-b border-tw-grey/15 flex items-center justify-between">
              <h2 className="font-bold text-tw-grey text-sm sm:text-base">💤 Ya sin opciones de alcanzar al líder</h2>
              <span className="text-xs text-tw-grey">{out.length} participante{out.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-tw-light">
              {out.map((r, i) => (
                <RowCard key={r.id} row={r} i={alive.length + i} scaleMax={scaleMax} leader={leaderCurrent} muted />
              ))}
            </div>
          </section>
        )}

        {/* Metodología */}
        <details className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm px-5 py-4 text-sm text-tw-navy/80">
          <summary className="font-bold text-tw-navy cursor-pointer select-none">ℹ️ Cómo se calcula</summary>
          <ul className="mt-3 space-y-1.5 list-disc pl-5">
            <li><strong>Asegurado</strong>: fase de grupos, marcadores de España y bonus de grupo (ya cerrados) más lo ya acertado en eliminatorias.</li>
            <li><strong>Potencial</strong>: puntos de picks que todavía pueden cumplirse — equipos vivos cuyo destino predicho sigue siendo alcanzable, más los bonus de goleadores aún abiertos.</li>
            <li><strong>En carrera</strong>: su máximo iguala o supera los {leaderCurrent} pts del líder actual.</li>
            <li>El máximo es una cota individual: dos escenarios óptimos pueden ser incompatibles entre sí (solo un campeón se dará).</li>
          </ul>
        </details>
      </main>
    </div>
  );
}
