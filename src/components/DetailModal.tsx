"use client";
import { useState } from "react";
import type { Participant, Results, Settings } from "@/types";
import { scoreParticipant, deriveResult, parseScore, norm } from "@/lib/scoring";
import { MATCHES, TEAMS, SPAIN_IDX, GROUPS } from "@/lib/matches";

interface Props {
  p: Participant;
  results: Results;
  settings: Settings;
  onClose: () => void;
}

type DTab = "resumen" | "grupos" | "espana" | "elim" | "bonus";

export default function DetailModal({ p, results, settings, onClose }: Props) {
  const [tab, setTab] = useState<DTab>("resumen");
  const score = scoreParticipant(p, results, settings.spainMode);
  const bd = score.bd;

  const tabs: [DTab, string][] = [
    ["resumen", "Resumen"],
    ["grupos", "Grupos"],
    ["espana", "🇪🇸 España"],
    ["elim", "Eliminatoria"],
    ["bonus", "Bonus"],
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
          <div>
            <h2 className="font-bold text-lg">{p.nombre}</h2>
            <p className="text-2xl font-extrabold text-emerald-700">{score.total} pts</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl leading-none">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 border-b shrink-0 overflow-x-auto">
          {tabs.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-3 py-1.5 text-xs font-medium rounded-t whitespace-nowrap ${tab === k ? "bg-slate-100 text-emerald-700 font-bold" : "text-slate-500 hover:text-slate-700"}`}>
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-5">
          {tab === "resumen" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "P1 — Resultados 1X2", pts: score.p1, detail: `${bd.p1ok}/${bd.p1n} acertados` },
                  { label: "P2 — España exactos", pts: score.p2, detail: `${bd.p2detail.filter(d => d?.label === "exacto").length} exactos` },
                  { label: "P3 — Eliminatoria", pts: score.p3, detail: `${bd.champ ? "✅" : "❌"} campeón` },
                  { label: "P4 — Bonus", pts: score.p4, detail: `${bd.b.filter(Boolean).length}/4 aciertos` },
                ].map(({ label, pts, detail }) => (
                  <div key={label} className="bg-slate-50 rounded-xl p-4 border">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-2xl font-extrabold text-emerald-700">{pts}</p>
                    <p className="text-xs text-slate-400">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "grupos" && (
            <div className="space-y-4">
              {GROUPS.map(g => {
                const groupMatches = MATCHES.map((m, i) => ({ m, i })).filter(({ m }) => m[2] === g);
                return (
                  <div key={g}>
                    <h4 className="font-bold text-sm mb-2 text-slate-600">Grupo {g}</h4>
                    <div className="space-y-1">
                      {groupMatches.map(({ m, i }) => {
                        if (SPAIN_IDX.includes(i) && settings.spainMode === "replace") return null;
                        const s = results.scores[i];
                        const pick = p.picks.p1[i];
                        const actual = s ? deriveResult(s.h, s.a) : null;
                        const hit = actual && pick === actual;
                        return (
                          <div key={i} className={`flex items-center gap-2 text-xs p-2 rounded-lg ${s ? (hit ? "bg-green-50" : "bg-red-50") : "bg-slate-50"}`}>
                            <span className="w-20 text-right text-slate-600">{TEAMS[m[0]]?.flag} {m[0]}</span>
                            <span className="text-slate-400">vs</span>
                            <span className="w-20 text-slate-600">{m[1]} {TEAMS[m[1]]?.flag}</span>
                            <span className={`ml-auto font-mono font-bold ${hit ? "text-green-600" : s ? "text-red-500" : "text-slate-400"}`}>
                              {pick || "—"}
                            </span>
                            {s && <span className="text-slate-400 font-mono">{s.h}-{s.a}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {tab === "espana" && (
            <div className="space-y-3">
              {SPAIN_IDX.map((mi, k) => {
                const m = MATCHES[mi];
                const s = results.scores[mi];
                const d = bd.p2detail[k];
                return (
                  <div key={mi} className={`p-4 rounded-xl border ${d?.label === "exacto" ? "bg-green-50 border-green-200" : d?.label === "1X2" ? "bg-yellow-50 border-yellow-200" : s ? "bg-red-50 border-red-200" : "bg-slate-50"}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{TEAMS[m[0]]?.flag} {TEAMS[m[0]]?.name} vs {TEAMS[m[1]]?.name} {TEAMS[m[1]]?.flag}</span>
                      <span className={`text-sm font-bold ${d?.pts ? "text-emerald-700" : "text-slate-400"}`}>+{d?.pts ?? 0} pts</span>
                    </div>
                    <div className="flex gap-4 text-xs">
                      <div><span className="text-slate-500">1X2: </span><span className="font-mono font-bold">{p.picks.p1[mi] || "—"}</span></div>
                      <div><span className="text-slate-500">Marcador: </span><span className="font-mono font-bold">{p.picks.p2[k] || "—"}</span></div>
                      {s && <div><span className="text-slate-500">Real: </span><span className="font-mono font-bold">{s.h}-{s.a}</span></div>}
                    </div>
                    {d && <div className="mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.label === "exacto" ? "bg-green-100 text-green-700" : d.label === "1X2" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                        {d.label}
                      </span>
                    </div>}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "elim" && (
            <div className="space-y-4 text-sm">
              {[
                { label: "Campeón (50 pts)", pred: p.picks.p3.winner, actual: results.knockout.winner, hit: bd.champ },
                { label: "Subcampeón (30 pts)", pred: p.picks.p3.runnerUp, actual: results.knockout.runnerUp, hit: bd.ru },
              ].map(({ label, pred, actual, hit }) => (
                <div key={label} className={`p-3 rounded-lg ${hit ? "bg-green-50" : actual ? "bg-red-50" : "bg-slate-50"}`}>
                  <div className="text-xs text-slate-500 mb-1">{label}</div>
                  <div className="flex gap-4">
                    <span><span className="text-slate-400">Pred: </span><strong>{pred || "—"}</strong></span>
                    {actual && <span><span className="text-slate-400">Real: </span><strong>{actual}</strong></span>}
                  </div>
                </div>
              ))}
              {[
                { label: "Semifinalistas (15 pts c/u)", pred: p.picks.p3.semis, actual: results.knockout.semis, score: bd.sem },
                { label: "Cuartos (6 pts c/u)", pred: p.picks.p3.qf, actual: results.knockout.qf, score: bd.qf },
                { label: "Ronda de 16 (3 pts c/u)", pred: p.picks.p3.r16, actual: results.knockout.r16, score: bd.r16 },
                { label: "Ronda de 32 (2 pts c/u)", pred: p.picks.p3.r32, actual: results.knockout.r32, score: bd.r32 },
              ].map(({ label, pred, actual, score: ps }) => (
                <div key={label}>
                  <div className="text-xs text-slate-500 mb-1 flex justify-between">
                    <span>{label}</span>
                    <strong className="text-emerald-700">{ps.pts} pts ({ps.hits} aciertos)</strong>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pred.map((t, j) => {
                      const hit = actual.some(a => norm(a) === norm(t));
                      return (
                        <span key={j} className={`text-xs px-2 py-0.5 rounded-full font-medium ${hit ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                          {t || "—"}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "bonus" && (
            <div className="space-y-3 text-sm">
              {[
                { label: "Equipo más goleador", pred: p.picks.p4.topScorerTeam, hit: bd.b[0] },
                { label: "Equipo más goleado", pred: p.picks.p4.mostConceded, hit: bd.b[1] },
                { label: "Bota de Oro", pred: p.picks.p4.goldenBoot, hit: bd.b[2] },
                { label: "Máx. goleador España", pred: p.picks.p4.topEspScorer, hit: bd.b[3] },
              ].map(({ label, pred, hit }) => (
                <div key={label} className={`flex justify-between items-center p-3 rounded-lg ${hit ? "bg-green-50" : "bg-slate-50"}`}>
                  <div>
                    <div className="text-xs text-slate-500">{label}</div>
                    <div className="font-medium">{pred || "—"}</div>
                  </div>
                  <span className={`text-sm font-bold ${hit ? "text-green-600" : "text-slate-400"}`}>
                    {hit ? "+10 pts" : "0 pts"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
