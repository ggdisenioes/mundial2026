import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hashPin } from "@/lib/scoring";

export async function GET() {
  const [res, set] = await Promise.all([
    supabase.from("resultados").select("*").single(),
    supabase.from("settings").select("*").single(),
  ]);
  if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 });
  return NextResponse.json({ results: res.data, settings: set.data });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { pin, scores, knockout, bonus, spainMode } = body;

  const { data: set } = await supabase.from("settings").select("admin_pin_hash").single();
  if (set?.admin_pin_hash && hashPin(String(pin)) !== set.admin_pin_hash) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 403 });
  }

  const { error: re } = await supabaseAdmin
    .from("resultados")
    .update({ scores, knockout, bonus, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (re) return NextResponse.json({ error: re.message }, { status: 500 });

  if (spainMode !== undefined) {
    await supabaseAdmin.from("settings").update({ spain_mode: spainMode }).eq("id", 1);
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const { currentPin, newPin } = await req.json();
  const { data: set } = await supabase.from("settings").select("admin_pin_hash").single();

  if (set?.admin_pin_hash && hashPin(String(currentPin)) !== set.admin_pin_hash) {
    return NextResponse.json({ error: "PIN actual incorrecto" }, { status: 403 });
  }
  await supabaseAdmin.from("settings").update({ admin_pin_hash: hashPin(String(newPin)) }).eq("id", 1);
  return NextResponse.json({ ok: true });
}
