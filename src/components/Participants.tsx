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
    if (!file || !nombre.trim()) {
      setError("Completá el nombre y seleccioná un archivo");
      return;
    }
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
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h3 className="font-bold text-base mb-4">Subir pronóstico (.xlsx)</h3>
        <form onSubmit={handleUpload} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nombre del participante</label>
            <input
              type="text" value={nombre} onChange={e => setNombre(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Archivo Excel</label>
            <input ref={fileRef} type="file" accept=".xlsx,.xls"
              className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={uploading}
            className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
            {uploading ? "Subiendo…" : "Subir pronóstico"}
          </button>
        </form>
      </div>

      <div className="space-y-2">
        <h3 className="font-bold text-base">{participants.length} participantes</h3>
        {participants.map(p => (
          <div key={p.id} className="bg-white rounded-xl border p-4 flex items-center gap-3">
            {editId === p.id ? (
              <div className="flex-1 flex gap-2">
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  className="flex-1 border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  onKeyDown={e => e.key === "Enter" && handleRename(p.id)} />
                <button onClick={() => handleRename(p.id)}
                  className="text-xs bg-emerald-600 text-white px-3 py-1 rounded">Guardar</button>
                <button onClick={() => setEditId(null)}
                  className="text-xs border px-3 py-1 rounded">Cancelar</button>
              </div>
            ) : (
              <>
                <span className="flex-1 font-medium">{p.nombre}</span>
                <button onClick={() => { setEditId(p.id); setEditName(p.nombre); }}
                  className="text-xs text-slate-400 hover:text-slate-700">✏️</button>
                <button onClick={() => handleDelete(p.id, p.nombre)}
                  className="text-xs text-red-400 hover:text-red-600">🗑️</button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
