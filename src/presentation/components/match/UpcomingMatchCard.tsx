/**
 * UpcomingMatchCard Component
 * Displays an upcoming match with date/time and calendar button
 */
import { Calendar, Clock } from 'lucide-react';
import { TeamBadge } from './TeamBadge';
import { downloadICSFile } from '@/application/services/calendar.service';
import { formatShortDate, formatInTimezone, TIMEZONES, getRelativeTime } from '@/application/services/timezone.service';
import type { Fixture } from '@/core/domain/entities/fixture';
import { cn } from '@/lib/utils';

interface UpcomingMatchCardProps {
  fixture: Fixture;
  compact?: boolean;
  showCalendarButton?: boolean;
  className?: string;
}

export const UpcomingMatchCard = ({
  fixture,
  compact = false,
  showCalendarButton = true,
  className = '',
}: UpcomingMatchCardProps) => {
  const handleDownloadICS = () => {
    downloadICSFile(fixture);
  };

  const shortDate = formatShortDate(fixture.date);
  const brazilTime = formatInTimezone(fixture.date, TIMEZONES.BRAZIL);
  const relativeTime = getRelativeTime(fixture.date);

  if (compact) {
    return (
      <div
        className={cn(
          'flex items-center gap-4 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors',
          className
        )}
      >
        {/* Date */}
        <div className="flex flex-col items-center min-w-[50px]">
          <span className="text-xs text-muted-foreground">{shortDate}</span>
          <span className="text-sm font-semibold text-primary">{brazilTime}</span>
        </div>

        {/* Teams */}
        <div className="flex-1 flex items-center gap-2">
          <img
            src={fixture.homeTeam.logo}
            alt={fixture.homeTeam.name}
            className="h-6 w-6 object-contain"
          />
          <span className="text-xs text-muted-foreground">vs</span>
          <img
            src={fixture.awayTeam.logo}
            alt={fixture.awayTeam.name}
            className="h-6 w-6 object-contain"
          />
          <span className="text-xs truncate ml-2">
            {fixture.homeTeam.code || fixture.homeTeam.name.slice(0, 3).toUpperCase()} x{' '}
            {fixture.awayTeam.code || fixture.awayTeam.name.slice(0, 3).toUpperCase()}
          </span>
        </div>

        {/* Calendar button */}
        {showCalendarButton && (
          <button
            onClick={handleDownloadICS}
            className="p-2 text-muted-foreground hover:text-primary transition-colors"
            title="Adicionar ao calendário"
          >
            <Calendar size={16} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'card-surface rounded-xl p-4 sm:p-5',
        className
      )}
    >
      {/* Header with league */}
      <div className="flex items-center gap-2 mb-3">
        {fixture.league.logo && (
          <img
            src={fixture.league.logo}
            alt={fixture.league.name}
            className="h-4 w-4 object-contain"
          />
        )}
        <span className="text-xs text-muted-foreground uppercase tracking-wider truncate">
          {fixture.league.name}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <TeamBadge
          team={fixture.homeTeam}
          size="sm"
          namePosition="right"
          className="flex-1"
        />
        <span className="text-primary font-heading text-lg">VS</span>
        <TeamBadge
          team={fixture.awayTeam}
          size="sm"
          namePosition="right"
          className="flex-1 justify-end"
        />
      </div>

      {/* Date and Time */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar size={14} />
            <span>{shortDate}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} className="text-primary" />
            <span className="font-semibold">{brazilTime}</span>
            <span className="text-xs text-muted-foreground">BRT</span>
          </div>
        </div>

        <span className="text-xs text-muted-foreground capitalize">
          {relativeTime}
        </span>
      </div>

      {/* Calendar Button */}
      {showCalendarButton && (
        <button
          onClick={handleDownloadICS}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 border border-primary/30 text-primary font-heading uppercase tracking-wider text-xs px-4 py-2 rounded hover:bg-primary/10 transition-colors"
        >
          <Calendar size={14} />
          Adicionar ao Calendário
        </button>
      )}
    </div>
  );
};

export default UpcomingMatchCard;
