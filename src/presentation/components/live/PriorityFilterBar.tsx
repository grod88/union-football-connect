/**
 * PriorityFilterBar Component
 * Toggle buttons to filter live fixtures by league priority
 */
import { cn } from '@/lib/utils';

interface PriorityFilterBarProps {
  visiblePriorities: number[];
  togglePriority: (priority: number) => void;
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
  togglePriority,
  showAll,
  filteredCount,
  totalLiveCount,
}: PriorityFilterBarProps) => {
  const isAllActive = visiblePriorities.includes(1) && visiblePriorities.includes(2) && visiblePriorities.includes(3);

  return (
    <div className="card-surface rounded-xl p-3 sm:p-4 mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {FILTER_BUTTONS.map((btn) => {
          const isActive = btn.priorities.every(p => visiblePriorities.includes(p));
          return (
            <button
              key={btn.id}
              onClick={() => btn.priorities.forEach(p => {
                // Toggle all priorities in this group together
                const allActive = btn.priorities.every(pp => visiblePriorities.includes(pp));
                if (allActive) {
                  btn.priorities.forEach(pp => {
                    if (visiblePriorities.includes(pp)) togglePriority(pp);
                  });
                } else {
                  btn.priorities.forEach(pp => {
                    if (!visiblePriorities.includes(pp)) togglePriority(pp);
                  });
                }
              })}
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
