/**
 * Statistics Mapper
 * Converts API-Football statistics DTOs to domain entities
 */
import type { StatisticsDTO, StatisticItemDTO } from '../dtos/statistics.dto';
import { STATISTIC_TYPES } from '../dtos/statistics.dto';
import type { FixtureStatistics, ParsedStatistics } from '@/core/domain/entities/statistic';
import { createEmptyStatistics } from '@/core/domain/entities/statistic';

const parseStatValue = (value: number | string | null): number => {
  if (value === null) return 0;
  if (typeof value === 'number') return value;
  // Handle percentage strings like "55%"
  const numValue = parseFloat(value.replace('%', ''));
  return isNaN(numValue) ? 0 : numValue;
};

const findStat = (statistics: StatisticItemDTO[], type: string): number => {
  const stat = statistics.find((s) => s.type === type);
  return stat ? parseStatValue(stat.value) : 0;
};

export const mapStatisticsFromDTO = (statistics: StatisticItemDTO[]): ParsedStatistics => {
  return {
    shotsOnGoal: findStat(statistics, STATISTIC_TYPES.SHOTS_ON_GOAL),
    shotsOffGoal: findStat(statistics, STATISTIC_TYPES.SHOTS_OFF_GOAL),
    totalShots: findStat(statistics, STATISTIC_TYPES.TOTAL_SHOTS),
    blockedShots: findStat(statistics, STATISTIC_TYPES.BLOCKED_SHOTS),
    insideBoxShots: findStat(statistics, STATISTIC_TYPES.SHOTS_INSIDE_BOX),
    outsideBoxShots: findStat(statistics, STATISTIC_TYPES.SHOTS_OUTSIDE_BOX),
    fouls: findStat(statistics, STATISTIC_TYPES.FOULS),
    corners: findStat(statistics, STATISTIC_TYPES.CORNER_KICKS),
    offsides: findStat(statistics, STATISTIC_TYPES.OFFSIDES),
    possession: findStat(statistics, STATISTIC_TYPES.BALL_POSSESSION),
    yellowCards: findStat(statistics, STATISTIC_TYPES.YELLOW_CARDS),
    redCards: findStat(statistics, STATISTIC_TYPES.RED_CARDS),
    goalkeeperSaves: findStat(statistics, STATISTIC_TYPES.GOALKEEPER_SAVES),
    totalPasses: findStat(statistics, STATISTIC_TYPES.TOTAL_PASSES),
    accuratePasses: findStat(statistics, STATISTIC_TYPES.PASSES_ACCURATE),
    passAccuracy: findStat(statistics, STATISTIC_TYPES.PASSES_PERCENTAGE),
    expectedGoals: findStat(statistics, STATISTIC_TYPES.EXPECTED_GOALS) || null,
  };
};

export const mapFixtureStatisticsFromDTO = (
  fixtureId: number,
  dtos: StatisticsDTO[]
): FixtureStatistics | null => {
  if (dtos.length < 2) return null;

  // API returns [homeTeam, awayTeam] order
  const [homeDTO, awayDTO] = dtos;

  return {
    fixtureId,
    homeStats: mapStatisticsFromDTO(homeDTO.statistics),
    awayStats: mapStatisticsFromDTO(awayDTO.statistics),
  };
};
