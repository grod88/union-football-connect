/**
 * useLeagueFilter Hook
 * Manages league selection state with sessionStorage persistence.
 * No API calls — purely local state management.
 */
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ufl-league-filter';

const availableLeagues: Array<{ id: number; name: string; country: string; group: string }> = [
  { id: 475, name: 'Paulistão', country: 'Brazil', group: 'brasil' },
  { id: 71, name: 'Brasileirão A', country: 'Brazil', group: 'brasil' },
  { id: 72, name: 'Brasileirão B', country: 'Brazil', group: 'brasil' },
  { id: 73, name: 'Copa do Brasil', country: 'Brazil', group: 'brasil' },
  { id: 13, name: 'Libertadores', country: 'South America', group: 'continental' },
  { id: 11, name: 'Sul-Americana', country: 'South America', group: 'continental' },
  { id: 2, name: 'Champions League', country: 'Europe', group: 'europa' },
  { id: 39, name: 'Premier League', country: 'England', group: 'europa' },
  { id: 140, name: 'La Liga', country: 'Spain', group: 'europa' },
  { id: 135, name: 'Serie A', country: 'Italy', group: 'europa' },
];

const DEFAULT_SELECTED = [475, 71, 73, 13];

export function useLeagueFilter() {
  const [selectedLeagueIds, setSelectedLeagueIds] = useState<number[]>(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : DEFAULT_SELECTED;
    } catch {
      return DEFAULT_SELECTED;
    }
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(selectedLeagueIds));
  }, [selectedLeagueIds]);

  const toggleLeague = (leagueId: number) => {
    setSelectedLeagueIds(prev =>
      prev.includes(leagueId)
        ? prev.filter(id => id !== leagueId)
        : [...prev, leagueId]
    );
  };

  const selectGroup = (group: string) => {
    const groupIds = availableLeagues.filter(l => l.group === group).map(l => l.id);
    setSelectedLeagueIds(prev => {
      const allSelected = groupIds.every(id => prev.includes(id));
      if (allSelected) return prev.filter(id => !groupIds.includes(id));
      return [...new Set([...prev, ...groupIds])];
    });
  };

  const selectAll = () => setSelectedLeagueIds(availableLeagues.map(l => l.id));
  const clearAll = () => setSelectedLeagueIds([]);

  return {
    availableLeagues,
    selectedLeagueIds,
    toggleLeague,
    selectGroup,
    selectAll,
    clearAll,
    isLeagueSelected: (id: number) => selectedLeagueIds.includes(id),
    groups: ['brasil', 'continental', 'europa'] as const,
  };
}
