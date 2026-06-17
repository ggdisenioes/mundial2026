"use client";
import { useState, useEffect } from "react";
import type { Results, Settings } from "@/types";
import { MATCHES, TEAMS, TEAM_LIST } from "@/lib/matches";
import PinModal from "./PinModal";
import { useT } from "@/contexts/LangContext";

interface Props { results: Results; settings: Settings; unlocked: boolean; setUnlocked: (v: boolean) => void; onRefresh: () => void; }

const inputCls = "w-full border-2 border-tw-grey/40 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-tw-green bg-white transition-colors";
const readCls  = "w-full border-2 border-tw-grey/20 rounded-xl px-4 py-3 text-base bg-tw-light text-tw-navy";

// Partidos ordenados cronológicamente y agrupados por día. Se conserva el
// índice original de MATCHES porque scores[] se indexa por esa posición.
const sortKey = ([, , , date, time]: (typeof MATCHES)[number]) => {
  const [d, mo] = date.split("/").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  return ((mo * 31 + d) * 24 + hh) * 60 + mm;
};
const MATCHES_BY_DAY = (() => {
  const ordered = MATCHES.map((m, i) => ({ m, i })).sort((a, b) => sortKey(a.m) - sortKey(b.m));
  const days: { date: string; items: typeof ordered }[] = [];
  ordered.forEach(it => {
    const last = days[days.length - 1];
    if (last?.date === it.m[3]) last.items.push(it);
    else days.push({ date: it.m[3], items: [it] });
  });
  return days;
})();
const dayLabel = (date: string) => {
  const [d, mo] = date.split("/").map(Number);
  const wd = new Date(2026, mo - 1, d).toLocaleDateString("es-ES", { weekday: "long" });
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)} ${date}`;
};

export default function AdminPanel({ results, settings, unlocked, setUnlocked, onRefresh }: Props) {
  const { t } = useT();
  const [showPinModal,  setShowPinModal]  = useState(false);
  const [showChangePin, setShowChangePin] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg,    setMsg]    = useState("");
  const [pin,    setPin]    = useState("");

  const [scores,    setScores]    = useState<string[]>(results.scores.map(s => s ? `${s.h}-${s.a}` : ""));
  useEffect(() => {
    if (!unlocked) setScores(results.scores.map(s => s ? `${s.h}-${s.a}` : ""));
  }, [results.scores, unlocked]);
  const [knockout,  setKnockout]  = useState({ ...results.knockout });
  const [bonus,     setBonus]     = useState({ ...results.bonus });
  const [syncing,   setSyncing]   = useState(false);
  const [syncMsg,   setSyncMsg]   = useState("");

  async function handleForceSync() {
    setSyncing(true); setSyncMsg("");
    const res = await fetch("/api/sync/force", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin }) });
    const data = await res.json();
    if (res.ok) { setSyncMsg(`✅ ${data.played} partidos cargados`); onRefresh(); }
    else setSyncMsg(`❌ ${data.error}`);
    setSyncing(false);
  }

  async function handleSave() {
    setSaving(true); setMsg("");
    const parsedScores = scores.map(s => { const m = s.match(/(\d+)\s*[-–:]\s*(\d+)/); return m ? { h: +m[1], a: +m[2] } : null; });
    const res = await fetch("/api/results", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pin, scores: parsedScores, knockout, bonus }) });
    const data = await res.json();
    setMsg(res.ok ? t.savedOk : `❌ ${data.error}`);
    if (res.ok) onRefresh();
    setSaving(false);
  }

  const lastUpdate = results.updated_at
    ? new Date(results.updated_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
    : null;

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-tw-navy">{t.resultsTitle}</h2>
          {lastUpdate && <p className="text-sm text-tw-grey mt-1">{t.lastUpdate(lastUpdate)}</p>}
        </div>
        <div className="flex gap-2">
          {unlocked ? (
            <>
              <button onClick={() => setShowChangePin(true)} className="text-sm sm:text-base border-2 border-tw-grey/40 text-tw-navy px-4 py-2.5 rounded-xl font-semibold hover:border-tw-navy transition-colors">{t.changePin}</button>
              <button onClick={() => setUnlocked(false)}     className="text-sm sm:text-base border-2 border-tw-grey/40 text-tw-navy px-4 py-2.5 rounded-xl font-semibold hover:border-tw-navy transition-colors">{t.closeEdit}</button>
            </>
          ) : (
            <button onClick={() => settings.adminPinHash ? setShowPinModal(true) : setUnlocked(true)}
              className="text-sm sm:text-base bg-tw-green text-tw-navy px-5 py-2.5 rounded-xl font-bold hover:opacity-90 transition-opacity shadow-sm">{t.editResults}</button>
          )}
        </div>
      </div>

      {/* Estado del sync automático */}
      {(() => {
        const sm = settings.syncMeta;
        const lastAt = sm?.last_at ? new Date(sm.last_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" }) : null;
        return (
          <div className={`rounded-2xl border-2 p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between ${sm?.ok === false ? "border-red-300 bg-red-50" : "border-tw-grey/20 bg-white"}`}>
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full shrink-0 ${sm?.ok === true ? "bg-tw-green" : sm?.ok === false ? "bg-red-500" : "bg-tw-grey/40"}`} />
              <div>
                <p className="font-semibold text-sm text-tw-navy">
                  {sm?.ok === true ? "Sync automático activo" : sm?.ok === false ? "Error en último sync" : "Sync pendiente de ejecutar"}
                </p>
                <p className="text-xs text-tw-grey mt-0.5">
                  {sm?.msg || "Esperando primera ejecución…"}
                  {lastAt && ` · ${lastAt}`}
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-1 items-start sm:items-end">
              <button onClick={handleForceSync} disabled={syncing}
                className="text-sm bg-tw-navy text-tw-green px-4 py-2 rounded-xl font-bold hover:opacity-80 disabled:opacity-50 transition-opacity shrink-0">
                {syncing ? "Sincronizando…" : "⚡ Sincronizar ahora"}
              </button>
              {syncMsg && <p className="text-xs font-medium text-tw-grey">{syncMsg}</p>}
            </div>
          </div>
        );
      })()}

      {/* Grupos */}
      <div className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm p-4 sm:p-6">
        <h3 className="font-bold text-lg sm:text-xl text-tw-navy mb-4">{t.groupResults}</h3>
        <div className="max-h-[480px] overflow-y-auto pr-1 space-y-4">
          {MATCHES_BY_DAY.map(({ date, items }) => (
            <div key={date}>
              <div className="sticky top-0 z-10 bg-white py-1.5">
                <span className="inline-block bg-tw-navy text-tw-green text-sm font-bold px-3 py-1 rounded-lg">📅 {dayLabel(date)}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-1.5">
                {items.map(({ m: [h, a, g, , time], i }) => (
                  <div key={i} className="flex flex-col bg-tw-light rounded-xl px-3 py-2">
                    <span className="text-xs text-tw-navy font-mono font-semibold mb-1">🕐 {time}h · Grupo {g}</span>
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm sm:text-base text-tw-navy flex-1 min-w-0">{TEAMS[h]?.flag} {h}</span>
                      {unlocked ? (
                        <input value={scores[i]} onChange={e => { const ns=[...scores]; ns[i]=e.target.value; setScores(ns); }} placeholder="0-0"
                          className="w-16 sm:w-20 border-2 border-tw-grey/40 rounded-lg px-2 py-1.5 font-mono text-center text-base font-bold focus:outline-none focus:border-tw-green bg-white" />
                      ) : (
                        <span className={`w-16 sm:w-20 text-center font-mono font-bold text-base px-2 py-1.5 rounded-lg ${scores[i] ? "bg-tw-navy text-tw-green" : "text-tw-grey"}`}>{scores[i] || "—"}</span>
                      )}
                      <span className="truncate text-sm sm:text-base text-tw-navy flex-1 min-w-0 text-right">{a} {TEAMS[a]?.flag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Eliminatoria */}
      <div className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm p-4 sm:p-6 space-y-5">
        <h3 className="font-bold text-lg sm:text-xl text-tw-navy">{t.knockoutStage}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[{ label: t.champion, key: "winner" as const }, { label: t.runnerUp, key: "runnerUp" as const }].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-tw-navy/60 mb-2">{label}</label>
              {unlocked
                ? <select value={knockout[key]} onChange={e => setKnockout({ ...knockout, [key]: e.target.value })} className={inputCls}><option value="">{t.noSetOption}</option>{TEAM_LIST.map(t2=><option key={t2}>{t2}</option>)}</select>
                : <div className={readCls}>{knockout[key] || <span className="text-tw-grey">{t.notSet}</span>}</div>}
            </div>
          ))}
        </div>
        {[
          { label: t.semis,    key: "semis" as const, n: 2 },
          { label: t.quarters, key: "qf"    as const, n: 4 },
          { label: t.r16,      key: "r16"   as const, n: 8 },
          { label: t.r32,      key: "r32"   as const, n: 16 },
        ].map(({ label, key, n }) => (
          <div key={key}>
            <label className="block text-sm font-semibold text-tw-navy/60 mb-2">{label}</label>
            {unlocked ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Array.from({ length: n }, (_, j) => (
                  <select key={j} value={knockout[key][j]||""} onChange={e=>{const arr=[...knockout[key]];arr[j]=e.target.value;setKnockout({...knockout,[key]:arr});}} className="border-2 border-tw-grey/40 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-tw-green bg-white">
                    <option value="">—</option>{TEAM_LIST.map(t2=><option key={t2}>{t2}</option>)}
                  </select>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {knockout[key].filter(Boolean).length > 0
                  ? knockout[key].filter(Boolean).map((tm,j)=><span key={j} className="text-sm sm:text-base px-3 py-1.5 bg-tw-navy text-tw-green rounded-xl font-semibold">{tm}</span>)
                  : <span className="text-sm text-tw-grey">{t.notSet}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bonus */}
      <div className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm p-4 sm:p-6 space-y-4">
        <h3 className="font-bold text-lg sm:text-xl text-tw-navy">{t.bonus}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: t.goldenBoot,     key: "goldenBoot"          as const, type: "text" },
            { label: t.topEspScorer,   key: "topEspScorer"         as const, type: "text" },
            { label: t.topScoringTeam, key: "topTeamOverride"      as const, type: "select" },
            { label: t.mostConceded,   key: "mostConcededOverride" as const, type: "select" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-tw-navy/60 mb-2">{label}</label>
              {unlocked
                ? type==="text"
                  ? <input value={bonus[key]} onChange={e=>setBonus({...bonus,[key]:e.target.value})} className={inputCls} placeholder={t.autoPlaceholder} />
                  : <select value={bonus[key]} onChange={e=>setBonus({...bonus,[key]:e.target.value})} className={inputCls}><option value="">{t.autoOption}</option>{TEAM_LIST.map(t2=><option key={t2}>{t2}</option>)}</select>
                : <div className={readCls}>{bonus[key]||<span className="text-tw-grey">{t.automatic}</span>}</div>
              }
            </div>
          ))}
        </div>
      </div>

      {unlocked && (
        <div className="space-y-4">
          {settings.adminPinHash && (
            <div className="bg-white rounded-2xl border-2 border-tw-grey/20 p-4 sm:p-6">
              <label className="block text-sm font-semibold text-tw-navy/60 mb-2">{t.pinConfirm}</label>
              <input type="password" value={pin} onChange={e=>setPin(e.target.value)} className={inputCls} placeholder={t.pinPlaceholder} />
            </div>
          )}
          {msg && <p className="text-base text-center font-semibold py-2">{msg}</p>}
          <button onClick={handleSave} disabled={saving}
            className="w-full py-4 sm:py-5 bg-tw-green text-tw-navy rounded-2xl font-extrabold text-lg hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm">
            {saving ? t.saving : t.saveResults}
          </button>
        </div>
      )}

      {showPinModal  && <PinModal mode="verify" adminPinHash={settings.adminPinHash} onSuccess={()=>{setUnlocked(true);setShowPinModal(false);}}  onClose={()=>setShowPinModal(false)} />}
      {showChangePin && <PinModal mode="set"    adminPinHash={settings.adminPinHash} onSuccess={()=>{setShowChangePin(false);onRefresh();}}         onClose={()=>setShowChangePin(false)} />}
    </div>
  );
}
