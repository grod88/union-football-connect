/**
 * StandingsTable Component
 * Displays league standings with form indicators and zone colors
 */
import { cn } from '@/lib/utils';
import { useStandings } from '@/application/hooks/useStandings';
import { getFormArray, getFormColor } from '@/core/domain/entities/standing';
import type { StandingEntry } from '@/core/domain/entities/standing';
import { Skeleton } from '@/components/ui/skeleton';

interface StandingsTableProps {
  leagueId: number;
  season: number;
  highlightTeamIds?: number[];
  compact?: boolean;
  maxRows?: number;
  className?: string;
}

const getZoneClass = (rank: number, total: number): string => {
  if (rank <= 4) return 'border-l-2 border-l-green-500';
  if (rank > total - 4) return 'border-l-2 border-l-destructive';
  return 'border-l-2 border-l-transparent';
};

export const StandingsTable = ({
  leagueId,
  season,
  highlightTeamIds = [],
  compact = false,
  maxRows,
  className,
}: StandingsTableProps) => {
  const { data: standings, isLoading } = useStandings({ leagueId, season });

  if (isLoading) {
    return (
      <div className={cn('card-surface rounded-xl p-4', className)}>
        <Skeleton className="h-5 w-48 mx-auto mb-4" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full mb-1" />
        ))}
      </div>
    );
  }

  if (!standings || !standings.standings[0]?.length) {
    return null;
  }

  const allEntries = standings.standings[0];
  const total = allEntries.length;

  let entries: (StandingEntry | 'separator')[] = [...allEntries];
  if (compact && maxRows && total > maxRows) {
    const topCount = Math.ceil(maxRows / 2);
    const bottomCount = Math.floor(maxRows / 2);
    entries = [
      ...allEntries.slice(0, topCount),
      'separator',
      ...allEntries.slice(total - bottomCount),
    ];
  } else if (maxRows) {
    entries = allEntries.slice(0, maxRows);
  }

  return (
    <div className={cn('card-surface rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 pb-2">
        {standings.leagueLogo && (
          <img src={standings.leagueLogo} alt="" className="w-5 h-5 object-contain" />
        )}
        <h3 className="font-heading text-primary text-sm uppercase tracking-wider">
          {standings.leagueName}
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50 text-muted-foreground text-xs uppercase tracking-wider">
              <th className="py-2 px-2 text-center w-8">#</th>
              <th className="py-2 px-2 text-left">Time</th>
              <th className="py-2 px-2 text-center w-8">P</th>
              <th className="py-2 px-2 text-center w-8">J</th>
              <th className="py-2 px-2 text-center w-8 hidden sm:table-cell">V</th>
              <th className="py-2 px-2 text-center w-8 hidden sm:table-cell">E</th>
              <th className="py-2 px-2 text-center w-8 hidden sm:table-cell">D</th>
              <th className="py-2 px-2 text-center w-8 hidden sm:table-cell">GP</th>
              <th className="py-2 px-2 text-center w-10">SG</th>
              <th className="py-2 px-2 text-center w-20 hidden md:table-cell">Forma</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry, i) => {
              if (entry === 'separator') {
                return (
                  <tr key="sep" className="border-b border-border">
                    <td colSpan={10} className="py-1 text-center text-muted-foreground text-xs">
                      ···
                    </td>
                  </tr>
                );
              }

              const isHighlighted = highlightTeamIds.includes(entry.team.id);

              return (
                <tr
                  key={entry.team.id}
                  className={cn(
                    'border-b border-border/50 hover:bg-secondary/30 transition-colors',
                    getZoneClass(entry.rank, total),
                    isHighlighted && 'bg-primary/5'
                  )}
                >
                  <td className="py-2 px-2 text-center font-bold text-xs">{entry.rank}</td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={entry.team.logo}
                        alt={entry.team.name}
                        className="w-5 h-5 object-contain"
                      />
                      <span className={cn(
                        'truncate max-w-[100px] sm:max-w-[160px] text-xs sm:text-sm',
                        isHighlighted && 'text-primary font-semibold'
                      )}>
                        {entry.team.shortName || entry.team.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-primary">{entry.points}</td>
                  <td className="py-2 px-2 text-center text-muted-foreground">{entry.all.played}</td>
                  <td className="py-2 px-2 text-center text-muted-foreground hidden sm:table-cell">{entry.all.win}</td>
                  <td className="py-2 px-2 text-center text-muted-foreground hidden sm:table-cell">{entry.all.draw}</td>
                  <td className="py-2 px-2 text-center text-muted-foreground hidden sm:table-cell">{entry.all.lose}</td>
                  <td className="py-2 px-2 text-center text-muted-foreground hidden sm:table-cell">{entry.all.goalsFor}</td>
                  <td className={cn(
                    'py-2 px-2 text-center font-semibold',
                    entry.goalsDiff > 0 ? 'text-primary' : entry.goalsDiff < 0 ? 'text-destructive' : 'text-muted-foreground'
                  )}>
                    {entry.goalsDiff > 0 ? `+${entry.goalsDiff}` : entry.goalsDiff}
                  </td>
                  <td className="py-2 px-2 hidden md:table-cell">
                    {entry.form && (
                      <div className="flex items-center justify-center gap-0.5">
                        {getFormArray(entry.form).slice(-5).map((r, j) => (
                          <span
                            key={j}
                            className={cn('w-4 h-4 rounded-full inline-flex items-center justify-center text-[8px] font-bold text-white', getFormColor(r))}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StandingsTable;
