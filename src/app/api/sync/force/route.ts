import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { runSync } from "@/lib/sync";

export const dynamic = "force-dynamic";

// Force sync: bypasses throttle. No PIN needed — equivalent to auto-sync
// but immediate. Only writes scores from the public football-data.org API.
export async function POST() {
  if (!process.env.FOOTBALLDATA_KEY) {
    return NextResponse.json({ ok: false, error: "FOOTBALLDATA_KEY no configurada" }, { status: 500 });
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
