/**
 * Football Repository Port
 * Interface defining the contract for football data access
 * Following Clean Architecture - this port is in the domain layer
 */
import type { Fixture } from '../domain/entities/fixture';
import type { FixtureStatistics } from '../domain/entities/statistic';
import type { FixtureEvent } from '../domain/entities/event';
import type { FixtureLineups } from '../domain/entities/lineup';
import type { LeagueStandings } from '../domain/entities/standing';
import type { Prediction } from '../domain/entities/prediction';
import type { Injury } from '../domain/entities/injury';
import type { PlayerFixtureStats } from '../domain/entities/player-fixture-stats';
import type { TopScorer } from '../domain/entities/top-scorer';
import type { TeamSeasonStats } from '../domain/entities/team-season-stats';

/** Options for API requests (e.g., live mode for OBS widgets) */
export interface RepositoryRequestOptions {
  live?: boolean;
}

export interface IFootballRepository {
  // Fixture queries
  getFixtureById(id: number, options?: RepositoryRequestOptions): Promise<Fixture | null>;
  getFixturesByTeam(teamId: number, options?: { next?: number; last?: number; leagueId?: number; season?: number }): Promise<Fixture[]>;
  getFixturesByLeague(leagueId: number, season: number): Promise<Fixture[]>;
  getLiveFixtures(): Promise<Fixture[]>;
  getFixturesByDate(date: string): Promise<Fixture[]>;

  // Fixture details
  getFixtureStatistics(fixtureId: number, options?: RepositoryRequestOptions): Promise<FixtureStatistics | null>;
  getFixtureEvents(fixtureId: number, options?: RepositoryRequestOptions): Promise<FixtureEvent[]>;
  getFixtureLineups(fixtureId: number, options?: RepositoryRequestOptions): Promise<FixtureLineups | null>;

  // Standings
  getStandings(leagueId: number, season: number): Promise<LeagueStandings | null>;

  // Head to head
  getHeadToHead(team1Id: number, team2Id: number, options?: { last?: number }): Promise<Fixture[]>;

  // ============================================
  // PREDICTIONS
  // ============================================

  /** Busca predições de resultado para uma partida. */
  getPredictions(fixtureId: number): Promise<Prediction | null>;

  // ============================================
  // INJURIES / DESFALQUES
  // ============================================

  /** Busca lista de jogadores ausentes (lesão, suspensão, dúvida). */
  getInjuries(fixtureId: number): Promise<Injury[]>;

  /** Busca lesões por liga e temporada. */
  getInjuriesByLeague(leagueId: number, season: number): Promise<Injury[]>;

  // ============================================
  // PLAYER STATS (durante partida)
  // ============================================

  /** Busca estatísticas dos jogadores em uma partida específica. */
  getFixturePlayers(fixtureId: number): Promise<PlayerFixtureStats[]>;

  // ============================================
  // TOP SCORERS / ASSISTS
  // ============================================

  /** Busca os 20 maiores artilheiros de uma liga/temporada. */
  getTopScorers(leagueId: number, season: number): Promise<TopScorer[]>;

  /** Busca os 20 maiores assistentes de uma liga/temporada. */
  getTopAssists(leagueId: number, season: number): Promise<TopScorer[]>;

  // ============================================
  // TEAM STATISTICS (temporada)
  // ============================================

  /** Busca estatísticas completas de um time em uma liga/temporada. */
  getTeamStatistics(teamId: number, leagueId: number, season: number): Promise<TeamSeasonStats | null>;
}
