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

  // Local state for editing
  const [scores, setScores] = useState<string[]>(
    results.scores.map(s => s ? `${s.h}-${s.a}` : "")
  );
  const [knockout, setKnockout] = useState({ ...results.knockout });
  const [bonus, setBonus] = useState({ ...results.bonus });
  const [spainMode, setSpainMode] = useState<"replace" | "add">(settings.spainMode);

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
      body: JSON.stringify({ pin, scores: parsedScores, knockout, bonus, spainMode }),
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

  if (!unlocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-5xl">🔐</div>
        <p className="text-slate-500">Área de administración protegida</p>
        <button onClick={() => settings.adminPinHash ? setShowPinModal(true) : setUnlocked(true)}
          className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700">
          Acceder
        </button>
        {showPinModal && (
          <PinModal mode="verify" adminPinHash={settings.adminPinHash}
            onSuccess={() => { setUnlocked(true); setShowPinModal(false); }}
            onClose={() => setShowPinModal(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Panel de Resultados</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowChangePin(true)}
            className="text-xs border px-3 py-1.5 rounded-lg hover:bg-slate-50">🔑 PIN</button>
          <button onClick={() => setUnlocked(false)}
            className="text-xs border px-3 py-1.5 rounded-lg hover:bg-slate-50">Cerrar</button>
        </div>
      </div>

      {/* Modo España */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-sm mb-3">Modo España</h3>
        <div className="flex gap-3">
          {(["replace", "add"] as const).map(m => (
            <label key={m} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={spainMode === m} onChange={() => setSpainMode(m)} />
              <span className="text-sm">{m === "replace" ? "Reemplaza P1 (solo P2)" : "Acumula (P1 + P2)"}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Scores */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-sm mb-3">Resultados de grupos (formato: 2-1)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto">
          {MATCHES.map(([h, a, g], i) => (
            <div key={i} className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 w-4">{g}</span>
              <span className="truncate">{TEAMS[h]?.flag}{h}</span>
              <input
                value={scores[i]} onChange={e => {
                  const ns = [...scores]; ns[i] = e.target.value; setScores(ns);
                }}
                placeholder="x-x"
                className="w-14 border rounded px-1.5 py-0.5 font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
              <span className="truncate">{a}{TEAMS[a]?.flag}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Knockout */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold text-sm">Fase eliminatoria</h3>
        {[
          { label: "Campeón", key: "winner" as const },
          { label: "Subcampeón", key: "runnerUp" as const },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="text-xs text-slate-500">{label}</label>
            <select value={knockout[key]} onChange={e => setKnockout({ ...knockout, [key]: e.target.value })}
              className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-400">
              <option value="">— Sin definir —</option>
              {TEAM_LIST.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        ))}
        {[
          { label: "Semifinalistas", key: "semis" as const, n: 2 },
          { label: "Cuartos de final", key: "qf" as const, n: 4 },
          { label: "Ronda de 16", key: "r16" as const, n: 8 },
          { label: "Ronda de 32", key: "r32" as const, n: 16 },
        ].map(({ label, key, n }) => (
          <div key={key}>
            <label className="text-xs text-slate-500">{label}</label>
            <div className="grid grid-cols-2 gap-1 mt-1">
              {Array.from({ length: n }, (_, j) => (
                <select key={j} value={knockout[key][j] || ""}
                  onChange={e => {
                    const arr = [...knockout[key]]; arr[j] = e.target.value;
                    setKnockout({ ...knockout, [key]: arr });
                  }}
                  className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400">
                  <option value="">—</option>
                  {TEAM_LIST.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bonus */}
      <div className="bg-white rounded-xl border p-4 space-y-3">
        <h3 className="font-semibold text-sm">Bonus</h3>
        {[
          { label: "Bota de Oro (nombre del jugador)", key: "goldenBoot" as const, type: "text" },
          { label: "Máx. goleador España (nombre)", key: "topEspScorer" as const, type: "text" },
          { label: "Override equipo más goleador", key: "topTeamOverride" as const, type: "select" },
          { label: "Override equipo más goleado", key: "mostConcededOverride" as const, type: "select" },
        ].map(({ label, key, type }) => (
          <div key={key}>
            <label className="text-xs text-slate-500">{label}</label>
            {type === "text" ? (
              <input value={bonus[key]} onChange={e => setBonus({ ...bonus, [key]: e.target.value })}
                className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                placeholder="Dejar vacío = automático" />
            ) : (
              <select value={bonus[key]} onChange={e => setBonus({ ...bonus, [key]: e.target.value })}
                className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-400">
                <option value="">— Automático —</option>
                {TEAM_LIST.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>
        ))}
      </div>

      {/* PIN para guardar */}
      {settings.adminPinHash && (
        <div className="bg-white rounded-xl border p-4">
          <label className="text-xs text-slate-500">PIN para confirmar guardado</label>
          <input type="password" value={pin} onChange={e => setPin(e.target.value)}
            className="w-full border rounded-lg px-2 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            placeholder="Ingresá el PIN" />
        </div>
      )}

      {msg && <p className="text-sm text-center">{msg}</p>}
      <button onClick={handleSave} disabled={saving}
        className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-50">
        {saving ? "Guardando…" : "Guardar resultados"}
      </button>

      {showChangePin && (
        <PinModal mode="set" adminPinHash={settings.adminPinHash}
          onSuccess={() => { setShowChangePin(false); onRefresh(); }}
          onClose={() => setShowChangePin(false)} />
      )}
    </div>
  );
}
