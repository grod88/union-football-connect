/**
 * Live Dashboard Page (/ao-vivo)
 * League-grouped list of live fixtures with inline expansion
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Radio, RefreshCw } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LiveBadge } from '@/presentation/components/common/LiveBadge';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import { useFilteredLiveFixtures } from '@/application/hooks/useFilteredLiveFixtures';
import { useLiveFixtures } from '@/application/hooks/useLiveFixtures';
import { useMonitoredLeagues } from '@/application/hooks/useMonitoredLeagues';
import {
  PriorityFilterBar,
  LeagueGroupHeader,
  CompactFixtureRow,
  ExpandedFixturePanel,
  OtherMatchesBanner,
  EmptyLiveState,
} from '@/presentation/components/live';

const LiveDashboard = () => {
  const [searchParams] = useSearchParams();
  const fixtureParam = searchParams.get('fixture');

  const [expandedFixtureId, setExpandedFixtureId] = useState<number | null>(
    fixtureParam ? parseInt(fixtureParam, 10) : null
  );
  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<number>>(new Set());
  const expandedRef = useRef<HTMLDivElement>(null);

  const {
    groupedFixtures,
    filteredCount,
    totalLiveCount,
    hiddenCount,
    visiblePriorities,
    setVisiblePriorities,
    showAll,
    showAllMatches,
    isLoading,
  } = useFilteredLiveFixtures();

  const { data: allLiveFixtures, refetch: refetchLive } = useLiveFixtures();
  const { allMonitoredIds } = useMonitoredLeagues();

  // Deep link: scroll to expanded fixture on mount
  useEffect(() => {
    if (fixtureParam && expandedRef.current) {
      expandedRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [fixtureParam]);

  const handleFixtureClick = useCallback((id: number) => {
    setExpandedFixtureId(prev => (prev === id ? null : id));
  }, []);

  const toggleLeague = useCallback((leagueId: number) => {
    setCollapsedLeagues(prev => {
      const next = new Set(prev);
      if (next.has(leagueId)) next.delete(leagueId);
      else next.add(leagueId);
      return next;
    });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-2 sm:px-4">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Radio className="h-6 w-6 text-accent" />
              <h1 className="font-heading text-2xl sm:text-3xl uppercase gold-text">
                Ao Vivo
              </h1>
              {totalLiveCount > 0 && <LiveBadge size="sm" />}
            </div>
            <button
              onClick={() => refetchLive()}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <RefreshCw size={16} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>

          {/* Priority Filter */}
          {totalLiveCount > 0 && (
            <PriorityFilterBar
              visiblePriorities={visiblePriorities}
              onSetPriorities={setVisiblePriorities}
              showAll={showAll}
              filteredCount={filteredCount}
              totalLiveCount={totalLiveCount}
            />
          )}

          {/* Loading */}
          {isLoading && (
            <div className="card-surface rounded-xl p-12 flex items-center justify-center">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Empty state */}
          {!isLoading && filteredCount === 0 && totalLiveCount === 0 && (
            <EmptyLiveState />
          )}

          {/* League groups */}
          {!isLoading && groupedFixtures.length > 0 && (
            <div className="space-y-3">
              {groupedFixtures.map((group) => {
                const leagueId = group.league.id;
                const isCollapsed = collapsedLeagues.has(leagueId);

                return (
                  <div key={leagueId} className="card-surface rounded-lg overflow-hidden">
                    <LeagueGroupHeader
                      league={group.league}
                      leagueInfo={group.leagueInfo}
                      fixtureCount={group.fixtures.length}
                      isCollapsed={isCollapsed}
                      onToggle={() => toggleLeague(leagueId)}
                    />

                    {!isCollapsed && (
                      <div>
                        {group.fixtures.map((fixture) => {
                          const isExpanded = expandedFixtureId === fixture.id;
                          return (
                            <div
                              key={fixture.id}
                              ref={isExpanded && fixtureParam ? expandedRef : undefined}
                            >
                              <CompactFixtureRow
                                fixture={fixture}
                                isExpanded={isExpanded}
                                onClick={() => handleFixtureClick(fixture.id)}
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
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Filtered out but no monitored matches */}
          {!isLoading && filteredCount === 0 && totalLiveCount > 0 && (
            <div className="card-surface rounded-xl p-8 text-center mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                Nenhum jogo das ligas selecionadas ao vivo agora.
              </p>
              <button
                onClick={showAll}
                className="text-sm text-primary hover:underline"
              >
                Mostrar todos os {totalLiveCount} jogos
              </button>
            </div>
          )}

          {/* Other matches banner — hidden when showAll is active */}
          {!isLoading && hiddenCount > 0 && !showAllMatches && (
            <OtherMatchesBanner
              hiddenCount={hiddenCount}
              allFixtures={allLiveFixtures ?? []}
              monitoredIds={allMonitoredIds}
              expandedFixtureId={expandedFixtureId}
              onFixtureClick={handleFixtureClick}
            />
          )}

          {/* YouTube CTA */}
          {!isLoading && (
            <div className="mt-6 card-surface rounded-xl p-4 border border-accent/30">
              <p className="text-sm text-muted-foreground mb-3">
                Assista às transmissões ao vivo no nosso canal:
              </p>
              <a
                href="https://youtube.com/live/4Xl5Ym1MvHA?feature=share"
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full text-center bg-accent text-accent-foreground font-heading uppercase tracking-wider text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity"
              >
                Abrir YouTube
              </a>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LiveDashboard;
