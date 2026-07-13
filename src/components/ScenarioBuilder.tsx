"use client";
import { useMemo, useState } from "react";
import type { Participant, Results, BracketMatch } from "@/types";
import { TEAMS } from "@/lib/matches";
import {
  buildScenarioBracket, scenarioSummary, isLockedMatch, winnerCode,
  type ScenarioChoices, type ScenarioSide,
} from "@/lib/bracket";
import { scoreParticipant, norm } from "@/lib/scoring";

const MEDALS = ["🥇", "🥈", "🥉"];
const ROUNDS: { stage: string; label: string }[] = [
  { stage: "LAST_32", label: "16avos" },
  { stage: "LAST_16", label: "Octavos" },
  { stage: "QUARTER_FINALS", label: "Cuartos" },
  { stage: "SEMI_FINALS", label: "Semis" },
  { stage: "FINAL", label: "Final" },
];

const label = (code: string | null) =>
  code ? `${TEAMS[code]?.flag ?? ""} ${TEAMS[code]?.name ?? code}`.trim() : "—";

function uniqueNames(vals: (string | undefined)[]): string[] {
  const seen = new Set<string>(); const out: string[] = [];
  for (const v of vals) {
    const t = (v ?? "").trim();
    if (!t) continue;
    const k = norm(t);
    if (!seen.has(k)) { seen.add(k); out.push(t); }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function TeamRow({ code, selected, locked, onPick }: {
  code: string | null; selected: boolean; locked: boolean; onPick?: () => void;
}) {
  const base = "w-full text-left px-2 py-1.5 text-[11px] sm:text-xs rounded-md flex items-center gap-1 transition-colors";
  const cls = selected
    ? "bg-tw-green/25 border border-emerald-500/70 text-tw-navy font-bold"
    : "border border-transparent text-tw-grey hover:bg-tw-navy/5";
  return (
    <button
      onClick={locked ? undefined : onPick}
      disabled={locked || !code}
      className={`${base} ${cls} ${locked ? "cursor-default" : code ? "cursor-pointer" : "cursor-not-allowed"}`}
    >
      <span className="truncate">{label(code)}</span>
      {selected && <span className="ml-auto text-[10px] text-emerald-700">✓</span>}
    </button>
  );
}

function MatchCard({ m, stage, idx, choices, onPick }: {
  m: BracketMatch; stage: string; idx: number; choices: ScenarioChoices;
  onPick: (key: string, side: ScenarioSide) => void;
}) {
  const locked = isLockedMatch(m);
  const win = winnerCode(m);
  const key = `${stage}:${idx}`;
  return (
    <div className={`rounded-lg border ${locked ? "border-tw-grey/20 bg-tw-navy/[0.02]" : "border-tw-grey/30 bg-white"} p-1 space-y-0.5`}>
      {locked && <div className="px-2 pt-0.5 text-[9px] font-semibold text-tw-grey">🔒 jugado</div>}
      <TeamRow code={m.home} selected={!!win && win === m.home} locked={locked} onPick={() => onPick(key, "HOME")} />
      <TeamRow code={m.away} selected={!!win && win === m.away} locked={locked} onPick={() => onPick(key, "AWAY")} />
    </div>
  );
}

export default function ScenarioBuilder({ participants, results }: {
  participants: Participant[]; results: Results;
}) {
  const api = results.knockout?._bracket ?? [];
  const scores = results.scores ?? [];

  const [choices, setChoices] = useState<ScenarioChoices>({});
  const [boot, setBoot] = useState<string>(results.bonus?.goldenBoot ?? "");
  const [esp, setEsp] = useState<string>(results.bonus?.topEspScorer ?? "");

  const bootOpts = useMemo(() => uniqueNames(participants.map(p => p.picks.p4?.goldenBoot)), [participants]);
  const espOpts = useMemo(() => uniqueNames(participants.map(p => p.picks.p4?.topEspScorer)), [participants]);

  const rounds = useMemo(() => buildScenarioBracket(api, scores, choices), [api, scores, choices]);
  const summary = useMemo(() => scenarioSummary(rounds), [rounds]);

  const scenarioResults: Results = useMemo(() => ({
    ...results,
    knockout: { ...summary, _bracket: api },
    bonus: { ...results.bonus, goldenBoot: boot, topEspScorer: esp },
  }), [results, summary, api, boot, esp]);

  const current = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of participants) m[p.id] = scoreParticipant(p, results).total;
    return m;
  }, [participants, results]);

  const ranking = useMemo(() => participants
    .map(p => ({ p, sc: scoreParticipant(p, scenarioResults).total }))
    .sort((a, b) => b.sc - a.sc || (current[b.p.id] - current[a.p.id]) || a.p.nombre.localeCompare(b.p.nombre)),
    [participants, scenarioResults, current]);

  const onPick = (key: string, side: ScenarioSide) =>
    setChoices(prev => ({ ...prev, [key]: side }));
  const reset = () => { setChoices({}); setBoot(results.bonus?.goldenBoot ?? ""); setEsp(results.bonus?.topEspScorer ?? ""); };

  const winnerRow = ranking[0];
  const dirty = Object.keys(choices).length > 0 || boot !== (results.bonus?.goldenBoot ?? "") || esp !== (results.bonus?.topEspScorer ?? "");

  const Selector = ({ value, opts, onChange, ph }: { value: string; opts: string[]; onChange: (v: string) => void; ph: string }) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full text-xs rounded-lg border border-tw-grey/30 bg-white px-2 py-1.5 text-tw-navy"
    >
      <option value="">— {ph} (sin efecto) —</option>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
      {value && !opts.some(o => norm(o) === norm(value)) && <option value={value}>{value}</option>}
    </select>
  );

  return (
    <div className="lg:flex lg:flex-row-reverse lg:items-start lg:gap-6">
      {/* Panel de resultado (a la derecha en desktop, arriba en móvil) */}
      <aside className="lg:w-80 lg:shrink-0 lg:sticky lg:top-4 space-y-3">
        <div className="rounded-2xl bg-tw-navy text-white px-4 py-4 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-widest text-tw-green">Si queda así…</p>
          <p className="mt-1 text-lg font-extrabold leading-tight">🏆 {winnerRow?.p.nombre ?? "—"}</p>
          <p className="text-white/60 text-xs mt-0.5">
            gana la porra con <strong className="text-white">{winnerRow?.sc ?? 0} pts</strong>
          </p>
          <p className="text-white/50 text-[11px] mt-2 border-t border-white/10 pt-2">
            Campeón: <strong className="text-white/90">{summary.winner || "—"}</strong> · Subcampeón: <strong className="text-white/90">{summary.runnerUp || "—"}</strong>
          </p>
        </div>

        <div className="rounded-2xl border-2 border-tw-grey/20 bg-white p-3 space-y-2 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-wider text-tw-grey">⚽ Goleadores (bonus +10)</p>
          <Selector value={boot} opts={bootOpts} onChange={setBoot} ph="Bota de Oro" />
          <Selector value={esp} opts={espOpts} onChange={setEsp} ph="Goleador España" />
        </div>

        <div className="rounded-2xl border-2 border-tw-grey/20 bg-white overflow-hidden shadow-sm">
          <div className="px-3 py-2 bg-tw-navy/5 border-b border-tw-grey/15 flex items-center justify-between">
            <span className="text-xs font-bold text-tw-navy">Clasificación del escenario</span>
            {dirty && <button onClick={reset} className="text-[11px] font-semibold text-tw-navy/60 hover:text-tw-navy underline underline-offset-2">↺ reset</button>}
          </div>
          <ol className="divide-y divide-tw-light">
            {ranking.map(({ p, sc }, i) => {
              const d = sc - (current[p.id] ?? 0);
              return (
                <li key={p.id} className={`flex items-center gap-2 px-3 py-2 ${i === 0 ? "bg-tw-green/10" : ""}`}>
                  <span className="w-5 shrink-0 text-center text-sm">{i < 3 ? MEDALS[i] : <span className="text-xs text-tw-grey">{i + 1}</span>}</span>
                  <span className={`flex-1 min-w-0 truncate text-sm ${i === 0 ? "font-bold text-tw-navy" : "text-tw-navy/80"}`}>{p.nombre}</span>
                  <span className="shrink-0 tabular-nums text-sm font-bold text-tw-navy">{sc}</span>
                  <span className={`shrink-0 w-10 text-right tabular-nums text-[11px] ${d > 0 ? "text-emerald-600" : d < 0 ? "text-red-500" : "text-tw-grey"}`}>
                    {d > 0 ? `▲${d}` : d < 0 ? `▼${-d}` : "–"}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>

      {/* Cuadro editable */}
      <div className="min-w-0 flex-1 mt-4 lg:mt-0">
        <p className="text-xs text-tw-grey mb-2">
          Tocá el ganador de cada llave pendiente. Los partidos ya jugados (🔒) están fijos. El resultado se recalcula al instante.
        </p>
        <div className="overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-3 min-w-max">
            {ROUNDS.map(({ stage, label: lbl }) => {
              const arr = (rounds[stage] ?? []).filter(m => m.home || m.away);
              if (!arr.length) return null;
              return (
                <div key={stage} className="w-40 sm:w-44 shrink-0 space-y-2">
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-tw-navy/70 sticky top-0">{lbl}</h3>
                  {(rounds[stage] ?? []).map((m, i) => (
                    (m.home || m.away)
                      ? <MatchCard key={`${stage}:${i}`} m={m} stage={stage} idx={i} choices={choices} onPick={onPick} />
                      : null
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
