/**
 * Match status codes from API-Football
 * Used to determine the current state of a fixture
 */
export enum MatchStatus {
  // Scheduled
  NOT_STARTED = 'NS',
  TIME_TO_BE_DEFINED = 'TBD',

  // In Play
  FIRST_HALF = '1H',
  HALFTIME = 'HT',
  SECOND_HALF = '2H',
  EXTRA_TIME = 'ET',
  BREAK_TIME = 'BT',
  PENALTIES = 'PEN',
  LIVE = 'LIVE',

  // Finished
  FINISHED = 'FT',
  FINISHED_AFTER_EXTRA_TIME = 'AET',
  FINISHED_AFTER_PENALTIES = 'PEN',

  // Postponed/Cancelled
  SUSPENDED = 'SUSP',
  INTERRUPTED = 'INT',
  POSTPONED = 'PST',
  CANCELLED = 'CANC',
  ABANDONED = 'ABD',
  AWARDED = 'AWD',
  WALKOVER = 'WO',
}

// Helper functions
export const isMatchLive = (status: MatchStatus): boolean => {
  return [
    MatchStatus.FIRST_HALF,
    MatchStatus.HALFTIME,
    MatchStatus.SECOND_HALF,
    MatchStatus.EXTRA_TIME,
    MatchStatus.BREAK_TIME,
    MatchStatus.PENALTIES,
    MatchStatus.LIVE,
  ].includes(status);
};

export const isMatchFinished = (status: MatchStatus): boolean => {
  return [
    MatchStatus.FINISHED,
    MatchStatus.FINISHED_AFTER_EXTRA_TIME,
    MatchStatus.FINISHED_AFTER_PENALTIES,
    MatchStatus.AWARDED,
    MatchStatus.WALKOVER,
  ].includes(status);
};

export const isMatchScheduled = (status: MatchStatus): boolean => {
  return [
    MatchStatus.NOT_STARTED,
    MatchStatus.TIME_TO_BE_DEFINED,
  ].includes(status);
};

export const isMatchPostponed = (status: MatchStatus): boolean => {
  return [
    MatchStatus.SUSPENDED,
    MatchStatus.INTERRUPTED,
    MatchStatus.POSTPONED,
    MatchStatus.CANCELLED,
    MatchStatus.ABANDONED,
  ].includes(status);
};

// Get display text for status
export const getMatchStatusText = (status: MatchStatus, locale: 'pt-BR' | 'en' = 'pt-BR'): string => {
  const texts: Record<MatchStatus, { 'pt-BR': string; en: string }> = {
    [MatchStatus.NOT_STARTED]: { 'pt-BR': 'Não iniciado', en: 'Not started' },
    [MatchStatus.TIME_TO_BE_DEFINED]: { 'pt-BR': 'Horário a definir', en: 'TBD' },
    [MatchStatus.FIRST_HALF]: { 'pt-BR': '1º Tempo', en: '1st Half' },
    [MatchStatus.HALFTIME]: { 'pt-BR': 'Intervalo', en: 'Half Time' },
    [MatchStatus.SECOND_HALF]: { 'pt-BR': '2º Tempo', en: '2nd Half' },
    [MatchStatus.EXTRA_TIME]: { 'pt-BR': 'Prorrogação', en: 'Extra Time' },
    [MatchStatus.BREAK_TIME]: { 'pt-BR': 'Intervalo', en: 'Break' },
    [MatchStatus.PENALTIES]: { 'pt-BR': 'Pênaltis', en: 'Penalties' },
    [MatchStatus.LIVE]: { 'pt-BR': 'Ao Vivo', en: 'Live' },
    [MatchStatus.FINISHED]: { 'pt-BR': 'Encerrado', en: 'Finished' },
    [MatchStatus.FINISHED_AFTER_EXTRA_TIME]: { 'pt-BR': 'Encerrado (Prorr.)', en: 'AET' },
    [MatchStatus.FINISHED_AFTER_PENALTIES]: { 'pt-BR': 'Encerrado (Pên.)', en: 'After Pen.' },
    [MatchStatus.SUSPENDED]: { 'pt-BR': 'Suspenso', en: 'Suspended' },
    [MatchStatus.INTERRUPTED]: { 'pt-BR': 'Interrompido', en: 'Interrupted' },
    [MatchStatus.POSTPONED]: { 'pt-BR': 'Adiado', en: 'Postponed' },
    [MatchStatus.CANCELLED]: { 'pt-BR': 'Cancelado', en: 'Cancelled' },
    [MatchStatus.ABANDONED]: { 'pt-BR': 'Abandonado', en: 'Abandoned' },
    [MatchStatus.AWARDED]: { 'pt-BR': 'W.O.', en: 'Awarded' },
    [MatchStatus.WALKOVER]: { 'pt-BR': 'W.O.', en: 'Walkover' },
  };

  return texts[status]?.[locale] || status;
};
