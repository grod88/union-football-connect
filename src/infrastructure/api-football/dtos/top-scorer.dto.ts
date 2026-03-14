/**
 * DTO da resposta dos endpoints /players/topscorers e /players/topassists
 */
export interface TopScorerResponseDTO {
  player: {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: { date: string; place: string; country: string };
    nationality: string;
    height: string | null;
    weight: string | null;
    injured: boolean;
    photo: string;
  };
  statistics: Array<{
    team: { id: number; name: string; logo: string };
    league: { id: number; name: string; country: string; logo: string; flag: string; season: number };
    games: { appearances: number | null; lineups: number | null; minutes: number | null; number: number | null; position: string; rating: string | null; captain: boolean };
    goals: { total: number | null; conceded: number | null; assists: number | null; saves: number | null };
    penalty: { won: number | null; committed: number | null; scored: number | null; missed: number | null; saved: number | null };
    cards: { yellow: number | null; yellowred: number | null; red: number | null };
  }>;
}
