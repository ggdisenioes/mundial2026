"use client";
import { useMemo, useState } from "react";
import type { Participant, Results } from "@/types";
import { predictionRanking, type PredictionRow } from "@/lib/predictions";
import ScenarioBuilder from "@/components/ScenarioBuilder";

const MEDALS = ["🥇", "🥈", "🥉"];
const FASE_BOTA = "Bota de Oro";
const FASE_ESP = "Goleador 🇪🇸";

interface Adjusted {
  row: PredictionRow;
  adj: number;        // proyección con lo marcado
  adjExtra: number;   // adj - current
  activeCount: number;
  excluded: number;   // puntos apagados (best - adj)
}

function StatTile({ icon, label, value, sub }: { icon: string; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-tw-grey">{icon} {label}</p>
      <p className="mt-1 text-2xl sm:text-3xl font-extrabold text-tw-navy tabular-nums leading-tight truncate">{value}</p>
      {sub && <p className="text-xs text-tw-grey mt-0.5 truncate">{sub}</p>}
    </div>
  );
}

function ToggleChip({ on, label, onClick, small = false }: { on: boolean; label: string; onClick: () => void; small?: boolean }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex items-center gap-1 rounded-lg border font-semibold transition-colors ${
        small ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2.5 py-1.5"
      } ${
        on
          ? "border-emerald-500/60 bg-tw-green/15 text-tw-navy"
          : "border-tw-grey/40 bg-tw-light text-tw-grey line-through decoration-tw-grey/70"
      }`}
    >
      <span className={`${small ? "text-[9px]" : "text-[10px]"} ${on ? "text-emerald-700" : "text-tw-grey"}`}>
        {on ? "✓" : "✕"}
      </span>
      {label}
    </button>
  );
}

// Barra: asegurado (navy) + potencial marcado (mint) + descartado (fantasma punteado).
function RangeBar({ a, scaleMax, leader, muted }: { a: Adjusted; scaleMax: number; leader: number; muted: boolean }) {
  const pct = (v: number) => `${Math.max(0, Math.min(100, (v / scaleMax) * 100))}%`;
  return (
    <div className="relative h-3.5 rounded-full bg-tw-navy/[0.06]">
      <div
        className={`absolute inset-y-0 left-0 rounded-full ${muted ? "bg-tw-grey" : "bg-tw-navy"}`}
        style={{ width: pct(a.row.current) }}
      />
      {a.adjExtra > 0 && (
        <div
          className={`absolute inset-y-0 rounded-full border ${
            muted ? "bg-tw-grey/30 border-tw-grey/60" : "bg-tw-green border-emerald-500/70"
          }`}
          style={{ left: `calc(${pct(a.row.current)} + 2px)`, width: `calc(${pct(a.adjExtra)} - 2px)` }}
        />
      )}
      {a.excluded > 0 && (
        <div
          className="absolute inset-y-0 rounded-full border border-dashed border-tw-grey/60"
          style={{ left: `calc(${pct(a.row.current + a.adjExtra)} + 2px)`, width: `calc(${pct(a.excluded)} - 2px)` }}
        />
      )}
      <div
        className="absolute -inset-y-1 w-0 border-l-2 border-dashed border-tw-navy/30"
        style={{ left: pct(leader) }}
        aria-hidden
      />
    </div>
  );
}

function RowCard({ a, i, scaleMax, leader, muted, isChipOn, toggleChip }: {
  a: Adjusted; i: number; scaleMax: number; leader: number; muted: boolean;
  isChipOn: (rowId: string, idx: number) => boolean;
  toggleChip: (rowId: string, idx: number) => void;
}) {
  const { row } = a;
  const bd = row.currentBreakdown;
  return (
    <div className={`px-4 sm:px-5 py-3.5 ${muted ? "opacity-70" : ""}`}>
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
          !muted && i < 3 ? "bg-tw-green/20 text-base" : "bg-tw-navy/5 text-tw-grey"
        }`}>
          {!muted && i < 3 ? MEDALS[i] : i + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3 mb-1.5">
            <span className={`truncate text-sm sm:text-base font-semibold ${muted ? "text-tw-grey" : "text-tw-navy"}`}>
              {row.nombre}
            </span>
            <span className="shrink-0 tabular-nums text-sm">
              <span className={`font-bold ${muted ? "text-tw-grey" : "text-tw-navy"}`}>{row.current}</span>
              <span className="text-tw-grey mx-1">→</span>
              <span className={`font-extrabold ${muted ? "text-tw-grey" : "text-tw-navy"}`}>{a.adj}</span>
              <span className={`ml-1.5 text-[11px] font-bold px-1.5 py-0.5 rounded-md align-middle ${
                muted ? "bg-tw-grey/15 text-tw-grey" : "bg-tw-green/25 text-emerald-800"
              }`}>
                +{a.adjExtra}
              </span>
              {a.excluded > 0 && (
                <span className="ml-1.5 text-[10px] text-tw-grey align-middle">(máx {row.best})</span>
              )}
            </span>
          </div>

          <RangeBar a={a} scaleMax={scaleMax} leader={leader} muted={muted} />

          <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-tw-grey tabular-nums">
            <span>Grupos <strong className="text-tw-navy/70">{bd.p1}</strong></span>
            <span>España <strong className="text-tw-navy/70">{bd.p2}</strong></span>
            <span>Eliminatorias <strong className="text-tw-navy/70">{bd.p3}</strong></span>
            <span>Bonus <strong className="text-tw-navy/70">{bd.p4}</strong></span>
          </div>

          {row.pending.length > 0 ? (
            <details className="mt-2">
              <summary className={`cursor-pointer select-none text-[11px] font-semibold ${
                muted ? "text-tw-grey" : "text-emerald-700 hover:text-emerald-800"
              }`}>
                {a.activeCount}/{row.pending.length} aciertos marcados → proyección {a.adj} pts ▾
              </summary>
              <p className="mt-1.5 text-[10px] text-tw-grey">Tocá un acierto para incluirlo o descartarlo de la proyección.</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {row.pending.map((pp, k) => (
                  <ToggleChip
                    key={k}
                    small
                    on={isChipOn(row.id, k)}
                    onClick={() => toggleChip(row.id, k)}
                    label={`${pp.fase}: ${pp.equipo} +${pp.pts}`}
                  />
                ))}
              </div>
            </details>
          ) : (
            <p className="mt-2 text-[11px] text-tw-grey">Sin aciertos pendientes — su puntaje está cerrado.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Projections({ participants, results, embedded = false }: {
  participants: Participant[]; results: Results; embedded?: boolean;
}) {
  const rows = useMemo(() => predictionRanking(participants, results), [participants, results]);
  const [mode, setMode] = useState<"techos" | "escenario">("techos");
  const [off, setOff] = useState<Set<string>>(new Set()); // chips apagados: "id:idx"
  const [incBota, setIncBota] = useState(true);
  const [incEsp, setIncEsp] = useState(true);

  const faseOn = (fase: string) =>
    fase === FASE_BOTA ? incBota : fase === FASE_ESP ? incEsp : true;

  const isChipOn = (rowId: string, idx: number) => {
    const row = rows.find(r => r.id === rowId);
    const pick = row?.pending[idx];
    if (!pick) return false;
    return !off.has(`${rowId}:${idx}`) && faseOn(pick.fase);
  };

  const toggleChip = (rowId: string, idx: number) => {
    const row = rows.find(r => r.id === rowId);
    const pick = row?.pending[idx];
    if (pick && !faseOn(pick.fase)) return; // apagado globalmente: se maneja arriba
    setOff(prev => {
      const next = new Set(prev);
      const key = `${rowId}:${idx}`;
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const adjusted: Adjusted[] = useMemo(() => {
    return rows.map(row => {
      let extra = 0, active = 0;
      row.pending.forEach((pp, k) => {
        if (!off.has(`${row.id}:${k}`) && faseOn(pp.fase)) { extra += pp.pts; active++; }
      });
      return { row, adj: row.current + extra, adjExtra: extra, activeCount: active, excluded: row.best - row.current - extra };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, off, incBota, incEsp]);

  const leaderCurrent = rows.reduce((mx, r) => Math.max(mx, r.current), 0);
  const scaleMax = Math.max(1, ...rows.map(r => r.best));
  const sorted = [...adjusted].sort((a, b) => b.adj - a.adj || b.row.current - a.row.current || a.row.nombre.localeCompare(b.row.nombre));
  const alive = sorted.filter(a => a.adj >= leaderCurrent);
  const out = sorted.filter(a => a.adj < leaderCurrent);
  const leaderRow = rows.find(r => r.current === leaderCurrent);
  const top = sorted[0];
  const anyOff = off.size > 0 || !incBota || !incEsp;

  const reset = () => { setOff(new Set()); setIncBota(true); setIncEsp(true); };

  return (
    <div className={embedded ? "max-w-4xl mx-auto space-y-5" : "max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-5"}>
      {/* Conmutador de modo */}
      <div className="inline-flex gap-1 bg-tw-navy/5 rounded-xl p-1">
        {([["techos", "📈 Techos"], ["escenario", "🔮 Si queda así…"]] as const).map(([m, lbl]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 sm:px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-lg transition-colors ${
              mode === m ? "bg-white text-tw-navy shadow-sm" : "text-tw-navy/60 hover:text-tw-navy"
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {mode === "escenario" ? (
        <ScenarioBuilder participants={participants} results={results} />
      ) : (<>
      {/* Stat tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile icon="🏆" label="Líder actual" value={`${leaderCurrent} pts`} sub={leaderRow?.nombre ?? "—"} />
        <StatTile icon="🎯" label="Siguen en carrera" value={`${alive.length} / ${rows.length}`} sub="con lo marcado, alcanzan al líder" />
        <StatTile icon="🚀" label="Proyección más alta" value={`${top?.adj ?? 0} pts`} sub={top?.row.nombre ?? "—"} />
      </div>

      {/* Simulador global */}
      <div className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm px-4 sm:px-5 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="text-xs font-bold text-tw-navy">🎛️ Simulador · bonus de jugadores:</span>
        <ToggleChip on={incBota} onClick={() => setIncBota(v => !v)} label="🥇 Bota de Oro (+10)" />
        <ToggleChip on={incEsp} onClick={() => setIncEsp(v => !v)} label="🇪🇸 Goleador España (+10)" />
        {anyOff && (
          <button
            onClick={reset}
            className="ml-auto text-xs font-semibold text-tw-navy/70 hover:text-tw-navy underline underline-offset-2"
          >
            ↺ Restablecer todo
          </button>
        )}
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-tw-navy/80 px-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-tw-navy inline-block" /> Asegurado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded bg-tw-green border border-emerald-500/70 inline-block" /> Potencial marcado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded border border-dashed border-tw-grey/70 inline-block" /> Descartado
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
          {alive.map((a, i) => (
            <RowCard key={a.row.id} a={a} i={i} scaleMax={scaleMax} leader={leaderCurrent} muted={false}
              isChipOn={isChipOn} toggleChip={toggleChip} />
          ))}
          {alive.length === 0 && <p className="px-5 py-8 text-center text-sm text-tw-grey">Nadie alcanza al líder con lo marcado.</p>}
        </div>
      </section>

      {/* Sin opciones */}
      {out.length > 0 && (
        <section className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-3 bg-tw-navy/5 border-b border-tw-grey/15 flex items-center justify-between">
            <h2 className="font-bold text-tw-grey text-sm sm:text-base">💤 No alcanzan al líder con lo marcado</h2>
            <span className="text-xs text-tw-grey">{out.length} participante{out.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="divide-y divide-tw-light">
            {out.map((a, i) => (
              <RowCard key={a.row.id} a={a} i={alive.length + i} scaleMax={scaleMax} leader={leaderCurrent} muted
                isChipOn={isChipOn} toggleChip={toggleChip} />
            ))}
          </div>
        </section>
      )}

      {/* Metodología */}
      <details className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm px-5 py-4 text-sm text-tw-navy/80">
        <summary className="font-bold text-tw-navy cursor-pointer select-none">ℹ️ Cómo se calcula</summary>
        <ul className="mt-3 space-y-1.5 list-disc pl-5">
          <li><strong>Asegurado</strong>: fase de grupos, marcadores de España y bonus de grupo (ya cerrados) más lo ya acertado en eliminatorias.</li>
          <li><strong>Potencial</strong>: puntos de picks que todavía pueden cumplirse. Por defecto se marcan todos (escenario máximo); podés descartar aciertos para simular escenarios.</li>
          <li>Los interruptores de arriba encienden/apagan de una los +10 de Bota de Oro y Goleador de España para todos.</li>
          <li><strong>En carrera</strong>: su proyección iguala o supera los {leaderCurrent} pts del líder actual.</li>
          <li>La proyección es una cota individual: dos escenarios óptimos pueden ser incompatibles entre sí (solo un campeón se dará).</li>
        </ul>
      </details>
      </>)}
    </div>
  );
}
