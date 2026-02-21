/**
 * Fixture entity
 * Represents a football match
 */
import { MatchStatus } from '../enums';
import type { Team } from './team';
import type { League } from './league';

export interface Fixture {
  id: number;
  date: Date;
  timestamp: number;
  timezone: string;
  status: MatchStatus;
  elapsed: number | null;
  extraTime?: number | null;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  goalsHome: number | null;
  goalsAway: number | null;
  venue?: {
    name: string;
    city: string;
  };
  referee?: string;
}

// Factory function
export const createFixture = (
  data: Partial<Fixture> & {
    id: number;
    homeTeam: Team;
    awayTeam: Team;
    league: League;
  }
): Fixture => ({
  id: data.id,
  date: data.date || new Date(),
  timestamp: data.timestamp || Date.now(),
  timezone: data.timezone || 'UTC',
  status: data.status || MatchStatus.NOT_STARTED,
  elapsed: data.elapsed ?? null,
  extraTime: data.extraTime,
  league: data.league,
  homeTeam: data.homeTeam,
  awayTeam: data.awayTeam,
  goalsHome: data.goalsHome ?? null,
  goalsAway: data.goalsAway ?? null,
  venue: data.venue,
  referee: data.referee,
});

// Helper functions
export const getScoreDisplay = (fixture: Fixture): string => {
  const home = fixture.goalsHome ?? '-';
  const away = fixture.goalsAway ?? '-';
  return `${home} - ${away}`;
};

export const getElapsedDisplay = (fixture: Fixture): string => {
  if (fixture.elapsed === null) return '';

  const extra = fixture.extraTime ? `+${fixture.extraTime}` : '';
  return `${fixture.elapsed}${extra}'`;
};

export const isFixtureLive = (fixture: Fixture): boolean => {
  return [
    MatchStatus.FIRST_HALF,
    MatchStatus.HALFTIME,
    MatchStatus.SECOND_HALF,
    MatchStatus.EXTRA_TIME,
    MatchStatus.BREAK_TIME,
    MatchStatus.PENALTIES,
    MatchStatus.LIVE,
  ].includes(fixture.status);
};

export const isFixtureFinished = (fixture: Fixture): boolean => {
  return [
    MatchStatus.FINISHED,
    MatchStatus.FINISHED_AFTER_EXTRA_TIME,
    MatchStatus.FINISHED_AFTER_PENALTIES,
  ].includes(fixture.status);
};
