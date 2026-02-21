/**
 * TodayMatches Page
 * Lists all today's matches from Campeonato Paulista with rich details
 */
import { motion } from 'framer-motion';
import { Clock, MapPin, User, Trophy, Loader2, AlertCircle, CalendarDays } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTodayFixtures } from '@/application/hooks/useTodayFixtures';
import { useLanguage } from '@/i18n';
import { TeamBadge } from '@/presentation/components/match/TeamBadge';
import { getMatchTimezones } from '@/application/services/timezone.service';
import { isFixtureLive, isFixtureFinished, getScoreDisplay, getElapsedDisplay } from '@/core/domain/entities/fixture';
import type { Fixture } from '@/core/domain/entities/fixture';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

const MatchCard = ({ fixture, index }: { fixture: Fixture; index: number }) => {
  const { t, locale } = useLanguage();
  const live = isFixtureLive(fixture);
  const finished = isFixtureFinished(fixture);
  const timezones = getMatchTimezones(fixture.date);
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS;

  return (
    <motion.div
      className={`card-surface rounded-xl overflow-hidden ${live ? 'ring-2 ring-red-accent red-glow' : ''}`}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border">
        <div className="flex items-center gap-2">
          {fixture.league.logo && (
            <img src={fixture.league.logo} alt={fixture.league.name} className="h-5 w-5 object-contain" />
          )}
          <span className="text-xs text-muted-foreground font-heading uppercase tracking-wider">
            {fixture.league.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {fixture.league.round && (
            <span className="text-xs text-primary/80 font-heading uppercase tracking-wider">
              {fixture.league.round}
            </span>
          )}
          {live && (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-accent text-foreground text-xs font-bold uppercase animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground" />
              </span>
              {t.todayMatches.live}
            </span>
          )}
          {finished && (
            <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs font-bold uppercase">
              {t.todayMatches.finished}
            </span>
          )}
          {!live && !finished && (
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold uppercase">
              {t.todayMatches.notStarted}
            </span>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="p-6">
        {/* Teams and score */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex-1 flex flex-col items-center text-center">
            <TeamBadge team={fixture.homeTeam} size="md" namePosition="bottom" />
          </div>

          <div className="flex flex-col items-center gap-1 min-w-[80px]">
            {(live || finished) ? (
              <>
                <span className="font-heading text-4xl text-foreground">{getScoreDisplay(fixture)}</span>
                {live && fixture.elapsed !== null && (
                  <span className="text-red-accent text-sm font-bold">{getElapsedDisplay(fixture)}</span>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center">
                <span className="font-heading text-2xl text-primary">
                  {format(fixture.date, 'HH:mm', { locale: dateLocale })}
                </span>
                <span className="text-xs text-muted-foreground mt-1">{t.todayMatches.kickoff}</span>
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col items-center text-center">
            <TeamBadge team={fixture.awayTeam} size="md" namePosition="bottom" />
          </div>
        </div>

        {/* Timezone bars */}
        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {timezones.map((tz) => (
            <div key={tz.label} className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-lg">
              <Clock size={12} className="text-primary" />
              <span className="text-xs text-muted-foreground">{tz.flag} {tz.label}</span>
              <span className="text-xs font-semibold text-foreground">{tz.time}</span>
            </div>
          ))}
        </div>

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
};

const TodayMatches = () => {
  const { t, locale } = useLanguage();
  const { data: fixtures, isLoading, error } = useTodayFixtures();
  const dateLocale = locale === 'pt-BR' ? ptBR : enUS;
  const todayFormatted = format(new Date(), "EEEE, d 'de' MMMM", { locale: dateLocale });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-3xl">
          {/* Page header */}
          <motion.div
            className="text-center mb-12"
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

          {/* States */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">{t.todayMatches.loading}</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <AlertCircle className="h-10 w-10 text-red-accent" />
              <p className="text-muted-foreground">{t.todayMatches.error}</p>
            </div>
          )}

          {!isLoading && !error && fixtures?.length === 0 && (
            <motion.div
              className="card-surface rounded-xl p-12 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <CalendarDays className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg">{t.todayMatches.noMatches}</p>
            </motion.div>
          )}

          {/* Match list */}
          {fixtures && fixtures.length > 0 && (
            <div className="space-y-6">
              {fixtures.map((fixture, i) => (
                <MatchCard key={fixture.id} fixture={fixture} index={i} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TodayMatches;
