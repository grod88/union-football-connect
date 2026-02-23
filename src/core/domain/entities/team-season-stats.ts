/**
 * Estatísticas de um time em uma temporada/liga específica.
 * Dados vindos do endpoint /teams/statistics.
 */
export interface TeamSeasonStats {
  team: {
    id: number;
    name: string;
    logo: string | null;
  };
  league: {
    id: number;
    name: string;
    logo: string | null;
    season: number;
  };
  form: string | null;
  fixtures: {
    played: { home: number; away: number; total: number };
    wins: { home: number; away: number; total: number };
    draws: { home: number; away: number; total: number };
    losses: { home: number; away: number; total: number };
  };
  goals: {
    for: { home: number; away: number; total: number; average: { home: string; away: string; total: string } };
    against: { home: number; away: number; total: number; average: { home: string; away: string; total: string } };
  };
  cleanSheets: { home: number; away: number; total: number };
  failedToScore: { home: number; away: number; total: number };
  penalty: {
    scored: { total: number; percentage: string };
    missed: { total: number; percentage: string };
  };
  biggestStreak: {
    wins: number;
    draws: number;
    losses: number;
  };
}
