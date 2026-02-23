/**
 * CompactFixtureRow Component
 * Single compact row for a fixture in the league-grouped list
 */
import { cn } from '@/lib/utils';
import type { Fixture } from '@/core/domain/entities/fixture';
import { getElapsedDisplay } from '@/core/domain/entities/fixture';
import { MatchStatus } from '@/core/domain/enums/match-status';
import { formatInTimezone, TIMEZONES } from '@/application/services/timezone.service';

interface CompactFixtureRowProps {
  fixture: Fixture;
  isExpanded: boolean;
  onClick: () => void;
}

const getStatusBadge = (fixture: Fixture) => {
  switch (fixture.status) {
    case MatchStatus.FIRST_HALF:
      return <span className="text-red-500 text-xs font-medium">1º T</span>;
    case MatchStatus.SECOND_HALF:
      return <span className="text-red-500 text-xs font-medium">2º T</span>;
    case MatchStatus.HALFTIME:
    case MatchStatus.BREAK_TIME:
      return <span className="text-yellow-500 text-xs font-medium">INT</span>;
    case MatchStatus.EXTRA_TIME:
      return <span className="text-red-500 text-xs font-medium">PRR</span>;
    case MatchStatus.PENALTIES:
      return <span className="text-red-500 text-xs font-medium">PÊN</span>;
    case MatchStatus.FINISHED:
    case MatchStatus.FINISHED_AFTER_EXTRA_TIME:
    case MatchStatus.FINISHED_AFTER_PENALTIES:
      return <span className="text-muted-foreground text-xs">FIM</span>;
    case MatchStatus.NOT_STARTED:
    case MatchStatus.TIME_TO_BE_DEFINED:
      return (
        <span className="text-muted-foreground text-xs">
          {formatInTimezone(fixture.date, TIMEZONES.BRAZIL, { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
      );
    default:
      return <span className="text-muted-foreground text-xs">{fixture.status}</span>;
  }
};

const getMinuteDisplay = (fixture: Fixture) => {
  const elapsed = getElapsedDisplay(fixture);
  if (elapsed) return elapsed;
  if (fixture.status === MatchStatus.HALFTIME || fixture.status === MatchStatus.BREAK_TIME) return 'HT';
  return '';
};

export const CompactFixtureRow = ({
  fixture,
  isExpanded,
  onClick,
}: CompactFixtureRowProps) => {
  const hasScore = fixture.goalsHome !== null && fixture.goalsAway !== null;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5',
        'border-b border-border/30 transition-colors text-left',
        isExpanded ? 'bg-primary/5' : 'hover:bg-white/5',
        'cursor-pointer'
      )}
    >
      {/* Minute */}
      <span className="text-xs text-muted-foreground w-10 sm:w-12 text-right tabular-nums flex-shrink-0">
        {getMinuteDisplay(fixture)}
      </span>

      {/* Home team */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
        <span className="text-xs sm:text-sm text-foreground truncate text-right">
          {fixture.homeTeam.shortName || fixture.homeTeam.name}
        </span>
        <img
          src={fixture.homeTeam.logo}
          alt=""
          className="w-4 h-4 sm:w-5 sm:h-5 object-contain flex-shrink-0"
          loading="lazy"
        />
      </div>

      {/* Score */}
      <div className="w-12 sm:w-14 text-center flex-shrink-0">
        {hasScore ? (
          <span className="text-sm font-bold text-foreground tabular-nums">
            {fixture.goalsHome} - {fixture.goalsAway}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">vs</span>
        )}
      </div>

      {/* Away team */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <img
          src={fixture.awayTeam.logo}
          alt=""
          className="w-4 h-4 sm:w-5 sm:h-5 object-contain flex-shrink-0"
          loading="lazy"
        />
        <span className="text-xs sm:text-sm text-foreground truncate">
          {fixture.awayTeam.shortName || fixture.awayTeam.name}
        </span>
      </div>

      {/* Status badge */}
      <div className="w-10 sm:w-12 text-right flex-shrink-0">
        {getStatusBadge(fixture)}
      </div>
    </button>
  );
};
