"use client";
import { useState, useEffect } from "react";

interface Status {
  ok: boolean;
  reason?: string;
  plan?: string;
  used?: number;
  limit?: number;
  remaining?: number;
}

export default function ApiStatus() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/status")
      .then(r => r.json())
      .then(d => { setStatus(d); setLoading(false); })
      .catch(() => { setStatus({ ok: false, reason: "Error de conexión" }); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-white/50">
      <span className="w-2 h-2 rounded-full bg-white/30 animate-pulse" />
      <span>Verificando API…</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2">
      {/* Dot */}
      <span className={`relative flex w-2.5 h-2.5`}>
        {status?.ok && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tw-green opacity-60" />
        )}
        <span className={`relative inline-flex rounded-full w-2.5 h-2.5 ${status?.ok ? "bg-tw-green" : "bg-red-500"}`} />
      </span>
      {/* Label */}
      <span className={`text-xs sm:text-sm font-medium ${status?.ok ? "text-tw-green" : "text-red-400"}`}>
        {status?.ok
          ? `API Online · ${status?.remaining}/${status?.limit} req`
          : `API Offline · ${status?.reason ?? ""}`
        }
      </span>
    </div>
  );
}
