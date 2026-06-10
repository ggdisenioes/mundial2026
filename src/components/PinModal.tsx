"use client";
import { useState } from "react";
import { hashPin } from "@/lib/scoring";
import { useT } from "@/contexts/LangContext";

interface Props { mode: "verify" | "set"; adminPinHash: string; onSuccess: () => void; onClose: () => void; }

export default function PinModal({ mode, adminPinHash, onSuccess, onClose }: Props) {
  const { t } = useT();
  const [pin,    setPin]    = useState("");
  const [newPin, setNewPin] = useState("");
  const [error,  setError]  = useState("");
  const [loading,setLoading]= useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    if (mode === "verify") {
      if (!adminPinHash) { onSuccess(); return; }
      if (hashPin(pin) === adminPinHash) { onSuccess(); } else { setError(t.pinWrong); }
      setLoading(false); return;
    }
    if (newPin.length < 4) { setError(t.pinTooShort); setLoading(false); return; }
    const res = await fetch("/api/results", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPin: pin, newPin }),
    });
    if (res.ok) { onSuccess(); } else { const d = await res.json(); setError(d.error || t.pinChangeError); }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-tw-navy/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border-2 border-tw-grey/20">
        <h2 className="text-lg sm:text-xl font-extrabold text-tw-navy mb-5">
          {mode === "verify" ? t.adminAccess : t.changePinTitle}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "set" && adminPinHash && (
            <div>
              <label className="block text-sm font-semibold text-tw-navy/60 mb-1.5">{t.currentPin}</label>
              <input type="password" value={pin} onChange={e => setPin(e.target.value)}
                className="w-full border-2 border-tw-grey/40 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-tw-green" />
            </div>
          )}
          {mode === "verify" && (
            <div>
              <label className="block text-sm font-semibold text-tw-navy/60 mb-1.5">{t.pin}</label>
              <input type="password" value={pin} onChange={e => setPin(e.target.value)}
                className="w-full border-2 border-tw-grey/40 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-tw-green"
                placeholder={t.enterPin} autoFocus />
            </div>
          )}
          {mode === "set" && (
            <div>
              <label className="block text-sm font-semibold text-tw-navy/60 mb-1.5">{t.newPin}</label>
              <input type="password" value={newPin} onChange={e => setNewPin(e.target.value)}
                className="w-full border-2 border-tw-grey/40 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-tw-green"
                placeholder={t.newPinPlaceholder} autoFocus />
            </div>
          )}
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-3 text-sm sm:text-base border-2 border-tw-grey/40 rounded-xl font-semibold hover:bg-tw-light transition-colors">
              {t.cancel}
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-3 text-sm sm:text-base bg-tw-green text-tw-navy rounded-xl font-bold hover:opacity-90 disabled:opacity-50 transition-opacity">
              {loading ? "…" : mode === "verify" ? t.enter : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
