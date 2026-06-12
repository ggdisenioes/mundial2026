import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabase
    .from("participantes")
    .select("id, nombre, picks, creado")
    .order("nombre", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ participants: data });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const { error } = await supabaseAdmin.from("participantes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
