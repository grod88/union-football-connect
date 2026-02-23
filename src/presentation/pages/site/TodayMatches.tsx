/**
 * TodayMatches Page
 * Lists all today's matches with league grouping, status badges, and contextual links
 */
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, MapPin, User, Trophy, Loader2, AlertCircle, CalendarDays } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTodayFixtures } from '@/application/hooks/useTodayFixtures';
import { useLeagueFilter } from '@/application/hooks/useLeagueFilter';
import { LeagueFilterBar } from '@/presentation/components/match/LeagueFilterBar';
import { useLanguage } from '@/i18n';
import { TeamBadge } from '@/presentation/components/match/TeamBadge';
import { getMatchTimezones } from '@/application/services/timezone.service';
import { isFixtureLive, isFixtureFinished, getScoreDisplay, getElapsedDisplay } from '@/core/domain/entities/fixture';
import type { Fixture } from '@/core/domain/entities/fixture';
import { ROUTES } from '@/config/routes';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const MatchCard = ({ fixture, index }: { fixture: Fixture; index: number }) => {
  const { t, locale } = useLanguage();
  const live = isFixtureLive(fixture);
  const finished = isFixtureFinished(fixture);
  const timezones = getMatchTimezones(fixture.date);
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS;

  // Contextual link
  const linkTo = live
    ? `${ROUTES.LIVE}?fixture=${fixture.id}`
    : !finished
      ? `/pre-jogo/${fixture.id}`
      : undefined;

  const card = (
    <motion.div
      className={cn(
        'card-surface rounded-xl overflow-hidden',
        live && 'ring-2 ring-destructive/50',
        linkTo && 'hover:bg-secondary/50 cursor-pointer transition-colors'
      )}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          {fixture.league.round && (
            <span className="text-xs text-primary/80 font-heading uppercase tracking-wider">
              {fixture.league.round}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {live && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-destructive text-destructive-foreground text-xs font-bold uppercase animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive-foreground opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive-foreground" />
              </span>
              {getElapsedDisplay(fixture) || t.todayMatches.live}
            </span>
          )}
          {finished && (
            <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-bold uppercase">
              {t.todayMatches.finished}
            </span>
          )}
          {!live && !finished && (
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold uppercase">
              {format(fixture.date, 'HH:mm', { locale: dateLocale })}
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="p-6">
        {/* Teams and score */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex-1 flex flex-col items-center text-center">
            <TeamBadge team={fixture.homeTeam} size="md" namePosition="bottom" />
          </div>

          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            {(live || finished) ? (
              <span className="font-heading text-3xl text-foreground">{getScoreDisplay(fixture)}</span>
            ) : (
              <span className="font-heading text-xl text-muted-foreground">VS</span>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center text-center">
            <TeamBadge team={fixture.awayTeam} size="md" namePosition="bottom" />
          </div>
        </div>

        {/* Timezone bars */}
        {!finished && (
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {timezones.map((tz) => (
              <div key={tz.label} className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-lg">
                <Clock size={12} className="text-primary" />
                <span className="text-xs text-muted-foreground">{tz.flag} {tz.label}</span>
                <span className="text-xs font-semibold text-foreground">{tz.time}</span>
              </div>
            ))}
          </div>
        )}

        {/* Details row */}
        <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
          {fixture.venue && (
            <div className="flex items-center gap-1.5">
              <MapPin size={12} className="text-primary" />
              <span>{fixture.venue.name}{fixture.venue.city ? `, ${fixture.venue.city}` : ''}</span>
            </div>
          )}
          {fixture.referee && (
            <div className="flex items-center gap-1.5">
              <User size={12} className="text-primary" />
              <span>{fixture.referee}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{card}</Link>;
  }
  return card;
};

const TodayMatches = () => {
  const { t, locale } = useLanguage();
  const { data: fixtures, isLoading, error } = useTodayFixtures();
  const { selectedLeagueIds } = useLeagueFilter();
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS;
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: dateLocale });

  // Filter by selected leagues and group by league
  const groupedFixtures = useMemo(() => {
    if (!fixtures) return {};
    const filtered = fixtures.filter(f => selectedLeagueIds.includes(f.league.id));
    const groups: Record<string, { logo: string; fixtures: Fixture[] }> = {};
    for (const f of filtered) {
      const key = f.league.name;
      if (!groups[key]) {
        groups[key] = { logo: f.league.logo || '', fixtures: [] };
      }
      groups[key].fixtures.push(f);
    }
    return groups;
  }, [fixtures, selectedLeagueIds]);

  const leagueNames = Object.keys(groupedFixtures);
  const totalFiltered = leagueNames.reduce((sum, k) => sum + groupedFixtures[k].fixtures.length, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Page header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <Trophy size={20} className="text-primary" />
              <span className="text-primary font-heading uppercase tracking-wider text-sm">
                {t.todayMatches.subtitle}
              </span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl uppercase gold-text mb-3">
              {t.todayMatches.title}
            </h1>
            <p className="text-muted-foreground capitalize">{todayFormatted}</p>
          </motion.div>

          {/* League filter */}
          <LeagueFilterBar className="mb-6" />

          {/* States */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">{t.todayMatches.loading}</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-muted-foreground">{t.todayMatches.error}</p>
            </div>
          )}

          {!isLoading && !error && totalFiltered === 0 && (
            <motion.div
              className="card-surface rounded-xl p-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <CalendarDays className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">{t.todayMatches.noMatches}</p>
            </motion.div>
          )}

          {/* Match list grouped by league */}
          {leagueNames.map((leagueName) => {
            const group = groupedFixtures[leagueName];
            return (
              <div key={leagueName} className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  {group.logo && (
                    <img src={group.logo} alt="" className="w-5 h-5 object-contain" />
                  )}
                  <h2 className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
                    {leagueName}
                  </h2>
                </div>
                <div className="space-y-4">
                  {group.fixtures.map((fixture, i) => (
                    <MatchCard key={fixture.id} fixture={fixture} index={i} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TodayMatches;
