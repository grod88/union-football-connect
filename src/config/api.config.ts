/**
 * API-Football configuration
 * Centralized API settings and endpoints
 */
const API_FOOTBALL_HOST = 'v3.football.api-sports.io';

export const API_CONFIG = {
  host: API_FOOTBALL_HOST,
  baseUrl: `https://${API_FOOTBALL_HOST}`,
} as const;

// API Endpoints
export const ENDPOINTS = {
  // Fixtures
  fixtures: '/fixtures',
  fixtureById: (id: number) => `/fixtures?id=${id}`,
  fixturesByTeam: (teamId: number, next?: number) =>
    `/fixtures?team=${teamId}${next ? `&next=${next}` : ''}`,
  fixturesByLeague: (leagueId: number, season: number) =>
    `/fixtures?league=${leagueId}&season=${season}`,
  liveFixtures: '/fixtures?live=all',

  // Fixture details
  fixtureStatistics: (fixtureId: number) => `/fixtures/statistics?fixture=${fixtureId}`,
  fixtureEvents: (fixtureId: number) => `/fixtures/events?fixture=${fixtureId}`,
  fixtureLineups: (fixtureId: number) => `/fixtures/lineups?fixture=${fixtureId}`,
  fixturePlayers: (fixtureId: number) => `/fixtures/players?fixture=${fixtureId}`,

  // Head to head
  headToHead: (team1Id: number, team2Id: number) =>
    `/fixtures/headtohead?h2h=${team1Id}-${team2Id}`,

  // Standings
  standings: (leagueId: number, season: number) =>
    `/standings?league=${leagueId}&season=${season}`,

  // Teams
  teamById: (id: number) => `/teams?id=${id}`,
  teamStatistics: (teamId: number, leagueId: number, season: number) =>
    `/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`,

  // Players
  playerById: (id: number) => `/players?id=${id}`,
  topScorers: (leagueId: number, season: number) =>
    `/players/topscorers?league=${leagueId}&season=${season}`,
  topAssists: (leagueId: number, season: number) =>
    `/players/topassists?league=${leagueId}&season=${season}`,

  // Predictions
  predictions: (fixtureId: number) => `/predictions?fixture=${fixtureId}`,

  // Injuries
  injuries: (fixtureId: number) => `/injuries?fixture=${fixtureId}`,
  injuriesByLeague: (leagueId: number, season: number) =>
    `/injuries?league=${leagueId}&season=${season}`,

  // Leagues
  leagues: (leagueId: number) => `/leagues?id=${leagueId}`,
} as const;
