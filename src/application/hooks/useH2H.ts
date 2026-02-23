/**
 * useH2H Hook
 * Fetches head-to-head matches between two teams
 */
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import type { Fixture } from '@/core/domain/entities/fixture';

interface H2HStats {
  team1Wins: number;
  team2Wins: number;
  draws: number;
  total: number;
}

function calculateStats(matches: Fixture[], team1Id: number): H2HStats {
  let team1Wins = 0;
  let team2Wins = 0;
  let draws = 0;

  for (const match of matches) {
    const home = match.goalsHome ?? 0;
    const away = match.goalsAway ?? 0;

    if (home === away) {
      draws++;
    } else if (
      (match.homeTeam.id === team1Id && home > away) ||
      (match.awayTeam.id === team1Id && away > home)
    ) {
      team1Wins++;
    } else {
      team2Wins++;
    }
  }

  return { team1Wins, team2Wins, draws, total: matches.length };
}

export function useH2H(team1Id: number, team2Id: number, limit: number = 10) {
  const query = useQuery<Fixture[], Error>({
    queryKey: ['h2h', team1Id, team2Id],
    queryFn: () => footballRepository.getHeadToHead(team1Id, team2Id, { last: limit }),
    enabled: team1Id > 0 && team2Id > 0,
    staleTime: 24 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const matches = query.data ?? [];
  const stats = useMemo(() => calculateStats(matches, team1Id), [matches, team1Id]);

  return {
    matches,
    stats,
    isLoading: query.isLoading,
    error: query.error,
  };
}
