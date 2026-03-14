/**
 * useCalendarFixtures Hook
 * Fetches fixtures for a specific date (YYYY-MM-DD) and filters only scheduled ones
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import { REFRESH_INTERVALS } from '@/config/constants';
import { MatchStatus } from '@/core/domain/enums';
import type { Fixture } from '@/core/domain/entities/fixture';

export const useCalendarFixtures = (date: string) => {
  return useQuery<Fixture[], Error>({
    queryKey: ['calendar-fixtures', date],
    queryFn: async () => {
      const fixtures = await footballRepository.getFixturesByDate(date);
      // Only scheduled (not started) fixtures
      return fixtures
        .filter((f) => f.status === MatchStatus.NOT_STARTED || f.status === MatchStatus.TIME_TO_BE_DEFINED)
        .sort((a, b) => a.timestamp - b.timestamp);
    },
    enabled: !!date,
    refetchInterval: REFRESH_INTERVALS.CALENDAR,
    staleTime: 60_000,
  });
};
