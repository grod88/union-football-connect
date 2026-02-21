/**
 * API-Football Repository
 * Implementation of IFootballRepository using API-Football as data source
 */
import type { IFootballRepository } from '@/core/ports/football-repository.port';
import type { Fixture } from '@/core/domain/entities/fixture';
import type { FixtureStatistics } from '@/core/domain/entities/statistic';
import type { FixtureEvent } from '@/core/domain/entities/event';
import type { FixtureLineups } from '@/core/domain/entities/lineup';
import type { LeagueStandings } from '@/core/domain/entities/standing';

import { apiFootballClient } from './client';
import { ENDPOINTS } from '@/config/api.config';
import { CURRENT_SEASON } from '@/config/constants';

import type { FixtureDTO } from './dtos/fixture.dto';
import type { StatisticsDTO } from './dtos/statistics.dto';
import type { EventDTO } from './dtos/events.dto';
import type { LineupDTO } from './dtos/lineups.dto';
import type { StandingsResponseDTO } from './dtos/standings.dto';

import { mapFixtureFromDTO, mapFixturesFromDTO } from './mappers/fixture.mapper';
import { mapFixtureStatisticsFromDTO } from './mappers/statistics.mapper';
import { mapEventsFromDTO } from './mappers/events.mapper';
import { mapFixtureLineupsFromDTO } from './mappers/lineups.mapper';
import { mapStandingsFromDTO } from './mappers/standings.mapper';

export class ApiFootballRepository implements IFootballRepository {
  // ==================== Fixtures ====================

  async getFixtureById(id: number): Promise<Fixture | null> {
    try {
      const response = await apiFootballClient.get<FixtureDTO[]>(ENDPOINTS.fixtureById(id));

      if (response.results === 0 || !response.response[0]) {
        return null;
      }

      return mapFixtureFromDTO(response.response[0]);
    } catch (error) {
      console.error(`Error fetching fixture ${id}:`, error);
      throw error;
    }
  }

  async getFixturesByTeam(
    teamId: number,
    options?: { next?: number; last?: number; leagueId?: number; season?: number }
  ): Promise<Fixture[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const season = options?.season ?? CURRENT_SEASON;
      // API-Football requires both 'from' and 'to' when using date range
      const endOfYear = `${season}-12-31`;
      let endpoint = `/fixtures?team=${teamId}&season=${season}&from=${today}&to=${endOfYear}`;
      if (options?.leagueId) endpoint += `&league=${options.leagueId}`;

      const response = await apiFootballClient.get<FixtureDTO[]>(endpoint);
      const fixtures = mapFixturesFromDTO(response.response);
      
      // Sort by date ascending and limit
      fixtures.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      // Filter only not-started matches for "next" queries
      if (options?.next) {
        const upcoming = fixtures.filter(f => f.status === 'NS' || f.status === 'TBD');
        return upcoming.slice(0, options.next);
      }
      return fixtures;
    } catch (error) {
      console.error(`Error fetching fixtures for team ${teamId}:`, error);
      throw error;
    }
  }

  async getFixturesByLeague(leagueId: number, season: number): Promise<Fixture[]> {
    try {
      const response = await apiFootballClient.get<FixtureDTO[]>(
        ENDPOINTS.fixturesByLeague(leagueId, season)
      );
      return mapFixturesFromDTO(response.response);
    } catch (error) {
      console.error(`Error fetching fixtures for league ${leagueId}:`, error);
      throw error;
    }
  }

  async getLiveFixtures(): Promise<Fixture[]> {
    try {
      const response = await apiFootballClient.get<FixtureDTO[]>(ENDPOINTS.liveFixtures);
      return mapFixturesFromDTO(response.response);
    } catch (error) {
      console.error('Error fetching live fixtures:', error);
      throw error;
    }
  }

  // ==================== Statistics ====================

  async getFixtureStatistics(fixtureId: number): Promise<FixtureStatistics | null> {
    try {
      const response = await apiFootballClient.get<StatisticsDTO[]>(
        ENDPOINTS.fixtureStatistics(fixtureId)
      );

      if (response.results === 0) {
        return null;
      }

      return mapFixtureStatisticsFromDTO(fixtureId, response.response);
    } catch (error) {
      console.error(`Error fetching statistics for fixture ${fixtureId}:`, error);
      throw error;
    }
  }

  // ==================== Events ====================

  async getFixtureEvents(fixtureId: number): Promise<FixtureEvent[]> {
    try {
      const response = await apiFootballClient.get<EventDTO[]>(
        ENDPOINTS.fixtureEvents(fixtureId)
      );

      return mapEventsFromDTO(fixtureId, response.response);
    } catch (error) {
      console.error(`Error fetching events for fixture ${fixtureId}:`, error);
      throw error;
    }
  }

  // ==================== Lineups ====================

  async getFixtureLineups(fixtureId: number): Promise<FixtureLineups | null> {
    try {
      const response = await apiFootballClient.get<LineupDTO[]>(
        ENDPOINTS.fixtureLineups(fixtureId)
      );

      if (response.results === 0) {
        return null;
      }

      return mapFixtureLineupsFromDTO(fixtureId, response.response);
    } catch (error) {
      console.error(`Error fetching lineups for fixture ${fixtureId}:`, error);
      throw error;
    }
  }

  // ==================== Standings ====================

  async getStandings(leagueId: number, season: number): Promise<LeagueStandings | null> {
    try {
      const response = await apiFootballClient.get<StandingsResponseDTO[]>(
        ENDPOINTS.standings(leagueId, season)
      );

      if (response.results === 0 || !response.response[0]) {
        return null;
      }

      return mapStandingsFromDTO(response.response[0]);
    } catch (error) {
      console.error(`Error fetching standings for league ${leagueId}:`, error);
      throw error;
    }
  }

  // ==================== Head to Head ====================

  async getHeadToHead(
    team1Id: number,
    team2Id: number,
    options?: { last?: number }
  ): Promise<Fixture[]> {
    try {
      let endpoint = ENDPOINTS.headToHead(team1Id, team2Id);
      if (options?.last) endpoint += `&last=${options.last}`;

      const response = await apiFootballClient.get<FixtureDTO[]>(endpoint);
      return mapFixturesFromDTO(response.response);
    } catch (error) {
      console.error(`Error fetching H2H for teams ${team1Id} vs ${team2Id}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const footballRepository = new ApiFootballRepository();
