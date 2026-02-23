/**
 * Live Dashboard Page (/ao-vivo)
 * Shows live fixtures with real-time updates, stats, and events
 */
import { useSearchParams, Link } from 'react-router-dom';
import { Radio, BarChart3, Clock, RefreshCw, ChevronRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import { LiveBadge } from '@/presentation/components/common/LiveBadge';
import { Scoreboard } from '@/presentation/components/match/Scoreboard';
import { StatComparison } from '@/presentation/components/statistics/StatComparison';
import { EventTimeline } from '@/presentation/components/events/EventTimeline';
import { LiveMatchCard } from '@/presentation/components/match/LiveMatchCard';
import { PlayerRatings } from '@/presentation/components/players/PlayerRatings';
import { TeamBadge } from '@/presentation/components/match/TeamBadge';
import { useFixture } from '@/application/hooks/useFixture';
import { useFixtureStatistics } from '@/application/hooks/useFixtureStatistics';
import { useFixtureEvents } from '@/application/hooks/useFixtureEvents';
import { useLiveFixtures } from '@/application/hooks/useLiveFixtures';
import { useNextMatch } from '@/application/hooks/useNextMatch';
import { isFixtureLive } from '@/core/domain/entities/fixture';
import { getMatchTimezones } from '@/application/services/timezone.service';
import { ROUTES } from '@/config/routes';

const LiveDashboard = () => {
  const [searchParams] = useSearchParams();
  const fixtureIdParam = searchParams.get('fixture');
  const fixtureId = fixtureIdParam ? parseInt(fixtureIdParam, 10) : undefined;

  // Fetch all live fixtures for sidebar
  const {
    data: liveFixtures,
    isLoading: isLoadingLive,
    refetch: refetchLive,
  } = useLiveFixtures();

  // Auto-detect: if no fixture param, use first live fixture
  const autoFixtureId = !fixtureId && liveFixtures?.length ? liveFixtures[0].id : fixtureId;

  // Fetch selected fixture details
  const {
    data: selectedFixture,
    isLoading: isLoadingFixture,
  } = useFixture(autoFixtureId, { autoRefreshWhenLive: true });

  // Fetch stats and events for selected fixture
  const { data: statistics } = useFixtureStatistics(autoFixtureId);
  const { data: events } = useFixtureEvents(autoFixtureId);

  // Next match (for when no live games)
  const { data: nextMatch } = useNextMatch();

  const displayFixture = selectedFixture;
  const isLive = displayFixture ? isFixtureLive(displayFixture) : false;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Radio className="h-6 w-6 text-accent" />
              <h1 className="font-heading text-2xl sm:text-3xl uppercase gold-text">
                Ao Vivo
              </h1>
              {liveFixtures && liveFixtures.length > 0 && (
                <LiveBadge size="sm" />
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Pre-match link */}
              {displayFixture && (
                <Link
                  to={`/pre-jogo/${displayFixture.id}`}
                  className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  📊 Pré-Jogo
                  <ChevronRight size={12} />
                </Link>
              )}
              <button
                onClick={() => refetchLive()}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <RefreshCw size={16} />
                Atualizar
              </button>
            </div>
          </div>

          {/* Main content grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main content area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Loading state */}
              {(isLoadingLive || isLoadingFixture) && (
                <div className="card-surface rounded-xl p-12 flex items-center justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              )}

              {/* No live matches & no fixture selected */}
              {!isLoadingLive && (!liveFixtures || liveFixtures.length === 0) && !fixtureId && (
                <div className="card-surface rounded-xl p-12 text-center">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h2 className="font-heading text-xl mb-4">
                    Nenhum jogo ao vivo no momento
                  </h2>

                  {/* Next match */}
                  {nextMatch && (
                    <div className="mt-6 p-4 bg-secondary/30 rounded-xl inline-block">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">Próximo jogo</p>
                      <div className="flex items-center gap-4 mb-3">
                        <TeamBadge team={nextMatch.homeTeam} size="sm" />
                        <span className="text-muted-foreground font-heading">VS</span>
                        <TeamBadge team={nextMatch.awayTeam} size="sm" />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {nextMatch.league.name}
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 mb-3">
                        {getMatchTimezones(nextMatch.date).slice(0, 2).map((tz) => (
                          <span key={tz.label} className="text-xs text-muted-foreground">
                            {tz.flag} {tz.time}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <Link
                          to={`/pre-jogo/${nextMatch.id}`}
                          className="text-xs bg-primary/20 text-primary px-3 py-1.5 rounded-lg hover:bg-primary/30 transition-colors"
                        >
                          Ver Pré-Jogo
                        </Link>
                        <Link
                          to={ROUTES.CALENDAR}
                          className="text-xs border border-border text-muted-foreground px-3 py-1.5 rounded-lg hover:border-primary/50 transition-colors"
                        >
                          Calendário
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Selected/Featured Match */}
              {displayFixture && !isLoadingFixture && (
                <>
                  {/* Scoreboard */}
                  <Scoreboard fixture={displayFixture} variant="default" size="lg" />

                  {/* Stats and Events Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Statistics */}
                    <div className="card-surface rounded-xl p-4 sm:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        <h3 className="font-heading text-lg uppercase">
                          Estatísticas
                        </h3>
                      </div>
                      {statistics ? (
                        <StatComparison
                          statistics={statistics}
                          variant="default"
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Estatísticas não disponíveis ainda.
                        </p>
                      )}
                    </div>

                    {/* Events */}
                    <div className="card-surface rounded-xl p-4 sm:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Clock className="h-5 w-5 text-primary" />
                        <h3 className="font-heading text-lg uppercase">
                          Eventos
                        </h3>
                      </div>
                      {events && events.length > 0 ? (
                        <EventTimeline
                          events={events}
                          homeTeamId={displayFixture.homeTeam.id}
                          maxEvents={6}
                        />
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Aguardando eventos do jogo...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Player Ratings - only when live */}
                  {isLive && (
                    <PlayerRatings
                      fixtureId={displayFixture.id}
                      homeTeamId={displayFixture.homeTeam.id}
                      homeTeamName={displayFixture.homeTeam.name}
                      awayTeamName={displayFixture.awayTeam.name}
                      enabled={isLive}
                    />
                  )}
                </>
              )}
            </div>

            {/* Sidebar - Other live matches */}
            <div className="space-y-4">
              <h2 className="font-heading text-lg uppercase text-muted-foreground">
                Jogos ao Vivo
              </h2>

              {isLoadingLive && (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="card-surface rounded-xl p-4 animate-pulse">
                      <div className="h-20 bg-secondary/50 rounded" />
                    </div>
                  ))}
                </div>
              )}

              {!isLoadingLive && liveFixtures && liveFixtures.length > 0 && (
                <div className="space-y-3">
                  {liveFixtures.map((fixture) => (
                    <LiveMatchCard
                      key={fixture.id}
                      fixture={fixture}
                      showActions={fixture.id !== displayFixture?.id}
                    />
                  ))}
                </div>
              )}

              {!isLoadingLive && (!liveFixtures || liveFixtures.length === 0) && (
                <div className="card-surface rounded-xl p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Nenhum jogo ao vivo no momento.
                  </p>
                </div>
              )}

              {/* YouTube CTA */}
              <div className="card-surface rounded-xl p-4 border border-accent/30">
                <p className="text-sm text-muted-foreground mb-3">
                  Assista às transmissões ao vivo no nosso canal:
                </p>
                <a
                  href="https://youtube.com/@UnionFootballLive"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-accent text-accent-foreground font-heading uppercase tracking-wider text-sm px-4 py-2 rounded hover:opacity-90 transition-opacity"
                >
                  Abrir YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LiveDashboard;
