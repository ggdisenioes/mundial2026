import { NextResponse } from "next/server";
import { MATCHES, FDORG_NAME_TO_CODE } from "@/lib/matches";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.FOOTBALLDATA_KEY;
  if (!key) return NextResponse.json({ error: "FOOTBALLDATA_KEY not set" }, { status: 500 });

  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?season=2026",
    { headers: { "X-Auth-Token": key }, next: { revalidate: 0 } }
  );
  if (!res.ok) return NextResponse.json({ error: `API ${res.status}` }, { status: 500 });

  const data = await res.json();
  const all: { status: string; stage: string; homeTeam: { name: string }; awayTeam: { name: string }; score: { fullTime: { home: number | null; away: number | null } } }[] = data.matches ?? [];

  const finished = all.filter(m => m.status === "FINISHED" && m.stage === "GROUP_STAGE");
  const recent   = all.filter(m => m.stage === "GROUP_STAGE").slice(-10);

  const unmatched = finished.filter(m => {
    const h = FDORG_NAME_TO_CODE[m.homeTeam.name];
    const a = FDORG_NAME_TO_CODE[m.awayTeam.name];
    if (!h || !a) return true;
    return MATCHES.findIndex(([mh, ma]) => (mh === h && ma === a) || (mh === a && ma === h)) < 0;
  });

  return NextResponse.json({
    total: all.length,
    finished_group: finished.length,
    unmatched_finished: unmatched.map(m => ({
      home: m.homeTeam.name,
      away: m.awayTeam.name,
      score: `${m.score.fullTime.home}-${m.score.fullTime.away}`,
      home_mapped: FDORG_NAME_TO_CODE[m.homeTeam.name] ?? "❌ NO MAP",
      away_mapped: FDORG_NAME_TO_CODE[m.awayTeam.name] ?? "❌ NO MAP",
    })),
    recent_group_matches: recent.map(m => ({
      status: m.status,
      home: m.homeTeam.name,
      away: m.awayTeam.name,
      home_mapped: FDORG_NAME_TO_CODE[m.homeTeam.name] ?? "❌ NO MAP",
      away_mapped: FDORG_NAME_TO_CODE[m.awayTeam.name] ?? "❌ NO MAP",
    })),
  });
}
