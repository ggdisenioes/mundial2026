import { NextResponse } from "next/server";
import { debugBracketSources } from "@/lib/sync";
import type { BracketMatch } from "@/types";

export const dynamic = "force-dynamic";

// Compara el cuadro de football-data vs API-Football vs el resultado combinado.
// Útil para ver por qué un cruce (ej. Argentina–Cabo Verde) aparece o no.
export async function GET() {
  try {
    const { hasAfKey, fd, af, merged } = await debugBracketSources();
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
