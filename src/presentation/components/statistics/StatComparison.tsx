/**
 * StatComparison Component
 * Full statistics comparison display with multiple bars
 */
import { cn } from '@/lib/utils';
import type { FixtureStatistics } from '@/core/domain/entities/statistic';
import { DISPLAY_STATISTICS } from '@/core/domain/entities/statistic';
import { StatBar } from './StatBar';

interface StatComparisonProps {
  statistics: FixtureStatistics;
  className?: string;
  variant?: 'default' | 'obs';
  locale?: 'pt-BR' | 'en';
  maxStats?: number;
  statsSlice?: { start: number; end: number };
}

export const StatComparison = ({
  statistics,
  className,
  variant = 'default',
  locale = 'pt-BR',
  maxStats,
  statsSlice,
}: StatComparisonProps) => {
  let statsToShow = DISPLAY_STATISTICS;
  if (statsSlice) {
    statsToShow = DISPLAY_STATISTICS.slice(statsSlice.start, statsSlice.end);
  } else if (maxStats) {
    statsToShow = DISPLAY_STATISTICS.slice(0, maxStats);
  }

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {statsToShow.map((stat) => {
        const homeValue = statistics.homeStats[stat.key] as number;
        const awayValue = statistics.awayStats[stat.key] as number;
        const label = locale === 'pt-BR' ? stat.labelPtBr : stat.labelEn;

        return (
          <StatBar
            key={stat.key}
            label={label}
            homeValue={homeValue}
            awayValue={awayValue}
            isPercentage={stat.isPercentage}
            variant={variant}
          />
        );
      })}
    </div>
  );
};

export default StatComparison;
