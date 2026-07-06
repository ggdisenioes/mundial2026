import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const norm = (s: unknown) => String(s ?? "").trim().toLowerCase();

// Baja el Excel de un participante del storage y vuelca su contenido literal
// (celda por celda, con la etiqueta de columna). Uso: /api/debug/excel?nombre=miguel
export async function GET(req: NextRequest) {
  const nombre = (req.nextUrl.searchParams.get("nombre") ?? "").trim();
  if (!nombre) return NextResponse.json({ error: "falta ?nombre=" }, { status: 400 });

  const { data: p, error: pe } = await supabaseAdmin
    .from("participantes")
    .select("nombre, archivo_path")
    .ilike("nombre", `%${nombre}%`)
    .limit(1)
    .maybeSingle();
  if (pe) return NextResponse.json({ error: pe.message }, { status: 500 });
  if (!p) return NextResponse.json({ error: "participante no encontrado" }, { status: 404 });
  if (!p.archivo_path) return NextResponse.json({ error: `${p.nombre}: no tiene archivo guardado` }, { status: 404 });

  const { data: file, error: fe } = await supabaseAdmin.storage.from("excels").download(p.archivo_path);
  if (fe || !file) return NextResponse.json({ error: fe?.message ?? "no se pudo descargar" }, { status: 500 });

  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });

  for (const sn of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[sn], { header: 1, defval: "", blankrows: false }) as string[][];
    const hIdx = rows.findIndex(r => norm(r[0]).startsWith("participant"));
    if (hIdx < 0) continue;
    const headers = rows[hIdx];
    const dataRow = rows.slice(hIdx + 1).find(r => r.some(c => String(c ?? "").trim() !== "")) ?? [];

    // Volcado literal: por cada columna con valor, {col, etiqueta, valor}.
    const celdas = dataRow
      .map((val, col) => ({ col, etiqueta: String(headers[col] ?? "").trim(), valor: String(val ?? "").trim() }))
      .filter(c => c.valor !== "");

    return NextResponse.json({
      participante: p.nombre,
      archivo: p.archivo_path,
      hoja: sn,
      celdas,
    });
  }

  return NextResponse.json({ error: 'no se encontró la hoja "Summary"', participante: p.nombre }, { status: 422 });
}
