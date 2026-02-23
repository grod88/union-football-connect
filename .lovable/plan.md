

## Fase 3 — Application Hooks (React Query)

Criar 6 hooks seguindo o padrao existente do projeto (singleton `footballRepository`, `useQuery` do TanStack v5, retorno direto do `useQuery` ou objeto customizado).

### Padrao identificado nos hooks existentes

- Importam `footballRepository` de `@/infrastructure/api-football/repository`
- Usam `useQuery<Type, Error>()` com query key array
- Exportam como `export const` ou `export function`
- Retornam o resultado do `useQuery` diretamente ou um objeto desestruturado

### Arquivos a criar

#### 1. `src/application/hooks/usePredictions.ts`
- Query key: `['predictions', fixtureId]`
- Chama `footballRepository.getPredictions(fixtureId)`
- staleTime: 1 hora (predicoes mudam pouco)
- enabled: `fixtureId > 0`
- Retorna `{ prediction, isLoading, error, refetch }`

#### 2. `src/application/hooks/useInjuries.ts`
- Query key: `['injuries', fixtureId]`
- Chama `footballRepository.getInjuries(fixtureId)`
- staleTime: 4 horas
- Importa `splitInjuriesByTeam` da entidade para separar home/away
- Retorna `{ injuries, homeInjuries, awayInjuries, total, isLoading, error }`

#### 3. `src/application/hooks/useFixturePlayers.ts`
- Query key: `['fixture-players', fixtureId]`
- Chama `footballRepository.getFixturePlayers(fixtureId)`
- staleTime: 1 minuto, refetchInterval: 2 min quando enabled
- Importa `topRatedPlayers` da entidade
- Filtra por `homeTeamId` para separar jogadores
- Retorna `{ allPlayers, homePlayers, awayPlayers, topRatedHome, topRatedAway, isLoading, error }`

#### 4. `src/application/hooks/useTopScorers.ts`
- Query key: `['top-scorers', leagueId, season, type]`
- Chama `getTopScorers` ou `getTopAssists` conforme parametro `type`
- staleTime: 24 horas
- Retorna `{ scorers, isLoading, error }`

#### 5. `src/application/hooks/useTeamStatistics.ts`
- Query key: `['team-statistics', teamId, leagueId, season]`
- Chama `footballRepository.getTeamStatistics(teamId, leagueId, season)`
- staleTime: 24 horas
- Retorna `{ stats, isLoading, error }`

#### 6. `src/application/hooks/useLeagueFilter.ts`
- Hook de estado local (sem API call)
- Gerencia selecao de ligas com `useState` + `sessionStorage`
- Lista fixa de ligas disponiveis com metadata (nome, pais, grupo)
- Funcoes: `toggleLeague`, `selectGroup`, `selectAll`, `clearAll`
- Retorna `{ availableLeagues, selectedLeagueIds, toggleLeague, ... }`

**Nota**: O hook `useFixtureStatisticsHalf` sera OMITIDO pois o metodo `getFixtureStatisticsHalf` nao existe na interface `IFootballRepository` nem no repository. Implementa-lo exigiria mudancas na Fase 2 (port + repository), que esta fora do escopo desta fase.

### Arquivo a editar

#### 7. `src/application/hooks/index.ts`
- Adicionar exports para os 6 novos hooks

### Resumo tecnico

| Hook | Arquivo | API call | staleTime | refetchInterval |
|------|---------|----------|-----------|-----------------|
| usePredictions | usePredictions.ts | getPredictions | 1h | nao |
| useInjuries | useInjuries.ts | getInjuries | 4h | nao |
| useFixturePlayers | useFixturePlayers.ts | getFixturePlayers | 1min | 2min (se enabled) |
| useTopScorers | useTopScorers.ts | getTopScorers/getTopAssists | 24h | nao |
| useTeamStatistics | useTeamStatistics.ts | getTeamStatistics | 24h | nao |
| useLeagueFilter | useLeagueFilter.ts | nenhum (estado local) | n/a | n/a |

Total: 6 novos arquivos + 1 edicao no index.ts

