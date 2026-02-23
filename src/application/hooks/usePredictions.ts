/**
 * usePredictions Hook
 * Fetches match predictions from API-Football
 */
import { useQuery } from '@tanstack/react-query';
import { footballRepository } from '@/infrastructure/api-football/repository';
import type { Prediction } from '@/core/domain/entities/prediction';

export function usePredictions(fixtureId: number, enabled: boolean = true) {
  const query = useQuery<Prediction | null, Error>({
    queryKey: ['predictions', fixtureId],
    queryFn: () => footballRepository.getPredictions(fixtureId),
    enabled: enabled && fixtureId > 0,
    staleTime: 60 * 60 * 1000,
    gcTime: 2 * 60 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  return {
    prediction: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
