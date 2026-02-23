/**
 * PredictionWidget Component
 * Displays AI match predictions with probability bars and comparison
 */
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePredictions } from '@/application/hooks/usePredictions';
import { parsePercentage } from '@/core/domain/entities/prediction';
import { Skeleton } from '@/components/ui/skeleton';

interface PredictionWidgetProps {
  fixtureId: number;
  homeTeam: { id: number; name: string; logo: string };
  awayTeam: { id: number; name: string; logo: string };
  className?: string;
}

const comparisonLabels: Record<string, string> = {
  form: 'Forma',
  attack: 'Ataque',
  defense: 'Defesa',
  poissonDistribution: 'Poisson',
  headToHead: 'H2H',
  goals: 'Gols',
  total: 'Total',
};

export const PredictionWidget = ({
  fixtureId,
  homeTeam,
  awayTeam,
  className,
}: PredictionWidgetProps) => {
  const { prediction, isLoading } = usePredictions(fixtureId);

  if (isLoading) {
    return (
      <div className={cn('card-surface rounded-xl p-4 md:p-6', className)}>
        <Skeleton className="h-5 w-48 mx-auto mb-6" />
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-20 w-full mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!prediction) return null;

  const homePercent = parsePercentage(prediction.percentages.home);
  const drawPercent = parsePercentage(prediction.percentages.draw);
  const awayPercent = parsePercentage(prediction.percentages.away);

  const comparisonKeys = ['form', 'attack', 'defense', 'headToHead', 'goals'] as const;

  return (
    <div className={cn('card-surface rounded-xl p-4 md:p-6', className)}>
      {/* Title */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Sparkles size={18} className="text-primary" />
        <h3 className="font-heading text-primary text-lg uppercase tracking-wider">
          Predição do Jogo
        </h3>
      </div>

      {/* Probability bars */}
      <div className="flex items-center gap-3 mb-2">
        <img src={homeTeam.logo} alt={homeTeam.name} className="w-8 h-8 md:w-10 md:h-10 object-contain" />
        <div className="flex-1">
          <div className="flex items-center text-xs md:text-sm mb-1">
            <span className="font-bold text-primary w-10">{prediction.percentages.home}</span>
            <div className="flex-1" />
            <span className="text-muted-foreground">{prediction.percentages.draw}</span>
            <div className="flex-1" />
            <span className="font-bold text-accent w-10 text-right">{prediction.percentages.away}</span>
          </div>
          <div className="flex h-3 rounded-full overflow-hidden bg-muted">
            <motion.div
              className="bg-primary rounded-l-full"
              initial={{ width: 0 }}
              animate={{ width: `${homePercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
            <motion.div
              className="bg-muted-foreground/40"
              initial={{ width: 0 }}
              animate={{ width: `${drawPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            />
            <motion.div
              className="bg-accent rounded-r-full"
              initial={{ width: 0 }}
              animate={{ width: `${awayPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
            />
          </div>
        </div>
        <img src={awayTeam.logo} alt={awayTeam.name} className="w-8 h-8 md:w-10 md:h-10 object-contain" />
      </div>

      <p className="text-center text-xs text-muted-foreground mb-4">
        {prediction.percentages.draw} Empate
      </p>

      {/* Advice */}
      {prediction.advice && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 mb-6">
          <p className="text-primary/90 italic text-center text-sm">
            💡 {prediction.advice}
          </p>
        </div>
      )}

      {/* Comparison bars */}
      <div className="space-y-3">
        <h4 className="text-xs text-muted-foreground uppercase tracking-wider text-center mb-2">
          Comparação
        </h4>
        {comparisonKeys.map((key) => {
          const comparison = prediction.comparison[key];
          const homeVal = parsePercentage(comparison.home);
          const awayVal = parsePercentage(comparison.away);

          return (
            <div key={key} className="flex items-center gap-2">
              <span className="text-xs text-foreground tabular-nums w-8 text-right">{comparison.home}</span>
              <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-muted">
                <motion.div
                  className="bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${homeVal}%` }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-16 text-center">{comparisonLabels[key]}</span>
              <div className="flex-1 flex h-2 rounded-full overflow-hidden bg-muted justify-end">
                <motion.div
                  className="bg-accent"
                  initial={{ width: 0 }}
                  animate={{ width: `${awayVal}%` }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                />
              </div>
              <span className="text-xs text-foreground tabular-nums w-8">{comparison.away}</span>
            </div>
          );
        })}
      </div>

      {/* Under/Over */}
      {(prediction.underOver || prediction.goalsHome || prediction.goalsAway) && (
        <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
          {prediction.underOver && (
            <span className="text-xs text-muted-foreground">
              U/O: <span className="text-foreground font-semibold">{prediction.underOver}</span>
            </span>
          )}
          {prediction.goalsHome && (
            <span className="text-xs text-muted-foreground">
              Casa: <span className="text-foreground font-semibold">{prediction.goalsHome}</span>
            </span>
          )}
          {prediction.goalsAway && (
            <span className="text-xs text-muted-foreground">
              Fora: <span className="text-foreground font-semibold">{prediction.goalsAway}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PredictionWidget;
