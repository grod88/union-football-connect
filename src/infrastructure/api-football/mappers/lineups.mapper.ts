/**
 * Lineups Mapper
 * Converts API-Football lineups DTOs to domain entities
 */
import type { LineupDTO } from '../dtos/lineups.dto';
import type { FixtureLineups, TeamLineup, Player } from '@/core/domain/entities/lineup';
import type { Team } from '@/core/domain/entities/team';

const mapTeamFromLineupDTO = (dto: LineupDTO['team']): Team => ({
  id: dto.id,
  name: dto.name,
  logo: dto.logo,
});

const mapPlayerFromDTO = (dto: { player: { id: number; name: string; number: number; pos: string; grid: string | null } }): Player => ({
  id: dto.player.id,
  name: dto.player.name,
  number: dto.player.number,
  pos: dto.player.pos,
  grid: dto.player.grid,
});

export const mapTeamLineupFromDTO = (dto: LineupDTO): TeamLineup => {
  return {
    team: mapTeamFromLineupDTO(dto.team),
    formation: dto.formation,
    startXI: dto.startXI.map(mapPlayerFromDTO),
    substitutes: dto.substitutes.map(mapPlayerFromDTO),
    coach: {
      id: dto.coach.id,
      name: dto.coach.name,
      photo: dto.coach.photo || undefined,
    },
  };
};

export const mapFixtureLineupsFromDTO = (
  fixtureId: number,
  dtos: LineupDTO[]
): FixtureLineups | null => {
  if (dtos.length < 2) return null;

  // API returns [homeTeam, awayTeam] order
  const [homeDTO, awayDTO] = dtos;

  return {
    fixtureId,
    home: mapTeamLineupFromDTO(homeDTO),
    away: mapTeamLineupFromDTO(awayDTO),
  };
};
