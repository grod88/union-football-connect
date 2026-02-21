/**
 * useFixture Hook
 * Fetches fixture data by ID with optional polling for live updates
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import { REFRESH_INTERVALS } from '@/config/constants';
import type { Fixture } from '@/core/domain/entities/fixture';
import { isFixtureLive } from '@/core/domain/entities/fixture';

interface UseFixtureOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
  autoRefreshWhenLive?: boolean;
}

export const useFixture = (
  fixtureId: number | undefined,
  options: UseFixtureOptions = {}
) => {
  const {
    enabled = true,
    refetchInterval,
    autoRefreshWhenLive = true,
  } = options;

  return useQuery<Fixture | null, Error>({
    queryKey: ['fixture', fixtureId],
    queryFn: () => {
      if (!fixtureId) return null;
      return footballRepository.getFixtureById(fixtureId);
    },
    enabled: enabled && !!fixtureId,
    refetchInterval: (query) => {
      if (refetchInterval !== undefined) return refetchInterval;

      // Auto-refresh when match is live
      if (autoRefreshWhenLive && query.state.data && isFixtureLive(query.state.data)) {
        return REFRESH_INTERVALS.LIVE_FIXTURE;
      }

      return false;
    },
    staleTime: 10_000, // Consider data stale after 10 seconds
  });
};

// Hook for OBS pages with guaranteed polling
export const useFixtureForOBS = (fixtureId: number | undefined) => {
  return useFixture(fixtureId, {
    refetchInterval: REFRESH_INTERVALS.LIVE_FIXTURE,
    autoRefreshWhenLive: false,
  });
};
