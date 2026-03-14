/**
 * Standing entity
 * Represents league standings/table
 */
import type { Team } from './team';

export interface StandingEntry {
  rank: number;
  team: Team;
  points: number;
  goalsDiff: number;
  group?: string;
  form?: string; // e.g., "WWDLW"
  status?: string; // e.g., "same", "up", "down"
  description?: string; // e.g., "Promotion", "Relegation"
  all: StandingStats;
  home: StandingStats;
  away: StandingStats;
}

export interface StandingStats {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface LeagueStandings {
  leagueId: number;
  leagueName: string;
  leagueLogo: string;
  season: number;
  standings: StandingEntry[][];  // Array of groups (for group stage) or single array
}

// Factory functions
export const createStandingStats = (data?: Partial<StandingStats>): StandingStats => ({
  played: data?.played || 0,
  win: data?.win || 0,
  draw: data?.draw || 0,
  lose: data?.lose || 0,
  goalsFor: data?.goalsFor || 0,
  goalsAgainst: data?.goalsAgainst || 0,
});

export const createStandingEntry = (
  data: Partial<StandingEntry> & { rank: number; team: Team }
): StandingEntry => ({
  rank: data.rank,
  team: data.team,
  points: data.points || 0,
  goalsDiff: data.goalsDiff || 0,
  group: data.group,
  form: data.form,
  status: data.status,
  description: data.description,
  all: data.all || createStandingStats(),
  home: data.home || createStandingStats(),
  away: data.away || createStandingStats(),
});

// Helper functions
export const getFormArray = (form: string): ('W' | 'D' | 'L')[] => {
  return form.split('').filter((c): c is 'W' | 'D' | 'L' =>
    ['W', 'D', 'L'].includes(c)
  );
};

export const getFormColor = (result: 'W' | 'D' | 'L'): string => {
  switch (result) {
    case 'W':
      return 'bg-green-500';
    case 'D':
      return 'bg-yellow-500';
    case 'L':
      return 'bg-red-500';
  }
};
