/**
 * useFixtureEvents Hook
 * Fetches match events (goals, cards, substitutions) with polling support
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import { REFRESH_INTERVALS } from '@/config/constants';
import type { FixtureEvent } from '@/core/domain/entities/event';

interface UseFixtureEventsOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export const useFixtureEvents = (
  fixtureId: number | undefined,
  options: UseFixtureEventsOptions = {}
) => {
  const {
    enabled = true,
    refetchInterval = false,
  } = options;

  return useQuery<FixtureEvent[], Error>({
    queryKey: ['fixture-events', fixtureId],
    queryFn: () => {
      if (!fixtureId) return [];
      return footballRepository.getFixtureEvents(fixtureId);
    },
    enabled: enabled && !!fixtureId,
    refetchInterval,
    refetchIntervalInBackground: !!refetchInterval,
    staleTime: 10_000,
  });
};

// Hook for OBS pages with guaranteed polling
export const useFixtureEventsForOBS = (fixtureId: number | undefined) => {
  return useFixtureEvents(fixtureId, {
    refetchInterval: REFRESH_INTERVALS.EVENTS,
  });
};
