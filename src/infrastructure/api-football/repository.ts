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
import type { Prediction } from '@/core/domain/entities/prediction';
import type { Injury } from '@/core/domain/entities/injury';
import type { PlayerFixtureStats } from '@/core/domain/entities/player-fixture-stats';
import type { TopScorer } from '@/core/domain/entities/top-scorer';
import type { TeamSeasonStats } from '@/core/domain/entities/team-season-stats';

import { apiFootballClient } from './client';
import { ENDPOINTS } from '@/config/api.config';
import { CURRENT_SEASON } from '@/config/constants';

import type { FixtureDTO } from './dtos/fixture.dto';
import type { StatisticsDTO } from './dtos/statistics.dto';
import type { EventDTO } from './dtos/events.dto';
import type { LineupDTO } from './dtos/lineups.dto';
import type { StandingsResponseDTO } from './dtos/standings.dto';
import type { PredictionResponseDTO } from './dtos/prediction.dto';
import type { InjuryResponseDTO } from './dtos/injury.dto';
import type { PlayerFixtureStatsResponseDTO } from './dtos/player-fixture-stats.dto';
import type { TopScorerResponseDTO } from './dtos/top-scorer.dto';
import type { TeamSeasonStatsResponseDTO } from './dtos/team-season-stats.dto';

import { mapFixtureFromDTO, mapFixturesFromDTO } from './mappers/fixture.mapper';
import { mapFixtureStatisticsFromDTO } from './mappers/statistics.mapper';
import { mapEventsFromDTO } from './mappers/events.mapper';
import { mapFixtureLineupsFromDTO } from './mappers/lineups.mapper';
import { mapStandingsFromDTO } from './mappers/standings.mapper';
import { mapPredictionFromDTO } from './mappers/prediction.mapper';
import { mapInjuriesFromDTO } from './mappers/injury.mapper';
import { mapPlayerFixtureStatsFromDTO } from './mappers/player-fixture-stats.mapper';
import { mapTopScorersFromDTO } from './mappers/top-scorer.mapper';
import { mapTeamSeasonStatsFromDTO } from './mappers/team-season-stats.mapper';

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
      const endOfYear = `${season}-12-31`;
      let endpoint = `/fixtures?team=${teamId}&season=${season}&from=${today}&to=${endOfYear}`;
      if (options?.leagueId) endpoint += `&league=${options.leagueId}`;

      const response = await apiFootballClient.get<FixtureDTO[]>(endpoint);
      const fixtures = mapFixturesFromDTO(response.response);
      
      fixtures.sort((a, b) => a.date.getTime() - b.date.getTime());
      
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

  // ==================== Predictions ====================

  async getPredictions(fixtureId: number): Promise<Prediction | null> {
    try {
      const response = await apiFootballClient.get<PredictionResponseDTO[]>(
        `/predictions?fixture=${fixtureId}`
      );

      if (response.results === 0 || !response.response[0]) {
        return null;
      }

      return mapPredictionFromDTO(response.response[0]);
    } catch (error) {
      console.error(`Error fetching predictions for fixture ${fixtureId}:`, error);
      throw error;
    }
  }

  // ==================== Injuries ====================

  async getInjuries(fixtureId: number): Promise<Injury[]> {
    try {
      const response = await apiFootballClient.get<InjuryResponseDTO[]>(
        `/injuries?fixture=${fixtureId}`
      );
      return mapInjuriesFromDTO(response.response);
    } catch (error) {
      console.error(`Error fetching injuries for fixture ${fixtureId}:`, error);
      throw error;
    }
  }

  async getInjuriesByLeague(leagueId: number, season: number): Promise<Injury[]> {
    try {
      const response = await apiFootballClient.get<InjuryResponseDTO[]>(
        `/injuries?league=${leagueId}&season=${season}`
      );
      return mapInjuriesFromDTO(response.response);
    } catch (error) {
      console.error(`Error fetching injuries for league ${leagueId}:`, error);
      throw error;
    }
  }

  // ==================== Player Stats ====================

  async getFixturePlayers(fixtureId: number): Promise<PlayerFixtureStats[]> {
    try {
      const response = await apiFootballClient.get<PlayerFixtureStatsResponseDTO[]>(
        `/fixtures/players?fixture=${fixtureId}`
      );
      return mapPlayerFixtureStatsFromDTO(response.response);
    } catch (error) {
      console.error(`Error fetching players for fixture ${fixtureId}:`, error);
      throw error;
    }
  }

  // ==================== Top Scorers / Assists ====================

  async getTopScorers(leagueId: number, season: number): Promise<TopScorer[]> {
    try {
      const response = await apiFootballClient.get<TopScorerResponseDTO[]>(
        `/players/topscorers?league=${leagueId}&season=${season}`
      );
      return mapTopScorersFromDTO(response.response);
    } catch (error) {
      console.error(`Error fetching top scorers for league ${leagueId}:`, error);
      throw error;
    }
  }

  async getTopAssists(leagueId: number, season: number): Promise<TopScorer[]> {
    try {
      const response = await apiFootballClient.get<TopScorerResponseDTO[]>(
        `/players/topassists?league=${leagueId}&season=${season}`
      );
      return mapTopScorersFromDTO(response.response);
    } catch (error) {
      console.error(`Error fetching top assists for league ${leagueId}:`, error);
      throw error;
    }
  }

  // ==================== Team Statistics ====================

  async getTeamStatistics(teamId: number, leagueId: number, season: number): Promise<TeamSeasonStats | null> {
    try {
      const response = await apiFootballClient.get<TeamSeasonStatsResponseDTO>(
        `/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`
      );

      if (!response.response) {
        return null;
      }

      return mapTeamSeasonStatsFromDTO(response.response);
    } catch (error) {
      console.error(`Error fetching team statistics for team ${teamId}:`, error);
      throw error;
    }
  }
}

// Singleton instance
export const footballRepository = new ApiFootballRepository();
