/**
 * LiveMatchCard Component
 * Displays a live match with score and real-time updates
 */
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { TeamBadge } from './TeamBadge';
import { LiveBadge } from '../common/LiveBadge';
import { MatchTimer } from './MatchTimer';
import type { Fixture } from '@/core/domain/entities/fixture';
import { isFixtureLive } from '@/core/domain/entities/fixture';
import { cn } from '@/lib/utils';

interface LiveMatchCardProps {
  fixture: Fixture;
  showActions?: boolean;
  youtubeLink?: string;
  className?: string;
}

export const LiveMatchCard = ({
  fixture,
  showActions = true,
  youtubeLink = 'https://youtube.com/@UnionFootballLive',
  className = '',
}: LiveMatchCardProps) => {
  const isLive = isFixtureLive(fixture);

  return (
    <div
      className={cn(
        'card-surface rounded-xl p-4 sm:p-6',
        isLive && 'red-glow border border-accent/30',
        className
      )}
    >
      {/* Header with league and live badge */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {fixture.league.logo && (
            <img
              src={fixture.league.logo}
              alt={fixture.league.name}
              className="h-5 w-5 object-contain"
            />
          )}
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            {fixture.league.name}
          </span>
        </div>
        {isLive && <LiveBadge />}
      </div>

      {/* Teams and Score */}
      <div className="flex items-center justify-between gap-4 mb-4">
        {/* Home Team */}
        <div className="flex-1 flex items-center gap-3">
          <TeamBadge team={fixture.homeTeam} size="md" showName={false} />
          <div className="flex flex-col">
            <span className="font-heading text-sm sm:text-base uppercase truncate max-w-[120px]">
              {fixture.homeTeam.name}
            </span>
            {fixture.homeTeam.code && (
              <span className="text-xs text-muted-foreground">
                {fixture.homeTeam.code}
              </span>
            )}
          </div>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <span className="font-heading text-3xl sm:text-4xl">
              {fixture.goalsHome ?? '-'}
            </span>
            <span className="font-heading text-xl sm:text-2xl text-muted-foreground">:</span>
            <span className="font-heading text-3xl sm:text-4xl">
              {fixture.goalsAway ?? '-'}
            </span>
          </div>
          {isLive && (
            <MatchTimer
              fixture={fixture}
              size="sm"
              className="mt-1"
            />
          )}
        </div>

        {/* Away Team */}
        <div className="flex-1 flex items-center justify-end gap-3">
          <div className="flex flex-col items-end">
            <span className="font-heading text-sm sm:text-base uppercase truncate max-w-[120px] text-right">
              {fixture.awayTeam.name}
            </span>
            {fixture.awayTeam.code && (
              <span className="text-xs text-muted-foreground">
                {fixture.awayTeam.code}
              </span>
            )}
          </div>
          <TeamBadge team={fixture.awayTeam} size="md" showName={false} />
        </div>
      </div>

      {/* Venue */}
      {fixture.venue && (
        <div className="text-center text-xs text-muted-foreground mb-4">
          {fixture.venue.name}{fixture.venue.city && `, ${fixture.venue.city}`}
        </div>
      )}

      {/* Actions */}
      {showActions && isLive && (
        <div className="flex items-center justify-center gap-3 pt-2 border-t border-border">
          <a
            href={youtubeLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-heading uppercase tracking-wider text-xs px-4 py-2 rounded hover:opacity-90 transition-opacity"
          >
            <ExternalLink size={14} />
            Assistir Agora
          </a>
          <Link
            to={`/ao-vivo?fixture=${fixture.id}`}
            className="inline-flex items-center gap-2 border border-primary/30 text-primary font-heading uppercase tracking-wider text-xs px-4 py-2 rounded hover:bg-primary/10 transition-colors"
          >
            Ver Detalhes
          </Link>
        </div>
      )}
    </div>
  );
};

export default LiveMatchCard;
