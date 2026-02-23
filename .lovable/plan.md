

## Corrigir Filtros e Dados da Pagina /classificacao

### Problema 1: Filtros em scroll horizontal

O container dos filtros usa `overflow-x-auto` que cria uma barra de scroll. Vamos trocar por `flex-wrap` para que os botoes quebrem linha naturalmente sem scroll.

### Problema 2: Ligas europeias sem dados

As ligas europeias retornam `results: 0` porque o sistema usa `CURRENT_SEASON = 2026` para todas. Porem, ligas europeias seguem calendario agosto-maio, entao a temporada atual na API-Football e `2025` (temporada 2025/26). Ligas brasileiras usam ano calendario, entao `2026` esta correto.

Evidencia nos network requests: todas as chamadas `/standings?league=39&season=2026`, `/standings?league=2&season=2026`, etc. retornam `"results": 0`.

### Solucao

#### Arquivo 1: `src/presentation/pages/site/Standings.tsx`

1. Trocar `overflow-x-auto` por `flex-wrap` no container dos filtros
2. Adicionar a season correta por liga no array `leagueGroups` (campo `season` em cada liga)
3. Passar o `season` correto para `StandingsTable` e `TopScorersTable`

Cada liga no array tera um campo `season`:
- Ligas brasileiras: `CURRENT_SEASON` (2026)
- Ligas europeias e Champions/Libertadores: `CURRENT_SEASON - 1` (2025)

O state `selectedLeagueId` sera expandido para incluir o season correspondente, ou criaremos um lookup simples.

#### Arquivo 2: Nenhum outro arquivo precisa mudar

O `useStandings`, `StandingsTable` e `TopScorersTable` ja recebem `season` como prop -- so precisamos passar o valor correto.

### Detalhes Tecnicos

```text
leagueGroups com season:

Brasil (season = 2026):
  Paulistao (475), Brasileirao A (71), Serie B (72)

Continental (season = 2025):
  Libertadores (13), Champions (2)

Europa (season = 2025):
  Premier League (39), La Liga (140), Serie A (135),
  Bundesliga (78), Ligue 1 (61), Primeira Liga (94)
```

No componente, ao selecionar uma liga, guardaremos tanto o `leagueId` quanto o `season`:

```text
const selectedLeague = allLeagues.find(l => l.id === selectedLeagueId)
const season = selectedLeague?.season ?? CURRENT_SEASON

<StandingsTable leagueId={selectedLeagueId} season={season} />
<TopScorersTable leagueId={selectedLeagueId} season={season} />
```

Layout dos filtros:

```text
ANTES:  flex overflow-x-auto  (scroll horizontal)
DEPOIS: flex flex-wrap gap-2   (quebra linha, sem scroll)
```

### Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/presentation/pages/site/Standings.tsx` | Trocar scroll por flex-wrap; adicionar season por liga; passar season correto aos componentes |

