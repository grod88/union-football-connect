/**
 * DTO da resposta do endpoint /injuries?fixture={id}
 */
export interface InjuryResponseDTO {
  player: {
    id: number;
    name: string;
    photo: string;
    type: string;
    reason: string;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  fixture: {
    id: number;
    timezone: string;
    date: string;
    timestamp: number;
  };
  league: {
    id: number;
    season: number;
    name: string;
    country: string;
    logo: string;
    flag: string | null;
  };
}
