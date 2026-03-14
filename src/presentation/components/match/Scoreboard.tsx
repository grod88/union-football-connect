/**
 * Scoreboard Component
 * Main scoreboard display with teams and score
 */
import { cn } from '@/lib/utils';
import type { Fixture } from '@/core/domain/entities/fixture';
import { isFixtureLive } from '@/core/domain/entities/fixture';
import { TeamBadge } from './TeamBadge';
import { MatchTimer } from './MatchTimer';
import { LiveBadge } from '../common/LiveBadge';

interface ScoreboardProps {
  fixture: Fixture;
  size?: 'sm' | 'md' | 'lg';
  showTimer?: boolean;
  showLiveBadge?: boolean;
  className?: string;
  variant?: 'default' | 'compact' | 'obs';
}

const scoreSizeClasses = {
  sm: 'text-3xl',
  md: 'text-5xl',
  lg: 'text-7xl',
};

const teamSizeMap = {
  sm: 'sm' as const,
  md: 'lg' as const,
  lg: 'xl' as const,
};

export const Scoreboard = ({
  fixture,
  size = 'md',
  showTimer = true,
  showLiveBadge = true,
  className,
  variant = 'default',
}: ScoreboardProps) => {
  const isLive = isFixtureLive(fixture);
  const homeScore = fixture.goalsHome ?? '-';
  const awayScore = fixture.goalsAway ?? '-';

  if (variant === 'obs') {
    return (
      <div className={cn('flex items-center justify-center gap-4', className)}>
        <TeamBadge
          team={fixture.homeTeam}
          size={teamSizeMap[size]}
          showName={false}
        />
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'font-heading font-bold tabular-nums text-white',
                scoreSizeClasses[size]
              )}
            >
              {homeScore}
            </span>
            <span className={cn('font-heading text-primary', scoreSizeClasses[size])}>
              -
            </span>
            <span
              className={cn(
                'font-heading font-bold tabular-nums text-white',
                scoreSizeClasses[size]
              )}
            >
              {awayScore}
            </span>
          </div>
          {showTimer && <MatchTimer fixture={fixture} size={size} />}
        </div>
        <TeamBadge
          team={fixture.awayTeam}
          size={teamSizeMap[size]}
          showName={false}
        />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      {showLiveBadge && isLive && <LiveBadge size={size} />}

      <div className="flex items-center justify-center gap-6 sm:gap-12">
        <TeamBadge team={fixture.homeTeam} size={teamSizeMap[size]} />

        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-4">
            <span
              className={cn(
                'font-heading font-bold tabular-nums gold-text',
                scoreSizeClasses[size]
              )}
            >
              {homeScore}
            </span>
            <span
              className={cn(
                'font-heading text-muted-foreground',
                size === 'lg' ? 'text-4xl' : size === 'md' ? 'text-3xl' : 'text-xl'
              )}
            >
              -
            </span>
            <span
              className={cn(
                'font-heading font-bold tabular-nums gold-text',
                scoreSizeClasses[size]
              )}
            >
              {awayScore}
            </span>
          </div>
          {showTimer && <MatchTimer fixture={fixture} size={size} />}
        </div>

        <TeamBadge team={fixture.awayTeam} size={teamSizeMap[size]} />
      </div>
    </div>
  );
};

export default Scoreboard;
