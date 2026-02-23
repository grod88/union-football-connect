

## Redesign Completo da Pagina /ao-vivo

### Resumo

Reescrever `LiveDashboard.tsx` de um layout 2 colunas (detalhe + sidebar) para uma lista vertical unica agrupada por liga, estilo FotMob/SofaScore, com expansao inline ao clicar.

### Novos componentes a criar

#### 1. `src/presentation/components/live/PriorityFilterBar.tsx`
Barra de filtro com 3 botoes toggle + contador "Mostrando X de Y".

- Botoes: "Brasil + Libertadores" (P1), "Europa" (P2+P3), "Todos" (sem filtro)
- Estilos: ativo = `bg-yellow-500/20 border-yellow-500 text-yellow-300`, inativo = `bg-secondary border-border text-muted-foreground`
- Props: `visiblePriorities`, `togglePriority`, `filteredCount`, `totalLiveCount`, `hiddenCount`

#### 2. `src/presentation/components/live/LeagueGroupHeader.tsx`
Header de cada grupo de liga com flag, nome e chevron para colapsar.

- Borda esquerda colorida por prioridade: P1 = `border-l-primary` (dourado), P2 = `border-l-blue-500`, P3 = `border-l-gray-600`
- Clique toggle para mostrar/esconder os jogos daquela liga
- Props: `league`, `leagueInfo`, `fixtureCount`, `isCollapsed`, `onToggle`

#### 3. `src/presentation/components/live/CompactFixtureRow.tsx`
Linha compacta para cada jogo (nao expandido).

- Layout horizontal: `[minuto] [escudo 5x5] Home [placar] Away [escudo 5x5] [status]`
- Status badge: `1o T` (vermelho), `INT` (amarelo), `FIM` (cinza), hora local (se NS)
- Hover: `bg-white/5 cursor-pointer`
- Click handler para expandir
- Props: `fixture`, `isExpanded`, `onClick`

#### 4. `src/presentation/components/live/ExpandedFixturePanel.tsx`
Painel expandido inline (aparece abaixo da row ao clicar).

- Header: escudos maiores (w-12 h-12) + placar grande (text-3xl) + minuto
- 2 colunas (md) / 1 coluna (mobile): Estatisticas (reusar `StatComparison`) + Eventos (reusar `EventTimeline`)
- Botao de link para copiar URL com `?fixture=ID`
- Dados carregados sob demanda: `useFixture`, `useFixtureStatistics`, `useFixtureEvents` com `enabled: isExpanded`
- Animacao: Framer Motion `AnimatePresence` com height/opacity transition
- Props: `fixture` (dados basicos da lista), `onClose`

#### 5. `src/presentation/components/live/OtherMatchesBanner.tsx`
Banner no final: "+N jogos de outras ligas [Mostrar todos]"

- Aparece quando `hiddenCount > 0`
- Ao clicar, expande mostrando jogos nao monitorados agrupados por liga
- Props: `hiddenCount`, `allFixtures`, `monitoredIds`

#### 6. `src/presentation/components/live/EmptyLiveState.tsx`
Estado vazio quando nao ha jogos nas ligas filtradas.

- Icone + texto "Nenhum jogo ao vivo agora"
- Proximo jogo monitorado usando `useNextMatch()`
- Link para pre-jogo e calendario

### Arquivo principal reescrito

#### `src/presentation/pages/site/LiveDashboard.tsx`
Reescrita completa:

- Remove: layout `grid lg:grid-cols-3`, coluna lateral, `LiveMatchCard`, busca de fixture individual no nivel da pagina
- Usa: `useFilteredLiveFixtures()` + `useLiveFixtures()` (para "outros jogos")
- Estado local: `expandedFixtureId: number | null` (accordion - so 1 expandido)
- Estado local: `collapsedLeagues: Set<number>` (ligas colapsadas)
- Container: `max-w-4xl mx-auto px-4` (mais estreito e focado)
- Deep link: se URL tem `?fixture=XXX`, auto-expandir e scroll ate o jogo
- Estrutura JSX:

```text
Header
PriorityFilterBar
  Para cada grupo em groupedFixtures:
    LeagueGroupHeader
      Para cada fixture no grupo:
        CompactFixtureRow
        (se expandido) ExpandedFixturePanel com AnimatePresence
OtherMatchesBanner (se hiddenCount > 0)
EmptyLiveState (se filteredCount === 0)
Footer
```

### Barrel export

#### `src/presentation/components/live/index.ts`
Exportar todos os novos componentes.

### Detalhes tecnicos

| Aspecto | Implementacao |
|---------|--------------|
| Animacao expansao | `framer-motion` `AnimatePresence` + `motion.div` com `initial/animate/exit` em height e opacity |
| Dados sob demanda | `useFixture(id, { enabled: isExpanded })` -- so busca quando expandido |
| Accordion | Estado `expandedFixtureId` -- ao clicar outro jogo, fecha o anterior |
| Deep link ?fixture=ID | `useEffect` com `useSearchParams` para auto-expandir + `scrollIntoView` |
| Copiar link | `navigator.clipboard.writeText` com URL + `?fixture=ID` |
| Responsividade mobile | Nomes truncados, escudos 4x4, stats/eventos em 1 coluna, `px-2` |
| Reutilizacao | `StatComparison`, `EventTimeline`, `TeamBadge`, `MatchTimer` -- todos existentes |

### Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `src/presentation/components/live/PriorityFilterBar.tsx` | Criar |
| `src/presentation/components/live/LeagueGroupHeader.tsx` | Criar |
| `src/presentation/components/live/CompactFixtureRow.tsx` | Criar |
| `src/presentation/components/live/ExpandedFixturePanel.tsx` | Criar |
| `src/presentation/components/live/OtherMatchesBanner.tsx` | Criar |
| `src/presentation/components/live/EmptyLiveState.tsx` | Criar |
| `src/presentation/components/live/index.ts` | Criar |
| `src/presentation/pages/site/LiveDashboard.tsx` | Reescrever |

### O que NAO muda

- Hooks existentes (`useFixture`, `useFixtureStatistics`, `useFixtureEvents`, `useLiveFixtures`, `useFilteredLiveFixtures`, `useMonitoredLeagues`, `useNextMatch`)
- Componentes reutilizados (`StatComparison`, `EventTimeline`, `TeamBadge`, `MatchTimer`, `Scoreboard`)
- Header e Footer globais
- Rotas (`/ao-vivo` continua no mesmo path)
- Funcionalidade: mesmas informacoes, apenas layout diferente

