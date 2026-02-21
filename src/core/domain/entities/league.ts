/**
 * League entity
 * Represents a football league/competition
 */
export interface League {
  id: number;
  name: string;
  logo: string;
  country: string;
  countryFlag?: string;
  season: number;
  round?: string;
}

// Factory function
export const createLeague = (data: Partial<League> & { id: number; name: string }): League => ({
  id: data.id,
  name: data.name,
  logo: data.logo || '',
  country: data.country || '',
  countryFlag: data.countryFlag,
  season: data.season || new Date().getFullYear(),
  round: data.round,
});
