
## Reformular a Pagina /jogos-do-dia no Padrao da /ao-vivo

### O que muda

A pagina atual mostra cards grandes com links para /pre-jogo. Vamos transformar num layout identico ao /ao-vivo: lista compacta agrupada por liga, com accordion que expande detalhes inline. Em vez de stats ao vivo, o detalhe expandido mostra informacoes de pre-jogo (predicoes, H2H, desfalques, escalacao).

### Problema atual do hook useTodayFixtures

O hook so busca jogos de UMA liga (Paulistao por default). Precisamos buscar de TODAS as ligas monitoradas. Vamos criar um novo hook `useTodayAllFixtures` que faz uma chamada por data (sem filtro de liga) ou itera as ligas monitoradas.

---

### Detalhes Tecnicos

#### Arquivo 1: `src/application/hooks/useTodayAllFixtures.ts` (NOVO)

Novo hook que busca fixtures do dia para todas as ligas monitoradas:
- Usa `useMonitoredLeagues` para obter os IDs das ligas
- Faz uma query para cada liga usando `useQueries` do TanStack Query (ou uma unica chamada com `date=YYYY-MM-DD` sem filtro de liga, se a API suportar)
- Alternativa mais simples: usar o endpoint `/fixtures?date=YYYY-MM-DD` sem parametro `league` — isso retorna TODOS os jogos do dia, e depois filtramos client-side pelas ligas monitoradas
- Retorna fixtures agrupadas por liga no mesmo formato `LeagueGroup[]` usado pela /ao-vivo

#### Arquivo 2: `src/presentation/components/live/PreMatchDetailPanel.tsx` (NOVO)

Novo componente para o detalhe expandido de pre-jogo. Similar ao `ExpandedFixturePanel` mas com dados de pre-jogo:
- Props: `fixture: Fixture`
- Busca dados lazy (so quando montado):
  - `usePredictions(fixture.id)` — predicoes de IA
  - `useH2H(fixture.homeTeam.id, fixture.awayTeam.id)` — confronto direto
  - `useInjuries(fixture.id, fixture.homeTeam.id)` — desfalques
  - `useFixtureLineups(fixture.id)` — escalacao (se disponivel)
- Layout:
  - Header: escudos grandes + VS ou placar + horario/status
  - Horarios em 3 fusos (Brasil, NZ, Local) — reusar `getMatchTimezones`
  - Estadio + arbitro
  - Grid 2 colunas (desktop) / 1 coluna (mobile):
    - Predicoes (reusar `PredictionWidget`)
    - H2H (reusar `H2HCard`)
  - Full width: Desfalques (reusar `InjuriesPanel`)
  - Full width: Escalacao (reusar logica do `ExpandedFixturePanel`)
- Se o jogo esta ao vivo: mostrar badge "AO VIVO" e link para /ao-vivo?fixture=ID
- Se o jogo terminou: mostrar placar final + stats/eventos (reusar `ExpandedFixturePanel` inline)

#### Arquivo 3: `src/presentation/pages/site/TodayMatches.tsx` (REESCREVER)

Reescrever a pagina seguindo o padrao da LiveDashboard:
- Layout: `max-w-4xl mx-auto`, single column
- Header: titulo "Jogos do Dia" + data formatada + badge com contagem
- Filtro: reusar `LeagueFilterBar` (ja existente na pagina, manter)
- Lista: usar `CompactFixtureRow` para cada jogo (mesmo componente da /ao-vivo)
- Accordion: `expandedFixtureId` state, clicar expande/colapsa
- Quando expande:
  - Se jogo NAO comecou: mostrar `PreMatchDetailPanel`
  - Se jogo ao vivo: mostrar `ExpandedFixturePanel` (com stats ao vivo)
  - Se jogo terminou: mostrar `ExpandedFixturePanel` (com resultado final)
- Agrupamento por liga com `LeagueGroupHeader` (reusar da /ao-vivo)
- Deep link: suportar `?fixture=ID` para abrir expandido
- Estados: loading spinner, empty state, error state

#### Arquivo 4: `src/presentation/components/live/index.ts` (ATUALIZAR)

Adicionar export do novo `PreMatchDetailPanel`.

### Fluxo do Usuario

```text
Abre /jogos-do-dia
  -> Ve lista compacta de todos os jogos do dia agrupados por liga
  -> Filtros de liga no topo (Brasil, Continental, Europa)
  -> Clica num jogo que ainda nao comecou
     -> Expande inline com: predicoes, H2H, desfalques, escalacao, horarios
  -> Clica num jogo ao vivo
     -> Expande inline com: placar, stats, eventos (mesmo da /ao-vivo)
  -> Clica num jogo finalizado
     -> Expande inline com: placar final, stats, eventos
```

### Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/application/hooks/useTodayAllFixtures.ts` | NOVO — busca fixtures do dia de todas as ligas |
| `src/presentation/components/live/PreMatchDetailPanel.tsx` | NOVO — detalhe inline de pre-jogo |
| `src/presentation/pages/site/TodayMatches.tsx` | REESCREVER — layout igual /ao-vivo com accordion |
| `src/presentation/components/live/index.ts` | Adicionar export |
