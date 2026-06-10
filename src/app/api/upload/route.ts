import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { parseWorkbook } from "@/lib/excel-parser";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get("file") as File;
  const nombre = (form.get("nombre") as string)?.trim();

  if (!file || !nombre) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();

  const parsed = parseWorkbook(buffer, nombre);
  if (!parsed.length) {
    return NextResponse.json({ error: 'No se encontró la hoja "Summary"' }, { status: 422 });
  }
  const { picks } = parsed[0];

  const path = `${Date.now()}-${nombre.replace(/\s+/g, "_")}.xlsx`;
  await supabaseAdmin.storage.from("excels").upload(path, Buffer.from(buffer), {
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    upsert: false,
  });

  const { data, error } = await supabaseAdmin
    .from("participantes")
    .upsert({ nombre, picks, archivo_path: path }, { onConflict: "nombre" })
    .select("id, nombre, picks, creado")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ participant: data });
}
