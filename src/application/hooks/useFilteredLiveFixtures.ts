/**
 * useFilteredLiveFixtures Hook
 * Combines live fixtures with monitored leagues to provide
 * filtered, grouped, and priority-sorted fixture data.
 */
import { useState, useMemo } from 'react';
import { useLiveFixtures } from './useLiveFixtures';
import { useMonitoredLeagues } from './useMonitoredLeagues';
import type { Fixture } from '@/core/domain/entities/fixture';
import type { Tables } from '@/integrations/supabase/types';

type MonitoredLeague = Tables<'monitored_leagues'>;

export interface LeagueGroup {
  league: Fixture['league'];
  leagueInfo: MonitoredLeague | undefined;
  fixtures: Fixture[];
}

export function useFilteredLiveFixtures() {
  const { data: allLiveFixtures, isLoading: fixturesLoading } = useLiveFixtures();
  const { leagues, isLoading: leaguesLoading } = useMonitoredLeagues();

  // Which priorities are visible — default P1 + P2
  const [visiblePriorities, setVisiblePriorities] = useState<number[]>([1, 2]);

  const visibleLeagueIds = useMemo(
    () => leagues.filter(l => visiblePriorities.includes(l.priority ?? 3)).map(l => l.id),
    [leagues, visiblePriorities],
  );

  const filteredFixtures = useMemo(
    () => (allLiveFixtures ?? []).filter(f => visibleLeagueIds.includes(f.league.id)),
    [allLiveFixtures, visibleLeagueIds],
  );

  const groupedFixtures = useMemo(() => {
    const groups: Record<number, LeagueGroup> = {};
    for (const fixture of filteredFixtures) {
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
  }, [filteredFixtures, leagues]);

  const totalLiveCount = (allLiveFixtures ?? []).length;

  return {
    groupedFixtures,
    filteredFixtures,
    totalLiveCount,
    filteredCount: filteredFixtures.length,
    hiddenCount: totalLiveCount - filteredFixtures.length,
    visiblePriorities,
    setVisiblePriorities,
    togglePriority: (priority: number) =>
      setVisiblePriorities(prev =>
        prev.includes(priority) ? prev.filter(p => p !== priority) : [...prev, priority],
      ),
    showAll: () => setVisiblePriorities([1, 2, 3]),
    showImportant: () => setVisiblePriorities([1, 2]),
    isLoading: fixturesLoading || leaguesLoading,
  };
}
