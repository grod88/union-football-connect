/**
 * API-Football configuration
 * Centralized API settings and endpoints
 */

export const API_CONFIG = {
  key: import.meta.env.VITE_API_FOOTBALL_KEY || '',
  host: import.meta.env.VITE_API_FOOTBALL_HOST || 'v3.football.api-sports.io',
  baseUrl: `https://${import.meta.env.VITE_API_FOOTBALL_HOST || 'v3.football.api-sports.io'}`,
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

  // Players
  playerById: (id: number) => `/players?id=${id}`,
} as const;
