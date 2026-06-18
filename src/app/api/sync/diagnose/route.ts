import { NextResponse } from "next/server";
import { MATCHES, FDORG_NAME_TO_CODE } from "@/lib/matches";

export const dynamic = "force-dynamic";

export async function GET() {
  const key = process.env.FOOTBALLDATA_KEY;
  if (!key) return NextResponse.json({ error: "FOOTBALLDATA_KEY not set" }, { status: 500 });

  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?season=2026",
    { headers: { "X-Auth-Token": key }, cache: "no-store" }
  );
  if (!res.ok) return NextResponse.json({ error: `API ${res.status}` }, { status: 500 });

  const data = await res.json();
  const all: { status: string; stage: string; homeTeam: { name: string }; awayTeam: { name: string }; score: { fullTime: { home: number | null; away: number | null } } }[] = data.matches ?? [];

  const finished = all.filter(m => (m.status === "FINISHED" || m.status === "AWARDED") && m.stage === "GROUP_STAGE");

  const unmatched = finished.filter(m => {
    const h = FDORG_NAME_TO_CODE[m.homeTeam.name];
    const a = FDORG_NAME_TO_CODE[m.awayTeam.name];
    if (!h || !a) return true;
    return MATCHES.findIndex(([mh, ma]) => (mh === h && ma === a) || (mh === a && ma === h)) < 0;
  });

  // Show the computed score for every finished group match
  const matched_scores = finished
    .filter(m => !unmatched.includes(m))
    .map(m => {
      const h = FDORG_NAME_TO_CODE[m.homeTeam.name]!;
      const a = FDORG_NAME_TO_CODE[m.awayTeam.name]!;
      const idx = MATCHES.findIndex(([mh, ma]) => (mh === h && ma === a) || (mh === a && ma === h));
      const [mh] = MATCHES[idx];
      const normalOrder = mh === h;
      return {
        idx,
        home_code: h,
        away_code: a,
        api_home: m.homeTeam.name,
        api_away: m.awayTeam.name,
        score: normalOrder
          ? `${m.score.fullTime.home}-${m.score.fullTime.away}`
          : `${m.score.fullTime.away}-${m.score.fullTime.home}`,
      };
    })
    .sort((a, b) => a.idx - b.idx);

  // Show ALL group stage matches that are NOT finished (to debug stuck matches)
  const not_finished_group = all
    .filter(m => m.stage === "GROUP_STAGE" && m.status !== "FINISHED")
    .map(m => ({
      status: m.status,
      home: m.homeTeam.name,
      away: m.awayTeam.name,
      home_mapped: FDORG_NAME_TO_CODE[m.homeTeam.name] ?? "❌",
      away_mapped: FDORG_NAME_TO_CODE[m.awayTeam.name] ?? "❌",
      fullTime: m.score.fullTime,
    }));

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
    not_finished_group,
    matched_scores,
  });
}
