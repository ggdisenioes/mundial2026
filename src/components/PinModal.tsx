"use client";
import { useState } from "react";
import { hashPin } from "@/lib/scoring";

interface Props {
  mode: "verify" | "set";
  adminPinHash: string;
  onSuccess: () => void;
  onClose: () => void;
}

export default function PinModal({ mode, adminPinHash, onSuccess, onClose }: Props) {
  const [pin, setPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "verify") {
      if (!adminPinHash) {
        onSuccess();
        return;
      }
      if (hashPin(pin) === adminPinHash) {
        onSuccess();
      } else {
        setError("PIN incorrecto");
      }
      setLoading(false);
      return;
    }

    // mode === "set"
    if (newPin.length < 4) {
      setError("El PIN debe tener al menos 4 caracteres");
      setLoading(false);
      return;
    }

    const res = await fetch("/api/results", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPin: pin, newPin }),
    });

    if (res.ok) {
      onSuccess();
    } else {
      const data = await res.json();
      setError(data.error || "Error al cambiar el PIN");
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold mb-4">
          {mode === "verify" ? "🔐 Acceso Admin" : "🔑 Cambiar PIN"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "set" && adminPinHash && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">PIN actual</label>
              <input
                type="password" value={pin} onChange={e => setPin(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="PIN actual"
              />
            </div>
          )}
          {mode === "verify" && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">PIN</label>
              <input
                type="password" value={pin} onChange={e => setPin(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Ingresá el PIN"
                autoFocus
              />
            </div>
          )}
          {mode === "set" && (
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">Nuevo PIN</label>
              <input
                type="password" value={newPin} onChange={e => setNewPin(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Nuevo PIN (mín. 4 chars)"
                autoFocus
              />
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2 text-sm border rounded-lg hover:bg-slate-50">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
              {loading ? "…" : mode === "verify" ? "Entrar" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
