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
    if (res.ok) {
      setMsg("✅ Guardado correctamente");
      onRefresh();
    } else {
      setMsg(`❌ ${data.error}`);
    }
    setSaving(false);
  }

  const lastUpdate = results.updated_at
    ? new Date(results.updated_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Resultados del torneo</h2>
          {lastUpdate && <p className="text-sm text-slate-400 mt-1">Última actualización: {lastUpdate}</p>}
        </div>
        <div className="flex gap-2">
          {unlocked ? (
            <>
              <button onClick={() => setShowChangePin(true)}
                className="text-sm border px-4 py-2 rounded-lg hover:bg-slate-50 font-medium">🔑 PIN</button>
              <button onClick={() => setUnlocked(false)}
                className="text-sm border px-4 py-2 rounded-lg hover:bg-slate-50 font-medium">🔒 Cerrar edición</button>
            </>
          ) : (
            <button onClick={() => settings.adminPinHash ? setShowPinModal(true) : setUnlocked(true)}
              className="text-sm bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 font-medium">
              ✏️ Editar resultados
            </button>
          )}
        </div>
      </div>

      {/* Scores de grupos — siempre visibles, editables solo si unlocked */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="font-semibold text-base mb-4">Resultados de grupos</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
          {MATCHES.map(([h, a, g], i) => (
            <div key={i} className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 w-5 font-mono">{g}</span>
              <span className="truncate text-slate-700">{TEAMS[h]?.flag}{h}</span>
              {unlocked ? (
                <input
                  value={scores[i]} onChange={e => {
                    const ns = [...scores]; ns[i] = e.target.value; setScores(ns);
                  }}
                  placeholder="x-x"
                  className="w-16 border rounded-lg px-2 py-1.5 font-mono text-center text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              ) : (
                <span className={`w-16 text-center font-mono font-bold text-sm px-2 py-1.5 rounded-lg ${scores[i] ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"}`}>
                  {scores[i] || "—"}
                </span>
              )}
              <span className="truncate text-slate-700">{a}{TEAMS[a]?.flag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Knockout — siempre visible */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h3 className="font-semibold text-base">Fase eliminatoria</h3>
        {[
          { label: "Campeón", key: "winner" as const },
          { label: "Subcampeón", key: "runnerUp" as const },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-sm text-slate-500 mb-1.5">{label}</label>
            {unlocked ? (
              <select value={knockout[key]} onChange={e => setKnockout({ ...knockout, [key]: e.target.value })}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                <option value="">— Sin definir —</option>
                {TEAM_LIST.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <div className="w-full border rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-700">
                {knockout[key] || <span className="text-slate-400">Sin definir</span>}
              </div>
            )}
          </div>
        ))}
        {[
          { label: "Semifinalistas", key: "semis" as const, n: 2 },
          { label: "Cuartos de final", key: "qf" as const, n: 4 },
          { label: "Ronda de 16", key: "r16" as const, n: 8 },
          { label: "Ronda de 32", key: "r32" as const, n: 16 },
        ].map(({ label, key, n }) => (
          <div key={key}>
            <label className="block text-sm text-slate-500 mb-1.5">{label}</label>
            <div className="flex flex-wrap gap-2">
              {unlocked ? (
                Array.from({ length: n }, (_, j) => (
                  <select key={j} value={knockout[key][j] || ""}
                    onChange={e => {
                      const arr = [...knockout[key]]; arr[j] = e.target.value;
                      setKnockout({ ...knockout, [key]: arr });
                    }}
                    className="border rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400">
                    <option value="">—</option>
                    {TEAM_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                ))
              ) : (
                knockout[key].filter(Boolean).length > 0
                  ? knockout[key].filter(Boolean).map((t, j) => (
                    <span key={j} className="text-sm px-3 py-1 bg-slate-100 rounded-full text-slate-700">{t}</span>
                  ))
                  : <span className="text-sm text-slate-400">Sin definir</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bonus — siempre visible */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h3 className="font-semibold text-base">Bonus</h3>
        {[
          { label: "Bota de Oro", key: "goldenBoot" as const, type: "text" },
          { label: "Máx. goleador España", key: "topEspScorer" as const, type: "text" },
          { label: "Equipo más goleador (override)", key: "topTeamOverride" as const, type: "select" },
          { label: "Equipo más goleado (override)", key: "mostConcededOverride" as const, type: "select" },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="block text-sm text-slate-500 mb-1.5">{label}</label>
            {unlocked ? (
              type === "text" ? (
                <input value={bonus[key]} onChange={e => setBonus({ ...bonus, [key]: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  placeholder="Dejar vacío = automático" />
              ) : (
                <select value={bonus[key]} onChange={e => setBonus({ ...bonus, [key]: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                  <option value="">— Automático —</option>
                  {TEAM_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              )
            ) : (
              <div className="w-full border rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-700">
                {bonus[key] || <span className="text-slate-400">Sin definir / automático</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sección de guardado — solo visible si desbloqueado */}
      {unlocked && (
        <>
          {settings.adminPinHash && (
            <div className="bg-white rounded-xl border p-6">
              <label className="block text-sm text-slate-500 mb-1.5">PIN para confirmar guardado</label>
              <input type="password" value={pin} onChange={e => setPin(e.target.value)}
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Ingresá el PIN" />
            </div>
          )}
          {msg && <p className="text-base text-center font-medium">{msg}</p>}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-base hover:bg-emerald-700 disabled:opacity-50">
            {saving ? "Guardando…" : "Guardar resultados"}
          </button>
        </>
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
