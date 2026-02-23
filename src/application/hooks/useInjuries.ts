/**
 * useInjuries Hook
 * Fetches injured/suspended players for a fixture
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import { splitInjuriesByTeam } from '@/core/domain/entities/injury';
import type { Injury } from '@/core/domain/entities/injury';

export function useInjuries(fixtureId: number, homeTeamId: number, enabled: boolean = true) {
  const query = useQuery<Injury[], Error>({
    queryKey: ['injuries', fixtureId],
    queryFn: () => footballRepository.getInjuries(fixtureId),
    enabled: enabled && fixtureId > 0,
    staleTime: 4 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const injuries = query.data ?? [];
  const { home, away } = splitInjuriesByTeam(injuries, homeTeamId);

  return {
    injuries,
    homeInjuries: home,
    awayInjuries: away,
    total: injuries.length,
    isLoading: query.isLoading,
    error: query.error,
  };
}
