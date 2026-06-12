"use client";
import { useMemo, useState } from "react";
import { MATCHES, TEAMS, SPAIN_IDX } from "@/lib/matches";
import { scoreParticipant, norm, deriveResult, effectiveBonus } from "@/lib/scoring";
import type { Participant, Results } from "@/types";

/* ─────────────────── types & constants ─────────────────── */
type Phase = "p1" | "p2" | "p3" | "p4";
type Group = "A"|"B"|"C"|"D"|"E"|"F"|"G"|"H"|"I"|"J"|"K"|"L";
const ALL_GROUPS: Group[] = ["A","B","C","D","E","F","G","H","I","J","K","L"];
const MEDALS = ["🥇","🥈","🥉"];

type St = "hit" | "miss" | "open";
const CL: Record<St, string> = {
  hit:  "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  miss: "bg-red-50 text-red-400 ring-1 ring-inset ring-red-100",
  open: "bg-white text-slate-400",
};

/* ─────────────────── helpers ─────────────────── */
const NAME_TO_CODE = Object.fromEntries(
  Object.entries(TEAMS).map(([code, t]) => [norm(t.name), code])
);
const teamOf = (name: string) => {
  const code = NAME_TO_CODE[norm(name)];
  return code ? { code, ...TEAMS[code] } : null;
};

const setOf = (arr: string[]) => new Set(arr.filter(Boolean).map(norm));

const stFrom = (pick: string, actual: string | null | undefined): St =>
  !actual ? "open" : norm(pick) === norm(actual) ? "hit" : "miss";

const stFromSet = (pick: string, aSet: Set<string>): St =>
  aSet.size === 0 ? "open" : aSet.has(norm(pick)) ? "hit" : "miss";

/* ─────────────────── sub-components ─────────────────── */
function Legend({ p3 = false }: { p3?: boolean }) {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-slate-500 px-1 select-none">
      <span className="flex items-center gap-1.5">
        <span className="w-4 h-4 rounded bg-emerald-50 ring-1 ring-emerald-200 inline-block" />
        Acertado
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-4 h-4 rounded bg-red-50 ring-1 ring-red-100 inline-block" />
        Fallado
      </span>
      <span className="flex items-center gap-1.5">
        <span className="w-4 h-4 rounded bg-white ring-1 ring-slate-200 inline-block" />
        Pendiente
      </span>
      {p3 && <span className="text-slate-400">· Banderas: intensidad = acierto</span>}
    </div>
  );
}

function NameCell({ nombre, total, rank }: { nombre: string; total: number; rank: number }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="shrink-0 w-7 text-center text-base leading-none select-none">
        {rank < 3 ? MEDALS[rank] : <span className="text-xs font-bold text-slate-400">{rank + 1}</span>}
      </span>
      <div className="min-w-0">
        <div className="font-semibold text-tw-navy text-sm leading-tight truncate max-w-[130px]">{nombre}</div>
        <div className="text-xs text-slate-400">{total} pts</div>
      </div>
    </div>
  );
}

