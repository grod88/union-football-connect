/**
 * useLeagueFilter Hook
 * Manages league selection state with sessionStorage persistence.
 * No API calls — purely local state management.
 */
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ufl-league-filter';

const availableLeagues: Array<{ id: number; name: string; country: string; flag: string; group: string }> = [
  // Prioridade 1 — Brasil + Libertadores
  { id: 475, name: 'Paulistão A1', country: 'Brazil', flag: '🇧🇷', group: 'brasil' },
  { id: 71, name: 'Brasileirão Série A', country: 'Brazil', flag: '🇧🇷', group: 'brasil' },
  { id: 72, name: 'Brasileirão Série B', country: 'Brazil', flag: '🇧🇷', group: 'brasil' },
  { id: 73, name: 'Copa do Brasil', country: 'Brazil', flag: '🇧🇷', group: 'brasil' },
  // Prioridade 1-2 — Continental
  { id: 13, name: 'Copa Libertadores', country: 'South-America', flag: '🌎', group: 'continental' },
  { id: 11, name: 'Copa Sul-Americana', country: 'South-America', flag: '🌎', group: 'continental' },
  { id: 15, name: 'FIFA Club World Cup', country: 'World', flag: '🌍', group: 'continental' },
  // Prioridade 2-3 — Europa
  { id: 2, name: 'Champions League', country: 'World', flag: '🇪🇺', group: 'europa' },
  { id: 3, name: 'Europa League', country: 'World', flag: '🇪🇺', group: 'europa' },
  { id: 848, name: 'Conference League', country: 'World', flag: '🇪🇺', group: 'europa' },
  { id: 39, name: 'Premier League', country: 'England', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', group: 'europa' },
  { id: 140, name: 'La Liga', country: 'Spain', flag: '🇪🇸', group: 'europa' },
  { id: 135, name: 'Serie A', country: 'Italy', flag: '🇮🇹', group: 'europa' },
  { id: 78, name: 'Bundesliga', country: 'Germany', flag: '🇩🇪', group: 'europa' },
  { id: 61, name: 'Ligue 1', country: 'France', flag: '🇫🇷', group: 'europa' },
  { id: 94, name: 'Primeira Liga', country: 'Portugal', flag: '🇵🇹', group: 'europa' },
  { id: 88, name: 'Eredivisie', country: 'Netherlands', flag: '🇳🇱', group: 'europa' },
  // Argentina
  { id: 128, name: 'Copa Argentina', country: 'Argentina', flag: '🇦🇷', group: 'argentina' },
  { id: 130, name: 'Copa de la Liga Argentina', country: 'Argentina', flag: '🇦🇷', group: 'argentina' },
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
    groups: ['brasil', 'continental', 'europa', 'argentina'] as const,
  };
}
