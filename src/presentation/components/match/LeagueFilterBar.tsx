/**
 * LeagueFilterBar Component
 * Toggle chips for filtering matches by league
 */
import { cn } from '@/lib/utils';
import { useLeagueFilter } from '@/application/hooks/useLeagueFilter';

interface LeagueFilterBarProps {
  className?: string;
  compact?: boolean;
}

const groupLabels: Record<string, { label: string; flag: string }> = {
  brasil: { label: 'Brasil', flag: '🇧🇷' },
  continental: { label: 'Continental', flag: '🌎' },
  europa: { label: 'Europa', flag: '🇪🇺' },
};

export const LeagueFilterBar = ({
  className,
  compact = false,
}: LeagueFilterBarProps) => {
  const {
    availableLeagues,
    selectedLeagueIds,
    toggleLeague,
    selectGroup,
    selectAll,
    clearAll,
    isLeagueSelected,
    groups,
  } = useLeagueFilter();

  return (
    <div className={cn('space-y-2', className)}>
      {/* Group toggles + actions */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {groups.map((group) => {
          const groupLeagues = availableLeagues.filter(l => l.group === group);
          const allSelected = groupLeagues.every(l => selectedLeagueIds.includes(l.id));

          return (
            <button
              key={group}
              onClick={() => selectGroup(group)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap border',
                allSelected
                  ? 'bg-primary/20 border-primary text-primary'
                  : 'bg-secondary/50 border-border text-muted-foreground hover:border-primary/50'
              )}
            >
              {groupLabels[group]?.flag} {groupLabels[group]?.label}
            </button>
          );
        })}

        <div className="ml-auto flex gap-1 shrink-0">
          <button
            onClick={selectAll}
            className="text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1"
          >
            Todos
          </button>
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* Individual league chips */}
      {!compact && (
        <div className="flex flex-wrap gap-1.5">
          {availableLeagues.map((league) => (
            <button
              key={league.id}
              onClick={() => toggleLeague(league.id)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs transition-colors border',
                isLeagueSelected(league.id)
                  ? 'bg-primary/20 border-primary/60 text-primary'
                  : 'bg-secondary/30 border-border text-muted-foreground hover:border-primary/30'
              )}
            >
              {league.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LeagueFilterBar;
