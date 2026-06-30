import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { scoreParticipant, effectiveBonus } from "@/lib/scoring";
import { MATCHES, TEAMS } from "@/lib/matches";
import type { Participant, Results, MatchScore } from "@/types";

export const dynamic = "force-dynamic";

// Ranking de goles a favor / en contra en fase de grupos (para verificar el bonus).
function goalRanking(scores: (MatchScore | null)[]) {
  const gf: Record<string, number> = {}, ga: Record<string, number> = {};
  MATCHES.forEach(([h, a], i) => {
    const s = scores[i];
    if (!s) return;
    gf[h] = (gf[h] || 0) + s.h; ga[h] = (ga[h] || 0) + s.a;
    gf[a] = (gf[a] || 0) + s.a; ga[a] = (ga[a] || 0) + s.h;
  });
  const rank = (o: Record<string, number>) =>
    Object.entries(o).sort((x, y) => y[1] - x[1]).slice(0, 6)
      .map(([c, n]) => `${TEAMS[c]?.name ?? c}: ${n}`);
  return { mas_goleador: rank(gf), mas_goleado: rank(ga) };
}

// Desglose de puntaje de un participante. Uso: /api/debug/score?nombre=jaime
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("nombre") ?? "").trim().toLowerCase();
  const [pRes, rRes] = await Promise.all([
    supabase.from("participantes").select("*"),
    supabase.from("resultados").select("*").single(),
  ]);
  if (rRes.error) return NextResponse.json({ error: rRes.error.message }, { status: 500 });

  const results = rRes.data as Results;
  const parts = ((pRes.data ?? []) as Participant[]).filter(p => p.nombre.toLowerCase().includes(q));
  const eb = effectiveBonus(results);

  const participantes = parts.map(p => {
    const s = scoreParticipant(p, results);
    return {
      nombre: p.nombre,
      total: s.total,
      P1_grupos: s.p1,
      P2_espana: s.p2,
      P3_eliminatorias: s.p3,
      P4_bonus: s.p4,
      detalle_P3: { campeon: s.bd.champ, subcampeon: s.bd.ru, semis: s.bd.sem, cuartos: s.bd.qf, r16: s.bd.r16, r32: s.bd.r32 },
      detalle_P4: { aciertos: s.bd.b, picks: p.picks?.p4 },
    };
  });

  return NextResponse.json({
    bonus_efectivo: eb,
    ranking_goles: goalRanking(Array.isArray(results.scores) ? results.scores : []),
    knockout_actual: {
      winner: results.knockout.winner, runnerUp: results.knockout.runnerUp,
      semis: results.knockout.semis, qf: results.knockout.qf,
      r16: results.knockout.r16, r32: results.knockout.r32,
    },
    participantes,
  });
}
