/**
 * Match event types from API-Football
 * Used to categorize events in a fixture
 */
export enum EventType {
  GOAL = 'Goal',
  CARD = 'Card',
  SUBSTITUTION = 'subst',
  VAR = 'Var',
}

export enum EventDetail {
  // Goals
  NORMAL_GOAL = 'Normal Goal',
  OWN_GOAL = 'Own Goal',
  PENALTY = 'Penalty',
  MISSED_PENALTY = 'Missed Penalty',

  // Cards
  YELLOW_CARD = 'Yellow Card',
  RED_CARD = 'Red Card',
  SECOND_YELLOW = 'Second Yellow card',

  // VAR
  GOAL_CANCELLED = 'Goal cancelled',
  PENALTY_CONFIRMED = 'Penalty confirmed',
  GOAL_CONFIRMED = 'Goal Disallowed - offside',
}

// Helper functions
export const isGoalEvent = (type: EventType, detail: string): boolean => {
  return type === EventType.GOAL &&
    detail !== EventDetail.MISSED_PENALTY &&
    !detail.toLowerCase().includes('cancelled');
};

export const isCardEvent = (type: EventType): boolean => {
  return type === EventType.CARD;
};

export const isYellowCard = (detail: string): boolean => {
  return detail === EventDetail.YELLOW_CARD || detail === EventDetail.SECOND_YELLOW;
};

export const isRedCard = (detail: string): boolean => {
  return detail === EventDetail.RED_CARD || detail === EventDetail.SECOND_YELLOW;
};

export const isSubstitution = (type: EventType): boolean => {
  return type === EventType.SUBSTITUTION;
};

// Get icon/emoji for event
export const getEventIcon = (type: EventType, detail: string): string => {
  switch (type) {
    case EventType.GOAL:
      if (detail === EventDetail.OWN_GOAL) return '⚽ (GC)';
      if (detail === EventDetail.PENALTY) return '⚽ (P)';
      if (detail === EventDetail.MISSED_PENALTY) return '❌';
      return '⚽';
    case EventType.CARD:
      if (isRedCard(detail)) return '🟥';
      return '🟨';
    case EventType.SUBSTITUTION:
      return '🔄';
    case EventType.VAR:
      return '📺';
    default:
      return '•';
  }
};
