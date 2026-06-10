"use client";
import { useState, useEffect, useCallback } from "react";
import type { Participant, Results, Settings } from "@/types";
import Leaderboard from "@/components/Leaderboard";
import Participants from "@/components/Participants";
import AdminPanel from "@/components/AdminPanel";
import Rules from "@/components/Rules";
import DetailModal from "@/components/DetailModal";
import { supabase } from "@/lib/supabase";

type Tab = "tabla" | "partis" | "admin" | "reglas";

export default function Home() {
  const [tab, setTab] = useState<Tab>("tabla");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [results, setResults] = useState<Results | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sel, setSel] = useState<Participant | null>(null);
  const [adminUnlocked, setAdminUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    const [pRes, rRes] = await Promise.all([
      fetch("/api/participants").then(r => r.json()),
      fetch("/api/results").then(r => r.json()),
    ]);
    setParticipants(pRes.participants ?? []);
    setResults(rRes.results ?? null);
    setSettings(rRes.settings ? {
      spainMode: rRes.settings.spain_mode,
      adminPinHash: rRes.settings.admin_pin_hash,
    } : null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const channel = supabase.channel("resultados-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "resultados" }, () => {
        fetchAll();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  const tabs: [Tab, string][] = [
    ["tabla", "🏆 Clasificación"],
    ["partis", "👥 Participantes"],
    ["admin", "📋 Resultados"],
    ["reglas", "📖 Reglas"],
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400">
      Cargando…
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-600 text-white">
        <div className="max-w-5xl mx-auto px-4 py-5">
          <h1 className="text-2xl font-extrabold">⚽ Prode Mundial 2026</h1>
          <p className="text-emerald-50 text-sm">Tablero en vivo · {participants.length} participantes</p>
        </div>
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {tabs.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition ${tab === k ? "bg-slate-50 text-emerald-700" : "text-emerald-50 hover:bg-white/10"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {tab === "tabla" && results && settings && (
          <Leaderboard
            participants={participants} results={results} settings={settings}
            onSelect={setSel} onRefresh={fetchAll}
          />
        )}
        {tab === "partis" && (
          <Participants participants={participants} onRefresh={fetchAll} />
        )}
        {tab === "admin" && results && settings && (
          <AdminPanel
            results={results} settings={settings}
            unlocked={adminUnlocked} setUnlocked={setAdminUnlocked}
            onRefresh={fetchAll}
          />
        )}
        {tab === "reglas" && settings && <Rules spainMode={settings.spainMode} />}
      </div>

      {sel && results && settings && (
        <DetailModal p={sel} results={results} settings={settings} onClose={() => setSel(null)} />
      )}
    </div>
  );
}
