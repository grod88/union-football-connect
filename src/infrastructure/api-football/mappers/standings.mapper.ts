/**
 * Standings Mapper
 * Converts API-Football standings DTOs to domain entities
 */
import type { StandingsResponseDTO, StandingEntryDTO } from '../dtos/standings.dto';
import type { LeagueStandings, StandingEntry, StandingStats } from '@/core/domain/entities/standing';

const mapStandingStats = (dto: { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } }): StandingStats => ({
  played: dto.played,
  win: dto.win,
  draw: dto.draw,
  lose: dto.lose,
  goalsFor: dto.goals.for,
  goalsAgainst: dto.goals.against,
});

const mapStandingEntry = (dto: StandingEntryDTO): StandingEntry => ({
  rank: dto.rank,
  team: {
    id: dto.team.id,
    name: dto.team.name,
    logo: dto.team.logo,
  },
  points: dto.points,
  goalsDiff: dto.goalsDiff,
  group: dto.group,
  form: dto.form || undefined,
  status: dto.status,
  description: dto.description || undefined,
  all: mapStandingStats(dto.all),
  home: mapStandingStats(dto.home),
  away: mapStandingStats(dto.away),
});

export const mapStandingsFromDTO = (dto: StandingsResponseDTO): LeagueStandings => {
  return {
    leagueId: dto.league.id,
    leagueName: dto.league.name,
    leagueLogo: dto.league.logo,
    season: dto.league.season,
    standings: dto.league.standings.map((group) =>
      group.map(mapStandingEntry)
    ),
  };
};
