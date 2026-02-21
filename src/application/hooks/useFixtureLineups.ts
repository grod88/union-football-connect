/**
 * useFixtureLineups Hook
 * Fetches match lineups (formations, starting XI, substitutes)
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import type { FixtureLineups } from '@/core/domain/entities/lineup';

interface UseFixtureLineupsOptions {
  enabled?: boolean;
}

export const useFixtureLineups = (
  fixtureId: number | undefined,
  options: UseFixtureLineupsOptions = {}
) => {
  const { enabled = true } = options;

  return useQuery<FixtureLineups | null, Error>({
    queryKey: ['fixture-lineups', fixtureId],
    queryFn: () => {
      if (!fixtureId) return null;
      return footballRepository.getFixtureLineups(fixtureId);
    },
    enabled: enabled && !!fixtureId,
    staleTime: 300_000, // Lineups don't change often during a match
  });
};
