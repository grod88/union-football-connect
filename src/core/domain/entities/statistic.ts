/**
 * Statistic entities
 * Represents match statistics
 */

export interface StatisticValue {
  type: string;
  value: number | string | null;
}

export interface TeamStatistics {
  teamId: number;
  teamName: string;
  statistics: StatisticValue[];
}

export interface FixtureStatistics {
  fixtureId: number;
  homeStats: ParsedStatistics;
  awayStats: ParsedStatistics;
}

// Parsed/normalized statistics for easier consumption
export interface ParsedStatistics {
  shotsOnGoal: number;
  shotsOffGoal: number;
  totalShots: number;
  blockedShots: number;
  insideBoxShots: number;
  outsideBoxShots: number;
  fouls: number;
  corners: number;
  offsides: number;
  possession: number; // percentage (0-100)
  yellowCards: number;
  redCards: number;
  goalkeeperSaves: number;
  totalPasses: number;
  accuratePasses: number;
  passAccuracy: number; // percentage (0-100)
  expectedGoals: number | null;
}

// Default/empty statistics
export const createEmptyStatistics = (): ParsedStatistics => ({
  shotsOnGoal: 0,
  shotsOffGoal: 0,
  totalShots: 0,
  blockedShots: 0,
  insideBoxShots: 0,
  outsideBoxShots: 0,
  fouls: 0,
  corners: 0,
  offsides: 0,
  possession: 0,
  yellowCards: 0,
  redCards: 0,
  goalkeeperSaves: 0,
  totalPasses: 0,
  accuratePasses: 0,
  passAccuracy: 0,
  expectedGoals: null,
});

// Statistics that should be displayed in comparison bars
export const DISPLAY_STATISTICS: Array<{
  key: keyof ParsedStatistics;
  labelPtBr: string;
  labelEn: string;
  isPercentage?: boolean;
}> = [
  { key: 'possession', labelPtBr: 'Posse de bola', labelEn: 'Ball Possession', isPercentage: true },
  { key: 'totalShots', labelPtBr: 'Finalizações', labelEn: 'Total Shots' },
  { key: 'shotsOnGoal', labelPtBr: 'Chutes no gol', labelEn: 'Shots on Goal' },
  { key: 'corners', labelPtBr: 'Escanteios', labelEn: 'Corners' },
  { key: 'fouls', labelPtBr: 'Faltas', labelEn: 'Fouls' },
  { key: 'yellowCards', labelPtBr: 'Cartões amarelos', labelEn: 'Yellow Cards' },
  { key: 'redCards', labelPtBr: 'Cartões vermelhos', labelEn: 'Red Cards' },
  { key: 'offsides', labelPtBr: 'Impedimentos', labelEn: 'Offsides' },
  { key: 'passAccuracy', labelPtBr: 'Precisão de passes', labelEn: 'Pass Accuracy', isPercentage: true },
];
