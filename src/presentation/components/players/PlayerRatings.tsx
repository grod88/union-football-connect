/**
 * PlayerRatings Component
 * Displays top-rated players from a live match
 */
import { Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFixturePlayers } from '@/application/hooks/useFixturePlayers';
import type { PlayerFixtureStats } from '@/core/domain/entities/player-fixture-stats';

interface PlayerRatingsProps {
  fixtureId: number;
  homeTeamId: number;
  homeTeamName: string;
  awayTeamName: string;
  enabled?: boolean;
  className?: string;
}

const getRatingColor = (rating: number | null): string => {
  if (!rating) return 'bg-muted text-muted-foreground';
  if (rating >= 8) return 'bg-primary text-primary-foreground';
  if (rating >= 7) return 'bg-green-600 text-white';
  return 'bg-muted text-muted-foreground';
};

const PlayerRow = ({ player }: { player: PlayerFixtureStats }) => (
  <div className="flex items-center gap-2 p-1.5">
    {player.player.photo ? (
      <img
        src={player.player.photo}
        alt={player.player.name}
        className="w-7 h-7 rounded-full object-cover"
      />
    ) : (
      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
        <User size={12} className="text-muted-foreground" />
      </div>
    )}
    <span className="flex-1 text-sm truncate">{player.player.name}</span>
    {player.games.position && (
      <span className="text-[10px] text-muted-foreground bg-secondary/50 rounded px-1">
        {player.games.position}
      </span>
    )}
    <span className={cn(
      'text-xs font-bold rounded px-1.5 py-0.5',
      getRatingColor(player.games.rating)
    )}>
      {player.games.rating?.toFixed(1) ?? '-'}
    </span>
  </div>
);

export const PlayerRatings = ({
  fixtureId,
  homeTeamId,
  homeTeamName,
  awayTeamName,
  enabled = true,
  className,
}: PlayerRatingsProps) => {
  const { topRatedHome, topRatedAway, isLoading } = useFixturePlayers(fixtureId, homeTeamId, enabled);

  if (isLoading || (topRatedHome.length === 0 && topRatedAway.length === 0)) {
    return null;
  }

  return (
    <div className={cn('card-surface rounded-xl p-4 md:p-6', className)}>
      <div className="flex items-center justify-center gap-2 mb-4">
        <Star size={18} className="text-primary" />
        <h3 className="font-heading text-primary text-lg uppercase tracking-wider">
          Melhores em Campo
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            {homeTeamName}
          </h4>
          <div className="space-y-0.5">
            {topRatedHome.map((p) => <PlayerRow key={p.player.id} player={p} />)}
          </div>
        </div>
        <div>
          <h4 className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            {awayTeamName}
          </h4>
          <div className="space-y-0.5">
            {topRatedAway.map((p) => <PlayerRow key={p.player.id} player={p} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerRatings;
