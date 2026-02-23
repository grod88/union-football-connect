/**
 * TopScorersTable Component
 * Displays top scorers or top assisters for a league
 */
import { User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTopScorers } from '@/application/hooks/useTopScorers';
import { Skeleton } from '@/components/ui/skeleton';

interface TopScorersTableProps {
  leagueId: number;
  season: number;
  type?: 'goals' | 'assists';
  limit?: number;
  className?: string;
}

export const TopScorersTable = ({
  leagueId,
  season,
  type = 'goals',
  limit = 10,
  className,
}: TopScorersTableProps) => {
  const { scorers, isLoading } = useTopScorers(leagueId, season, type, limit);

  if (isLoading) {
    return (
      <div className={cn('card-surface rounded-xl p-4', className)}>
        <Skeleton className="h-5 w-40 mx-auto mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full mb-1" />
        ))}
      </div>
    );
  }

  if (!scorers.length) {
    return (
      <div className={cn('card-surface rounded-xl p-6 text-center', className)}>
        <p className="text-muted-foreground text-sm">Dados não disponíveis para esta competição</p>
      </div>
    );
  }

  const title = type === 'goals' ? 'Artilharia' : 'Assistências';
  const icon = type === 'goals' ? '⚽' : '🅰️';

  return (
    <div className={cn('card-surface rounded-xl overflow-hidden', className)}>
      <div className="p-4 pb-2">
        <h3 className="font-heading text-primary text-sm uppercase tracking-wider text-center">
          {icon} {title}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
              <th className="py-2 px-2 text-center w-8">#</th>
              <th className="py-2 px-2 text-left">Jogador</th>
              <th className="py-2 px-2 text-left hidden sm:table-cell">Time</th>
              <th className="py-2 px-2 text-center w-10">⚽</th>
              <th className="py-2 px-2 text-center w-10">🅰️</th>
            </tr>
          </thead>
          <tbody>
            {scorers.map((scorer, index) => (
              <tr
                key={scorer.player.id}
                className={cn(
                  'border-b border-border/50 hover:bg-secondary/30 transition-colors',
                  index % 2 === 0 && 'bg-secondary/10'
                )}
              >
                <td className={cn(
                  'py-2 px-2 text-center font-bold text-xs',
                  index === 0 && 'text-primary'
                )}>
                  {index + 1}
                </td>
                <td className="py-2 px-2">
                  <div className="flex items-center gap-2">
                    {scorer.player.photo ? (
                      <img
                        src={scorer.player.photo}
                        alt={scorer.player.name}
                        className="w-7 h-7 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
                        <User size={12} className="text-muted-foreground" />
                      </div>
                    )}
                    <span className={cn(
                      'truncate max-w-[120px] text-xs sm:text-sm',
                      index === 0 && 'text-primary font-bold'
                    )}>
                      {scorer.player.name}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-2 hidden sm:table-cell">
                  <div className="flex items-center gap-1.5">
                    {scorer.statistics.team.logo && (
                      <img
                        src={scorer.statistics.team.logo}
                        alt=""
                        className="w-4 h-4 object-contain"
                      />
                    )}
                    <span className="text-xs text-muted-foreground truncate max-w-[80px]">
                      {scorer.statistics.team.name}
                    </span>
                  </div>
                </td>
                <td className={cn(
                  'py-2 px-2 text-center font-bold',
                  index === 0 && 'text-primary'
                )}>
                  {scorer.statistics.goals.total ?? 0}
                </td>
                <td className="py-2 px-2 text-center text-muted-foreground">
                  {scorer.statistics.goals.assists ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopScorersTable;
