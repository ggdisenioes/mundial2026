"use client";
import { useState, useRef } from "react";
import type { Participant, Settings } from "@/types";
import { useT } from "@/contexts/LangContext";
import PinModal from "./PinModal";

interface Props { participants: Participant[]; settings: Settings; onRefresh: () => void; }

export default function Participants({ participants, settings, onRefresh }: Props) {
  const { t } = useT();
  const [unlocked,  setUnlocked]  = useState(false);
  const [showPin,   setShowPin]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [nombre,    setNombre]    = useState("");
  const [error,     setError]     = useState("");
  const [editId,    setEditId]    = useState<string | null>(null);
  const [editName,  setEditName]  = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const file = fileRef.current?.files?.[0];
    if (!file || !nombre.trim()) { setError(t.uploadError); return; }
    setUploading(true);
    const form = new FormData(); form.append("file", file); form.append("nombre", nombre.trim());
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) { setError(data.error || t.uploadError); }
    else { setNombre(""); if (fileRef.current) fileRef.current.value = ""; onRefresh(); }
    setUploading(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar a ${name}?`)) return;
    await fetch("/api/participants", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    onRefresh();
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    await fetch(`/api/participants/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nombre: editName.trim() }) });
    setEditId(null); onRefresh();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Upload section — PIN gated if adminPinHash is set */}
      {!unlocked && settings.adminPinHash ? (
        <div className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm p-8 sm:p-12 flex flex-col items-center gap-5 text-center">
          <div className="text-5xl">🔐</div>
          <div>
            <p className="font-extrabold text-xl sm:text-2xl text-tw-navy">{t.uploadLocked}</p>
            <p className="text-tw-grey text-sm sm:text-base mt-2">{t.uploadUnlockDesc}</p>
          </div>
          <button onClick={() => setShowPin(true)}
            className="bg-tw-green text-tw-navy px-8 py-3 rounded-xl font-bold text-base hover:opacity-90 transition-opacity shadow-sm">
            {t.uploadUnlock}
          </button>
          {showPin && (
            <PinModal mode="verify" adminPinHash={settings.adminPinHash}
              onSuccess={() => { setUnlocked(true); setShowPin(false); }}
              onClose={() => setShowPin(false)} />
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-extrabold text-xl sm:text-2xl text-tw-navy">{t.uploadTitle}</h3>
            {settings.adminPinHash && (
              <button onClick={() => setUnlocked(false)}
                className="text-sm border-2 border-tw-grey/40 text-tw-navy px-3 py-1.5 rounded-xl font-semibold hover:border-tw-navy transition-colors">
                🔒
              </button>
            )}
          </div>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm sm:text-base font-semibold text-tw-navy/60 mb-2">{t.nameLabel}</label>
              <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder={t.namePlaceholder}
                className="w-full border-2 border-tw-grey/40 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-tw-green" />
            </div>
            <div>
              <label className="block text-sm sm:text-base font-semibold text-tw-navy/60 mb-2">{t.fileLabel}</label>
              <input ref={fileRef} type="file" accept=".xlsx,.xls"
                className="w-full text-sm sm:text-base text-tw-grey file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-semibold file:bg-tw-green file:text-tw-navy hover:file:opacity-90 transition-all" />
            </div>
            {error && <p className="text-red-500 text-sm sm:text-base font-medium">{error}</p>}
            <button type="submit" disabled={uploading}
              className="w-full py-3.5 bg-tw-green text-tw-navy rounded-xl text-base font-bold hover:opacity-90 disabled:opacity-50 transition-opacity">
              {uploading ? t.uploading : t.uploadBtn}
            </button>
          </form>
        </div>
      )}

      {/* Participant list — always visible */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-xl sm:text-2xl text-tw-navy">{t.participantsCount(participants.length)}</h3>
        {participants.length === 0 && (
          <div className="text-center py-12 text-tw-grey bg-white rounded-2xl border-2 border-dashed border-tw-grey/40">
            <p className="text-4xl mb-3">👥</p><p className="text-base">{t.noParticipants}</p>
          </div>
        )}
        {participants.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border-2 border-tw-grey/20 p-4 sm:p-5 flex items-center gap-3 sm:gap-4 shadow-sm">
            {editId === p.id ? (
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="flex-1 border-2 border-tw-grey/40 rounded-xl px-4 py-2.5 text-base focus:outline-none focus:border-tw-green"
                  onKeyDown={e => e.key === "Enter" && handleRename(p.id)} autoFocus />
                <div className="flex gap-2">
                  <button onClick={() => handleRename(p.id)} className="flex-1 sm:flex-none text-sm sm:text-base bg-tw-green text-tw-navy px-4 py-2.5 rounded-xl font-bold">{t.save}</button>
                  <button onClick={() => setEditId(null)}    className="flex-1 sm:flex-none text-sm sm:text-base border-2 border-tw-grey/40 px-4 py-2.5 rounded-xl font-semibold">{t.cancel}</button>
                </div>
              </div>
            ) : (
              <>
                <span className="flex-1 font-bold text-base sm:text-lg text-tw-navy">{p.nombre}</span>
                {unlocked && (
                  <>
                    <button onClick={() => { setEditId(p.id); setEditName(p.nombre); }} className="p-2.5 text-tw-grey hover:text-tw-navy hover:bg-tw-light rounded-xl transition-colors text-lg">✏️</button>
                    <button onClick={() => handleDelete(p.id, p.nombre)} className="p-2.5 text-tw-grey hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors text-lg">🗑️</button>
                  </>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
