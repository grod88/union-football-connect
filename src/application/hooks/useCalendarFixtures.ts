/**
 * useCalendarFixtures Hook
 * Fetches all fixtures for a league/season for the calendar page
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import { REFRESH_INTERVALS, LEAGUES, CURRENT_SEASON } from '@/config/constants';
import type { Fixture } from '@/core/domain/entities/fixture';
import { isFixtureLive, isFixtureFinished } from '@/core/domain/entities/fixture';

interface UseCalendarFixturesOptions {
  leagueId?: number;
  season?: number;
  enabled?: boolean;
}

export const useCalendarFixtures = (options: UseCalendarFixturesOptions = {}) => {
  const {
    leagueId = LEAGUES.PAULISTAO,
    season = CURRENT_SEASON,
    enabled = true,
  } = options;

  return useQuery<Fixture[], Error>({
    queryKey: ['calendar-fixtures', leagueId, season],
    queryFn: () => footballRepository.getFixturesByLeague(leagueId, season),
    enabled,
    refetchInterval: REFRESH_INTERVALS.CALENDAR,
    staleTime: 60_000,
  });
};

// Filter utilities
export const filterUpcomingFixtures = (fixtures: Fixture[]): Fixture[] => {
  return fixtures
    .filter((f) => !isFixtureFinished(f))
    .sort((a, b) => a.timestamp - b.timestamp);
};

export const filterLiveFixtures = (fixtures: Fixture[]): Fixture[] => {
  return fixtures.filter(isFixtureLive);
};

export const filterFinishedFixtures = (fixtures: Fixture[]): Fixture[] => {
  return fixtures
    .filter(isFixtureFinished)
    .sort((a, b) => b.timestamp - a.timestamp); // Most recent first
};
