/**
 * PriorityFilterBar Component
 * Toggle buttons to filter live fixtures by league priority
 */
import { cn } from '@/lib/utils';

interface PriorityFilterBarProps {
  visiblePriorities: number[];
  onSetPriorities: (priorities: number[]) => void;
  showAll: () => void;
  filteredCount: number;
  totalLiveCount: number;
}

const FILTER_BUTTONS = [
  { label: '🇧🇷 Brasil + Liberta', priorities: [1], id: 'p1' },
  { label: '🇪🇺 Europa', priorities: [2, 3], id: 'p2p3' },
] as const;

export const PriorityFilterBar = ({
  visiblePriorities,
  onSetPriorities,
  showAll,
  filteredCount,
  totalLiveCount,
}: PriorityFilterBarProps) => {
  const isAllActive = visiblePriorities.includes(1) && visiblePriorities.includes(2) && visiblePriorities.includes(3);

  const handleGroupClick = (groupPriorities: readonly number[]) => {
    const allActive = groupPriorities.every(p => visiblePriorities.includes(p));
    let next: number[];
    if (allActive) {
      // Remove all priorities in this group
      next = visiblePriorities.filter(p => !groupPriorities.includes(p));
    } else {
      // Add all priorities in this group
      next = [...new Set([...visiblePriorities, ...groupPriorities])];
    }
    onSetPriorities(next);
  };

  return (
    <div className="card-surface rounded-xl p-3 sm:p-4 mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {FILTER_BUTTONS.map((btn) => {
          const isActive = btn.priorities.every(p => visiblePriorities.includes(p));
          return (
            <button
              key={btn.id}
              onClick={() => handleGroupClick(btn.priorities)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm border transition-all',
                isActive
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
                  : 'bg-secondary border-border text-muted-foreground hover:border-yellow-500/50'
              )}
            >
              {btn.label}
            </button>
          );
        })}
        <button
          onClick={showAll}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm border transition-all',
            isAllActive
              ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300'
              : 'bg-secondary border-border text-muted-foreground hover:border-yellow-500/50'
          )}
        >
          🌍 Todos
        </button>
      </div>
      <p className="text-xs text-muted-foreground">
        Mostrando {filteredCount} de {totalLiveCount} jogos ao vivo
      </p>
    </div>
  );
};
