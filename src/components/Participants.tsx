"use client";
import { useState, useRef } from "react";
import type { Participant } from "@/types";

interface Props {
  participants: Participant[];
  onRefresh: () => void;
}

export default function Participants({ participants, onRefresh }: Props) {
  const [uploading, setUploading] = useState(false);
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const file = fileRef.current?.files?.[0];
    if (!file || !nombre.trim()) { setError("Completá el nombre y seleccioná un archivo"); return; }
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    form.append("nombre", nombre.trim());
    const res = await fetch("/api/upload", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Error al subir");
    } else {
      setNombre("");
      if (fileRef.current) fileRef.current.value = "";
      onRefresh();
    }
    setUploading(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar a ${name}?`)) return;
    await fetch("/api/participants", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    onRefresh();
  }

  async function handleRename(id: string) {
    if (!editName.trim()) return;
    await fetch(`/api/participants/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre: editName.trim() }),
    });
    setEditId(null);
    onRefresh();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Upload form */}
      <div className="bg-white rounded-2xl shadow-sm border p-4 sm:p-6">
        <h3 className="font-bold text-xl sm:text-2xl mb-5">Subir pronóstico (.xlsx)</h3>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-600 mb-2">Nombre del participante</label>
            <input
              type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm sm:text-base font-semibold text-slate-600 mb-2">Archivo Excel</label>
            <input ref={fileRef} type="file" accept=".xlsx,.xls"
              className="w-full text-sm sm:text-base text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:font-medium file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
          </div>
          {error && <p className="text-red-500 text-sm sm:text-base font-medium">{error}</p>}
          <button type="submit" disabled={uploading}
            className="w-full py-3.5 bg-emerald-600 text-white rounded-xl text-base font-bold hover:bg-emerald-700 disabled:opacity-50 transition-colors">
            {uploading ? "Subiendo…" : "📤 Subir pronóstico"}
          </button>
        </form>
      </div>

      {/* Lista */}
      <div className="space-y-3">
        <h3 className="font-bold text-xl sm:text-2xl">{participants.length} participante{participants.length !== 1 ? "s" : ""}</h3>
        {participants.length === 0 && (
          <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-base">Aún no hay participantes</p>
          </div>
        )}
        {participants.map(p => (
          <div key={p.id} className="bg-white rounded-2xl border p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
            {editId === p.id ? (
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="flex-1 border rounded-xl px-4 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  onKeyDown={e => e.key === "Enter" && handleRename(p.id)}
                  autoFocus />
                <div className="flex gap-2">
                  <button onClick={() => handleRename(p.id)}
                    className="flex-1 sm:flex-none text-sm sm:text-base bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-medium">
                    Guardar
                  </button>
                  <button onClick={() => setEditId(null)}
                    className="flex-1 sm:flex-none text-sm sm:text-base border px-4 py-2.5 rounded-xl font-medium">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span className="flex-1 font-semibold text-base sm:text-lg">{p.nombre}</span>
                <button onClick={() => { setEditId(p.id); setEditName(p.nombre); }}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors text-lg">
                  ✏️
                </button>
                <button onClick={() => handleDelete(p.id, p.nombre)}
                  className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-lg">
                  🗑️
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
