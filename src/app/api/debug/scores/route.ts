import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { MATCHES, FDORG_NAME_TO_CODE } from "@/lib/matches";

export const dynamic = "force-dynamic";

// Debug endpoint: shows what scores are currently saved in the DB
// and compares them against what the football-data.org API returns.
// Visit /api/debug/scores to diagnose sync issues.
export async function GET() {
  // 1. Read current DB state
  const { data, error } = await supabase
    .from("resultados")
    .select("scores, updated_at")
    .eq("id", 1)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const dbScores: ({ h: number; a: number } | null)[] = Array.isArray(data?.scores) ? data.scores : [];

  // 2. Show matches with their DB score and status
  const matches_status = MATCHES.map(([home, away, group, date, time], idx) => ({
    idx,
    home,
    away,
    group,
    date,
    time,
    db_score: dbScores[idx] ? `${dbScores[idx]!.h}-${dbScores[idx]!.a}` : null,
  }));

  // 3. Also fetch from football-data.org if key available
  const key = process.env.FOOTBALLDATA_KEY;
  let api_finished: { home: string; away: string; score: string; status: string }[] = [];
  if (key) {
    const res = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches?season=2026",
      { headers: { "X-Auth-Token": key }, cache: "no-store" }
    );
    if (res.ok) {
      const apiData = await res.json();
      const all = apiData.matches ?? [];
      api_finished = all
        .filter((m: { status: string; stage: string }) => m.status === "FINISHED" && m.stage === "GROUP_STAGE")
        .map((m: { homeTeam: { name: string }; awayTeam: { name: string }; score: { fullTime: { home: number | null; away: number | null } }; status: string }) => {
          const h = FDORG_NAME_TO_CODE[m.homeTeam.name];
          const a = FDORG_NAME_TO_CODE[m.awayTeam.name];
          const idx = h && a ? MATCHES.findIndex(([mh, ma]) => (mh === h && ma === a) || (mh === a && ma === h)) : -1;
          return {
            api_home: m.homeTeam.name,
            api_away: m.awayTeam.name,
            home_code: h ?? "❌",
            away_code: a ?? "❌",
            idx,
            api_score: `${m.score.fullTime.home}-${m.score.fullTime.away}`,
            db_score: idx >= 0 && dbScores[idx] ? `${dbScores[idx]!.h}-${dbScores[idx]!.a}` : null,
            in_sync: idx >= 0 && dbScores[idx] != null,
          };
        });
    }
  }

  return NextResponse.json({
    db_updated_at: data?.updated_at,
    db_scores_length: dbScores.length,
    db_scores_non_null: dbScores.filter(Boolean).length,
    // Show only matches with a DB score
    saved_matches: matches_status.filter(m => m.db_score !== null),
    // Show API finished matches and whether they match DB
    api_finished_count: api_finished.length,
    api_vs_db: api_finished,
  });
}
