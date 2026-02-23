/**
 * Standings Page (/classificacao)
 * League standings with top scorers and assists
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { StandingsTable } from '@/presentation/components/standings/StandingsTable';
import { TopScorersTable } from '@/presentation/components/players/TopScorersTable';
import { LEAGUES, CURRENT_SEASON, TEAMS } from '@/config/constants';
import { cn } from '@/lib/utils';

const leagueOptions = [
  { id: LEAGUES.PAULISTAO, name: 'Paulistão', flag: '🏆' },
  { id: LEAGUES.BRASILEIRAO_A, name: 'Brasileirão A', flag: '🇧🇷' },
  { id: LEAGUES.BRASILEIRAO_B, name: 'Série B', flag: '🇧🇷' },
  { id: LEAGUES.COPA_DO_BRASIL, name: 'Copa do Brasil', flag: '🏆' },
  { id: LEAGUES.LIBERTADORES, name: 'Libertadores', flag: '🌎' },
  { id: LEAGUES.SULAMERICANA, name: 'Sul-Americana', flag: '🌎' },
];

const featuredTeamIds = [
  TEAMS.SAO_PAULO,
  TEAMS.PALMEIRAS,
  TEAMS.CORINTHIANS,
  TEAMS.SANTOS,
];

const StandingsPage = () => {
  const [selectedLeagueId, setSelectedLeagueId] = useState<number>(LEAGUES.PAULISTAO);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Page header */}
          <motion.div
            className="text-center mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 mb-4">
              <Trophy size={20} className="text-primary" />
              <span className="text-primary font-heading uppercase tracking-wider text-sm">
                Tabela de Classificação
              </span>
            </div>
            <h1 className="font-heading text-4xl sm:text-5xl uppercase gold-text mb-6">
              Classificação
            </h1>
          </motion.div>

          {/* League selector */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
            {leagueOptions.map((league) => (
              <button
                key={league.id}
                onClick={() => setSelectedLeagueId(league.id)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors whitespace-nowrap border',
                  selectedLeagueId === league.id
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-secondary/50 border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                {league.flag} {league.name}
              </button>
            ))}
          </div>

          {/* Standings table */}
          <div className="mb-8">
            <StandingsTable
              leagueId={selectedLeagueId}
              season={CURRENT_SEASON}
              highlightTeamIds={featuredTeamIds}
            />
          </div>

          {/* Top scorers + assists */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TopScorersTable
              leagueId={selectedLeagueId}
              season={CURRENT_SEASON}
              type="goals"
              limit={10}
            />
            <TopScorersTable
              leagueId={selectedLeagueId}
              season={CURRENT_SEASON}
              type="assists"
              limit={10}
            />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StandingsPage;
