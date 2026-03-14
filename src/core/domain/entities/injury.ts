/**
 * Jogador ausente de uma partida (lesão, suspensão, etc).
 * Dados vindos do endpoint /injuries da API-Football.
 */
export interface Injury {
  /** Jogador ausente */
  player: {
    id: number;
    name: string;
    photo: string | null;
    type: InjuryType;
    reason: string;
  };
  /** Time do jogador */
  team: {
    id: number;
    name: string;
    logo: string | null;
  };
  /** Fixture e liga */
  fixtureId: number;
  leagueId: number;
  leagueName: string;
  leagueSeason: number;
}

export type InjuryType = 'Missing Fixture' | 'Questionable';

/** Helper: separa injuries por time */
export function splitInjuriesByTeam(
  injuries: Injury[],
  homeTeamId: number
): { home: Injury[]; away: Injury[] } {
  return {
    home: injuries.filter(i => i.team.id === homeTeamId),
    away: injuries.filter(i => i.team.id !== homeTeamId),
  };
}
