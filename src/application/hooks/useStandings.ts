/**
 * useStandings Hook
 * Fetches league standings/table
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import { REFRESH_INTERVALS, LEAGUES, CURRENT_SEASON } from '@/config/constants';
import type { LeagueStandings } from '@/core/domain/entities/standing';

interface UseStandingsOptions {
  leagueId?: number;
  season?: number;
  enabled?: boolean;
}

export const useStandings = (options: UseStandingsOptions = {}) => {
  const {
    leagueId = LEAGUES.PAULISTAO,
    season = CURRENT_SEASON,
    enabled = true,
  } = options;

  return useQuery<LeagueStandings | null, Error>({
    queryKey: ['standings', leagueId, season],
    queryFn: () => footballRepository.getStandings(leagueId, season),
    enabled,
    refetchInterval: REFRESH_INTERVALS.STANDINGS,
    staleTime: 300_000, // 5 minutes
  });
};
