/**
 * OtherMatchesBanner Component
 * Shows count of hidden fixtures from non-monitored leagues
 */
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Fixture } from '@/core/domain/entities/fixture';
import { AnimatePresence } from 'framer-motion';
import { CompactFixtureRow } from './CompactFixtureRow';
import { ExpandedFixturePanel } from './ExpandedFixturePanel';

interface OtherMatchesBannerProps {
  hiddenCount: number;
  allFixtures: Fixture[];
  monitoredIds: number[];
  expandedFixtureId: number | null;
  onFixtureClick: (id: number) => void;
}

export const OtherMatchesBanner = ({
  hiddenCount,
  allFixtures,
  monitoredIds,
  expandedFixtureId,
  onFixtureClick,
}: OtherMatchesBannerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (hiddenCount <= 0) return null;

  const otherFixtures = allFixtures.filter(f => !monitoredIds.includes(f.league.id));

  // Group by league
  const grouped: Record<number, { league: Fixture['league']; fixtures: Fixture[] }> = {};
  for (const f of otherFixtures) {
    if (!grouped[f.league.id]) {
      grouped[f.league.id] = { league: f.league, fixtures: [] };
    }
    grouped[f.league.id].fixtures.push(f);
  }

  return (
    <div className="mt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3',
          'card-surface rounded-xl border border-border/50',
          'hover:border-primary/30 transition-colors'
        )}
      >
        <span className="text-sm text-muted-foreground">
          📋 +{hiddenCount} jogos de outras ligas
        </span>
        <ChevronDown
          size={16}
          className={cn(
            'text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="mt-2 space-y-3">
          {Object.values(grouped).map((group) => (
            <div key={group.league.id} className="card-surface rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-secondary/40 border-l-4 border-l-muted">
                {group.league.logo && (
                  <img src={group.league.logo} alt="" className="w-4 h-4 object-contain" />
                )}
                <span className="text-xs font-heading uppercase text-muted-foreground">
                  {group.league.name}
                </span>
              </div>
              {group.fixtures.map((fixture) => {
                const isExpanded = expandedFixtureId === fixture.id;
                return (
                  <div key={fixture.id}>
                    <CompactFixtureRow
                      fixture={fixture}
                      isExpanded={isExpanded}
                      onClick={() => onFixtureClick(fixture.id)}
                    />
                    <AnimatePresence>
                      {isExpanded && (
                        <ExpandedFixturePanel fixture={fixture} />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
