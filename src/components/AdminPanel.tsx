"use client";
import { useState } from "react";
import type { Results, Settings } from "@/types";
import { MATCHES, TEAMS, TEAM_LIST } from "@/lib/matches";
import PinModal from "./PinModal";

interface Props {
  results: Results;
  settings: Settings;
  unlocked: boolean;
  setUnlocked: (v: boolean) => void;
  onRefresh: () => void;
}

export default function AdminPanel({ results, settings, unlocked, setUnlocked, onRefresh }: Props) {
  const [showPinModal, setShowPinModal] = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [pin, setPin] = useState("");

  const [scores, setScores] = useState<string[]>(
    results.scores.map(s => s ? `${s.h}-${s.a}` : "")
  );
  const [knockout, setKnockout] = useState({ ...results.knockout });
  const [bonus, setBonus] = useState({ ...results.bonus });

  async function handleSave() {
    setSaving(true);
    setMsg("");
    const parsedScores = scores.map(s => {
      const m = s.match(/(\d+)\s*[-–:]\s*(\d+)/);
      return m ? { h: +m[1], a: +m[2] } : null;
    });
    const res = await fetch("/api/results", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, scores: parsedScores, knockout, bonus }),
    });
    const data = await res.json();
    setMsg(res.ok ? "✅ Guardado correctamente" : `❌ ${data.error}`);
    if (res.ok) onRefresh();
    setSaving(false);
  }

  const lastUpdate = results.updated_at
    ? new Date(results.updated_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
    : null;

  const inputCls = "w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white";
  const readonlyCls = "w-full border rounded-xl px-4 py-3 text-base bg-slate-50 text-slate-700";

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Resultados del torneo</h2>
          {lastUpdate && <p className="text-sm text-slate-400 mt-1">Última actualización: {lastUpdate}</p>}
        </div>
        <div className="flex gap-2">
          {unlocked ? (
            <>
              <button onClick={() => setShowChangePin(true)}
                className="text-sm sm:text-base border px-4 py-2.5 rounded-xl hover:bg-slate-50 font-medium transition-colors">
                🔑 Cambiar PIN
              </button>
              <button onClick={() => setUnlocked(false)}
                className="text-sm sm:text-base border px-4 py-2.5 rounded-xl hover:bg-slate-50 font-medium transition-colors">
                🔒 Cerrar edición
              </button>
            </>
          ) : (
            <button onClick={() => settings.adminPinHash ? setShowPinModal(true) : setUnlocked(true)}
              className="text-sm sm:text-base bg-emerald-600 text-white px-5 py-2.5 rounded-xl hover:bg-emerald-700 font-semibold transition-colors">
              ✏️ Editar resultados
            </button>
          )}
        </div>
      </div>

      {/* Grupos */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6">
        <h3 className="font-bold text-lg sm:text-xl mb-4">Resultados de grupos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-[500px] overflow-y-auto pr-1">
          {MATCHES.map(([h, a, g], i) => (
            <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2.5">
              <span className="text-slate-400 font-mono text-sm w-5 shrink-0">{g}</span>
              <span className="truncate text-sm sm:text-base text-slate-700 flex-1 min-w-0">
                {TEAMS[h]?.flag} {h}
              </span>
              {unlocked ? (
                <input
                  value={scores[i]}
                  onChange={e => { const ns = [...scores]; ns[i] = e.target.value; setScores(ns); }}
                  placeholder="0-0"
                  className="w-16 sm:w-20 border rounded-lg px-2 py-1.5 font-mono text-center text-base font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                />
              ) : (
                <span className={`w-16 sm:w-20 text-center font-mono font-bold text-base px-2 py-1.5 rounded-lg ${scores[i] ? "bg-emerald-50 text-emerald-700" : "text-slate-300"}`}>
                  {scores[i] || "—"}
                </span>
              )}
              <span className="truncate text-sm sm:text-base text-slate-700 flex-1 min-w-0 text-right">
                {a} {TEAMS[a]?.flag}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Eliminatoria */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6 space-y-5">
        <h3 className="font-bold text-lg sm:text-xl">Fase eliminatoria</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "🏆 Campeón (50 pts)", key: "winner" as const },
            { label: "🥈 Subcampeón (30 pts)", key: "runnerUp" as const },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-slate-500 mb-2">{label}</label>
              {unlocked ? (
                <select value={knockout[key]} onChange={e => setKnockout({ ...knockout, [key]: e.target.value })} className={inputCls}>
                  <option value="">— Sin definir —</option>
                  {TEAM_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <div className={readonlyCls}>{knockout[key] || <span className="text-slate-400">Sin definir</span>}</div>
              )}
            </div>
          ))}
        </div>

        {[
          { label: "🎽 Semifinalistas (15 pts c/u)", key: "semis" as const, n: 2 },
          { label: "⚡ Cuartos de final (6 pts c/u)", key: "qf" as const, n: 4 },
          { label: "Ronda de 16 (3 pts c/u)", key: "r16" as const, n: 8 },
          { label: "Ronda de 32 (2 pts c/u)", key: "r32" as const, n: 16 },
        ].map(({ label, key, n }) => (
          <div key={key}>
            <label className="block text-sm font-semibold text-slate-500 mb-2">{label}</label>
            {unlocked ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from({ length: n }, (_, j) => (
                  <select key={j} value={knockout[key][j] || ""}
                    onChange={e => { const arr = [...knockout[key]]; arr[j] = e.target.value; setKnockout({ ...knockout, [key]: arr }); }}
                    className="border rounded-xl px-3 py-2.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white">
                    <option value="">—</option>
                    {TEAM_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {knockout[key].filter(Boolean).length > 0
                  ? knockout[key].filter(Boolean).map((t, j) => (
                    <span key={j} className="text-sm sm:text-base px-3 py-1.5 bg-slate-100 rounded-xl text-slate-700 font-medium">{t}</span>
                  ))
                  : <span className="text-sm text-slate-400">Sin definir</span>
                }
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bonus */}
      <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6 space-y-4">
        <h3 className="font-bold text-lg sm:text-xl">Bonus</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "🥇 Bota de Oro (jugador)", key: "goldenBoot" as const, type: "text" },
            { label: "🇪🇸 Máx. goleador España", key: "topEspScorer" as const, type: "text" },
            { label: "⚽ Equipo más goleador (override)", key: "topTeamOverride" as const, type: "select" },
            { label: "🥅 Equipo más goleado (override)", key: "mostConcededOverride" as const, type: "select" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-slate-500 mb-2">{label}</label>
              {unlocked ? (
                type === "text" ? (
                  <input value={bonus[key]} onChange={e => setBonus({ ...bonus, [key]: e.target.value })}
                    className={inputCls} placeholder="Dejar vacío = automático" />
                ) : (
                  <select value={bonus[key]} onChange={e => setBonus({ ...bonus, [key]: e.target.value })} className={inputCls}>
                    <option value="">— Automático —</option>
                    {TEAM_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )
              ) : (
                <div className={readonlyCls}>
                  {bonus[key] || <span className="text-slate-400">Sin definir / automático</span>}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Guardar — solo si desbloqueado */}
      {unlocked && (
        <div className="space-y-4">
          {settings.adminPinHash && (
            <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6">
              <label className="block text-sm font-semibold text-slate-500 mb-2">PIN para confirmar</label>
              <input type="password" value={pin} onChange={e => setPin(e.target.value)}
                className={inputCls} placeholder="Ingresá el PIN" />
            </div>
          )}
          {msg && <p className="text-base text-center font-semibold py-2">{msg}</p>}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 sm:py-5 bg-emerald-600 text-white rounded-2xl font-bold text-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-sm">
            {saving ? "Guardando…" : "💾 Guardar resultados"}
          </button>
        </div>
      )}

      {showPinModal && (
        <PinModal mode="verify" adminPinHash={settings.adminPinHash}
          onSuccess={() => { setUnlocked(true); setShowPinModal(false); }}
          onClose={() => setShowPinModal(false)} />
      )}
      {showChangePin && (
        <PinModal mode="set" adminPinHash={settings.adminPinHash}
          onSuccess={() => { setShowChangePin(false); onRefresh(); }}
          onClose={() => setShowChangePin(false)} />
      )}
    </div>
  );
}
