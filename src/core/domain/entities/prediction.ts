/**
 * Predição de resultado de uma partida.
 * Dados vindos do endpoint /predictions da API-Football.
 */
export interface Prediction {
  /** Probabilidades de resultado */
  winner: {
    teamId: number | null;
    teamName: string | null;
    comment: string | null;
  };
  /** Probabilidades percentuais */
  percentages: {
    home: string;
    draw: string;
    away: string;
  };
  /** Indicador de vitória ou empate */
  winOrDraw: boolean;
  /** Predição de gols under/over */
  underOver: string | null;
  /** Predição de gols do mandante */
  goalsHome: string | null;
  /** Predição de gols do visitante */
  goalsAway: string | null;
  /** Conselho textual da IA */
  advice: string | null;
  /** Comparação estatística entre os dois times */
  comparison: PredictionComparison;
}

export interface PredictionComparison {
  form: { home: string; away: string };
  attack: { home: string; away: string };
  defense: { home: string; away: string };
  poissonDistribution: { home: string; away: string };
  headToHead: { home: string; away: string };
  goals: { home: string; away: string };
  total: { home: string; away: string };
}

/** Helper: converte string "45%" para number 45 */
export function parsePercentage(value: string | null): number {
  if (!value) return 0;
  return parseInt(value.replace('%', ''), 10) || 0;
}
