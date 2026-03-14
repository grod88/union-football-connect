/**
 * Event entity
 * Represents a match event (goal, card, substitution, etc.)
 */
import { EventType } from '../enums';
import type { Team } from './team';

export interface FixtureEvent {
  id: number;
  fixtureId: number;
  timeElapsed: number;
  timeExtra: number | null;
  team: Team;
  player: {
    id: number | null;
    name: string;
  };
  assist: {
    id: number | null;
    name: string | null;
  } | null;
  type: EventType;
  detail: string;
  comments: string | null;
}

// Factory function
export const createEvent = (
  data: Partial<FixtureEvent> & {
    fixtureId: number;
    timeElapsed: number;
    team: Team;
    type: EventType;
  }
): FixtureEvent => ({
  id: data.id || Math.random(),
  fixtureId: data.fixtureId,
  timeElapsed: data.timeElapsed,
  timeExtra: data.timeExtra ?? null,
  team: data.team,
  player: data.player || { id: null, name: '' },
  assist: data.assist ?? null,
  type: data.type,
  detail: data.detail || '',
  comments: data.comments ?? null,
});

// Helper functions
export const getEventTimeDisplay = (event: FixtureEvent): string => {
  const extra = event.timeExtra ? `+${event.timeExtra}` : '';
  return `${event.timeElapsed}${extra}'`;
};

export const sortEventsByTime = (events: FixtureEvent[]): FixtureEvent[] => {
  return [...events].sort((a, b) => {
    const timeA = a.timeElapsed + (a.timeExtra || 0);
    const timeB = b.timeElapsed + (b.timeExtra || 0);
    return timeA - timeB;
  });
};

export const filterGoalEvents = (events: FixtureEvent[]): FixtureEvent[] => {
  return events.filter(
    (e) =>
      e.type === EventType.GOAL &&
      e.detail !== 'Missed Penalty' &&
      !e.detail.toLowerCase().includes('cancelled')
  );
};

export const filterCardEvents = (events: FixtureEvent[]): FixtureEvent[] => {
  return events.filter((e) => e.type === EventType.CARD);
};

export const filterSubstitutions = (events: FixtureEvent[]): FixtureEvent[] => {
  return events.filter((e) => e.type === EventType.SUBSTITUTION);
};
