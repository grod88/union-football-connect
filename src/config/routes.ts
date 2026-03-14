/**
 * Application routes
 * Centralized route definitions
 */

export const ROUTES = {
  // Public pages
  HOME: '/',
  LIVE: '/ao-vivo',
  TODAY_MATCHES: '/jogos-do-dia',
  PRE_MATCH: '/pre-jogo/:fixtureId',
  STANDINGS: '/classificacao',
  CALENDAR: '/calendario',
  JOIN_US: '/junte-se',
  WHERE_FROM: '/de-onde-assiste',
  HISTORY: '/historico',
  COMMUNITY: '/comunidade',
  NEWSLETTER: '/newsletter',
  BLOG: '/blog',
  BLOG_POST: '/blog/:slug',
  PARTNERS: '/parceiros',

  // Admin routes
  ADMIN_BOLINHA: '/admin/bolinha',
  ADMIN_CLIPS: '/clipes/admin',
  ADMIN_CLIPS_LOGS: '/clipes/logs',
  ADMIN_CLIPS_STUDIO: '/clipes/studio',

  // OBS overlay routes (transparent, no chrome)
  OBS_SCOREBOARD: '/obs/placar',
  OBS_STATS: '/obs/stats',
  OBS_EVENTS: '/obs/eventos',
  OBS_FIELD: '/obs/campo',
  OBS_POLL: '/obs/enquete',
  OBS_LEAGUE: '/obs/liga',
  OBS_HOME: '/obs/home',
  OBS_AWAY: '/obs/away',
  OBS_SCORE: '/obs/score',
  OBS_TIME: '/obs/tempo',
  OBS_RATINGS: '/obs/ratings',
  OBS_LINEUPS: '/obs/escalacao',
  OBS_STANDINGS: '/obs/classificacao',
  OBS_PREDICTIONS: '/obs/predicao',
  OBS_H2H: '/obs/h2h',
  OBS_INJURIES: '/obs/desfalques',
  OBS_BOLINHA: '/obs/bolinha',
} as const;

// Helper to check if current route is an OBS route
export const isOBSRoute = (pathname: string): boolean => {
  return pathname.startsWith('/obs/');
};
