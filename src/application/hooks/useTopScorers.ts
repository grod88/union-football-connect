/**
 * useTopScorers Hook
 * Fetches top scorers or top assisters for a league/season
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import type { TopScorer } from '@/core/domain/entities/top-scorer';

export function useTopScorers(
  leagueId: number,
  season: number,
  type: 'goals' | 'assists' = 'goals',
  limit: number = 10
) {
  const query = useQuery<TopScorer[], Error>({
    queryKey: ['top-scorers', leagueId, season, type],
    queryFn: () =>
      type === 'goals'
        ? footballRepository.getTopScorers(leagueId, season)
        : footballRepository.getTopAssists(leagueId, season),
    enabled: leagueId > 0 && season > 0,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    scorers: (query.data ?? []).slice(0, limit),
    isLoading: query.isLoading,
    error: query.error,
  };
}
