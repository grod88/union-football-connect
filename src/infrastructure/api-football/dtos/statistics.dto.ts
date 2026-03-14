/**
 * Statistics DTOs
 * Data Transfer Objects matching API-Football statistics response
 */

export interface StatisticsDTO {
  team: {
    id: number;
    name: string;
    logo: string;
  };
  statistics: StatisticItemDTO[];
}

export interface StatisticItemDTO {
  type: string;
  value: number | string | null;
}

// Known statistic types from API-Football
export const STATISTIC_TYPES = {
  SHOTS_ON_GOAL: 'Shots on Goal',
  SHOTS_OFF_GOAL: 'Shots off Goal',
  TOTAL_SHOTS: 'Total Shots',
  BLOCKED_SHOTS: 'Blocked Shots',
  SHOTS_INSIDE_BOX: 'Shots insidebox',
  SHOTS_OUTSIDE_BOX: 'Shots outsidebox',
  FOULS: 'Fouls',
  CORNER_KICKS: 'Corner Kicks',
  OFFSIDES: 'Offsides',
  BALL_POSSESSION: 'Ball Possession',
  YELLOW_CARDS: 'Yellow Cards',
  RED_CARDS: 'Red Cards',
  GOALKEEPER_SAVES: 'Goalkeeper Saves',
  TOTAL_PASSES: 'Total passes',
  PASSES_ACCURATE: 'Passes accurate',
  PASSES_PERCENTAGE: 'Passes %',
  EXPECTED_GOALS: 'expected_goals',
} as const;
