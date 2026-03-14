/**
 * Lineup entity
 * Represents team lineups for a match
 */
import type { Team } from './team';

export interface Player {
  id: number;
  name: string;
  number: number;
  pos: string; // G, D, M, F
  grid: string | null; // position on field grid (e.g., "1:1", "2:3")
}

export interface TeamLineup {
  team: Team;
  formation: string; // e.g., "4-3-3", "4-4-2"
  startXI: Player[];
  substitutes: Player[];
  coach: {
    id: number | null;
    name: string;
    photo?: string;
  };
}

export interface FixtureLineups {
  fixtureId: number;
  home: TeamLineup;
  away: TeamLineup;
}

// Factory functions
export const createPlayer = (data: Partial<Player> & { name: string; number: number }): Player => ({
  id: data.id || 0,
  name: data.name,
  number: data.number,
  pos: data.pos || '',
  grid: data.grid ?? null,
});

export const createTeamLineup = (
  data: Partial<TeamLineup> & { team: Team }
): TeamLineup => ({
  team: data.team,
  formation: data.formation || '',
  startXI: data.startXI || [],
  substitutes: data.substitutes || [],
  coach: data.coach || { id: null, name: '' },
});

// Helper functions
export const getPlayersByPosition = (
  lineup: TeamLineup
): { goalkeepers: Player[]; defenders: Player[]; midfielders: Player[]; forwards: Player[] } => {
  const goalkeepers: Player[] = [];
  const defenders: Player[] = [];
  const midfielders: Player[] = [];
  const forwards: Player[] = [];

  lineup.startXI.forEach((player) => {
    switch (player.pos) {
      case 'G':
        goalkeepers.push(player);
        break;
      case 'D':
        defenders.push(player);
        break;
      case 'M':
        midfielders.push(player);
        break;
      case 'F':
        forwards.push(player);
        break;
    }
  });

  return { goalkeepers, defenders, midfielders, forwards };
};

export const parseFormation = (formation: string): number[] => {
  return formation.split('-').map((n) => parseInt(n, 10));
};
