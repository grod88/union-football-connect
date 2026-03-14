/**
 * TodayMatches Page (/jogos-do-dia)
 * Compact league-grouped list with accordion expansion (same pattern as /ao-vivo)
 */
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CalendarDays, Loader2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTodayAllFixtures } from '@/application/hooks/useTodayAllFixtures';
import { useMonitoredLeagues } from '@/application/hooks/useMonitoredLeagues';
import {
  PriorityFilterBar,
  LeagueGroupHeader,
  CompactFixtureRow,
  ExpandedFixturePanel,
  PreMatchDetailPanel,
} from '@/presentation/components/live';
import { isFixtureLive, isFixtureFinished } from '@/core/domain/entities/fixture';
import { useLanguage } from '@/i18n';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import type { LeagueGroup } from '@/application/hooks/useFilteredLiveFixtures';

const TodayMatches = () => {
  const { t, locale } = useLanguage();
  const [searchParams] = useSearchParams();
  const fixtureParam = searchParams.get('fixture');
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS;
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: dateLocale });

  const [expandedFixtureId, setExpandedFixtureId] = useState<number | null>(
    fixtureParam ? parseInt(fixtureParam, 10) : null
  );
  const [collapsedLeagues, setCollapsedLeagues] = useState<Set<number>>(new Set());
  const [visiblePriorities, setVisiblePriorities] = useState<number[]>([1, 2, 3]);
  const expandedRef = useRef<HTMLDivElement>(null);

  const { groupedFixtures, totalCount, isLoading, error, leagues } = useTodayAllFixtures();

  // Filter groups by visible priorities
  const filteredGroups = useMemo(() => {
    const visibleLeagueIds = leagues
      .filter(l => visiblePriorities.includes(l.priority ?? 3))
      .map(l => l.id);
    return groupedFixtures.filter(g => visibleLeagueIds.includes(g.league.id));
  }, [groupedFixtures, leagues, visiblePriorities]);

  // Split into upcoming (not started + live) and finished
  const { upcomingGroups, finishedGroups } = useMemo(() => {
    const upcoming: LeagueGroup[] = [];
    const finished: LeagueGroup[] = [];

    for (const group of filteredGroups) {
      const upFixtures = group.fixtures.filter(f => !isFixtureFinished(f));
      const finFixtures = group.fixtures.filter(f => isFixtureFinished(f));

      if (upFixtures.length > 0) {
        upcoming.push({ ...group, fixtures: upFixtures });
      }
      if (finFixtures.length > 0) {
        finished.push({ ...group, fixtures: finFixtures });
      }
    }

    return { upcomingGroups: upcoming, finishedGroups: finished };
  }, [filteredGroups]);

  const upcomingCount = upcomingGroups.reduce((s, g) => s + g.fixtures.length, 0);
  const finishedCount = finishedGroups.reduce((s, g) => s + g.fixtures.length, 0);
  const filteredCount = upcomingCount + finishedCount;

  // Deep link scroll
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

  const renderFixtureList = (groups: LeagueGroup[], usePreMatch: boolean) =>
    groups.map((group) => {
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
                const live = isFixtureLive(fixture);

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
                        usePreMatch && !live
                          ? <PreMatchDetailPanel fixture={fixture} />
                          : <ExpandedFixturePanel fixture={fixture} />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-2 sm:px-4">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CalendarDays className="h-6 w-6 text-accent" />
              <div>
                <h1 className="font-heading text-2xl sm:text-3xl uppercase gold-text">
                  {t.todayMatches.title}
                </h1>
                <p className="text-xs text-muted-foreground capitalize">{todayFormatted}</p>
              </div>
            </div>
            {totalCount > 0 && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded font-heading">
                {totalCount} jogos
              </span>
            )}
          </div>

          {/* Priority Filter */}
          {totalCount > 0 && (
            <PriorityFilterBar
              visiblePriorities={visiblePriorities}
              onSetPriorities={setVisiblePriorities}
              showAll={() => setVisiblePriorities([1, 2, 3])}
              filteredCount={filteredCount}
              totalLiveCount={totalCount}
            />
          )}

          {/* Loading */}
          {isLoading && (
            <div className="card-surface rounded-xl p-12 flex flex-col items-center justify-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">{t.todayMatches.loading}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="card-surface rounded-xl p-12 flex flex-col items-center justify-center gap-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-muted-foreground">{t.todayMatches.error}</p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && filteredCount === 0 && (
            <div className="card-surface rounded-xl p-12 text-center">
              <CalendarDays className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">{t.todayMatches.noMatches}</p>
            </div>
          )}

          {/* Upcoming / Live block */}
          {!isLoading && upcomingGroups.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-primary" />
                <h2 className="font-heading text-sm uppercase text-primary tracking-wide">
                  Próximos Jogos
                </h2>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded font-heading">
                  {upcomingCount}
                </span>
              </div>
              <div className="space-y-3">
                {renderFixtureList(upcomingGroups, true)}
              </div>
            </div>
          )}

          {/* Finished block */}
          {!isLoading && finishedGroups.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-heading text-sm uppercase text-muted-foreground tracking-wide">
                  Encerrados
                </h2>
                <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded font-heading">
                  {finishedCount}
                </span>
              </div>
              <div className="space-y-3 opacity-90">
                {renderFixtureList(finishedGroups, false)}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TodayMatches;
