/**
 * useNextMatch Hook
 * Fetches the next match for a specific team
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import { REFRESH_INTERVALS, TEAMS, LEAGUES, CURRENT_SEASON } from '@/config/constants';
import type { Fixture } from '@/core/domain/entities/fixture';

interface UseNextMatchOptions {
  teamId?: number;
  leagueId?: number;
  season?: number;
  enabled?: boolean;
}

export const useNextMatch = (options: UseNextMatchOptions = {}) => {
  const {
    teamId = TEAMS.SAO_PAULO,
    leagueId = LEAGUES.PAULISTAO,
    season = CURRENT_SEASON,
    enabled = true,
  } = options;

  return useQuery<Fixture | null, Error>({
    queryKey: ['next-match', teamId, leagueId, season],
    queryFn: async () => {
      const fixtures = await footballRepository.getFixturesByTeam(teamId, { next: 1, leagueId, season });
      return fixtures[0] || null;
    },
    enabled,
    refetchInterval: REFRESH_INTERVALS.NEXT_MATCH,
    staleTime: 60_000, // 1 minute
  });
};

// Hook to get multiple upcoming matches
export const useUpcomingMatches = (options: UseNextMatchOptions & { count?: number } = {}) => {
  const {
    teamId = TEAMS.SAO_PAULO,
    count = 5,
    enabled = true,
  } = options;

  return useQuery<Fixture[], Error>({
    queryKey: ['upcoming-matches', teamId, count],
    queryFn: () => footballRepository.getFixturesByTeam(teamId, { next: count }),
    enabled,
    refetchInterval: REFRESH_INTERVALS.NEXT_MATCH,
    staleTime: 60_000,
  });
};
