import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { hashPin } from "@/lib/scoring";
import { runSync } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { pin } = await req.json();
  const { data: set } = await supabase.from("settings").select("admin_pin_hash").single();
  if (set?.admin_pin_hash && hashPin(String(pin)) !== set.admin_pin_hash) {
    return NextResponse.json({ error: "PIN incorrecto" }, { status: 403 });
  }

  try {
    const summary = await runSync();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await supabaseAdmin
      .from("settings")
      .update({ sync_meta: { last_at: new Date().toISOString(), ok: false, msg, played: 0 } })
      .eq("id", 1);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
