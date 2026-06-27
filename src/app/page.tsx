"use client";
import { useState, useEffect, useCallback } from "react";
import type { Participant, Results, Settings } from "@/types";
import Leaderboard      from "@/components/Leaderboard";
import Participants     from "@/components/Participants";
import AdminPanel       from "@/components/AdminPanel";
import Rules            from "@/components/Rules";
import DetailModal      from "@/components/DetailModal";
import ApiStatus        from "@/components/ApiStatus";
import LangSelector     from "@/components/LangSelector";
import PredictionsGrid  from "@/components/PredictionsGrid";
import KnockoutBracket  from "@/components/KnockoutBracket";
import { supabase }  from "@/lib/supabase";
import { useT }      from "@/contexts/LangContext";

type Tab = "tabla" | "partis" | "preds" | "bracket" | "admin" | "reglas";

export default function Home() {
  const { t } = useT();
  const [tab,          setTab]          = useState<Tab>("tabla");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [results,      setResults]      = useState<Results | null>(null);
  const [settings,     setSettings]     = useState<Settings | null>(null);
  const [sel,          setSel]          = useState<Participant | null>(null);
  const [adminUnlocked,setAdminUnlocked]= useState(false);
  const [loading,      setLoading]      = useState(true);

  const fetchAll = useCallback(async () => {
    const [pRes, rRes] = await Promise.all([
      fetch("/api/participants", { cache: "no-store" }).then(r => r.json()),
      fetch("/api/results",      { cache: "no-store" }).then(r => r.json()),
    ]);
    setParticipants(pRes.participants ?? []);
    setResults(rRes.results ?? null);
    const s = rRes.settings;
    setSettings(s ? {
      adminPinHash: s.admin_pin_hash ?? "",
      syncMeta: s.sync_meta ?? undefined,
    } : { adminPinHash: "" });
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    const ch = supabase.channel("resultados-changes")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "resultados" }, fetchAll)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  // Auto-sync de resultados: el backend se limita solo (1 llamada real cada
  // 10 min); cuando guarda cambios, el canal Realtime de arriba refresca la UI.
  useEffect(() => {
    const ping = () => { fetch("/api/sync/auto").catch(() => {}); };
    ping();
    const iv = setInterval(ping, 5 * 60_000);
    const onVis = () => { if (document.visibilityState === "visible") ping(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(iv); document.removeEventListener("visibilitychange", onVis); };
  }, []);

  const tabs: [Tab, string][] = [
    ["tabla",  t.tabLeaderboard],
    ["partis", t.tabParticipants],
    ["preds",  t.tabPredictions],
    ["bracket",t.tabBracket],
    ["admin",  t.tabResults],
    ["reglas", t.tabRules],
  ];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-tw-navy">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-tw-green border-t-transparent rounded-full animate-spin" />
        <span className="text-white/60 text-base">{t.loading}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-tw-light">
      <header className="bg-tw-navy shadow-xl">
        {/* Top bar */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-4 pb-3 flex items-center gap-3 sm:gap-4">
          <img src="/logo-twinco.jpg" alt="Twinco Capital" className="h-8 sm:h-10 w-auto rounded object-contain shrink-0" />
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-extrabold text-white leading-tight">⚽ {t.appTitle}</h1>
            <p className="text-tw-green/80 text-xs sm:text-sm mt-0.5">{t.appSubtitle(participants.length)}</p>
          </div>
          {/* Controls: lang + api status */}
          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2 shrink-0">
            <LangSelector />
            <div className="hidden sm:block"><ApiStatus /></div>
          </div>
        </div>
        {/* API status mobile */}
        <div className="sm:hidden px-4 pb-2"><ApiStatus /></div>
        {/* Tabs */}
        <nav className="max-w-5xl mx-auto px-4 sm:px-6 flex overflow-x-auto scrollbar-hide gap-1">
          {tabs.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`shrink-0 px-4 sm:px-6 py-3 text-sm sm:text-base font-semibold rounded-t-xl whitespace-nowrap transition-all ${
                tab === k ? "bg-tw-light text-tw-navy shadow-sm" : "text-white/60 hover:text-white hover:bg-white/10"
              }`}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {tab === "tabla"  && results && (
          <Leaderboard participants={participants} results={results} onSelect={setSel} onRefresh={fetchAll} />
        )}
        {tab === "partis" && settings && <Participants participants={participants} settings={settings} onRefresh={fetchAll} />}
        {tab === "preds"  && results && <PredictionsGrid participants={participants} results={results} />}
        {tab === "bracket" && results && <KnockoutBracket bracket={results.bracket} />}
        {tab === "admin"  && results && settings && (
          <AdminPanel results={results} settings={settings} unlocked={adminUnlocked} setUnlocked={setAdminUnlocked} onRefresh={fetchAll} />
        )}
        {tab === "reglas" && <Rules />}
      </main>

      {sel && results && (
        <DetailModal p={sel} results={results} onClose={() => setSel(null)} />
      )}
    </div>
  );
}
