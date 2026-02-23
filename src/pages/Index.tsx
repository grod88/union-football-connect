import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import NextMatchSection from "@/components/NextMatchSection";
import VideoSection from "@/components/VideoSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import Footer from "@/components/Footer";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, CalendarDays, ChevronRight } from "lucide-react";
import { StandingsTable } from "@/presentation/components/standings/StandingsTable";
import { TeamBadge } from "@/presentation/components/match/TeamBadge";
import { useTodayFixtures } from "@/application/hooks/useTodayFixtures";
import { isFixtureLive, isFixtureFinished, getScoreDisplay } from "@/core/domain/entities/fixture";
import { getMatchTimezones } from "@/application/services/timezone.service";
import { LEAGUES, CURRENT_SEASON, TEAMS } from "@/config/constants";
import { ROUTES } from "@/config/routes";
import { cn } from "@/lib/utils";

const TodayMatchesSummary = () => {
  const { data: fixtures, isLoading } = useTodayFixtures();

  if (isLoading || !fixtures || fixtures.length === 0) return null;

  const displayFixtures = fixtures.slice(0, 5);

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2">
            <CalendarDays size={20} className="text-primary" />
            <h2 className="font-heading text-2xl sm:text-3xl uppercase gold-text">
              Jogos de Hoje
            </h2>
          </div>
          <Link
            to={ROUTES.TODAY_MATCHES}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver todos <ChevronRight size={14} />
          </Link>
        </motion.div>

        <div className="space-y-3">
          {displayFixtures.map((fixture) => {
            const live = isFixtureLive(fixture);
            const finished = isFixtureFinished(fixture);
            const timezones = getMatchTimezones(fixture.date);
            const linkTo = live
              ? `${ROUTES.LIVE}?fixture=${fixture.id}`
              : !finished
                ? `/pre-jogo/${fixture.id}`
                : undefined;

            const content = (
              <motion.div
                className={cn(
                  'card-surface rounded-xl p-4 flex items-center gap-3',
                  live && 'ring-1 ring-destructive/50',
                  linkTo && 'hover:bg-secondary/50 cursor-pointer transition-colors'
                )}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <div className="flex-1 flex items-center gap-2 justify-end">
                  <span className="text-sm truncate max-w-[80px] text-right hidden sm:block">
                    {fixture.homeTeam.shortName || fixture.homeTeam.name}
                  </span>
                  <img src={fixture.homeTeam.logo} alt="" className="w-6 h-6 object-contain shrink-0" />
                </div>

                <div className="min-w-[60px] text-center">
                  {live || finished ? (
                    <span className="font-heading text-lg">{getScoreDisplay(fixture)}</span>
                  ) : (
                    <span className="text-sm text-primary font-semibold">{timezones[0]?.time}</span>
                  )}
                </div>

                <div className="flex-1 flex items-center gap-2">
                  <img src={fixture.awayTeam.logo} alt="" className="w-6 h-6 object-contain shrink-0" />
                  <span className="text-sm truncate max-w-[80px] hidden sm:block">
                    {fixture.awayTeam.shortName || fixture.awayTeam.name}
                  </span>
                </div>

                {live && (
                  <span className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded font-bold animate-pulse shrink-0">
                    LIVE
                  </span>
                )}
              </motion.div>
            );

            if (linkTo) {
              return <Link key={fixture.id} to={linkTo}>{content}</Link>;
            }
            return <div key={fixture.id}>{content}</div>;
          })}
        </div>
      </div>
    </section>
  );
};

const StandingsSummary = () => {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-primary" />
            <h2 className="font-heading text-2xl sm:text-3xl uppercase gold-text">
              Classificação
            </h2>
          </div>
          <Link
            to={ROUTES.STANDINGS}
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            Ver completa <ChevronRight size={14} />
          </Link>
        </motion.div>

        <StandingsTable
          leagueId={LEAGUES.PAULISTAO}
          season={CURRENT_SEASON}
          highlightTeamIds={[TEAMS.SAO_PAULO]}
          compact
          maxRows={6}
        />
      </div>
    </section>
  );
};

const Index = () => {
  useEffect(() => {
    document.title = "Union Football Live — O Futebol é Melhor Junto";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <NextMatchSection />
      <TodayMatchesSummary />
      <StandingsSummary />
      <VideoSection />
      <HowItWorksSection />
      <Footer />
    </div>
  );
};

export default Index;
