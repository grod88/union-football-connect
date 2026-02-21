/**
 * Lineups DTOs
 * Data Transfer Objects matching API-Football lineups response
 */

export interface LineupDTO {
  team: {
    id: number;
    name: string;
    logo: string;
    colors: {
      player: ColorDTO;
      goalkeeper: ColorDTO;
    } | null;
  };
  formation: string;
  startXI: PlayerSlotDTO[];
  substitutes: PlayerSlotDTO[];
  coach: {
    id: number | null;
    name: string;
    photo: string | null;
  };
}

export interface PlayerSlotDTO {
  player: {
    id: number;
    name: string;
    number: number;
    pos: string;
    grid: string | null;
  };
}

export interface ColorDTO {
  primary: string;
  number: string;
  border: string;
}
