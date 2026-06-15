"use client";
import { useState } from "react";
import type { Participant, Results } from "@/types";
import { scoreParticipant, deriveResult, norm } from "@/lib/scoring";
import { MATCHES, TEAMS, SPAIN_IDX, GROUPS } from "@/lib/matches";
import { useT } from "@/contexts/LangContext";

interface Props { p: Participant; results: Results; onClose: () => void; }
type DTab = "resumen" | "grupos" | "espana" | "elim" | "bonus";

export default function DetailModal({ p, results, onClose }: Props) {
  const { t } = useT();
  const [tab, setTab] = useState<DTab>("resumen");
  const score = scoreParticipant(p, results);
  const bd = score.bd;

  const tabs: [DTab, string][] = [
    ["resumen", t.summary], ["grupos", t.groups], ["espana", t.spainTab],
    ["elim", t.knockout],   ["bonus",  t.bonusTab],
  ];

  return (
    <div className="fixed inset-0 bg-tw-navy/70 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] border-2 border-tw-grey/10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 bg-tw-navy sm:rounded-t-2xl">
          <div>
            <p className="text-white/60 text-sm font-medium mb-0.5">{p.nombre}</p>
            <p className="text-4xl sm:text-5xl font-extrabold text-tw-green leading-none">
              {score.total} <span className="text-xl text-tw-green/70 font-semibold">{t.pts}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white text-3xl w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 border-b-2 border-tw-grey/20 shrink-0 overflow-x-auto scrollbar-hide bg-white">
          {tabs.map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)}
              className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-t-lg whitespace-nowrap transition-all ${
                tab === k ? "bg-tw-navy text-tw-green" : "text-tw-grey hover:text-tw-navy"
              }`}>{label}</button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 bg-tw-light sm:rounded-b-2xl">

          {tab === "resumen" && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {[
                { label: "P1 — 1X2",              pts: score.p1, sub: t.correctOf(bd.p1ok, bd.p1n) },
                { label: `P2 — 🇪🇸`,              pts: score.p2, sub: t.exactOf(bd.p2detail.filter(d=>d?.label==="exacto").length) },
                { label: `P3 — ${t.knockout}`,    pts: score.p3, sub: t.champLabel(bd.champ) },
                { label: `P4 — ${t.bonusTab}`,    pts: score.p4, sub: t.bonusOf(bd.b.filter(Boolean).length) },
              ].map(({ label, pts, sub }) => (
                <div key={label} className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-tw-grey/20 shadow-sm">
                  <p className="text-xs sm:text-sm text-tw-grey font-medium">{label}</p>
                  <p className="text-4xl sm:text-5xl font-extrabold text-tw-navy my-1">{pts}</p>
                  <p className="text-xs sm:text-sm text-tw-grey">{sub}</p>
                </div>
              ))}
            </div>
          )}

          {tab === "grupos" && (
            <div className="space-y-5">
              {GROUPS.map(g => {
                const gms = MATCHES.map((m,i)=>({m,i})).filter(({m})=>m[2]===g);
                return (
                  <div key={g}>
                    <h4 className="font-bold text-sm sm:text-base text-tw-navy/50 mb-2 uppercase tracking-wide">Group {g}</h4>
                    <div className="space-y-1.5">
                      {gms.map(({m,i}) => {
                        const isEsp = SPAIN_IDX.includes(i);
                        const s = results.scores[i];
                        if (isEsp) {
                          const espIdx = SPAIN_IDX.indexOf(i);
                          const pred = p.picks.p2[espIdx];
                          const pm = pred?.match(/(\d+)\s*[-–:]\s*(\d+)/);
                          const hit = s && pm && +pm[1] === s.h && +pm[2] === s.a;
                          return (
                            <div key={i} className={`flex items-center gap-2 text-sm p-2.5 rounded-xl ${s?(hit?"bg-tw-green/20 border border-tw-green/40":"bg-red-50 border border-red-100"):"bg-white border border-tw-grey/20"}`}>
                              <span className="w-20 sm:w-24 text-right text-tw-navy text-xs sm:text-sm">{TEAMS[m[0]]?.flag} {m[0]}</span>
                              <span className="text-tw-grey text-xs">vs</span>
                              <span className="w-20 sm:w-24 text-tw-navy text-xs sm:text-sm">{m[1]} {TEAMS[m[1]]?.flag}</span>
                              <span className="text-[9px] font-bold text-tw-green/80 ml-1 shrink-0">P2</span>
                              <span className={`ml-auto font-mono font-bold text-sm sm:text-base ${hit?"text-tw-navy":s?"text-red-500":"text-tw-grey"}`}>{pred||"—"}</span>
                              {s&&<span className="text-tw-grey font-mono text-sm">{s.h}-{s.a}</span>}
                            </div>
                          );
                        }
                        const pick=p.picks.p1[i];
                        const actual=s?deriveResult(s.h,s.a):null, hit=actual&&pick===actual;
                        return (
                          <div key={i} className={`flex items-center gap-2 text-sm p-2.5 rounded-xl ${s?(hit?"bg-tw-green/20 border border-tw-green/40":"bg-red-50 border border-red-100"):"bg-white border border-tw-grey/20"}`}>
                            <span className="w-20 sm:w-24 text-right text-tw-navy text-xs sm:text-sm">{TEAMS[m[0]]?.flag} {m[0]}</span>
                            <span className="text-tw-grey text-xs">vs</span>
                            <span className="w-20 sm:w-24 text-tw-navy text-xs sm:text-sm">{m[1]} {TEAMS[m[1]]?.flag}</span>
                            <span className={`ml-auto font-mono font-bold text-sm sm:text-base ${hit?"text-tw-navy":s?"text-red-500":"text-tw-grey"}`}>{pick||"—"}</span>
                            {s&&<span className="text-tw-grey font-mono text-sm">{s.h}-{s.a}</span>}
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
            <div className="space-y-4">
              <div className="bg-tw-navy/5 rounded-xl p-3 text-sm text-tw-navy/70 font-medium">{t.spainRule}</div>
              {SPAIN_IDX.map((mi, k) => {
                const m=MATCHES[mi], s=results.scores[mi], d=bd.p2detail[k];
                return (
                  <div key={mi} className={`p-4 sm:p-5 rounded-2xl border-2 ${d?.label==="exacto"?"bg-tw-green/10 border-tw-green/40":s?"bg-red-50 border-red-200":"bg-white border-tw-grey/20"}`}>
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <span className="font-bold text-sm sm:text-base text-tw-navy">{TEAMS[m[0]]?.flag} {TEAMS[m[0]]?.name} vs {TEAMS[m[1]]?.name} {TEAMS[m[1]]?.flag}</span>
                      <span className={`text-base sm:text-lg font-extrabold shrink-0 ${d?.pts?"text-tw-navy":"text-tw-grey"}`}>+{d?.pts??0} {t.pts}</span>
                    </div>
                    <div className="flex gap-4 sm:gap-6 text-sm">
                      <span><span className="text-tw-grey">{t.scoreLabel} </span><strong className="font-mono text-base text-tw-navy">{p.picks.p2[k]||"—"}</strong></span>
                      {s&&<span><span className="text-tw-grey">{t.actualLabel} </span><strong className="font-mono text-base text-tw-navy">{s.h}-{s.a}</strong></span>}
                    </div>
                    {d&&<div className="mt-3"><span className={`text-sm px-3 py-1 rounded-full font-semibold ${d.label==="exacto"?"bg-tw-green text-tw-navy":"bg-red-100 text-red-600"}`}>{d.label==="exacto"?t.exact:t.miss}</span></div>}
                  </div>
                );
              })}
            </div>
          )}

          {tab === "elim" && (
            <div className="space-y-4">
              {[
                { label: `${t.p3Champion} (50 ${t.pts})`,  pred: p.picks.p3.winner,   actual: results.knockout.winner,   hit: bd.champ },
                { label: `${t.p3Runner} (30 ${t.pts})`,    pred: p.picks.p3.runnerUp, actual: results.knockout.runnerUp, hit: bd.ru },
              ].map(({label,pred,actual,hit})=>(
                <div key={label} className={`p-4 rounded-2xl border-2 ${hit?"bg-tw-green/10 border-tw-green/40":actual?"bg-red-50 border-red-200":"bg-white border-tw-grey/20"}`}>
                  <div className="text-xs sm:text-sm text-tw-grey font-semibold mb-1">{label}</div>
                  <div className="flex gap-6 text-sm sm:text-base">
                    <span><span className="text-tw-grey">{t.predLabel} </span><strong className="text-tw-navy">{pred||"—"}</strong></span>
                    {actual&&<span><span className="text-tw-grey">{t.actualLabel} </span><strong className="text-tw-navy">{actual}</strong></span>}
                  </div>
                </div>
              ))}
              {[
                { label: t.semis,    pred: p.picks.p3.semis, actual: results.knockout.semis, sc: bd.sem },
                { label: t.quarters, pred: p.picks.p3.qf,    actual: results.knockout.qf,    sc: bd.qf  },
                { label: t.r16,      pred: p.picks.p3.r16,   actual: results.knockout.r16,   sc: bd.r16 },
                { label: t.r32,      pred: p.picks.p3.r32,   actual: results.knockout.r32,   sc: bd.r32 },
              ].map(({label,pred,actual,sc})=>(
                <div key={label}>
                  <div className="text-xs sm:text-sm text-tw-grey font-semibold mb-2 flex justify-between">
                    <span>{label}</span>
                    <strong className="text-tw-navy">{sc.pts} {t.pts} ({t.hits(sc.hits)})</strong>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {pred.map((tm,j)=>{
                      const hit=actual.some(a=>norm(a)===norm(tm));
                      return <span key={j} className={`text-xs sm:text-sm px-3 py-1.5 rounded-xl font-semibold ${hit?"bg-tw-navy text-tw-green":"bg-white text-tw-navy border border-tw-grey/30"}`}>{tm||"—"}</span>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "bonus" && (
            <div className="space-y-3">
              {[
                { label: t.topScoringTeam, pred: p.picks.p4.topScorerTeam, hit: bd.b[0] },
                { label: t.mostConceded,   pred: p.picks.p4.mostConceded,  hit: bd.b[1] },
                { label: t.goldenBoot,     pred: p.picks.p4.goldenBoot,    hit: bd.b[2] },
                { label: t.topEspScorer,   pred: p.picks.p4.topEspScorer,  hit: bd.b[3] },
              ].map(({label,pred,hit})=>(
                <div key={label} className={`flex justify-between items-center p-4 sm:p-5 rounded-2xl border-2 ${hit?"bg-tw-green/10 border-tw-green/40":"bg-white border-tw-grey/20"}`}>
                  <div>
                    <div className="text-xs sm:text-sm text-tw-grey font-medium">{label}</div>
                    <div className="font-bold text-base sm:text-lg text-tw-navy mt-0.5">{pred||"—"}</div>
                  </div>
                  <span className={`text-base sm:text-lg font-extrabold ${hit?"text-tw-navy":"text-tw-grey"}`}>{hit?`+10 ${t.pts}`:`0 ${t.pts}`}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
