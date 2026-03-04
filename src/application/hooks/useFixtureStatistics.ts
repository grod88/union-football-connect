/**
 * useFixtureStatistics Hook
 * Fetches match statistics with polling support
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import { REFRESH_INTERVALS } from '@/config/constants';
import type { FixtureStatistics } from '@/core/domain/entities/statistic';

interface UseFixtureStatisticsOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export const useFixtureStatistics = (
  fixtureId: number | undefined,
  options: UseFixtureStatisticsOptions = {}
) => {
  const {
    enabled = true,
    refetchInterval = false,
  } = options;

  return useQuery<FixtureStatistics | null, Error>({
    queryKey: ['fixture-statistics', fixtureId],
    queryFn: () => {
      if (!fixtureId) return null;
      return footballRepository.getFixtureStatistics(fixtureId);
    },
    enabled: enabled && !!fixtureId,
    refetchInterval,
    refetchIntervalInBackground: !!refetchInterval,
    staleTime: 15_000,
  });
};

// Hook for OBS pages with guaranteed polling
export const useFixtureStatisticsForOBS = (fixtureId: number | undefined) => {
  return useFixtureStatistics(fixtureId, {
    refetchInterval: REFRESH_INTERVALS.STATISTICS,
  });
};
