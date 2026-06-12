export interface TeamAbbr {
  name: string;
  flag: string;
}

export interface MatchScore {
  h: number;
  a: number;
}

export interface KnockoutResults {
  winner: string;
  runnerUp: string;
  semis: string[];
  qf: string[];
  r16: string[];
  r32: string[];
}

export interface BonusResults {
  goldenBoot: string;
  topEspScorer: string;
  topTeamOverride: string;
  mostConcededOverride: string;
}

export interface Results {
  scores: (MatchScore | null)[];
  knockout: KnockoutResults;
  bonus: BonusResults;
  updated_at?: string;
}

export interface ParticipantPicks {
  p1: string[];
  p2: string[];
  p3: {
    winner: string;
    runnerUp: string;
    semis: string[];
    qf: string[];
    r16: string[];
    r32: string[];
  };
  p4: {
    topScorerTeam: string;
    mostConceded: string;
    goldenBoot: string;
    topEspScorer: string;
  };
}

export interface Participant {
  id: string;
  nombre: string;
  picks: ParticipantPicks;
  archivo_path?: string;
  creado?: string;
}

export interface PhaseScore {
  pts: number;
  hits: number;
}

export interface P2Detail {
  pts: number;
  label: "exacto" | "fallo";
}

export interface ScoreBreakdown {
  p1ok: number;
  p1n: number;
  p2detail: (P2Detail | null)[];
  champ: boolean;
  ru: boolean;
  sem: PhaseScore;
  qf: PhaseScore;
  r16: PhaseScore;
  r32: PhaseScore;
  b: boolean[];
}

export interface ParticipantScore {
  p1: number;
  p2: number;
  p3: number;
  p4: number;
  total: number;
  bd: ScoreBreakdown;
}

export interface SyncMeta {
  last_at: string | null;
  ok: boolean | null;
  msg: string;
  played: number;
}

export interface Settings {
  adminPinHash: string;
  syncMeta?: SyncMeta;
}
