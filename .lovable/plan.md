

## Corrigir 3 Problemas na Pagina /ao-vivo

### Problema 1: Filtro nao funciona bem

**Causa raiz:** O `PriorityFilterBar` tem um bug no onClick dos botoes de grupo. Ao chamar `togglePriority` varias vezes dentro de um `forEach`, cada chamada aciona um `setState` que referencia o estado anterior de forma inconsistente (closure stale). Exemplo: ao clicar "Europa" (priorities [2, 3]), ele chama `togglePriority(2)` e `togglePriority(3)` em sequencia, mas ambos usam o mesmo snapshot de `prev`, entao so um deles efetivamente muda.

**Correcao:** Trocar a logica do `PriorityFilterBar` para chamar `setVisiblePriorities` diretamente com o novo array completo, em vez de chamar `togglePriority` multiplas vezes. Adicionar tambem uma funcao `setPriorities` no hook `useFilteredLiveFixtures` para suportar isso.

### Problema 2: "Mostrar todos" so abre 3 jogos — quero 5 por default

**Causa raiz:** O default de `visiblePriorities` e `[1, 2]`, que so mostra jogos de ligas P1 e P2. Se poucas ligas P1/P2 tem jogos ao vivo, aparecem poucos. O "OtherMatchesBanner" funciona como toggle mas depende de clique manual.

**Correcao:** Mudar o default de `visiblePriorities` para `[1, 2, 3]` (mostrar TODAS as ligas monitoradas por padrao). Isso garante que ao abrir a pagina, todos os jogos monitorados aparecem. Tambem adicionar um limite visivel de 5 fixtures por grupo de liga no `OtherMatchesBanner` com botao "ver mais" para expandir.

### Problema 3: Fotos dos jogadores e notas sumiram do detalhe expandido

**Causa raiz:** O `ExpandedFixturePanel` atual so usa `useFixtureStatistics` e `useFixtureEvents`. Ele NAO usa `useFixturePlayers` (que traz fotos + ratings) nem `useFixtureLineups` (que traz escalacao). O componente `PlayerRatings` ja existe no projeto mas nao esta sendo usado no painel expandido.

**Correcao:** Adicionar ao `ExpandedFixturePanel`:
- `useFixturePlayers` para buscar ratings e fotos dos jogadores
- `useFixtureLineups` para buscar escalacao e formacao
- Renderizar `PlayerRatings` (componente existente) dentro do painel
- Adicionar secao de escalacao com formacao e titulares/reservas

---

### Detalhes Tecnicos

#### Arquivo 1: `src/application/hooks/useFilteredLiveFixtures.ts`

- Mudar default de `visiblePriorities` de `[1, 2]` para `[1, 2, 3]`

#### Arquivo 2: `src/presentation/components/live/PriorityFilterBar.tsx`

- Corrigir o bug do onClick: em vez de chamar `togglePriority` multiplas vezes (que causa race condition no setState), calcular o novo array de prioridades e usar uma unica chamada `setVisiblePriorities` passada como nova prop.

Logica corrigida:
```text
onClick para "Brasil + Liberta" (priorities [1]):
  Se P1 ja ativo -> remover P1 do array
  Se P1 inativo -> adicionar P1 ao array

onClick para "Europa" (priorities [2, 3]):
  Se P2 e P3 ambos ativos -> remover ambos
  Senao -> adicionar ambos

Usar uma unica chamada onSetPriorities(newArray) em vez de togglePriority x N
```

Adicionar prop `onSetPriorities: (priorities: number[]) => void` e usar `setVisiblePriorities` do hook.

#### Arquivo 3: `src/presentation/components/live/ExpandedFixturePanel.tsx`

Adicionar 3 novas secoes ao painel expandido:

1. **Player Ratings** (secao "Melhores em Campo"):
   - Usar `useFixturePlayers(fixture.id, display.homeTeam.id)`
   - Renderizar `PlayerRatings` componente existente
   - Mostra fotos dos jogadores + nota + posicao

2. **Lineups** (secao "Escalacao"):
   - Usar `useFixtureLineups(fixture.id)`
   - Mostrar formacao (ex: "4-3-3")
   - Listar titulares e reservas com numero e posicao

3. **Layout atualizado**:
   - Manter stats e eventos nas 2 colunas superiores
   - Adicionar abaixo: player ratings (full width)
   - Adicionar abaixo: lineups em 2 colunas (home | away)
   - Remover `maxStats={7}` para mostrar TODAS as estatisticas
   - Remover `maxEvents={8}` para mostrar TODOS os eventos

#### Arquivo 4: `src/presentation/pages/site/LiveDashboard.tsx`

- Passar `setVisiblePriorities` como prop para `PriorityFilterBar`

### Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/application/hooks/useFilteredLiveFixtures.ts` | Default `[1,2,3]` |
| `src/presentation/components/live/PriorityFilterBar.tsx` | Fix toggle bug, nova prop |
| `src/presentation/components/live/ExpandedFixturePanel.tsx` | Adicionar players + lineups + remover limites |
| `src/presentation/pages/site/LiveDashboard.tsx` | Passar `setVisiblePriorities` |

