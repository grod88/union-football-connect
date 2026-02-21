/**
 * Fixture Mapper
 * Converts API-Football DTOs to domain entities
 */
import type { FixtureDTO } from '../dtos/fixture.dto';
import type { Fixture } from '@/core/domain/entities/fixture';
import type { Team } from '@/core/domain/entities/team';
import type { League } from '@/core/domain/entities/league';
import { MatchStatus } from '@/core/domain/enums';

export const mapTeamFromDTO = (dto: { id: number; name: string; logo: string }): Team => ({
  id: dto.id,
  name: dto.name,
  logo: dto.logo,
});

export const mapLeagueFromDTO = (dto: FixtureDTO['league']): League => ({
  id: dto.id,
  name: dto.name,
  logo: dto.logo,
  country: dto.country,
  countryFlag: dto.flag || undefined,
  season: dto.season,
  round: dto.round,
});

export const mapFixtureFromDTO = (dto: FixtureDTO): Fixture => {
  return {
    id: dto.fixture.id,
    date: new Date(dto.fixture.date),
    timestamp: dto.fixture.timestamp,
    timezone: dto.fixture.timezone,
    status: dto.fixture.status.short as MatchStatus,
    elapsed: dto.fixture.status.elapsed,
    extraTime: dto.fixture.status.extra,
    league: mapLeagueFromDTO(dto.league),
    homeTeam: mapTeamFromDTO(dto.teams.home),
    awayTeam: mapTeamFromDTO(dto.teams.away),
    goalsHome: dto.goals.home,
    goalsAway: dto.goals.away,
    venue: dto.fixture.venue.name
      ? {
          name: dto.fixture.venue.name,
          city: dto.fixture.venue.city || '',
        }
      : undefined,
    referee: dto.fixture.referee || undefined,
  };
};

export const mapFixturesFromDTO = (dtos: FixtureDTO[]): Fixture[] => {
  return dtos.map(mapFixtureFromDTO);
};
