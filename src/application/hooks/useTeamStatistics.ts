/**
 * useTeamStatistics Hook
 * Fetches a team's season statistics for a specific league
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import type { TeamSeasonStats } from '@/core/domain/entities/team-season-stats';

export function useTeamStatistics(
  teamId: number,
  leagueId: number,
  season: number,
  enabled: boolean = true
) {
  const query = useQuery<TeamSeasonStats | null, Error>({
    queryKey: ['team-statistics', teamId, leagueId, season],
    queryFn: () => footballRepository.getTeamStatistics(teamId, leagueId, season),
    enabled: enabled && teamId > 0 && leagueId > 0 && season > 0,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    stats: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
  };
}
