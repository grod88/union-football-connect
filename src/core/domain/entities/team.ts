/**
 * Team entity
 * Represents a football team
 */
export interface Team {
  id: number;
  name: string;
  logo: string;
  shortName?: string;
  code?: string;
  country?: string;
}

// Factory function
export const createTeam = (data: Partial<Team> & { id: number; name: string }): Team => ({
  id: data.id,
  name: data.name,
  logo: data.logo || '',
  shortName: data.shortName,
  code: data.code,
  country: data.country,
});
