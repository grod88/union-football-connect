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

const EURO_SEASON = CURRENT_SEASON - 1; // European leagues run Aug-May

interface LeagueOption {
  id: number;
  name: string;
  flag: string;
  season: number;
}

const leagueGroups: { label: string; leagues: LeagueOption[] }[] = [
  {
    label: 'Brasil',
    leagues: [
      { id: LEAGUES.PAULISTAO, name: 'Paulistão', flag: '🏆', season: CURRENT_SEASON },
      { id: LEAGUES.BRASILEIRAO_A, name: 'Brasileirão A', flag: '🇧🇷', season: CURRENT_SEASON },
      { id: LEAGUES.BRASILEIRAO_B, name: 'Série B', flag: '🇧🇷', season: CURRENT_SEASON },
    ],
  },
  {
    label: 'Continental',
    leagues: [
      { id: LEAGUES.LIBERTADORES, name: 'Libertadores', flag: '🌎', season: EURO_SEASON },
      { id: LEAGUES.CHAMPIONS_LEAGUE, name: 'Champions', flag: '🇪🇺', season: EURO_SEASON },
    ],
  },
  {
    label: 'Europa',
    leagues: [
      { id: LEAGUES.PREMIER_LEAGUE, name: 'Premier League', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', season: EURO_SEASON },
      { id: LEAGUES.LA_LIGA, name: 'La Liga', flag: '🇪🇸', season: EURO_SEASON },
      { id: LEAGUES.SERIE_A_ITALY, name: 'Serie A', flag: '🇮🇹', season: EURO_SEASON },
      { id: LEAGUES.BUNDESLIGA, name: 'Bundesliga', flag: '🇩🇪', season: EURO_SEASON },
      { id: LEAGUES.LIGUE_1, name: 'Ligue 1', flag: '🇫🇷', season: EURO_SEASON },
      { id: LEAGUES.PRIMEIRA_LIGA, name: 'Primeira Liga', flag: '🇵🇹', season: EURO_SEASON },
    ],
  },
];

const allLeagues = leagueGroups.flatMap(g => g.leagues);

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
          <div className="space-y-3 mb-6">
            {leagueGroups.map((group) => (
              <div key={group.label}>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 block">
                  {group.label}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {group.leagues.map((league) => (
                    <button
                      key={league.id}
                      onClick={() => setSelectedLeagueId(league.id)}
                      className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors border',
                        selectedLeagueId === league.id
                          ? 'bg-primary/20 border-primary text-primary'
                          : 'bg-secondary/50 border-border text-muted-foreground hover:border-primary/50'
                      )}
                    >
                      {league.flag} {league.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Standings table */}
          {(() => {
            const season = allLeagues.find(l => l.id === selectedLeagueId)?.season ?? CURRENT_SEASON;
            return (
              <>
                <div className="mb-8">
                  <StandingsTable
                    leagueId={selectedLeagueId}
                    season={season}
                    highlightTeamIds={featuredTeamIds}
                  />
                </div>

                {/* Top scorers + assists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <TopScorersTable
                    leagueId={selectedLeagueId}
                    season={season}
                    type="goals"
                    limit={10}
                  />
                  <TopScorersTable
                    leagueId={selectedLeagueId}
                    season={season}
                    type="assists"
                    limit={10}
                  />
                </div>
              </>
            );
          })()}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default StandingsPage;
