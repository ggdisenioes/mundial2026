import { NextResponse } from "next/server";
import { MATCHES, FDORG_NAME_TO_CODE } from "@/lib/matches";

export const dynamic = "force-dynamic";

// Returns the full corrected MATCHES array with CEST times from football-data.org.
// Visit /api/debug/matches-corrected to get the fixed code ready to paste.
export async function GET() {
  const key = process.env.FOOTBALLDATA_KEY;
  if (!key) return NextResponse.json({ error: "FOOTBALLDATA_KEY not set" }, { status: 500 });

  const res = await fetch(
    "https://api.football-data.org/v4/competitions/WC/matches?season=2026",
    { headers: { "X-Auth-Token": key }, cache: "no-store" }
  );
  if (!res.ok) return NextResponse.json({ error: `API ${res.status}` }, { status: 500 });

  const data = await res.json();
  const apiMatches: { utcDate: string; stage: string; homeTeam: { name: string }; awayTeam: { name: string } }[] =
    data.matches ?? [];

  const groupMatches = apiMatches.filter(m => m.stage === "GROUP_STAGE");

  const corrected: { idx: number; line: string; changed: boolean; our: string; api_cest: string }[] = [];
  const notFound: { idx: number; home: string; away: string }[] = [];

  for (let idx = 0; idx < MATCHES.length; idx++) {
    const [home, away, group] = MATCHES[idx];
    const [ourDate, ourTime] = [MATCHES[idx][3], MATCHES[idx][4]];

    const apiMatch = groupMatches.find(m => {
      const h = FDORG_NAME_TO_CODE[m.homeTeam.name];
      const a = FDORG_NAME_TO_CODE[m.awayTeam.name];
      return (h === home && a === away) || (h === away && a === home);
    });

    if (!apiMatch) {
      notFound.push({ idx, home, away });
      corrected.push({ idx, line: `  ["${home}","${away}","${group}","${ourDate}","${ourTime}"],`, changed: false, our: `${ourDate} ${ourTime}`, api_cest: "❌ NOT FOUND" });
      continue;
    }

    // Convert UTC to CEST (UTC+2)
    const utc = new Date(apiMatch.utcDate);
    const cest = new Date(utc.getTime() + 2 * 60 * 60 * 1000);
    const dd = String(cest.getUTCDate()).padStart(2, "0");
    const mo = String(cest.getUTCMonth() + 1).padStart(2, "0");
    const hh = String(cest.getUTCHours()).padStart(2, "0");
    const mm = String(cest.getUTCMinutes()).padStart(2, "0");
    const apiDate = `${dd}/${mo}`;
    const apiTime = `${hh}:${mm}`;

    const changed = apiDate !== ourDate || apiTime !== ourTime;
    corrected.push({
      idx,
      line: `  ["${home}","${away}","${group}","${apiDate}","${apiTime}"],`,
      changed,
      our: `${ourDate} ${ourTime}`,
      api_cest: `${apiDate} ${apiTime}`,
    });
  }

  const changes = corrected.filter(c => c.changed);
  const codeLines = corrected.map(c => c.line).join("\n");

  return NextResponse.json({
    total_matches: MATCHES.length,
    changes_count: changes.length,
    not_found_count: notFound.length,
    changes,
    not_found: notFound,
    corrected_code: `export const MATCHES: [string, string, string, string, string][] = [\n${codeLines}\n];`,
  }, { headers: { "Content-Type": "application/json" } });
}
