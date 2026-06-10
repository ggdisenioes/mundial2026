"use client";
import { useState, useRef } from "react";
import type { Participant } from "@/types";

interface Props { participants: Participant[]; onRefresh: () => void; }

export default function Participants({ participants, onRefresh }: Props) {
  const [uploading, setUploading] = useState(false);
  const [nombre, setNombre]       = useState("");
  const [error, setError]         = useState("");
  const [editId, setEditId]       = useState<string | null>(null);
  const [editName, setEditName]   = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault(); setError("");
    const file = fileRef.current?.files?.[0];
    if (!file || !nombre.trim()) { setError("Completá el nombre y seleccioná un archivo"); return; }
    setUploading(true);
    const form = new FormData();
    form.append("file", file); form.append("nombre", nombre.trim());
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) { setError(data.error || "Error al subir"); }
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
      <div className="bg-white rounded-2xl border-2 border-tw-grey/20 shadow-sm p-4 sm:p-6">
        <h3 className="font-extrabold text-xl sm:text-2xl text-tw-navy mb-5">Subir pronóstico (.xlsx)</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm sm:text-base font-semibold text-tw-navy/60 mb-2">Nombre del participante</label>
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Juan Pérez"
              className="w-full border-2 border-tw-grey/40 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-tw-green" />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-semibold text-tw-navy/60 mb-2">Archivo Excel</label>
            <input ref={fileRef} type="file" accept=".xlsx,.xls"
              className="w-full text-sm sm:text-base text-tw-grey file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-semibold file:bg-tw-green file:text-tw-navy hover:file:opacity-90 transition-all" />
          </div>
          {error && <p className="text-red-500 text-sm sm:text-base font-medium">{error}</p>}
          <button type="submit" disabled={uploading}
            className="w-full py-3.5 bg-tw-green text-tw-navy rounded-xl text-base font-bold hover:opacity-90 disabled:opacity-50 transition-opacity">
            {uploading ? "Subiendo…" : "📤 Subir pronóstico"}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="font-extrabold text-xl sm:text-2xl text-tw-navy">
          {participants.length} participante{participants.length !== 1 ? "s" : ""}
        </h3>
        {participants.length === 0 && (
          <div className="text-center py-12 text-tw-grey bg-white rounded-2xl border-2 border-dashed border-tw-grey/40">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-base">Aún no hay participantes</p>
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
                  <button onClick={() => handleRename(p.id)}
                    className="flex-1 sm:flex-none text-sm sm:text-base bg-tw-green text-tw-navy px-4 py-2.5 rounded-xl font-bold">Guardar</button>
                  <button onClick={() => setEditId(null)}
                    className="flex-1 sm:flex-none text-sm sm:text-base border-2 border-tw-grey/40 px-4 py-2.5 rounded-xl font-semibold">Cancelar</button>
                </div>
              </div>
            ) : (
              <>
                <span className="flex-1 font-bold text-base sm:text-lg text-tw-navy">{p.nombre}</span>
                <button onClick={() => { setEditId(p.id); setEditName(p.nombre); }}
                  className="p-2.5 text-tw-grey hover:text-tw-navy hover:bg-tw-light rounded-xl transition-colors text-lg">✏️</button>
                <button onClick={() => handleDelete(p.id, p.nombre)}
                  className="p-2.5 text-tw-grey hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors text-lg">🗑️</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
