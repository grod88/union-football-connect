/**
 * Mapper: TopScorerResponseDTO[] → TopScorer[]
 */
import type { TopScorer } from '@/core/domain/entities/top-scorer';
import type { TopScorerResponseDTO } from '../dtos/top-scorer.dto';

export function mapTopScorersFromDTO(dtos: TopScorerResponseDTO[]): TopScorer[] {
  return dtos.map(dto => {
    const stats = dto.statistics[0];
    return {
      player: {
        id: dto.player.id,
        name: dto.player.name ?? '',
        firstname: dto.player.firstname || null,
        lastname: dto.player.lastname || null,
        age: dto.player.age ?? null,
        nationality: dto.player.nationality || null,
        photo: dto.player.photo || null,
      },
      statistics: {
        team: {
          id: stats?.team?.id ?? 0,
          name: stats?.team?.name ?? '',
          logo: stats?.team?.logo || null,
        },
        league: {
          id: stats?.league?.id ?? 0,
          name: stats?.league?.name ?? '',
          logo: stats?.league?.logo || null,
        },
        games: {
          appearances: stats?.games?.appearances ?? null,
          minutes: stats?.games?.minutes ?? null,
          position: stats?.games?.position ?? null,
          rating: stats?.games?.rating ?? null,
        },
        goals: {
          total: stats?.goals?.total ?? null,
          assists: stats?.goals?.assists ?? null,
        },
        penalty: {
          scored: stats?.penalty?.scored ?? null,
          missed: stats?.penalty?.missed ?? null,
        },
        cards: {
          yellow: stats?.cards?.yellow ?? null,
          red: stats?.cards?.red ?? null,
        },
      },
    };
  });
}