/* ─────────────────── main component ─────────────────── */
export default function PredictionsGrid({
  participants, results,
}: { participants: Participant[]; results: Results }) {
  const [phase, setPhase] = useState<Phase>("p1");
  const [group, setGroup] = useState<Group>("A");

  const ranked = useMemo(() =>
    participants
      .map(p => ({ p, s: scoreParticipant(p, results) }))
      .sort((a, b) => b.s.total - a.s.total),
    [participants, results]
  );
  const eb = useMemo(() => effectiveBonus(results), [results]);
  const kn = results.knockout;

  const groupMatches = useMemo(() =>
    MATCHES.map((m, i) => ({ m, i })).filter(({ m }) => m[2] === group),
    [group]
  );

  const p3Sets = useMemo(() => ({
    semis: setOf(kn.semis),
    qf:    setOf(kn.qf),
    r16:   setOf(kn.r16),
    r32:   setOf(kn.r32),
  }), [kn]);

  const PHASES: [Phase, string][] = [
    ["p1", "Grupos · P1"],
    ["p2", "🇪🇸 España · P2"],
    ["p3", "Eliminatoria · P3"],
    ["p4", "Bonus · P4"],
  ];

  if (!participants.length) return (
    <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-tw-grey">
      <p className="text-5xl mb-4">📊</p>
      <p className="text-tw-grey">Aún no hay predicciones que mostrar.</p>
    </div>
  );

  /* shared header th for name sticky col */
  const stickyTH = "sticky left-0 z-20 bg-tw-navy text-white text-xs font-semibold uppercase tracking-wide text-left px-3 py-3 border-r border-white/10 min-w-[175px]";
  /* shared sticky td (participant rows — inherits row bg via CSS variable trick via ring) */
  const stickyTD = (ri: number) =>
    `sticky left-0 z-10 px-3 py-2 border-r border-slate-200 ${ri % 2 ? "bg-slate-50" : "bg-white"} group-hover:bg-[#f0fdf4]`;

  return (
    <div className="space-y-4">
      {/* ── Phase selector ── */}
      <div className="flex flex-wrap gap-2">
        {PHASES.map(([id, label]) => (
          <button key={id} onClick={() => setPhase(id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              phase === id
                ? "bg-tw-navy text-white shadow-sm"
                : "bg-white text-tw-navy/60 border border-slate-200 hover:border-tw-green hover:text-tw-navy"
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* ══════════════════ P1 — GRUPOS ══════════════════ */}
      {phase === "p1" && (
        <div className="space-y-3">
          {/* Group pills */}
          <div className="flex flex-wrap gap-1.5">
            {ALL_GROUPS.map(g => (
              <button key={g} onClick={() => setGroup(g)}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all border ${
                  group === g
                    ? "bg-tw-navy text-white border-tw-navy shadow-sm"
                    : "bg-white text-tw-navy/50 border-slate-200 hover:border-tw-green hover:text-tw-navy"
                }`}>{g}</button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="border-collapse text-sm">
              <thead>
                <tr>
                  <th className={stickyTH}>Participante</th>
                  {groupMatches.map(({ m, i }) => {
                    const isEsp = SPAIN_IDX.includes(i);
                    const res = results.scores[i] ?? null;
                    const actual = res ? deriveResult(res.h, res.a) : null;
                    return (
                      <th key={i}
                        className={`bg-tw-navy border-r border-white/10 last:border-0 px-1.5 py-2 text-center w-11 ${isEsp ? "bg-white/10" : ""}`}>
                        <div className="flex flex-col items-center leading-none gap-px">
                          <span className="text-sm">{TEAMS[m[0]].flag}</span>
                          <span className="text-[8px] text-white/30">vs</span>
                          <span className="text-sm">{TEAMS[m[1]].flag}</span>
                          {actual
                            ? <span className={`mt-1 text-[9px] font-bold px-1 py-px rounded ${actual === "1" ? "bg-tw-green/30 text-tw-green" : actual === "2" ? "bg-blue-400/30 text-blue-200" : "bg-white/20 text-white/80"}`}>{actual}</span>
                            : <span className="mt-1 text-[8px] text-white/20">–</span>
                          }
                          {isEsp && <span className="text-[7px] text-tw-green/80 mt-px">P2</span>}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {ranked.map(({ p, s }, ri) => (
                  <tr key={p.id}
                    className={`border-t border-slate-100 transition-colors group ${ri % 2 ? "bg-slate-50/60" : "bg-white"} hover:bg-[#f0fdf4]`}>
                    <td className={stickyTD(ri)}>
                      <NameCell nombre={p.nombre} total={s.total} rank={ri} />
                    </td>
                    {groupMatches.map(({ m, i }) => {
                      const res = results.scores[i] ?? null;
                      const actual = res ? deriveResult(res.h, res.a) : null;
                      const pick = p.picks.p1[i] || "–";
                      const st: St = actual === null ? "open" : pick === actual ? "hit" : "miss";
                      return (
                        <td key={i}
                          className={`text-center font-bold w-11 h-10 border-r border-slate-100 last:border-0 text-sm ${CL[st]}`}>
                          {pick}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Legend />
        </div>
      )}

      {/* ══════════════════ P2 — ESPAÑA ══════════════════ */}
      {phase === "p2" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="border-collapse text-sm">
              <thead>
                <tr>
                  <th className={stickyTH}>Participante</th>
                  {SPAIN_IDX.map((mi, k) => {
                    const [h, a] = MATCHES[mi];
                    const res = results.scores[mi] ?? null;
                    return (
                      <th key={k}
                        className="bg-tw-navy border-r border-white/10 last:border-0 px-4 py-2 text-center min-w-[115px]">
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-base">{TEAMS[h].flag}&thinsp;vs&thinsp;{TEAMS[a].flag}</span>
                          <span className="text-[9px] text-white/50">{TEAMS[h].name} – {TEAMS[a].name}</span>
                          {res
                            ? <span className="text-xs font-bold text-tw-green mt-0.5">{res.h}–{res.a}</span>
                            : <span className="text-[9px] text-white/30 mt-0.5">Sin resultado</span>}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {ranked.map(({ p, s }, ri) => (
                  <tr key={p.id}
                    className={`border-t border-slate-100 transition-colors group ${ri % 2 ? "bg-slate-50/60" : "bg-white"} hover:bg-[#f0fdf4]`}>
                    <td className={stickyTD(ri)}>
                      <NameCell nombre={p.nombre} total={s.total} rank={ri} />
                    </td>
                    {SPAIN_IDX.map((mi, k) => {
                      const res = results.scores[mi] ?? null;
                      const pred = p.picks.p2[k] || "–";
                      let st: St = "open";
                      if (res) {
                        const pm = pred.match(/(\d+)\s*[-–:]\s*(\d+)/);
                        st = pm && +pm[1] === res.h && +pm[2] === res.a ? "hit" : "miss";
                      }
                      return (
                        <td key={k}
                          className={`text-center py-4 px-3 border-r border-slate-100 last:border-0 font-bold text-base ${CL[st]}`}>
                          {pred}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Legend />
        </div>
      )}

      {/* ══════════════════ P3 — ELIMINATORIA ══════════════════ */}
      {phase === "p3" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-tw-navy text-white text-xs font-semibold uppercase tracking-wide text-left px-3 py-3 border-r border-white/10 min-w-[145px]">
                    Ronda
                  </th>
                  {ranked.map(({ p }, ri) => (
                    <th key={p.id}
                      className="bg-tw-navy border-r border-white/10 last:border-0 px-1 py-2.5 text-center min-w-[72px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-base leading-none select-none">
                          {ri < 3 ? MEDALS[ri] : <span className="text-xs text-white/50">{ri+1}</span>}
                        </span>
                        <span className="text-[9px] text-white/55 leading-tight max-w-[60px] truncate">
                          {p.nombre.split(" ")[0]}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Champion */}
                {(["winner","runnerUp"] as const).map((field, idx) => {
                  const isChamp = field === "winner";
                  const label = isChamp ? "🏆 Campeón" : "🥈 Subcampeón";
                  const actualName = kn[field];
                  const actualTeam = actualName ? teamOf(actualName) : null;
                  return (
                    <tr key={field} className={`border-t border-slate-100 ${isChamp ? "bg-amber-50/20" : "bg-white"}`}>
                      <td className={`sticky left-0 z-10 px-3 py-3 text-xs font-bold text-tw-navy border-r border-slate-200 whitespace-nowrap ${isChamp ? "bg-amber-50/40" : "bg-white"}`}>
                        {label}
                        {actualTeam && (
                          <div className="text-slate-500 font-normal mt-0.5">{actualTeam.flag} {actualTeam.name}</div>
                        )}
                      </td>
                      {ranked.map(({ p }) => {
                        const pick = p.picks.p3[field];
                        const st = stFrom(pick, actualName);
                        const t = teamOf(pick);
                        return (
                          <td key={p.id}
                            className={`text-center border-r border-slate-100 last:border-0 py-2.5 px-1 ${CL[st]}`}>
                            <div className="text-xl leading-none">{t?.flag ?? "?"}</div>
                            <div className="text-[9px] leading-tight mt-0.5 font-semibold max-w-[65px] truncate mx-auto">
                              {t?.name.split(" ")[0] ?? pick}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}

                {/* Multi-team rows */}
                {([
                  { key: "semis", label: "🎽 Semifinalistas", note: "15 pts c/u", aSet: p3Sets.semis, getPicks: (p: Participant) => p.picks.p3.semis },
                  { key: "qf",    label: "⚡ Cuartos de final", note: "6 pts c/u",  aSet: p3Sets.qf,    getPicks: (p: Participant) => p.picks.p3.qf },
                  { key: "r16",   label: "Ronda de 16",        note: "3 pts c/u",  aSet: p3Sets.r16,   getPicks: (p: Participant) => p.picks.p3.r16 },
                  { key: "r32",   label: "Ronda de 32",        note: "2 pts c/u",  aSet: p3Sets.r32,   getPicks: (p: Participant) => p.picks.p3.r32 },
                ] as const).map(({ key, label, note, aSet, getPicks }) => (
                  <tr key={key} className="border-t border-slate-100">
                    <td className="sticky left-0 z-10 bg-white px-3 py-2.5 text-xs font-bold text-tw-navy border-r border-slate-200 whitespace-nowrap">
                      {label}
                      <div className="text-[9px] text-slate-400 font-normal">{note}</div>
                    </td>
                    {ranked.map(({ p }) => {
                      const teams = getPicks(p);
                      return (
                        <td key={p.id}
                          className="border-r border-slate-100 last:border-0 py-2 px-1.5 align-middle">
                          <div className="flex flex-wrap gap-[3px] justify-center">
                            {teams.map((name, j) => {
                              const t = teamOf(name);
                              const st = stFromSet(name, aSet);
                              return (
                                <span key={j}
                                  title={name}
                                  className={`text-[15px] leading-none transition-opacity select-none ${
                                    st === "hit"  ? "opacity-100 drop-shadow-sm" :
                                    st === "miss" ? "opacity-25" :
                                    "opacity-60"
                                  }`}>
                                  {t?.flag ?? "🏳️"}
                                </span>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Legend p3 />
        </div>
      )}

      {/* ══════════════════ P4 — BONUS ══════════════════ */}
      {phase === "p4" && (
        <div className="space-y-3">
          <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
            <table className="border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 bg-tw-navy text-white text-xs font-semibold uppercase tracking-wide text-left px-3 py-3 border-r border-white/10 min-w-[170px]">
                    Pregunta
                  </th>
                  {ranked.map(({ p }, ri) => (
                    <th key={p.id}
                      className="bg-tw-navy border-r border-white/10 last:border-0 px-1 py-2.5 text-center min-w-[80px]">
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-base leading-none select-none">
                          {ri < 3 ? MEDALS[ri] : <span className="text-xs text-white/50">{ri+1}</span>}
                        </span>
                        <span className="text-[9px] text-white/55 leading-tight max-w-[65px] truncate">
                          {p.nombre.split(" ")[0]}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {([
                  { label: "⚽ Máx. goleador equipo", actual: eb.topTeam,     getPick: (p: Participant) => p.picks.p4.topScorerTeam },
                  { label: "🥅 Más goleado",          actual: eb.mostConceded, getPick: (p: Participant) => p.picks.p4.mostConceded },
                  { label: "🥇 Bota de Oro",          actual: eb.goldenBoot,   getPick: (p: Participant) => p.picks.p4.goldenBoot },
                  { label: "🇪🇸 Goleador España",     actual: eb.topEspScorer, getPick: (p: Participant) => p.picks.p4.topEspScorer },
                ] as const).map(({ label, actual, getPick }, qi) => (
                  <tr key={qi} className={`border-t border-slate-100 ${qi % 2 ? "bg-slate-50/40" : "bg-white"}`}>
                    <td className={`sticky left-0 z-10 px-3 py-3 text-xs font-bold text-tw-navy border-r border-slate-200 whitespace-nowrap ${qi % 2 ? "bg-slate-50" : "bg-white"}`}>
                      {label}
                      {actual
                        ? <div className="text-slate-500 font-normal mt-0.5 text-[10px]">{actual}</div>
                        : <div className="text-slate-400 font-normal mt-0.5 text-[10px]">Pendiente</div>
                      }
                    </td>
                    {ranked.map(({ p }) => {
                      const pick = getPick(p);
                      const st = stFrom(pick, actual);
                      const t = teamOf(pick);
                      const isTeam = (label.startsWith("⚽") || label.startsWith("🥅")) && !!t;
                      return (
                        <td key={p.id}
                          className={`text-center border-r border-slate-100 last:border-0 py-3 px-1.5 ${CL[st]}`}>
                          {isTeam ? (
                            <>
                              <div className="text-lg leading-none">{t!.flag}</div>
                              <div className="text-[9px] font-semibold mt-0.5 max-w-[70px] truncate mx-auto leading-tight">
                                {t!.name.split(" ")[0]}
                              </div>
                            </>
                          ) : (
                            <div className="text-[10px] font-medium leading-tight max-w-[70px] mx-auto">
                              {pick || <span className="opacity-40">—</span>}
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Legend />
        </div>
      )}
    </div>
  );
}
