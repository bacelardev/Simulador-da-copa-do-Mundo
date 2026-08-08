export interface Player {
  id: string;
  name: string;
  position: 'Goleiro' | 'Defensor' | 'Meio-Campista' | 'Atacante';
  number: number;
  club: string;
  rating: number; // 1-99 rating
  isStar?: boolean;
}

export interface NationalTeam {
  id: string;
  name: string;
  code: string; // ISO 3-letter, e.g., BRA, ARG, FRA
  flag: string; // Emoji flag representation
  formation: string; // e.g., '4-3-3', '4-2-3-1'
  ratingAttack: number;
  ratingMidfield: number;
  ratingDefense: number;
  ratingOverall: number;
  players: Player[];
  primaryColor: string; // Tailwind hex or class prefix for visual styling
  secondaryColor: string;
}

export interface ConfrontoDirect {
  teamAId: string;
  teamBId: string;
  matchesPlayed: number;
  winsA: number;
  winsB: number;
  draws: number;
  goalsA: number;
  goalsB: number;
  memorableMatches: {
    year: number;
    stage: string;
    score: string;
    details: string;
  }[];
}

export interface Group {
  letter: string; // A to H
  teams: {
    teamId: string;
    points: number;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    gf: number; // Goals For
    ga: number; // Goals Against
    gd: number; // Goal Difference
  }[];
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'injury' | 'substitution';
  teamId: string;
  playerName: string;
  detail?: string;
}

export interface Match {
  id: string;
  groupLetter?: string; // If Group Stage
  roundLabel?: string; // Or "Oitavas de Final", "Quartas de Final", "Semifinal", "Disputa de 3º Lugar", "Final"
  teamAId: string;
  teamBId: string;
  scoreA?: number;
  scoreB?: number;
  penaltiesA?: number;
  penaltiesB?: number;
  played: boolean;
  events?: MatchEvent[];
  stats?: {
    possessionA: number;
    possessionB: number;
    shotsA: number;
    shotsB: number;
    foulsA: number;
    foulsB: number;
    cornersA: number;
    cornersB: number;
  };
}

export interface TournamentState {
  mode?: 'classic' | 'official';
  groups: Group[];
  groupMatches: Match[];
  currentRound: 'group' | 'r32' | 'oitavas' | 'quartas' | 'semifinal' | 'final_stages';
  r32Matches: Match[];
  oitavasMatches: Match[];
  quartasMatches: Match[];
  semifinalMatches: Match[];
  thirdPlaceMatch: Match | null;
  finalMatch: Match | null;
  championId: string | null;
  runnerUpId: string | null;
  thirdPlaceId: string | null;
}
