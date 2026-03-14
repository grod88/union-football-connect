/**
 * Events DTOs
 * Data Transfer Objects matching API-Football events response
 */

export interface EventDTO {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: {
    id: number;
    name: string;
    logo: string;
  };
  player: {
    id: number | null;
    name: string;
  };
  assist: {
    id: number | null;
    name: string | null;
  };
  type: string; // 'Goal', 'Card', 'subst', 'Var'
  detail: string; // 'Normal Goal', 'Yellow Card', etc.
  comments: string | null;
}
