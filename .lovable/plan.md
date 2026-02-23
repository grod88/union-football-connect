
## Refatorar Calendario: Apenas Jogos Futuros D+1, D+2, D+3

### O que muda

A pagina `/calendario` deixa de mostrar jogos encerrados e ao vivo. Passa a funcionar como um calendario de proximos jogos com 3 filtros simples: **Amanha (D+1)**, **Em 2 dias (D+2)** e **Em 3 dias (D+3)**. D+1 e o filtro padrao ao carregar. Ao clicar em um jogo, expande inline com os detalhes de pre-jogo (odds/predicoes, H2H, desfalques, escalacao) usando o `PreMatchDetailPanel` ja existente.

### Detalhes Tecnicos

#### Arquivo 1: `src/application/hooks/useCalendarFixtures.ts`

Reescrever o hook para buscar fixtures por data especifica em vez de por liga/season inteira.

- Novo parametro: `date: string` (formato YYYY-MM-DD)
- Endpoint: `/fixtures?date=YYYY-MM-DD` (sem filtro de liga — traz todas as ligas naquele dia)
- Filtrar client-side apenas fixtures com status `NS` ou `TBD` (nao iniciados)
- Remover as funcoes `filterUpcomingFixtures`, `filterLiveFixtures`, `filterFinishedFixtures` (nao serao mais usadas aqui)

```text
queryKey: ['calendar-fixtures', date]
queryFn: GET /fixtures?date={date}
Pos-processamento: filtrar apenas status NS/TBD, ordenar por timestamp
```

#### Arquivo 2: `src/presentation/pages/site/Calendar.tsx`

Reescrever a pagina com:

1. **State `selectedDay`**: 1, 2 ou 3 (default: 1) representando D+1, D+2, D+3
2. **Filtro de 3 botoes**: Calcular a data real (amanha, depois de amanha, daqui 3 dias) e exibir como label no botao (ex: "Seg, 24 fev", "Ter, 25 fev", "Qua, 26 fev")
3. **Remover**: `LeagueFilterBar`, imports de `isFixtureLive`/`isFixtureFinished`, logica de jogos encerrados/ao vivo
4. **Agrupar por liga**: Em vez de agrupar por data (ja que e so 1 dia), agrupar os jogos por liga (league.name)
5. **Accordion com pre-jogo**: State `expandedFixtureId`, ao clicar expande o `PreMatchDetailPanel` com predicoes, H2H, desfalques, escalacao
6. **FixtureCard simplificado**: So mostra horario (nunca placar), sempre linka para expandir inline

```text
Layout:
  [D+1 ativo] [D+2] [D+3]      <-- 3 botoes com data formatada

  Premier League
    Santos vs Palmeiras    18:00
    [expand: PreMatchDetailPanel]

  La Liga
    Barcelona vs Real Madrid  16:00

  Sem jogos? -> Estado vazio
```

#### Calculo das datas

```text
const today = new Date()
const targetDate = new Date(today)
targetDate.setDate(today.getDate() + selectedDay)
const dateStr = targetDate.toISOString().split('T')[0]
```

#### Dados buscados

O endpoint `/fixtures?date=YYYY-MM-DD` retorna jogos de TODAS as ligas naquele dia. Nao precisamos filtrar por liga — mostramos tudo agrupado por liga.

### Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/application/hooks/useCalendarFixtures.ts` | Reescrever para buscar por data (`/fixtures?date=X`), filtrar apenas NS/TBD |
| `src/presentation/pages/site/Calendar.tsx` | Novo layout com filtro D+1/D+2/D+3, accordion com PreMatchDetailPanel, agrupar por liga |
