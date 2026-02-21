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

export interface IFootballRepository {
  // Fixture queries
  getFixtureById(id: number): Promise<Fixture | null>;
  getFixturesByTeam(teamId: number, options?: { next?: number; last?: number; leagueId?: number; season?: number }): Promise<Fixture[]>;
  getFixturesByLeague(leagueId: number, season: number): Promise<Fixture[]>;
  getLiveFixtures(): Promise<Fixture[]>;

  // Fixture details
  getFixtureStatistics(fixtureId: number): Promise<FixtureStatistics | null>;
  getFixtureEvents(fixtureId: number): Promise<FixtureEvent[]>;
  getFixtureLineups(fixtureId: number): Promise<FixtureLineups | null>;

  // Standings
  getStandings(leagueId: number, season: number): Promise<LeagueStandings | null>;

  // Head to head
  getHeadToHead(team1Id: number, team2Id: number, options?: { last?: number }): Promise<Fixture[]>;
}
