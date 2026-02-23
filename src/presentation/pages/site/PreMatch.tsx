/**
 * PreMatch Page (/pre-jogo/:fixtureId)
 * Complete pre-match dashboard with predictions, H2H, standings, injuries
 */
import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, ExternalLink, ChevronLeft, Trophy, Clock } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/presentation/components/common/LoadingSpinner';
import { Scoreboard } from '@/presentation/components/match/Scoreboard';
import { TeamBadge } from '@/presentation/components/match/TeamBadge';
import { PredictionWidget } from '@/presentation/components/predictions/PredictionWidget';
import { H2HCard } from '@/presentation/components/match/H2HCard';
import { StandingsTable } from '@/presentation/components/standings/StandingsTable';
import { InjuriesPanel } from '@/presentation/components/injuries/InjuriesPanel';
import { useFixture } from '@/application/hooks/useFixture';
import { isFixtureLive } from '@/core/domain/entities/fixture';
import { getMatchTimezones, formatMatchDate } from '@/application/services/timezone.service';
import { downloadICSFile } from '@/application/services/calendar.service';
import { CURRENT_SEASON } from '@/config/constants';
import { SOCIAL_LINKS } from '@/config/constants';
import { ROUTES } from '@/config/routes';

const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  const units = [
    { value: timeLeft.days, label: 'dias' },
    { value: timeLeft.hours, label: 'h' },
    { value: timeLeft.minutes, label: 'min' },
    { value: timeLeft.seconds, label: 's' },
  ];

  return (
    <div className="flex items-center gap-2">
      {units.map((u, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="font-heading text-2xl sm:text-3xl text-primary tabular-nums">
            {String(u.value).padStart(2, '0')}
          </span>
          <span className="text-xs text-muted-foreground">{u.label}</span>
        </div>
      ))}
    </div>
  );
};

const PreMatch = () => {
  const { fixtureId } = useParams<{ fixtureId: string }>();
  const id = fixtureId ? parseInt(fixtureId, 10) : undefined;

  const { data: fixture, isLoading } = useFixture(id);

  useEffect(() => {
    if (fixture) {
      document.title = `${fixture.homeTeam.name} vs ${fixture.awayTeam.name} — Pré-Jogo | Union Football Live`;
    }
  }, [fixture]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-20 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!fixture) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-24 pb-20 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="font-heading text-3xl text-foreground mb-4">Partida não encontrada</h1>
            <p className="text-muted-foreground mb-6">O jogo solicitado não foi encontrado.</p>
            <Link to={ROUTES.HOME} className="text-primary hover:underline">
              ← Voltar à página inicial
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const live = isFixtureLive(fixture);
  const timezones = getMatchTimezones(fixture.date);
  const dateFormatted = formatMatchDate(fixture.date);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Back link */}
          <Link
            to={ROUTES.HOME}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
          >
            <ChevronLeft size={16} />
            Voltar
          </Link>

          {/* Match Header */}
          <motion.div
            className="card-surface rounded-xl p-6 md:p-10 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* League info */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {fixture.league.logo && (
                <img src={fixture.league.logo} alt="" className="w-6 h-6 object-contain" />
              )}
              <span className="font-heading text-sm uppercase tracking-wider text-muted-foreground">
                {fixture.league.name}
                {fixture.league.round && ` — ${fixture.league.round}`}
              </span>
            </div>

            {/* Teams */}
            <div className="flex items-center justify-center gap-6 sm:gap-12 mb-6">
              <TeamBadge team={fixture.homeTeam} size="lg" />
              <span className="font-heading text-3xl sm:text-5xl text-muted-foreground">VS</span>
              <TeamBadge team={fixture.awayTeam} size="lg" />
            </div>

            {/* Date and timezone */}
            <div className="text-center space-y-3">
              <p className="text-muted-foreground capitalize">
                <CalendarDays size={14} className="inline mr-1" />
                {dateFormatted}
              </p>

              <div className="flex flex-wrap justify-center gap-2">
                {timezones.map((tz) => (
                  <div key={tz.label} className="flex items-center gap-1.5 bg-secondary/50 px-3 py-1.5 rounded-lg">
                    <span className="text-xs">{tz.flag}</span>
                    <span className="text-xs text-muted-foreground">{tz.label}</span>
                    <span className="text-xs font-semibold text-foreground">{tz.time}</span>
                  </div>
                ))}
              </div>

              {/* Countdown or Live badge */}
              {live ? (
                <Link
                  to={`${ROUTES.LIVE}?fixture=${fixture.id}`}
                  className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground font-heading uppercase tracking-wider text-sm px-4 py-2 rounded-lg animate-pulse"
                >
                  🔴 AO VIVO AGORA
                </Link>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <CountdownTimer targetDate={fixture.date} />
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-center gap-3 pt-2">
                {live ? (
                  <Link
                    to={`${ROUTES.LIVE}?fixture=${fixture.id}`}
                    className="inline-flex items-center gap-2 bg-destructive text-destructive-foreground font-heading uppercase tracking-wider text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    🔴 Assistir Live
                  </Link>
                ) : (
                  <a
                    href={SOCIAL_LINKS.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-accent text-accent-foreground font-heading uppercase tracking-wider text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                  >
                    <ExternalLink size={14} />
                    Assistir Live
                  </a>
                )}
                <button
                  onClick={() => downloadICSFile(fixture)}
                  className="inline-flex items-center gap-2 border border-border text-foreground font-heading uppercase tracking-wider text-sm px-4 py-2 rounded-lg hover:border-primary/50 transition-colors"
                >
                  <CalendarDays size={14} />
                  Lembrar-me
                </button>
              </div>
            </div>
          </motion.div>

          {/* 3-column grid: Prediction, H2H, Standings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
            <PredictionWidget
              fixtureId={fixture.id}
              homeTeam={fixture.homeTeam}
              awayTeam={fixture.awayTeam}
            />
            <H2HCard
              teamId1={fixture.homeTeam.id}
              teamId2={fixture.awayTeam.id}
              team1={fixture.homeTeam}
              team2={fixture.awayTeam}
              limit={10}
            />
            <StandingsTable
              leagueId={fixture.league.id}
              season={CURRENT_SEASON}
              highlightTeamIds={[fixture.homeTeam.id, fixture.awayTeam.id]}
              compact
              maxRows={8}
            />
          </div>

          {/* Injuries - full width */}
          <div className="mb-6">
            <InjuriesPanel
              fixtureId={fixture.id}
              homeTeamId={fixture.homeTeam.id}
              homeTeamName={fixture.homeTeam.name}
              awayTeamName={fixture.awayTeam.name}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PreMatch;
