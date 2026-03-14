/**
 * useTodayFixtures Hook
 * Fetches all fixtures for today from a specific league
 */
import { useQuery } from '@tanstack/react-query';
import { apiFootballClient } from '@/infrastructure/api-football/client';
import { mapFixturesFromDTO } from '@/infrastructure/api-football/mappers/fixture.mapper';
import { REFRESH_INTERVALS, LEAGUES, CURRENT_SEASON } from '@/config/constants';
import type { FixtureDTO } from '@/infrastructure/api-football/dtos/fixture.dto';
import type { Fixture } from '@/core/domain/entities/fixture';

interface UseTodayFixturesOptions {
  leagueId?: number;
  season?: number;
  enabled?: boolean;
}

export const useTodayFixtures = (options: UseTodayFixturesOptions = {}) => {
  const {
    leagueId = LEAGUES.PAULISTAO,
    season = CURRENT_SEASON,
    enabled = true,
  } = options;

  const today = new Date().toISOString().split('T')[0];

  return useQuery<Fixture[], Error>({
    queryKey: ['today-fixtures', leagueId, season, today],
    queryFn: async () => {
      const response = await apiFootballClient.get<FixtureDTO[]>(
        `/fixtures?league=${leagueId}&season=${season}&date=${today}`
      );
      const fixtures = mapFixturesFromDTO(response.response);
      return fixtures.sort((a, b) => a.timestamp - b.timestamp);
    },
    enabled,
    refetchInterval: REFRESH_INTERVALS.CALENDAR,
    staleTime: 60_000,
  });
};
