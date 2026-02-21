/**
 * Standings DTOs
 * Data Transfer Objects matching API-Football standings response
 */

export interface StandingsResponseDTO {
  league: {
    id: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
    season: number;
    standings: StandingEntryDTO[][];
  };
}

export interface StandingEntryDTO {
  rank: number;
  team: {
    id: number;
    name: string;
    logo: string;
  };
  points: number;
  goalsDiff: number;
  group: string;
  form: string | null;
  status: string;
  description: string | null;
  all: StandingStatsDTO;
  home: StandingStatsDTO;
  away: StandingStatsDTO;
  update: string;
}

export interface StandingStatsDTO {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: {
    for: number;
    against: number;
  };
}
