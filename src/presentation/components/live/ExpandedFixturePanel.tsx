/**
 * ExpandedFixturePanel Component
 * Inline expanded panel showing fixture details (stats + events)
 * Data is fetched on-demand when expanded
 */
import { Link2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFixture } from '@/application/hooks/useFixture';
import { useFixtureStatistics } from '@/application/hooks/useFixtureStatistics';
import { useFixtureEvents } from '@/application/hooks/useFixtureEvents';
import { StatComparison } from '@/presentation/components/statistics/StatComparison';
import { EventTimeline } from '@/presentation/components/events/EventTimeline';
import { MatchTimer } from '@/presentation/components/match/MatchTimer';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import type { Fixture } from '@/core/domain/entities/fixture';
import { toast } from 'sonner';

interface ExpandedFixturePanelProps {
  fixture: Fixture;
}

export const ExpandedFixturePanel = ({ fixture }: ExpandedFixturePanelProps) => {
  // Fetch detailed data on-demand
  const { data: fullFixture } = useFixture(fixture.id, { autoRefreshWhenLive: true });
  const { data: statistics, isLoading: statsLoading } = useFixtureStatistics(fixture.id);
  const { data: events, isLoading: eventsLoading } = useFixtureEvents(fixture.id);

  const display = fullFixture || fixture;

  const copyLink = () => {
    const url = `${window.location.origin}/ao-vivo?fixture=${fixture.id}`;
    navigator.clipboard.writeText(url);
    toast.success('Link copiado!');
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="overflow-hidden"
    >
      <div className="px-3 sm:px-6 py-4 bg-primary/5 border-b border-border/30">
        {/* Header: badges + score */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 mb-4">
          <div className="flex flex-col items-center gap-1">
            <img
              src={display.homeTeam.logo}
              alt={display.homeTeam.name}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            />
            <span className="text-xs font-heading uppercase text-foreground text-center max-w-[80px] truncate">
              {display.homeTeam.shortName || display.homeTeam.name}
            </span>
          </div>

          <div className="flex flex-col items-center">
            <span className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
              {display.goalsHome ?? 0} - {display.goalsAway ?? 0}
            </span>
            <MatchTimer fixture={display} size="sm" />
          </div>

          <div className="flex flex-col items-center gap-1">
            <img
              src={display.awayTeam.logo}
              alt={display.awayTeam.name}
              className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
            />
            <span className="text-xs font-heading uppercase text-foreground text-center max-w-[80px] truncate">
              {display.awayTeam.shortName || display.awayTeam.name}
            </span>
          </div>
        </div>

        {/* Copy link */}
        <div className="flex justify-center mb-4">
          <button
            onClick={copyLink}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
          >
            <Link2 size={12} />
            Copiar link
          </button>
        </div>

        {/* Stats + Events grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Statistics */}
          <div>
            <h4 className="text-xs font-heading uppercase text-muted-foreground mb-3">
              📊 Estatísticas
            </h4>
            {statsLoading ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner size="sm" />
              </div>
            ) : statistics ? (
              <StatComparison statistics={statistics} maxStats={7} />
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                Estatísticas não disponíveis.
              </p>
            )}
          </div>

          {/* Events */}
          <div>
            <h4 className="text-xs font-heading uppercase text-muted-foreground mb-3">
              ⏱️ Eventos
            </h4>
            {eventsLoading ? (
              <div className="flex justify-center py-6">
                <LoadingSpinner size="sm" />
              </div>
            ) : events && events.length > 0 ? (
              <EventTimeline
                events={events}
                homeTeamId={display.homeTeam.id}
                maxEvents={8}
              />
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                Aguardando eventos...
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
