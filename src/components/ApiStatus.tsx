"use client";
import { useState, useEffect } from "react";
import { useT } from "@/contexts/LangContext";

interface Status { ok: boolean; reason?: string; remaining?: number; limit?: number; }

export default function ApiStatus() {
  const { t } = useT();
  const [status,  setStatus]  = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/status")
      .then(r => r.json())
      .then(d => { setStatus(d); setLoading(false); })
      .catch(() => { setStatus({ ok: false, reason: "Connection error" }); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center gap-2 text-white/50 text-sm">
      <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse" />
      {t.checkingApi}
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      <span className="relative flex w-2.5 h-2.5">
        {status?.ok && <span className="animate-ping absolute inset-0 rounded-full bg-tw-green opacity-60" />}
        <span className={`relative inline-flex rounded-full w-2.5 h-2.5 ${status?.ok ? "bg-tw-green" : "bg-red-500"}`} />
      </span>
      <span className={`text-xs sm:text-sm font-medium ${status?.ok ? "text-tw-green" : "text-red-400"}`}>
        {status?.ok
          ? t.apiOnline(status?.remaining ?? 0, status?.limit ?? 100)
          : t.apiOffline(status?.reason ?? "")
        }
      </span>
    </div>
  );
}
