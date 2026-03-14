/**
 * DTO da resposta do endpoint /fixtures/players?fixture={id}
 */
export interface PlayerFixtureStatsResponseDTO {
  team: {
    id: number;
    name: string;
    logo: string;
    update: string;
  };
  players: Array<{
    player: {
      id: number;
      name: string;
      photo: string;
    };
    statistics: Array<{
      games: {
        minutes: number | null;
        number: number;
        position: string;
        rating: string | null;
        captain: boolean;
        substitute: boolean;
      };
      offsides: number | null;
      shots: { total: number | null; on: number | null };
      goals: { total: number | null; conceded: number | null; assists: number | null; saves: number | null };
      passes: { total: number | null; key: number | null; accuracy: string | null };
      tackles: { total: number | null; blocks: number | null; interceptions: number | null };
      duels: { total: number | null; won: number | null };
      dribbles: { attempts: number | null; success: number | null; past: number | null };
      fouls: { drawn: number | null; committed: number | null };
      cards: { yellow: number; red: number };
      penalty: { won: number | null; committed: number | null; scored: number | null; missed: number | null; saved: number | null };
    }>;
  }>;
}
