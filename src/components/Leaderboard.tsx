"use client";
import { useMemo, useState } from "react";
import type { Participant, Results } from "@/types";
import { scoreParticipant, liveGroupStats } from "@/lib/scoring";
import { MATCHES } from "@/lib/matches";
import NextMatches from "./NextMatches";
import { useT } from "@/contexts/LangContext";

interface Props {
  participants: Participant[];
  results: Results;
  onSelect: (p: Participant) => void;
  onRefresh: () => void;
}

const normSearch = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export default function Leaderboard({ participants, results, onSelect, onRefresh }: Props) {
  const { t } = useT();
  const [query, setQuery] = useState("");

  const ranked = useMemo(() =>
    participants
      .map(p => ({ p, score: scoreParticipant(p, results) }))
      .sort((a, b) => b.score.total - a.score.total),
    [participants, results]
  );

  const stats = useMemo(() => liveGroupStats(results.scores), [results.scores]);

  // La porra queda cerrada cuando el Mundial ya tiene campeón (final jugada).
  // Ahí destacamos y felicitamos al ganador (o ganadores, si hay empate arriba).
  const champDecided = !!results.knockout?.winner?.trim();
  const topScore = ranked[0]?.score.total ?? 0;
  const winnerNames = champDecided && ranked.length
    ? ranked.filter(r => r.score.total === topScore).map(r => r.p.nombre)
    : [];
  const isWinner = (total: number) => champDecided && ranked.length > 0 && total === topScore;
  const winnersLabel = winnerNames.length > 1
    ? winnerNames.slice(0, -1).join(", ") + " y " + winnerNames[winnerNames.length - 1]
    : winnerNames[0] ?? "";

  const filtered = useMemo(() => {
    const q = normSearch(query.trim());
    if (!q) return ranked.map((item, i) => ({ ...item, rank: i }));
    return ranked
      .map((item, i) => ({ ...item, rank: i }))
      .filter(({ p }) => normSearch(p.nombre).includes(q));
  }, [ranked, query]);

  const lastUpdate = results.updated_at
    ? new Date(results.updated_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })
    : null;

  return (
    <div className="space-y-4 sm:space-y-5">
      {champDecided && winnerNames.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tw-navy to-[#0a2570] px-5 py-6 sm:px-8 sm:py-8 text-center shadow-lg ring-2 ring-tw-green/50">
          <div aria-hidden className="pointer-events-none absolute inset-0 opacity-20 text-3xl select-none leading-[2.2rem] tracking-[0.6rem]">
            🎉🏆✨🎊⚽🥇🎉🏆✨🎊⚽🥇🎉🏆✨🎊⚽🥇🎉🏆✨🎊⚽🥇🎉🏆✨🎊⚽🥇🎉🏆✨🎊⚽🥇
          </div>
          <div className="relative">
            <div className="text-4xl sm:text-5xl mb-1">🎉🏆🎉</div>
            <p className="text-tw-green text-[11px] sm:text-xs font-bold uppercase tracking-widest">Porra del Mundial 2026 · ¡Torneo finalizado!</p>
            <h2 className="mt-1.5 text-2xl sm:text-4xl font-extrabold text-white leading-tight">
              ¡Enhorabuena, {winnersLabel}! 🥇
            </h2>
            <p className="mt-2 text-white/85 text-sm sm:text-base">
              {winnerNames.length > 1 ? "Ganadores" : "Ganador"} de la porra con{" "}
              <strong className="text-tw-green">{topScore} pts</strong>. ¡Enhorabuena, campeón! 👑
            </p>
          </div>
        </div>
      )}

      <div className="flex items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-tw-navy">{t.leaderboardTitle}</h2>
          {lastUpdate && <p className="text-sm text-tw-grey mt-1">{t.updatedAt(lastUpdate)}</p>}
        </div>
        <button onClick={onRefresh}
          className="shrink-0 text-sm sm:text-base border-2 border-tw-navy/20 text-tw-navy px-4 py-2 rounded-xl hover:border-tw-green font-semibold transition-all">
          {t.refresh}
        </button>
      </div>

      {stats.matchesPlayed > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl border-2 border-tw-grey/20 px-4 py-3 flex items-center gap-3">
            <span className="text-2xl shrink-0">⚽</span>
            <div className="min-w-0">
              <p className="text-xs text-tw-grey font-medium uppercase tracking-wide">Más goleador</p>
              {stats.topTeam
                ? <p className="font-bold text-tw-navy truncate">{stats.topTeam} <span className="font-normal text-tw-grey">({stats.topTeamGoals} goles)</span></p>
                : <p className="text-tw-grey text-sm">—</p>}
            </div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-tw-grey/20 px-4 py-3 flex items-center gap-3">
            <span className="text-2xl shrink-0">🥅</span>
            <div className="min-w-0">
              <p className="text-xs text-tw-grey font-medium uppercase tracking-wide">Más goleado</p>
              {stats.mostConceded
                ? <p className="font-bold text-tw-navy truncate">{stats.mostConceded} <span className="font-normal text-tw-grey">({stats.mostConcededGoals} goles)</span></p>
                : <p className="text-tw-grey text-sm">—</p>}
            </div>
          </div>
          <p className="sm:col-span-2 text-xs text-tw-grey text-right -mt-1">{t.liveStatsOf(stats.matchesPlayed, MATCHES.length)}</p>
        </div>
      )}

      {/* Próximos 3 partidos (eliminatorias) */}
      <NextMatches results={results} />

      {ranked.length > 0 && (
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tw-grey pointer-events-none">🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border-2 border-tw-grey/30 focus:border-tw-green focus:outline-none text-sm sm:text-base text-tw-navy placeholder:text-tw-grey/60 transition-colors"
          />
        </div>
      )}

      {ranked.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-tw-grey">
          <p className="text-5xl mb-4">📋</p>
          <p className="text-base sm:text-lg text-tw-grey">{t.noParticipantsTitle}.<br className="sm:hidden" /> {t.noParticipantsDesc}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(({ p, score, rank }) => {
            const medal = rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : null;
            const isTop3 = rank < 3;
            const won = isWinner(score.total);
            return (
              <button key={p.id} onClick={() => onSelect(p)}
                className={`w-full text-left rounded-2xl border-2 transition-all active:scale-[0.99] p-4 sm:p-5 flex items-center gap-3 sm:gap-5 ${
                  won ? "bg-tw-green/10 border-tw-green ring-2 ring-tw-green/50 shadow-md"
                      : isTop3 ? "bg-white border-tw-navy/10 hover:border-tw-green shadow-sm hover:shadow-md"
                               : "bg-white border-tw-grey/30 hover:border-tw-green hover:shadow-sm"
                }`}>
                <div className="shrink-0 w-10 sm:w-12 flex items-center justify-center">
                  {won ? <span className="text-2xl sm:text-3xl">👑</span>
                       : medal ? <span className="text-2xl sm:text-3xl">{medal}</span>
                               : <span className="text-base sm:text-lg font-bold text-tw-grey">{rank + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-base sm:text-xl text-tw-navy truncate">{p.nombre}</span>
                    {won && <span className="shrink-0 text-[10px] sm:text-xs font-bold uppercase tracking-wide bg-tw-green text-tw-navy px-2 py-0.5 rounded-full">🏆 Campeón de la porra</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                    {[
                      { k: "P1", v: score.p1 }, { k: t.p2Label, v: score.p2 },
                      { k: "P3", v: score.p3 }, { k: "P4",       v: score.p4 },
                    ].map(({ k, v }) => (
                      <span key={k} className="text-xs sm:text-sm text-tw-grey">
                        {k}: <strong className="text-tw-navy/80">{v}</strong>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`font-extrabold leading-none ${isTop3 ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"} text-tw-navy`}>{score.total}</div>
                  <div className="text-xs text-tw-grey mt-0.5">{t.pts}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
