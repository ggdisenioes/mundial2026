import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { runSync, isThrottled } from "@/lib/sync";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.FOOTBALLDATA_KEY) {
    return NextResponse.json({ ok: false, skipped: "no-key" });
  }

  if (await isThrottled()) {
    return NextResponse.json({ ok: true, skipped: "throttled" });
  }

  try {
    const summary = await runSync();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    // Save error to sync_meta so it's visible in the admin panel
    await supabaseAdmin
      .from("settings")
      .update({ sync_meta: { last_at: new Date().toISOString(), ok: false, msg, played: 0 } })
      .eq("id", 1);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
