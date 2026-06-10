import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { MATCHES, API_NAME_TO_CODE } from "@/lib/matches";
import type { MatchScore, KnockoutResults } from "@/types";

const LEAGUE_ID = 1;
const SEASON = 2026;

function verifySecret(req: NextRequest): boolean {
  const secret = req.headers.get("x-cron-secret");
  return secret === process.env.CRON_SECRET;
}

interface ApiFixture {
  fixture: { id: number; status: { short: string } };
  league: { round: string };
  teams: { home: { name: string }; away: { name: string } };
  goals: { home: number | null; away: number | null };
  score: { penalty?: { home: number | null; away: number | null } };
}

const TEAMS_BY_APIFOOTBALL_NAME: Record<string, string> = {
  "Mexico": "México", "South Africa": "Sudáfrica", "Korea Republic": "Corea del Sur",
  "Czech Republic": "Rep. Checa", "Canada": "Canadá", "Bosnia and Herzegovina": "Bosnia",
  "Qatar": "Catar", "Switzerland": "Suiza", "Brazil": "Brasil", "Morocco": "Marruecos",
  "Haiti": "Haití", "Scotland": "Escocia", "United States": "Estados Unidos",
  "Paraguay": "Paraguay", "Australia": "Australia", "Turkey": "Turquía",
  "Germany": "Alemania", "Curacao": "Curazao", "Ivory Coast": "C. de Marfil", "Ecuador": "Ecuador",
  "Netherlands": "Países Bajos", "Japan": "Japón", "Sweden": "Suecia", "Tunisia": "Túnez",
  "Belgium": "Bélgica", "Egypt": "Egipto", "Iran": "Irán", "New Zealand": "Nueva Zelanda",
  "Spain": "España", "Cape Verde": "Cabo Verde", "Saudi Arabia": "Arabia Saudí", "Uruguay": "Uruguay",
  "France": "Francia", "Senegal": "Senegal", "Iraq": "Irak", "Norway": "Noruega",
  "Argentina": "Argentina", "Algeria": "Argelia", "Austria": "Austria", "Jordan": "Jordania",
  "Portugal": "Portugal", "Congo DR": "Congo", "Uzbekistan": "Uzbekistán", "Colombia": "Colombia",
  "England": "Inglaterra", "Croatia": "Croacia", "Ghana": "Ghana", "Panama": "Panamá",
};

export async function GET(req: NextRequest) {
  if (!verifySecret(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `https://v3.football.api-sports.io/fixtures?league=${LEAGUE_ID}&season=${SEASON}`,
      {
        headers: { "x-apisports-key": process.env.APIFOOTBALL_KEY! },
        next: { revalidate: 0 },
      }
    );
    const json = await res.json();
    const fixtures = json.response as ApiFixture[];

    const scores: (MatchScore | null)[] = Array(72).fill(null);
    MATCHES.forEach(([home, away], idx) => {
      const fix = fixtures.find(f => {
        const fh = API_NAME_TO_CODE[f.teams.home.name];
        const fa = API_NAME_TO_CODE[f.teams.away.name];
        return fh === home && fa === away && f.fixture.status.short === "FT";
      });
      if (fix) scores[idx] = { h: fix.goals.home ?? 0, a: fix.goals.away ?? 0 };
    });

    const knockout: Partial<KnockoutResults> = {
      winner: "", runnerUp: "",
      semis: ["", ""], qf: ["", "", "", ""],
      r16: Array(8).fill(""), r32: Array(16).fill(""),
    };

    const getLoser = (f: ApiFixture): string | null => {
      if (f.fixture.status.short !== "FT") return null;
      const h = f.goals.home ?? 0, a = f.goals.away ?? 0;
      if (h === a) return null;
      const loserTeam = h > a ? f.teams.away.name : f.teams.home.name;
      return TEAMS_BY_APIFOOTBALL_NAME[loserTeam] || loserTeam;
    };
    const getWinner = (f: ApiFixture): string | null => {
      if (f.fixture.status.short !== "FT") return null;
      const h = f.goals.home ?? 0, a = f.goals.away ?? 0;
      const winnerTeam = h >= a ? f.teams.home.name : f.teams.away.name;
      return TEAMS_BY_APIFOOTBALL_NAME[winnerTeam] || winnerTeam;
    };

    const r32Fixtures = fixtures.filter(f => f.league.round.includes("Round of 32"));
    knockout.r32 = r32Fixtures.map(getLoser).filter(Boolean).slice(0, 16) as string[];

    const r16Fixtures = fixtures.filter(f => f.league.round.includes("Round of 16"));
    knockout.r16 = r16Fixtures.map(getLoser).filter(Boolean).slice(0, 8) as string[];

    const qfFixtures = fixtures.filter(f => f.league.round.toLowerCase().includes("quarter"));
    knockout.qf = qfFixtures.map(getLoser).filter(Boolean).slice(0, 4) as string[];

    const sfFixtures = fixtures.filter(f => f.league.round.toLowerCase().includes("semi"));
    knockout.semis = sfFixtures.map(getLoser).filter(Boolean).slice(0, 2) as string[];

    const finalFix = fixtures.find(f => f.league.round.toLowerCase().includes("final") && !f.league.round.toLowerCase().includes("semi"));
    if (finalFix && finalFix.fixture.status.short === "FT") {
      knockout.winner = getWinner(finalFix) || "";
      knockout.runnerUp = getLoser(finalFix) || "";
    }

    const { error } = await supabaseAdmin
      .from("resultados")
      .update({ scores, knockout, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      ok: true,
      played: scores.filter(Boolean).length,
      synced_at: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
