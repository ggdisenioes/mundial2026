import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import type { Participant } from "@/types";

export const dynamic = "force-dynamic";

// Reemplaza el "Turquía" duplicado de 16avos por "Canadá" en la carga de
// María De Rotaeche. Dry-run por defecto; ?apply=1 para aplicarlo.
export async function GET(req: NextRequest) {
  const apply = req.nextUrl.searchParams.get("apply") === "1";

  const { data, error } = await supabaseAdmin
    .from("participantes")
    .select("id, nombre, picks")
    .ilike("nombre", "%rotaeche%")
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "María no encontrada" }, { status: 404 });

  const p = data as Participant;
  const r32 = [...(p.picks?.p3?.r32 ?? [])];
  const idx = r32.findIndex(t => (t ?? "").trim().toLowerCase() === "turquía".toLowerCase()
                              || (t ?? "").trim().toLowerCase() === "turquia");
  if (idx < 0) return NextResponse.json({ error: "no hay Turquía en 16avos", r32 });

  const antes = r32[idx];
  r32[idx] = "Canadá";
  const newPicks = { ...p.picks, p3: { ...p.picks.p3, r32 } };

  if (!apply) {
    return NextResponse.json({
      modo: "DRY-RUN (agregá ?apply=1 para aplicar)",
      participante: p.nombre,
      cambio: { fase: "16avos", posicion: idx, antes, despues: "Canadá" },
      r32_final: r32,
    });
  }

  const { error: ue } = await supabaseAdmin
    .from("participantes").update({ picks: newPicks }).eq("id", p.id);
  if (ue) return NextResponse.json({ error: ue.message }, { status: 500 });

  return NextResponse.json({
    modo: "✅ APLICADO",
    participante: p.nombre,
    cambio: { fase: "16avos", posicion: idx, antes, despues: "Canadá" },
    r32_final: r32,
  });
}
