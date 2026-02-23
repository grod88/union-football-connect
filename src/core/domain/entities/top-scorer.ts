/**
 * Artilheiro ou líder de assistências de uma liga.
 * Dados vindos dos endpoints /players/topscorers e /players/topassists.
 */
export interface TopScorer {
  player: {
    id: number;
    name: string;
    firstname: string | null;
    lastname: string | null;
    age: number | null;
    nationality: string | null;
    photo: string | null;
  };
  statistics: {
    team: {
      id: number;
      name: string;
      logo: string | null;
    };
    league: {
      id: number;
      name: string;
      logo: string | null;
    };
    games: {
      appearances: number | null;
      minutes: number | null;
      position: string | null;
      rating: string | null;
    };
    goals: {
      total: number | null;
      assists: number | null;
    };
    penalty: {
      scored: number | null;
      missed: number | null;
    };
    cards: {
      yellow: number | null;
      red: number | null;
    };
  };
}
