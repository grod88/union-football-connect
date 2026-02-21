/**
 * Application routes
 * Centralized route definitions
 */

export const ROUTES = {
  // Public pages
  HOME: '/',
  LIVE: '/ao-vivo',
  TODAY_MATCHES: '/jogos-do-dia',
  JOIN_US: '/junte-se',
  WHERE_FROM: '/de-onde-assiste',
  HISTORY: '/historico',
  COMMUNITY: '/comunidade',
  NEWSLETTER: '/newsletter',
  BLOG: '/blog',
  BLOG_POST: '/blog/:slug',
  PARTNERS: '/parceiros',

  // OBS overlay routes (transparent, no chrome)
  OBS_SCOREBOARD: '/obs/placar',
  OBS_STATS: '/obs/stats',
  OBS_EVENTS: '/obs/eventos',
  OBS_FIELD: '/obs/campo',
  OBS_POLL: '/obs/enquete',
} as const;

// Helper to check if current route is an OBS route
export const isOBSRoute = (pathname: string): boolean => {
  return pathname.startsWith('/obs/');
};
