/**
 * useTodayAllFixtures Hook
 * Fetches all fixtures for today across all monitored leagues,
 * grouped by league in the same LeagueGroup[] format as useFilteredLiveFixtures.
 */
import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { apiFootballClient } from '@/infrastructure/api-football/client';
import { mapFixturesFromDTO } from '@/infrastructure/api-football/mappers/fixture.mapper';
import { useMonitoredLeagues } from './useMonitoredLeagues';
import { CURRENT_SEASON } from '@/config/constants';
import type { FixtureDTO } from '@/infrastructure/api-football/dtos/fixture.dto';
import type { Fixture } from '@/core/domain/entities/fixture';
import type { LeagueGroup } from './useFilteredLiveFixtures';

export function useTodayAllFixtures() {
  const { leagues, allMonitoredIds, isLoading: leaguesLoading } = useMonitoredLeagues();

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const queries = useQueries({
    queries: leagues.map((league) => ({
      queryKey: ['today-fixtures', league.id, league.season, today],
      queryFn: async () => {
        const response = await apiFootballClient.get<FixtureDTO[]>(
          `/fixtures?league=${league.id}&season=${league.season || CURRENT_SEASON}&date=${today}`
        );
        return mapFixturesFromDTO(response.response);
      },
      staleTime: 60_000,
      enabled: leagues.length > 0,
    })),
  });

  const isLoading = leaguesLoading || queries.some(q => q.isLoading);
  const error = queries.find(q => q.error)?.error ?? null;

  const allFixtures = useMemo(() => {
    const fixtures: Fixture[] = [];
    for (const q of queries) {
      if (q.data) fixtures.push(...q.data);
    }
    return fixtures.sort((a, b) => a.timestamp - b.timestamp);
  }, [queries.map(q => q.data)]);

  const groupedFixtures = useMemo(() => {
    const groups: Record<number, LeagueGroup> = {};
    for (const fixture of allFixtures) {
      const lid = fixture.league.id;
      if (!groups[lid]) {
        groups[lid] = {
          league: fixture.league,
          leagueInfo: leagues.find(l => l.id === lid),
          fixtures: [],
        };
      }
      groups[lid].fixtures.push(fixture);
    }
    return Object.values(groups).sort(
      (a, b) => (a.leagueInfo?.priority ?? 99) - (b.leagueInfo?.priority ?? 99),
    );
  }, [allFixtures, leagues]);

  return {
    allFixtures,
    groupedFixtures,
    totalCount: allFixtures.length,
    isLoading,
    error,
    allMonitoredIds,
    leagues,
  };
}
