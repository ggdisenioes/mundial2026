import { NextResponse } from "next/server";
import { debugBracketSources, debugApiFootball } from "@/lib/sync";
import { supabase } from "@/lib/supabase";
import { groupStandings } from "@/lib/standings";
import { GROUPS } from "@/lib/matches";
import type { BracketMatch, MatchScore } from "@/types";

export const dynamic = "force-dynamic";

// Compara el cuadro de football-data vs API-Football vs el resultado combinado.
// Útil para ver por qué un cruce (ej. Argentina–Cabo Verde) aparece o no.
export async function GET() {
  try {
    const { hasAfKey, fd, af, merged } = await debugBracketSources();
    const af_diag = await debugApiFootball();

    // Clasificación actual por grupo (lo que ve la app), para verificar posiciones.
    const { data: row } = await supabase.from("resultados").select("scores").single();
    const scores = (Array.isArray(row?.scores) ? row.scores : []) as (MatchScore | null)[];
    const standings = Object.fromEntries(
      GROUPS.map(g => [
        g,
        groupStandings(g, scores).map(t => `${t.code} ${t.pts}p ${t.gd >= 0 ? "+" : ""}${t.gd} (J${t.played})`),
      ]),
    );
    const view = (arr: BracketMatch[]) =>
      arr
        .filter(m => m.stage === "LAST_32")
        .slice()
        .sort((a, b) => (a.utcDate < b.utcDate ? -1 : a.utcDate > b.utcDate ? 1 : 0))
        .map(m => ({
          date: m.utcDate,
          home: m.homeName || m.home || "—",
          away: m.awayName || m.away || "—",
          status: m.status,
        }));

    return NextResponse.json({
      hasAfKey,
      counts: { fd: fd.length, af: af ? af.length : null, merged: merged.length },
      apifootball_diag: af_diag,
      standings_actual: standings,
      r32_footballdata: view(fd),
      r32_apifootball: af ? view(af) : "(sin datos de API-Football)",
      r32_combinado: view(merged),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
