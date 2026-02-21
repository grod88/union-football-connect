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
}

export const StatComparison = ({
  statistics,
  className,
  variant = 'default',
  locale = 'pt-BR',
  maxStats,
}: StatComparisonProps) => {
  const statsToShow = maxStats
    ? DISPLAY_STATISTICS.slice(0, maxStats)
    : DISPLAY_STATISTICS;

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
