

## Ajustar Filtros da Pagina /classificacao com Ligas Europeias

### O que muda

A lista de ligas no seletor sera expandida de 6 para ~11 opcoes, removendo Copa do Brasil e Sul-Americana (que nao tem formato de classificacao tradicional) e adicionando as principais ligas europeias. Tambem vamos adicionar os IDs faltantes no `LEAGUES` constant.

### Novas ligas no seletor

1. Paulistao (475) - manter
2. Brasileirao Serie A (71) - manter
3. Brasileirao Serie B (72) - manter
4. Libertadores (13) - manter
5. Champions League (2) - NOVO
6. Premier League (39) - NOVO
7. La Liga (140) - NOVO
8. Serie A Italia (135) - NOVO
9. Bundesliga (78) - NOVO
10. Ligue 1 (61) - NOVO
11. Primeira Liga Portugal (94) - NOVO

### Detalhes Tecnicos

#### Arquivo 1: `src/config/constants.ts`

Adicionar os IDs das ligas europeias ao objeto `LEAGUES`:

```
CHAMPIONS_LEAGUE: 2,
PREMIER_LEAGUE: 39,
LA_LIGA: 140,
SERIE_A_ITALY: 135,
BUNDESLIGA: 78,
LIGUE_1: 61,
PRIMEIRA_LIGA: 94,
```

#### Arquivo 2: `src/presentation/pages/site/Standings.tsx`

Atualizar o array `leagueOptions` para incluir as 11 ligas, organizadas por grupo (Brasil, Continental, Europa). Remover Copa do Brasil e Sul-Americana. O layout dos chips de filtro permanece o mesmo (scroll horizontal), so muda a lista.

Novo array:

```text
Brasil:
  - Paulistao (475) 🏆
  - Brasileirao A (71) 🇧🇷
  - Serie B (72) 🇧🇷

Continental:
  - Libertadores (13) 🌎

Europa:
  - Champions League (2) 🇪🇺
  - Premier League (39) 🏴
  - La Liga (140) 🇪🇸
  - Serie A (135) 🇮🇹
  - Bundesliga (78) 🇩🇪
  - Ligue 1 (61) 🇫🇷
  - Primeira Liga (94) 🇵🇹
```

Como sao ~11 filtros, adicionar separadores visuais leves (um `|` ou gap maior) entre os grupos Brasil / Continental / Europa para facilitar a leitura na barra horizontal.

### Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/config/constants.ts` | Adicionar IDs das 7 ligas europeias ao LEAGUES |
| `src/presentation/pages/site/Standings.tsx` | Atualizar leagueOptions com 11 ligas agrupadas |

