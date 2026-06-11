import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { runSync } from "@/lib/sync";

export const dynamic = "force-dynamic";

// Public, self-throttled sync. The frontend pings this on page load and on an
// interval; the conditional update below makes sure football-data.org is hit
// at most once per window no matter how many visitors are on the page.
const THROTTLE_MINUTES = 10;

export async function GET() {
  if (!process.env.FOOTBALLDATA_KEY) {
    return NextResponse.json({ ok: false, skipped: "no-key" });
  }

  // Claim the sync slot: bump updated_at only if it's stale. Acts as both
  // throttle and mutex — concurrent visitors race here and only one wins.
  const cutoff = new Date(Date.now() - THROTTLE_MINUTES * 60_000).toISOString();
  const { data: claimed, error: claimErr } = await supabaseAdmin
    .from("resultados")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", 1)
    .lt("updated_at", cutoff)
    .select("id");

  if (claimErr) {
    return NextResponse.json({ ok: false, error: claimErr.message }, { status: 500 });
  }
  if (!claimed?.length) {
    return NextResponse.json({ ok: true, skipped: "throttled" });
  }

  try {
    const summary = await runSync();
    return NextResponse.json({ ok: true, ...summary, synced_at: new Date().toISOString() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
