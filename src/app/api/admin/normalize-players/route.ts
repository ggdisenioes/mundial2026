import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { norm } from "@/lib/scoring";

export const dynamic = "force-dynamic";

// Mapa de normalización de nombres de jugadores → nombre completo canónico.
// La clave es el nombre normalizado (sin tildes ni mayúsculas), así cubre
// cualquier variante de grafía.
const CANON: Record<string, string> = {
  "mbappe": "Kylian Mbappé",
  "kylian mbappe": "Kylian Mbappé",
  "harry kane": "Harry Kane",
  "kane": "Harry Kane",
  "julian alvarez": "Julián Álvarez",
  "oyarzabal": "Mikel Oyarzabal",
  "mikel oyarzabal": "Mikel Oyarzabal",
  "lamine yamal": "Lamine Yamal",
  "ferran torres": "Ferran Torres",
};

interface Picks { p4?: Record<string, string | undefined>; [k: string]: unknown }
interface Row { id: string; nombre: string; picks: Picks }

export async function GET(req: NextRequest) {
  const apply = req.nextUrl.searchParams.get("apply") === "1";

  const { data, error } = await supabaseAdmin
    .from("participantes").select("id, nombre, picks");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const cambios: Record<string, string>[] = [];

  for (const p of (data ?? []) as Row[]) {
    const p4 = p.picks?.p4;
    if (!p4) continue;
    const updates: Record<string, string> = {};

    for (const field of ["goldenBoot", "topEspScorer"] as const) {
      const cur = (p4[field] ?? "").trim();
      if (!cur) continue;
      const canon = CANON[norm(cur)];
      if (canon && canon !== cur) updates[field] = canon;
    }

    if (Object.keys(updates).length === 0) continue;

    const detalle: Record<string, string> = { participante: p.nombre };
    for (const [f, v] of Object.entries(updates)) detalle[f] = `${p4[f]} → ${v}`;
    cambios.push(detalle);

    if (apply) {
      const newPicks = { ...p.picks, p4: { ...p4, ...updates } };
      const { error: ue } = await supabaseAdmin
        .from("participantes").update({ picks: newPicks }).eq("id", p.id);
      if (ue) return NextResponse.json(
        { error: `Error actualizando ${p.nombre}: ${ue.message}`, aplicados_antes_del_error: cambios.length - 1 },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({
    modo: apply ? "✅ APLICADO" : "DRY-RUN (no se tocó nada — agregá ?apply=1 para aplicar)",
    total_cambios: cambios.length,
    cambios,
  });
}
