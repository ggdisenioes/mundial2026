import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

// Lista los nombres de JUGADORES cargados por los participantes en los bonus
// (Bota de Oro y Goleador de España), agrupados y con quién los puso, para
// poder normalizarlos a nombre completo.
interface Row { nombre: string; picks: { p4?: { goldenBoot?: string; topEspScorer?: string } } }

export async function GET() {
  const { data, error } = await supabase.from("participantes").select("nombre, picks");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const gb: Record<string, string[]> = {};
  const te: Record<string, string[]> = {};
  for (const p of (data ?? []) as Row[]) {
    const g = (p.picks?.p4?.goldenBoot ?? "").trim();
    const e = (p.picks?.p4?.topEspScorer ?? "").trim();
    if (g) (gb[g] ??= []).push(p.nombre);
    if (e) (te[e] ??= []).push(p.nombre);
  }
  const fmt = (o: Record<string, string[]>) =>
    Object.entries(o)
      .map(([name, who]) => ({ name, count: who.length, who }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return NextResponse.json({
    total_participantes: data?.length ?? 0,
    bota_de_oro: fmt(gb),
    goleador_espana: fmt(te),
  });
}
