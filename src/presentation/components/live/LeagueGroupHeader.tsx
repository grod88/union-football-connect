/**
 * LeagueGroupHeader Component
 * Collapsible header for a league group with priority-coded border
 */
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Fixture } from '@/core/domain/entities/fixture';
import type { Tables } from '@/integrations/supabase/types';

type MonitoredLeague = Tables<'monitored_leagues'>;

interface LeagueGroupHeaderProps {
  league: Fixture['league'];
  leagueInfo: MonitoredLeague | undefined;
  fixtureCount: number;
  isCollapsed: boolean;
  onToggle: () => void;
}

const priorityBorderClass = (priority: number | null | undefined) => {
  switch (priority) {
    case 1: return 'border-l-primary';
    case 2: return 'border-l-blue-500';
    default: return 'border-l-muted';
  }
};

export const LeagueGroupHeader = ({
  league,
  leagueInfo,
  fixtureCount,
  isCollapsed,
  onToggle,
}: LeagueGroupHeaderProps) => {
  const flag = leagueInfo?.country_flag || league.country;

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-full flex items-center justify-between px-4 py-2.5',
        'bg-secondary/60 border-l-4 rounded-t-lg',
        'hover:bg-secondary/80 transition-colors cursor-pointer',
        priorityBorderClass(leagueInfo?.priority)
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        {league.logo && (
          <img src={league.logo} alt="" className="w-5 h-5 object-contain" />
        )}
        <span className="text-xs text-muted-foreground">{flag}</span>
        <span className="font-heading text-sm uppercase text-foreground truncate">
          {league.name}
        </span>
        <span className="text-xs text-muted-foreground">({fixtureCount})</span>
      </div>
      <ChevronDown
        size={16}
        className={cn(
          'text-muted-foreground transition-transform flex-shrink-0',
          isCollapsed && '-rotate-90'
        )}
      />
    </button>
  );
};
