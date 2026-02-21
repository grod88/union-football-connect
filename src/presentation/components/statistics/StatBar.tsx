/**
 * StatBar Component
 * Single horizontal comparison bar for a statistic
 */
import { cn } from '@/lib/utils';

interface StatBarProps {
  label: string;
  homeValue: number;
  awayValue: number;
  isPercentage?: boolean;
  className?: string;
  homeColor?: string;
  awayColor?: string;
  variant?: 'default' | 'obs';
}

export const StatBar = ({
  label,
  homeValue,
  awayValue,
  isPercentage = false,
  className,
  homeColor = 'bg-primary',
  awayColor = 'bg-red-500',
  variant = 'default',
}: StatBarProps) => {
  const total = homeValue + awayValue;
  const homePercent = total > 0 ? (homeValue / total) * 100 : 50;
  const awayPercent = total > 0 ? (awayValue / total) * 100 : 50;

  const displayHome = isPercentage ? `${homeValue}%` : homeValue;
  const displayAway = isPercentage ? `${awayValue}%` : awayValue;

  if (variant === 'obs') {
    return (
      <div className={cn('flex flex-col gap-1', className)}>
        <div className="flex justify-between items-center text-sm">
          <span className="font-bold text-white tabular-nums">{displayHome}</span>
          <span className="text-white/80 text-xs uppercase tracking-wider">{label}</span>
          <span className="font-bold text-white tabular-nums">{displayAway}</span>
        </div>
        <div className="flex h-2 rounded-full overflow-hidden bg-white/10">
          <div
            className={cn('transition-all duration-500', homeColor)}
            style={{ width: `${homePercent}%` }}
          />
          <div
            className={cn('transition-all duration-500', awayColor)}
            style={{ width: `${awayPercent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex justify-between items-center">
        <span className="font-bold text-foreground tabular-nums w-12 text-left">
          {displayHome}
        </span>
        <span className="text-muted-foreground text-sm uppercase tracking-wider flex-1 text-center">
          {label}
        </span>
        <span className="font-bold text-foreground tabular-nums w-12 text-right">
          {displayAway}
        </span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        <div
          className={cn('transition-all duration-500 rounded-l-full', homeColor)}
          style={{ width: `${homePercent}%` }}
        />
        <div
          className={cn('transition-all duration-500 rounded-r-full', awayColor)}
          style={{ width: `${awayPercent}%` }}
        />
      </div>
    </div>
  );
};

export default StatBar;
