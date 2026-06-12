import { NextRequest, NextResponse } from "next/server";
import { MATCHES, FDORG_NAME_TO_CODE } from "@/lib/matches";

export const dynamic = "force-dynamic";

function verifySecret(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return (
    req.headers.get("x-cron-secret") === secret ||
    req.headers.get("authorization") === `Bearer ${secret}`
  );
}

export async function GET(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.FOOTBALLDATA_KEY;
  if (!key) return NextResponse.json({ error: "FOOTBALLDATA_KEY not set" }, { status: 500 });

  const res = await fetch("https://api.football-data.org/v4/competitions/WC/matches", {
    headers: { "X-Auth-Token": key },
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    return NextResponse.json({ error: `API ${res.status}: ${await res.text()}` }, { status: 500 });
  }

  const data = await res.json();
  const all = data.matches ?? [];

  const finished = all.filter((m: { status: string; stage: string }) =>
    m.status === "FINISHED" && m.stage === "GROUP_STAGE"
  );

  // Show which finished matches matched an entry in MATCHES and which didn't
  const matched: unknown[] = [];
  const unmatched: unknown[] = [];

  for (const m of finished) {
    const hCode = FDORG_NAME_TO_CODE[m.homeTeam.name] ?? null;
    const aCode = FDORG_NAME_TO_CODE[m.awayTeam.name] ?? null;
    const idx   = MATCHES.findIndex(([h, a]) => h === hCode && a === aCode);
    const entry = {
      api_home: m.homeTeam.name, mapped_home: hCode,
      api_away: m.awayTeam.name, mapped_away: aCode,
      score: `${m.score.fullTime.home}-${m.score.fullTime.away}`,
      match_idx: idx,
    };
    (idx >= 0 ? matched : unmatched).push(entry);
  }

  // Also list any internal MATCHES teams with no mapping
  const allCodes = new Set(Object.values(FDORG_NAME_TO_CODE));
  const unmappedInternal = [...new Set(MATCHES.flatMap(([h, a]) => [h, a]))].filter(c => !allCodes.has(c));

  return NextResponse.json({
    total_api_matches: all.length,
    finished_group_stage: finished.length,
    matched_count: matched.length,
    unmatched_count: unmatched.length,
    matched,
    unmatched,
    unmapped_internal_codes: unmappedInternal,
  });
}
