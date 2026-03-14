/**
 * MatchTimer Component
 * Displays match elapsed time with status
 */
import { cn } from '@/lib/utils';
import type { Fixture } from '@/core/domain/entities/fixture';
import { getElapsedDisplay } from '@/core/domain/entities/fixture';
import { getMatchStatusText, isMatchLive } from '@/core/domain/enums/match-status';

interface MatchTimerProps {
  fixture: Fixture;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-4xl',
};

const statusSizeClasses = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export const MatchTimer = ({
  fixture,
  size = 'md',
  showStatus = true,
  className,
}: MatchTimerProps) => {
  const elapsed = getElapsedDisplay(fixture);
  const statusText = getMatchStatusText(fixture.status);
  const isLive = isMatchLive(fixture.status);

  return (
    <div className={cn('flex flex-col items-center gap-1', className)}>
      {elapsed && (
        <span
          className={cn(
            'font-mono font-bold tabular-nums',
            isLive ? 'text-primary animate-pulse' : 'text-foreground',
            sizeClasses[size]
          )}
        >
          {elapsed}
        </span>
      )}
      {showStatus && (
        <span
          className={cn(
            'uppercase tracking-wider',
            isLive ? 'text-red-500 font-semibold' : 'text-muted-foreground',
            statusSizeClasses[size]
          )}
        >
          {statusText}
        </span>
      )}
    </div>
  );
};

export default MatchTimer;
