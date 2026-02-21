/**
 * useLiveFixtures Hook
 * Fetches all currently live fixtures
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import { REFRESH_INTERVALS } from '@/config/constants';
import type { Fixture } from '@/core/domain/entities/fixture';

interface UseLiveFixturesOptions {
  enabled?: boolean;
  refetchInterval?: number | false;
}

export const useLiveFixtures = (options: UseLiveFixturesOptions = {}) => {
  const {
    enabled = true,
    refetchInterval = REFRESH_INTERVALS.LIVE_FIXTURE,
  } = options;

  return useQuery<Fixture[], Error>({
    queryKey: ['live-fixtures'],
    queryFn: () => footballRepository.getLiveFixtures(),
    enabled,
    refetchInterval,
    staleTime: 10_000,
  });
};
