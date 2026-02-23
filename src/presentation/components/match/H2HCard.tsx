/**
 * H2HCard Component
 * Displays head-to-head record between two teams
 */
import { Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useH2H } from '@/application/hooks/useH2H';
import { isFixtureFinished } from '@/core/domain/entities/fixture';
import { formatShortDate } from '@/application/services/timezone.service';
import { Skeleton } from '@/components/ui/skeleton';

interface H2HCardProps {
  teamId1: number;
  teamId2: number;
  team1: { name: string; logo: string };
  team2: { name: string; logo: string };
  limit?: number;
  className?: string;
}

export const H2HCard = ({
  teamId1,
  teamId2,
  team1,
  team2,
  limit = 10,
  className,
}: H2HCardProps) => {
  const { matches, stats, isLoading } = useH2H(teamId1, teamId2, limit);

  if (isLoading) {
    return (
      <div className={cn('card-surface rounded-xl p-4 md:p-6', className)}>
        <Skeleton className="h-5 w-48 mx-auto mb-6" />
        <Skeleton className="h-16 w-full mb-4" />
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!matches.length) {
    return (
      <div className={cn('card-surface rounded-xl p-4 md:p-6 text-center', className)}>
        <Swords size={24} className="text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">Sem confrontos recentes</p>
      </div>
    );
  }

  return (
    <div className={cn('card-surface rounded-xl p-4 md:p-6 overflow-hidden', className)}>
      {/* Title */}
      <div className="flex items-center justify-center gap-2 mb-6">
        <Swords size={18} className="text-primary" />
        <h3 className="font-heading text-primary text-lg uppercase tracking-wider">
          Confronto Direto
        </h3>
      </div>

      {/* Summary */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-4 md:gap-8 mb-6 min-w-0">
        <div className="shrink-0">
          <img src={team1.logo} alt={team1.name} className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 md:gap-6">
          <div className="text-center">
            <span className="font-heading text-lg sm:text-2xl md:text-3xl text-primary">{stats.team1Wins}</span>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Vitórias</p>
          </div>
          <div className="text-center">
            <span className="font-heading text-lg sm:text-2xl md:text-3xl text-muted-foreground">{stats.draws}</span>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Empates</p>
          </div>
          <div className="text-center">
            <span className="font-heading text-lg sm:text-2xl md:text-3xl text-accent">{stats.team2Wins}</span>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Vitórias</p>
          </div>
        </div>

        <div className="shrink-0">
          <img src={team2.logo} alt={team2.name} className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
        </div>
      </div>

      {/* Match history */}
      <div className="border-t border-border pt-4">
        <h4 className="text-xs text-muted-foreground uppercase tracking-wider text-center mb-3">
          Últimos Confrontos
        </h4>
        <div className="space-y-2">
          {matches.filter(isFixtureFinished).slice(0, 6).map((match) => {
            const homeGoals = match.goalsHome ?? 0;
            const awayGoals = match.goalsAway ?? 0;
            const isDraw = homeGoals === awayGoals;
            const homeWon = homeGoals > awayGoals;

            return (
              <div
                key={match.id}
                className="flex items-center justify-between p-2 rounded-lg bg-secondary/30 text-xs"
              >
                <span className="text-muted-foreground w-10 shrink-0">
                  {formatShortDate(match.date)}
                </span>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    'truncate max-w-[60px] text-right',
                    homeWon ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}>
                    {match.homeTeam.shortName || match.homeTeam.name}
                  </span>
                  <img src={match.homeTeam.logo} alt="" className="w-4 h-4 object-contain shrink-0" />
                  <span className={cn(
                    'font-heading text-sm',
                    homeWon ? 'text-primary' : isDraw ? 'text-muted-foreground' : 'text-foreground'
                  )}>
                    {homeGoals}
                  </span>
                </div>
                <span className="text-muted-foreground">-</span>
                <div className="flex items-center gap-1">
                  <span className={cn(
                    'font-heading text-sm',
                    !isDraw && !homeWon ? 'text-primary' : isDraw ? 'text-muted-foreground' : 'text-foreground'
                  )}>
                    {awayGoals}
                  </span>
                  <img src={match.awayTeam.logo} alt="" className="w-4 h-4 object-contain shrink-0" />
                  <span className={cn(
                    'truncate max-w-[60px]',
                    !isDraw && !homeWon ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}>
                    {match.awayTeam.shortName || match.awayTeam.name}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default H2HCard;
