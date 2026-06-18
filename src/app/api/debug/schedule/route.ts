import { NextResponse } from "next/server";
import { MATCHES, FDORG_NAME_TO_CODE } from "@/lib/matches";

export const dynamic = "force-dynamic";

// Compares kickoff times from football-data.org (UTC) against what we have
// in MATCHES (CEST = UTC+2). Returns discrepancies and a corrected array.
export async function GET() {
  const key = process.env.FOOTBALLDATA_KEY;
  if (!key) return NextResponse.json({ error: "FOOTBALLDATA_KEY not set" }, { status: 500 });

  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?season=2026",
    { headers: { "X-Auth-Token": key }, cache: "no-store" }
  );
  if (!res.ok) return NextResponse.json({ error: `API ${res.status}` }, { status: 500 });

  const data = await res.json();
  const apiMatches: {
    utcDate: string;
    stage: string;
    homeTeam: { name: string };
    awayTeam: { name: string };
  }[] = data.matches ?? [];

  const groupMatches = apiMatches.filter(m => m.stage === "GROUP_STAGE");

  const comparison = MATCHES.map(([home, away, group, date, time], idx) => {
    const hCode = home;
    const aCode = away;

    const apiMatch = groupMatches.find(m => {
      const h = FDORG_NAME_TO_CODE[m.homeTeam.name];
      const a = FDORG_NAME_TO_CODE[m.awayTeam.name];
      return (h === hCode && a === aCode) || (h === aCode && a === hCode);
    });

    if (!apiMatch) {
      return { idx, home, away, group, our_date: date, our_time: time, api_utc: null, api_cest: null, api_date_cest: null, diff_min: null, ok: false, note: "❌ no encontrado en API" };
    }

    // Parse our time (CEST)
    const [d, mo] = date.split("/").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    // CEST = UTC+2, so UTC = CEST - 2h
    const ourUtc = new Date(Date.UTC(2026, mo - 1, d, hh - 2, mm));

    // Parse API UTC time
    const apiUtc = new Date(apiMatch.utcDate);

    // Convert API UTC to CEST
    const apiCest = new Date(apiUtc.getTime() + 2 * 60 * 60 * 1000);
    const apiCestDate = `${String(apiCest.getUTCDate()).padStart(2,"0")}/${String(apiCest.getUTCMonth()+1).padStart(2,"0")}`;
    const apiCestTime = `${String(apiCest.getUTCHours()).padStart(2,"0")}:${String(apiCest.getUTCMinutes()).padStart(2,"0")}`;

    const diffMin = Math.round((ourUtc.getTime() - apiUtc.getTime()) / 60000);

    return {
      idx, home, away, group,
      our_date: date, our_time: time,
      api_utc: apiMatch.utcDate,
      api_date_cest: apiCestDate,
      api_time_cest: apiCestTime,
      diff_min: diffMin,
      ok: Math.abs(diffMin) < 5,
      note: Math.abs(diffMin) < 5 ? "✅" : `⚠️ diferencia ${diffMin > 0 ? "+" : ""}${diffMin} min`,
    };
  });

  const errors = comparison.filter(c => !c.ok);

  return NextResponse.json({
    total: MATCHES.length,
    errors_count: errors.length,
    errors,
    all: comparison,
  });
}
