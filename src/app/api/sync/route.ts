import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { MATCHES, TEAMS, FDORG_NAME_TO_CODE } from "@/lib/matches";
import type { MatchScore, KnockoutResults } from "@/types";

const BASE = "https://api.football-data.org/v4";

function verifySecret(req: NextRequest): boolean {
  return req.headers.get("x-cron-secret") === process.env.CRON_SECRET;
}

interface FdMatch {
  status: string;
  stage: string;
  homeTeam: { name: string };
  awayTeam: { name: string };
  score: {
    winner: "HOME_TEAM" | "AWAY_TEAM" | "DRAW" | null;
    fullTime: { home: number | null; away: number | null };
  };
}

function teamCode(name: string): string | null {
  return FDORG_NAME_TO_CODE[name] ?? null;
}

// Returns the Spanish display name for a team (as used in participant picks)
function teamName(fdName: string): string {
  const code = teamCode(fdName);
  return code ? TEAMS[code]?.name ?? fdName : fdName;
}

export async function GET(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const key = process.env.FOOTBALLDATA_KEY;
  if (!key) {
    return NextResponse.json({ error: "FOOTBALLDATA_KEY not set" }, { status: 500 });
  }

  try {
    const res = await fetch(`${BASE}/competitions/WC/matches`, {
      headers: { "X-Auth-Token": key },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `API error ${res.status}: ${text}` }, { status: 500 });
    }

    const data = await res.json();
    const matches: FdMatch[] = data.matches ?? [];

    // ── Group stage scores ──────────────────────────────────────────────────
    const scores: (MatchScore | null)[] = Array(72).fill(null);

    MATCHES.forEach(([home, away], idx) => {
      const fix = matches.find(m => {
        if (m.status !== "FINISHED") return false;
        if (m.stage !== "GROUP_STAGE") return false;
        return teamCode(m.homeTeam.name) === home && teamCode(m.awayTeam.name) === away;
      });
      if (fix) {
        scores[idx] = {
          h: fix.score.fullTime.home ?? 0,
          a: fix.score.fullTime.away ?? 0,
        };
      }
    });

    // ── Knockout results ────────────────────────────────────────────────────
    const knockout: KnockoutResults = {
      winner: "", runnerUp: "",
      semis: Array(2).fill(""),
      qf:    Array(4).fill(""),
      r16:   Array(8).fill(""),
      r32:   Array(16).fill(""),
    };

    const finished = matches.filter(m => m.status === "FINISHED" && m.stage !== "GROUP_STAGE" && m.stage !== "THIRD_PLACE");

    const r32losers: string[] = [], r16losers: string[] = [];
    const qfLosers: string[]  = [], sfLosers: string[]  = [];

    for (const m of finished) {
      const { winner } = m.score;
      if (!winner || winner === "DRAW") continue;

      const loser  = teamName(winner === "HOME_TEAM" ? m.awayTeam.name : m.homeTeam.name);
      const champ  = teamName(winner === "HOME_TEAM" ? m.homeTeam.name : m.awayTeam.name);

      switch (m.stage) {
        case "LAST_32":       r32losers.push(loser); break;
        case "LAST_16":       r16losers.push(loser); break;
        case "QUARTER_FINALS":qfLosers.push(loser);  break;
        case "SEMI_FINALS":   sfLosers.push(loser);  break;
        case "FINAL":
          knockout.winner   = champ;
          knockout.runnerUp = loser;
          break;
      }
    }

    knockout.r32  = r32losers.slice(0, 16);
    knockout.r16  = r16losers.slice(0, 8);
    knockout.qf   = qfLosers.slice(0, 4);
    knockout.semis= sfLosers.slice(0, 2);

    // ── Save to Supabase ────────────────────────────────────────────────────
    const { error } = await supabaseAdmin
      .from("resultados")
      .update({ scores, knockout, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      ok: true,
      played: scores.filter(Boolean).length,
      knockout_matches: finished.length,
      synced_at: new Date().toISOString(),
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
