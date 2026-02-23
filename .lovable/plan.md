

## Correcoes: Landing Page (Proximo Jogo + Classificacao) e Tela Ao Vivo

### Problema 1: Landing Page - Proximo Jogo busca apenas Paulistao

O hook `useNextMatch` filtra por `leagueId = LEAGUES.PAULISTAO` por padrao, o que impede de encontrar jogos do Sao Paulo em outras competicoes (Brasileirao, Libertadores, etc.). A busca precisa ser sem filtro de liga para trazer o proximo jogo independente da competicao.

### Problema 2: Landing Page - Classificacao fixa no Paulistao

O componente `StandingsSummary` usa `LEAGUES.PAULISTAO` fixo. Deveria mostrar a classificacao da liga do proximo jogo (se o proximo jogo e pelo Brasileirao, mostra a tabela do Brasileirao).

### Problema 3: Ao Vivo - "Mostrar todos os X jogos" nao funciona

O botao chama `showAll()` que define priorities `[1, 2, 3]`, mas jogos de ligas nao monitoradas nao tem priority, entao continuam ocultos. A solucao e fazer o showAll incluir TODOS os jogos, nao apenas os de ligas monitoradas.

### Problema 4: Ao Vivo - OtherMatchesBanner sem painel expandido

O componente `OtherMatchesBanner` renderiza `CompactFixtureRow` mas nao renderiza o `ExpandedFixturePanel` quando um jogo e clicado, entao clicar neles nao mostra detalhes.

---

### Detalhes Tecnicos

#### Arquivo 1: `src/application/hooks/useNextMatch.ts`

Remover o filtro de `leagueId` e `season` da chamada padrao, para buscar o proximo jogo do Sao Paulo em QUALQUER liga:

```text
ANTES: getFixturesByTeam(teamId, { next: 1, leagueId, season })
DEPOIS: getFixturesByTeam(teamId, { next: 1 })
```

Isso faz a API retornar o proximo jogo independente da competicao.

#### Arquivo 2: `src/pages/Index.tsx`

Atualizar `StandingsSummary` para usar a liga do proximo jogo dinamicamente:

- Importar `useNextMatch`
- Buscar o proximo jogo e extrair `fixture.league.id` e `fixture.league.season`
- Passar esses valores para `StandingsTable` em vez dos hardcoded `LEAGUES.PAULISTAO` e `CURRENT_SEASON`
- Determinar a season correta baseado na liga (ligas europeias usam season - 1)

#### Arquivo 3: `src/application/hooks/useFilteredLiveFixtures.ts`

Atualizar `showAll` para incluir jogos de ligas NAO monitoradas tambem. Adicionar um state `showAllMatches` que, quando ativo, bypassa o filtro de `visibleLeagueIds`:

```text
ANTES: showAll: () => setVisiblePriorities([1, 2, 3])
DEPOIS: showAll inclui flag que mostra TODOS os jogos, inclusive nao monitorados
```

#### Arquivo 4: `src/presentation/pages/site/LiveDashboard.tsx`

Quando `showAll` estiver ativo, os jogos "outros" devem aparecer inline na lista principal em vez de no banner separado.

#### Arquivo 5: `src/presentation/components/live/OtherMatchesBanner.tsx`

Adicionar `ExpandedFixturePanel` apos cada `CompactFixtureRow` para que clicar num jogo expanda os detalhes, igual ao comportamento da lista principal.

### Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/application/hooks/useNextMatch.ts` | Remover filtro de leagueId para buscar proximo jogo em qualquer liga |
| `src/pages/Index.tsx` | StandingsSummary dinamico baseado na liga do proximo jogo |
| `src/application/hooks/useFilteredLiveFixtures.ts` | showAll inclui jogos de ligas nao monitoradas |
| `src/presentation/pages/site/LiveDashboard.tsx` | Integrar showAll com lista completa |
| `src/presentation/components/live/OtherMatchesBanner.tsx` | Adicionar ExpandedFixturePanel nos jogos expandidos |
