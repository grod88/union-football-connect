

## Separar Jogos do Dia em 2 Blocos: Pre-Jogo e Pos-Jogo

### O que muda

A pagina `/jogos-do-dia` atualmente mistura todos os jogos (futuros, ao vivo, encerrados) numa unica lista. Vamos separar em dois blocos visuais distintos:

1. **Bloco "Proximos Jogos"** — jogos que ainda nao comecaram + jogos ao vivo. Ao expandir, mostra `PreMatchDetailPanel` (predicoes, H2H, desfalques, escalacao, horarios).
2. **Bloco "Jogos Encerrados"** — jogos finalizados. Ao expandir, mostra `ExpandedFixturePanel` (placar, estatisticas completas, eventos, notas dos jogadores, escalacao).

Cada bloco mantem o agrupamento por liga com `LeagueGroupHeader` e accordion.

---

### Detalhes Tecnicos

#### Arquivo: `src/presentation/pages/site/TodayMatches.tsx`

Alterar a logica de renderizacao para dividir `filteredGroups` em dois conjuntos:

```text
Para cada grupo de liga em filteredGroups:
  - upcomingFixtures = fixtures onde !isFixtureFinished(f)
  - finishedFixtures = fixtures onde isFixtureFinished(f)

upcomingGroups = grupos que tem upcomingFixtures (mantendo a estrutura LeagueGroup)
finishedGroups = grupos que tem finishedFixtures
```

Renderizar dois blocos separados:

1. **Secao "Proximos Jogos"** (icone CalendarDays ou Clock):
   - Titulo: "Proximos Jogos" ou "Jogos de Hoje"
   - Mostra `upcomingGroups` agrupados por liga
   - Ao expandir: `PreMatchDetailPanel` para jogos nao iniciados, `ExpandedFixturePanel` para jogos ao vivo

2. **Secao "Jogos Encerrados"** (icone CheckCircle ou Trophy):
   - Titulo: "Encerrados" com badge de contagem
   - So aparece se existem jogos finalizados
   - Mostra `finishedGroups` agrupados por liga
   - Ao expandir: `ExpandedFixturePanel` com stats completas, eventos, player ratings

Ambos os blocos compartilham o mesmo `expandedFixtureId` (accordion global — so um jogo expandido por vez).

#### Mudancas visuais

- Separador visual entre os dois blocos (linha ou espaco + titulo)
- Bloco de encerrados com estilo levemente diferente (opacidade reduzida no header ou borda sutil) para diferenciar visualmente
- Badge de contagem em cada secao (ex: "5 jogos" / "3 encerrados")

### Arquivos impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/presentation/pages/site/TodayMatches.tsx` | Dividir lista em 2 blocos (upcoming vs finished), adicionar titulos de secao |

Nenhum arquivo novo necessario — apenas reestruturar a renderizacao da pagina existente.

