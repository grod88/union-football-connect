/**
 * Application constants
 * Centralized configuration for leagues, teams, and refresh intervals
 */

// League IDs from API-Football
export const LEAGUES = {
  PAULISTAO: 475,
  BRASILEIRAO_A: 71,
  BRASILEIRAO_B: 72,
  LIBERTADORES: 13,
  COPA_DO_BRASIL: 73,
  SULAMERICANA: 11,
  CHAMPIONS_LEAGUE: 2,
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  SERIE_A_ITALY: 135,
  BUNDESLIGA: 78,
  LIGUE_1: 61,
  PRIMEIRA_LIGA: 94,
} as const;

// Team IDs from API-Football
export const TEAMS = {
  SAO_PAULO: 126,
  PALMEIRAS: 121,
  CORINTHIANS: 131,
  SANTOS: 128,
  FLAMENGO: 127,
  FLUMINENSE: 124,
  BOTAFOGO: 120,
  VASCO: 133,
  GREMIO: 130,
  INTERNACIONAL: 119,
  ATLETICO_MG: 1062,
  CRUZEIRO: 129,
  BRASIL: 6,
  FRANCA: 2,
  CROACIA: 3,
} as const;

// Current season
export const CURRENT_SEASON = 2026;

// Refresh intervals for React Query (in milliseconds)
export const REFRESH_INTERVALS = {
  LIVE_FIXTURE: 15_000,      // 15 seconds - for live match data
  STATISTICS: 30_000,        // 30 seconds - for match statistics
  EVENTS: 15_000,            // 15 seconds - for match events
  STANDINGS: 300_000,        // 5 minutes - for league standings
  NEXT_MATCH: 300_000,       // 5 minutes - for next match card
  CALENDAR: 300_000,         // 5 minutes - for calendar fixtures
} as const;

// Social links
export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/unionfootball.live',
  tiktok: 'https://www.tiktok.com/@unionfootball.live',
  youtube: 'https://www.youtube.com/@UnionFootballLive',
  discord: '#', // placeholder
  email: 'live.unionfootball@gmail.com',
} as const;

// Design tokens
export const COLORS = {
  primary: '#d4a853',      // Gold
  background: '#0a0a0a',   // Black
  cardSurface: '#1a1a1a',  // Dark gray
  cardSurfaceAlt: '#2a2a2a',
  accent: '#c0392b',       // Red
  accentLight: '#e74c3c',
  text: '#ffffff',
  textMuted: '#b0b0b0',
} as const;
