/**
 * Mapper: InjuryResponseDTO[] → Injury[]
 */
import type { Injury, InjuryType } from '@/core/domain/entities/injury';
import type { InjuryResponseDTO } from '../dtos/injury.dto';

export function mapInjuriesFromDTO(dtos: InjuryResponseDTO[]): Injury[] {
  return dtos.map(dto => ({
    player: {
      id: dto.player.id,
      name: dto.player.name ?? '',
      photo: dto.player.photo || null,
      type: (dto.player.type as InjuryType) ?? 'Missing Fixture',
      reason: dto.player.reason ?? '',
    },
    team: {
      id: dto.team.id,
      name: dto.team.name ?? '',
      logo: dto.team.logo || null,
    },
    fixtureId: dto.fixture.id,
    leagueId: dto.league.id,
    leagueName: dto.league.name ?? '',
    leagueSeason: dto.league.season,
  }));
}
