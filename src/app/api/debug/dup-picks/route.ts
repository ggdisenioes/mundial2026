import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { norm } from "@/lib/scoring";
import type { Participant } from "@/types";

export const dynamic = "force-dynamic";

// Lista participantes cuya predicción de eliminatorias (P3) repite un equipo en
// más de una fase (ej. Campeón y Cuartos) — predicciones inconsistentes.
export async function GET() {
  const { data, error } = await supabase.from("participantes").select("nombre, picks");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const out: { nombre: string; repetidos: string[][]; excel: Record<string, unknown> }[] = [];
  for (const p of (data ?? []) as Participant[]) {
    const p3 = p.picks?.p3;
    if (!p3) continue;
    const entries: [string, string][] = [];
    const add = (team: string | undefined, fase: string) => {
      if (team && team.trim()) entries.push([team.trim(), fase]);
    };
    add(p3.winner, "Campeón");
    add(p3.runnerUp, "Subcampeón");
    (p3.semis ?? []).forEach(x => add(x, "Semis"));
    (p3.qf ?? []).forEach(x => add(x, "Cuartos"));
    (p3.r16 ?? []).forEach(x => add(x, "Octavos"));
    (p3.r32 ?? []).forEach(x => add(x, "16avos"));

    const byNorm: Record<string, string[]> = {};
    for (const [team, fase] of entries) (byNorm[norm(team)] ??= []).push(`${team} (${fase})`);
    const dups = Object.values(byNorm).filter(v => v.length > 1);
    if (dups.length) out.push({
      nombre: p.nombre,
      repetidos: dups,
      excel: {
        campeon: p3.winner, subcampeon: p3.runnerUp,
        semifinalistas: p3.semis, cuartos: p3.qf, octavos: p3.r16, "16avos": p3.r32,
      },
    });
  }

  return NextResponse.json({ con_repetidos: out.length, participantes: out });
}
