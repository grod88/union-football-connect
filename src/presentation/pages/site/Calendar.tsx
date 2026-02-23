/**
 * Calendar Page (/calendario)
 * Shows upcoming fixtures grouped by date with league filter
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CalendarDays, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LeagueFilterBar } from '@/presentation/components/match/LeagueFilterBar';
import { TeamBadge } from '@/presentation/components/match/TeamBadge';
import { useCalendarFixtures, filterUpcomingFixtures } from '@/application/hooks/useCalendarFixtures';
import { useLeagueFilter } from '@/application/hooks/useLeagueFilter';
import { isFixtureLive, isFixtureFinished } from '@/core/domain/entities/fixture';
import { getMatchTimezones } from '@/application/services/timezone.service';
import { CURRENT_SEASON } from '@/config/constants';
import { ROUTES } from '@/config/routes';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Fixture } from '@/core/domain/entities/fixture';

const FixtureCard = ({ fixture }: { fixture: Fixture }) => {
  const live = isFixtureLive(fixture);
  const finished = isFixtureFinished(fixture);
  const timezones = getMatchTimezones(fixture.date);

  const linkTo = live
    ? `${ROUTES.LIVE}?fixture=${fixture.id}`
    : !finished
      ? `/pre-jogo/${fixture.id}`
      : undefined;

  const content = (
    <div className={cn(
      'card-surface rounded-xl p-4 transition-colors',
      live && 'ring-1 ring-destructive/50',
      linkTo && 'hover:bg-secondary/50 cursor-pointer'
    )}>
      {/* League + status */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {fixture.league.logo && (
            <img src={fixture.league.logo} alt="" className="w-4 h-4 object-contain" />
          )}
          <span className="text-xs text-muted-foreground">{fixture.league.name}</span>
        </div>
        {live && (
          <span className="text-xs bg-destructive text-destructive-foreground px-2 py-0.5 rounded-full font-bold animate-pulse">
            ● AO VIVO
          </span>
        )}
      </div>

      {/* Teams */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 justify-end">
          <span className="text-sm truncate max-w-[100px] text-right">{fixture.homeTeam.shortName || fixture.homeTeam.name}</span>
          <img src={fixture.homeTeam.logo} alt="" className="w-6 h-6 object-contain shrink-0" />
        </div>
        <div className="text-center min-w-[50px]">
          {live || finished ? (
            <span className="font-heading text-lg">{fixture.goalsHome ?? 0} - {fixture.goalsAway ?? 0}</span>
          ) : (
            <span className="font-heading text-lg text-primary">
              {timezones[0]?.time}
            </span>
          )}
        </div>
        <div className="flex-1 flex items-center gap-2">
          <img src={fixture.awayTeam.logo} alt="" className="w-6 h-6 object-contain shrink-0" />
          <span className="text-sm truncate max-w-[100px]">{fixture.awayTeam.shortName || fixture.awayTeam.name}</span>
        </div>
      </div>

      {/* Timezone row for upcoming */}
      {!live && !finished && (
        <div className="flex justify-center gap-2 mt-2">
          {timezones.slice(0, 2).map((tz) => (
            <span key={tz.label} className="text-[10px] text-muted-foreground">
              {tz.flag} {tz.time}
            </span>
          ))}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{content}</Link>;
  }
  return content;
};

const CalendarPage = () => {
  const { selectedLeagueIds } = useLeagueFilter();

  // Fetch fixtures for the first selected league (we fetch per league)
  // For simplicity, fetch the primary league
  const primaryLeagueId = selectedLeagueIds[0] || 475;
  const { data: fixtures, isLoading } = useCalendarFixtures({
    leagueId: primaryLeagueId,
    season: CURRENT_SEASON,
  });

  // Group upcoming fixtures by date
  const groupedByDate = useMemo(() => {
    if (!fixtures) return {};
    const upcoming = filterUpcomingFixtures(fixtures);
    const groups: Record<string, Fixture[]> = {};
    for (const f of upcoming) {
      const dateKey = f.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(f);
    }
    return groups;
  }, [fixtures]);

  const dateKeys = Object.keys(groupedByDate);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <CalendarDays size={20} className="text-primary" />
              <span className="text-primary font-heading uppercase tracking-wider text-sm">
                Próximos Jogos
              </span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl uppercase gold-text mb-6">
              Calendário
            </h1>
          </motion.div>

          {/* League filter */}
          <LeagueFilterBar className="mb-6" compact />

          {/* Loading */}
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          )}

          {/* Empty */}
          {!isLoading && dateKeys.length === 0 && (
            <div className="card-surface rounded-xl p-12 text-center">
              <CalendarDays className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">Nenhum jogo futuro encontrado</p>
            </div>
          )}

          {/* Grouped fixtures */}
          {dateKeys.map((dateKey) => (
            <div key={dateKey} className="mb-6">
              <h2 className="font-heading text-sm uppercase tracking-wider text-muted-foreground mb-3 capitalize">
                {dateKey}
              </h2>
              <div className="space-y-3">
                {groupedByDate[dateKey].map((fixture) => (
                  <FixtureCard key={fixture.id} fixture={fixture} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CalendarPage;
