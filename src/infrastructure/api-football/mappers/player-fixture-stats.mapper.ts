/**
 * Mapper: PlayerFixtureStatsResponseDTO[] → PlayerFixtureStats[]
 */
import type { PlayerFixtureStats } from '@/core/domain/entities/player-fixture-stats';
import type { PlayerFixtureStatsResponseDTO } from '../dtos/player-fixture-stats.dto';

export function mapPlayerFixtureStatsFromDTO(dtos: PlayerFixtureStatsResponseDTO[]): PlayerFixtureStats[] {
  const result: PlayerFixtureStats[] = [];

  for (const teamDto of dtos) {
    const team = {
      id: teamDto.team.id,
      name: teamDto.team.name ?? '',
      logo: teamDto.team.logo || null,
    };

    for (const playerDto of teamDto.players) {
      const stats = playerDto.statistics[0];
      if (!stats) continue;

      result.push({
        player: {
          id: playerDto.player.id,
          name: playerDto.player.name ?? '',
          photo: playerDto.player.photo || null,
        },
        team,
        games: {
          minutes: stats.games?.minutes ?? null,
          position: stats.games?.position ?? null,
          rating: stats.games?.rating ? parseFloat(stats.games.rating) : null,
          captain: stats.games?.captain ?? false,
          substitute: stats.games?.substitute ?? false,
        },
        shots: {
          total: stats.shots?.total ?? null,
          on: stats.shots?.on ?? null,
        },
        goals: {
          total: stats.goals?.total ?? null,
          conceded: stats.goals?.conceded ?? null,
          assists: stats.goals?.assists ?? null,
        },
        passes: {
          total: stats.passes?.total ?? null,
          key: stats.passes?.key ?? null,
          accuracy: stats.passes?.accuracy ? parseInt(stats.passes.accuracy.replace('%', ''), 10) : null,
        },
        tackles: {
          total: stats.tackles?.total ?? null,
          blocks: stats.tackles?.blocks ?? null,
          interceptions: stats.tackles?.interceptions ?? null,
        },
        duels: {
          total: stats.duels?.total ?? null,
          won: stats.duels?.won ?? null,
        },
        cards: {
          yellow: stats.cards?.yellow ?? 0,
          red: stats.cards?.red ?? 0,
        },
        fouls: {
          drawn: stats.fouls?.drawn ?? null,
          committed: stats.fouls?.committed ?? null,
        },
      });
    }
  }

  return result;
}
