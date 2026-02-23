/**
 * Estatísticas de um jogador durante uma partida específica.
 * Dados vindos do endpoint /fixtures/players da API-Football.
 */
export interface PlayerFixtureStats {
  player: {
    id: number;
    name: string;
    photo: string | null;
  };
  team: {
    id: number;
    name: string;
    logo: string | null;
  };
  /** Dados de jogo */
  games: {
    minutes: number | null;
    position: string | null;
    rating: number | null;
    captain: boolean;
    substitute: boolean;
  };
  /** Chutes */
  shots: { total: number | null; on: number | null };
  /** Gols */
  goals: { total: number | null; conceded: number | null; assists: number | null };
  /** Passes */
  passes: { total: number | null; key: number | null; accuracy: number | null };
  /** Defesa */
  tackles: { total: number | null; blocks: number | null; interceptions: number | null };
  /** Duelos */
  duels: { total: number | null; won: number | null };
  /** Cartões */
  cards: { yellow: number; red: number };
  /** Faltas */
  fouls: { drawn: number | null; committed: number | null };
}

/** Helper: ordena jogadores por rating (maior primeiro) */
export function sortByRating(players: PlayerFixtureStats[]): PlayerFixtureStats[] {
  return [...players].sort((a, b) => (b.games.rating ?? 0) - (a.games.rating ?? 0));
}

/** Helper: top N jogadores por rating */
export function topRatedPlayers(players: PlayerFixtureStats[], n: number = 3): PlayerFixtureStats[] {
  return sortByRating(players).slice(0, n);
}
