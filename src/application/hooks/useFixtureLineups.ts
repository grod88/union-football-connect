/**
 * useFixtureLineups Hook
 * Fetches match lineups (formations, starting XI, substitutes)
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import { REFRESH_INTERVALS } from '@/config/constants';
import type { FixtureLineups } from '@/core/domain/entities/lineup';

interface UseFixtureLineupsOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export const useFixtureLineups = (
  fixtureId: number | undefined,
  options: UseFixtureLineupsOptions = {}
) => {
  const { enabled = true, refetchInterval = false } = options;

  return useQuery<FixtureLineups | null, Error>({
    queryKey: ['fixture-lineups', fixtureId],
    queryFn: () => {
      if (!fixtureId) return null;
      return footballRepository.getFixtureLineups(fixtureId);
    },
    enabled: enabled && !!fixtureId,
    staleTime: 120_000, // 2 minutes
    refetchInterval,
    refetchIntervalInBackground: !!refetchInterval,
  });
};

// Hook for OBS pages with guaranteed polling
export const useFixtureLineupsForOBS = (fixtureId: number | undefined, enabled: boolean = true) => {
  return useFixtureLineups(fixtureId, {
    enabled,
    refetchInterval: REFRESH_INTERVALS.LIVE_FIXTURE, // 15s
  });
};
