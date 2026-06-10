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
    setSettings(rRes.settings ? { adminPinHash: rRes.settings.admin_pin_hash } : null);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const channel = supabase.channel("resultados-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "resultados" }, () => fetchAll())
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
    <div className="min-h-screen flex items-center justify-center text-slate-400 text-xl">
      Cargando…
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-600 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-5 pb-2">
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">⚽ Prode Mundial 2026</h1>
          <p className="text-emerald-100 text-sm sm:text-base mt-1">Tablero en vivo · {participants.length} participantes</p>
        </div>
        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex overflow-x-auto scrollbar-hide">
          {tabs.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-semibold rounded-t-xl whitespace-nowrap transition-all mr-1 ${
                tab === k
                  ? "bg-slate-100 text-emerald-700 shadow-sm"
                  : "text-emerald-100 hover:bg-white/10"
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {tab === "tabla" && results && settings && (
          <Leaderboard participants={participants} results={results} onSelect={setSel} onRefresh={fetchAll} />
        )}
        {tab === "partis" && (
          <Participants participants={participants} onRefresh={fetchAll} />
        )}
        {tab === "admin" && results && settings && (
          <AdminPanel results={results} settings={settings} unlocked={adminUnlocked} setUnlocked={setAdminUnlocked} onRefresh={fetchAll} />
        )}
        {tab === "reglas" && <Rules />}
      </div>

      {sel && results && settings && (
        <DetailModal p={sel} results={results} onClose={() => setSel(null)} />
      )}
    </div>
  );
}
