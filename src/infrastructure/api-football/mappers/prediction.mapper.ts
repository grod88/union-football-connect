/**
 * Mapper: PredictionResponseDTO → Prediction
 */
import type { Prediction, PredictionComparison } from '@/core/domain/entities/prediction';
import type { PredictionResponseDTO } from '../dtos/prediction.dto';

export function mapPredictionFromDTO(dto: PredictionResponseDTO): Prediction {
  const { predictions, comparison } = dto;

  return {
    winner: {
      teamId: predictions.winner?.id ?? null,
      teamName: predictions.winner?.name ?? null,
      comment: predictions.winner?.comment ?? null,
    },
    percentages: {
      home: predictions.percent?.home ?? '0%',
      draw: predictions.percent?.draw ?? '0%',
      away: predictions.percent?.away ?? '0%',
    },
    winOrDraw: predictions.win_or_draw ?? false,
    underOver: predictions.under_over ?? null,
    goalsHome: predictions.goals?.home ?? null,
    goalsAway: predictions.goals?.away ?? null,
    advice: predictions.advice ?? null,
    comparison: mapComparisonFromDTO(comparison),
  };
}

function mapComparisonFromDTO(dto: PredictionResponseDTO['comparison']): PredictionComparison {
  return {
    form: { home: dto?.form?.home ?? '0%', away: dto?.form?.away ?? '0%' },
    attack: { home: dto?.att?.home ?? '0%', away: dto?.att?.away ?? '0%' },
    defense: { home: dto?.def?.home ?? '0%', away: dto?.def?.away ?? '0%' },
    poissonDistribution: { home: dto?.poisson_distribution?.home ?? '0%', away: dto?.poisson_distribution?.away ?? '0%' },
    headToHead: { home: dto?.h2h?.home ?? '0%', away: dto?.h2h?.away ?? '0%' },
    goals: { home: dto?.goals?.home ?? '0%', away: dto?.goals?.away ?? '0%' },
    total: { home: dto?.total?.home ?? '0%', away: dto?.total?.away ?? '0%' },
  };
}
