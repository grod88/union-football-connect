/**
 * useFixturePlayers Hook
 * Fetches player statistics during a match (ratings, shots, passes, etc.)
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import { topRatedPlayers } from '@/core/domain/entities/player-fixture-stats';
import type { PlayerFixtureStats } from '@/core/domain/entities/player-fixture-stats';

export function useFixturePlayers(fixtureId: number, homeTeamId: number, enabled: boolean = true) {
  const query = useQuery<PlayerFixtureStats[], Error>({
    queryKey: ['fixture-players', fixtureId],
    queryFn: () => footballRepository.getFixturePlayers(fixtureId),
    enabled: enabled && fixtureId > 0,
    staleTime: 60 * 1000,
    refetchInterval: enabled ? 2 * 60 * 1000 : false,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const allPlayers = query.data ?? [];
  const homePlayers = allPlayers.filter(p => p.team.id === homeTeamId);
  const awayPlayers = allPlayers.filter(p => p.team.id !== homeTeamId);

  return {
    allPlayers,
    homePlayers,
    awayPlayers,
    topRatedHome: topRatedPlayers(homePlayers, 3),
    topRatedAway: topRatedPlayers(awayPlayers, 3),
    isLoading: query.isLoading,
    error: query.error,
  };
}
