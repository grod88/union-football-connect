/**
 * useMonitoredLeagues Hook
 * Fetches active monitored leagues from the database.
 * Data is nearly static — cached for 24 hours.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type MonitoredLeague = Tables<'monitored_leagues'>;

export function useMonitoredLeagues() {
  const query = useQuery<MonitoredLeague[], Error>({
    queryKey: ['monitored-leagues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monitored_leagues')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true });

      if (error) throw error;
      return data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 24h
  });

  const leagues = query.data ?? [];

  const priority1Ids = leagues.filter(l => l.priority === 1).map(l => l.id);
  const priority2Ids = leagues.filter(l => l.priority === 2).map(l => l.id);
  const priority3Ids = leagues.filter(l => l.priority === 3).map(l => l.id);
  const allMonitoredIds = leagues.map(l => l.id);

  return {
    leagues,
    priority1Ids,
    priority2Ids,
    priority3Ids,
    allMonitoredIds,
    isLoading: query.isLoading,
    isLeagueMonitored: (leagueId: number) => allMonitoredIds.includes(leagueId),
    getLeagueInfo: (leagueId: number) => leagues.find(l => l.id === leagueId),
  };
}
