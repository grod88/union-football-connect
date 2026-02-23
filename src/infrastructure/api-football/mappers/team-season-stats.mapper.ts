/**
 * Mapper: TeamSeasonStatsResponseDTO → TeamSeasonStats
 */
import type { TeamSeasonStats } from '@/core/domain/entities/team-season-stats';
import type { TeamSeasonStatsResponseDTO } from '../dtos/team-season-stats.dto';

export function mapTeamSeasonStatsFromDTO(dto: TeamSeasonStatsResponseDTO): TeamSeasonStats {
  return {
    team: {
      id: dto.team.id,
      name: dto.team.name ?? '',
      logo: dto.team.logo || null,
    },
    league: {
      id: dto.league.id,
      name: dto.league.name ?? '',
      logo: dto.league.logo || null,
      season: dto.league.season,
    },
    form: dto.form || null,
    fixtures: {
      played: dto.fixtures.played,
      wins: dto.fixtures.wins,
      draws: dto.fixtures.draws,
      losses: dto.fixtures.loses, // API uses "loses" without double s
    },
    goals: {
      for: {
        home: dto.goals.for.total.home,
        away: dto.goals.for.total.away,
        total: dto.goals.for.total.total,
        average: dto.goals.for.average,
      },
      against: {
        home: dto.goals.against.total.home,
        away: dto.goals.against.total.away,
        total: dto.goals.against.total.total,
        average: dto.goals.against.average,
      },
    },
    cleanSheets: dto.clean_sheet,
    failedToScore: dto.failed_to_score,
    penalty: {
      scored: dto.penalty.scored,
      missed: dto.penalty.missed,
    },
    biggestStreak: {
      wins: dto.biggest.streak.wins,
      draws: dto.biggest.streak.draws,
      losses: dto.biggest.streak.loses,
    },
  };
}
