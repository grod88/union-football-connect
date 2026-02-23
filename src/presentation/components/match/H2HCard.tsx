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
        <div className="flex flex-col items-center gap-1 shrink min-w-0">
          <img src={team1.logo} alt={team1.name} className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain" />
          <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[48px] sm:max-w-[80px] text-center">{team1.name}</span>
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

        <div className="flex flex-col items-center gap-1 shrink min-w-0">
          <img src={team2.logo} alt={team2.name} className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 object-contain" />
          <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[48px] sm:max-w-[80px] text-center">{team2.name}</span>
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
                className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 text-sm"
              >
                <span className="text-xs text-muted-foreground w-12 shrink-0">
                  {formatShortDate(match.date)}
                </span>
                <div className="flex-1 flex items-center justify-end gap-1">
                  <span className={cn(
                    'text-xs truncate max-w-[80px]',
                    homeWon ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}>
                    {match.homeTeam.shortName || match.homeTeam.name}
                  </span>
                  <img src={match.homeTeam.logo} alt="" className="w-4 h-4 object-contain" />
                </div>
                <span className={cn(
                  'font-heading text-sm w-12 text-center',
                  isDraw ? 'text-muted-foreground' : 'text-foreground'
                )}>
                  {homeGoals} - {awayGoals}
                </span>
                <div className="flex-1 flex items-center gap-1">
                  <img src={match.awayTeam.logo} alt="" className="w-4 h-4 object-contain" />
                  <span className={cn(
                    'text-xs truncate max-w-[80px]',
                    !isDraw && !homeWon ? 'text-primary font-semibold' : 'text-muted-foreground'
                  )}>
                    {match.awayTeam.shortName || match.awayTeam.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground italic truncate max-w-[60px] hidden sm:block">
                  {match.league.name}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default H2HCard;
