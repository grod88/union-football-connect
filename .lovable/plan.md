

## Plano: Novos Widgets OBS - Melhores em Campo, Escalacao, Classificacao, Predicoes, H2H e Desfalques

### Resumo

Existem 9 widgets OBS atualmente: placar, stats, eventos, enquete, liga, home, away, score, tempo. As seguintes visoes do site **nao** tem equivalente OBS:

1. **Melhores em Campo** (PlayerRatings) - ratings dos jogadores
2. **Escalacao** (Lineups) - formacao, titulares e reservas
3. **Classificacao** (StandingsTable) - tabela do campeonato
4. **Predicoes** (PredictionWidget) - probabilidades e comparacao
5. **Confronto Direto / H2H** (H2HCard) - ultimos confrontos
6. **Desfalques** (InjuriesPanel) - jogadores lesionados/suspensos

### Arquivos a criar (6 novos componentes)

| Arquivo | Rota | Parametros |
|---|---|---|
| `src/presentation/pages/obs/ObsPlayerRatings.tsx` | `/obs/ratings` | `?fixture=ID` |
| `src/presentation/pages/obs/ObsLineups.tsx` | `/obs/escalacao` | `?fixture=ID` |
| `src/presentation/pages/obs/ObsStandings.tsx` | `/obs/classificacao` | `?league=ID&season=YYYY` |
| `src/presentation/pages/obs/ObsPredictions.tsx` | `/obs/predicao` | `?fixture=ID` |
| `src/presentation/pages/obs/ObsH2H.tsx` | `/obs/h2h` | `?fixture=ID` |
| `src/presentation/pages/obs/ObsInjuries.tsx` | `/obs/desfalques` | `?fixture=ID` |

### Arquivos a editar (3 existentes)

1. **`src/config/routes.ts`** - adicionar 6 novas rotas OBS
2. **`src/presentation/pages/obs/index.ts`** - exportar os 6 novos componentes
3. **`src/App.tsx`** - registrar as 6 novas rotas no Router

### Padrao visual (identico aos widgets existentes)

Todos os novos widgets seguem o mesmo padrao:
- Container externo: `bg-transparent p-2`
- Container interno: `rounded-xl overflow-hidden` com `background: linear-gradient(135deg, rgba(30,25,22,0.95) 0%, rgba(20,18,16,0.98) 100%)` e `border: 1px solid rgba(255,255,255,0.06)`
- Textos em branco com opacidade variavel
- Header com icone amber-400 e titulo uppercase tracking-widest
- Auto-refresh a cada 30s (via hooks existentes com `refetchInterval`)
- Sem OBSLayout wrapper (usar div direto como nos widgets recentes)

### Detalhes tecnicos por widget

**ObsPlayerRatings** - Reutiliza `useFixturePlayers` e `useFixtureForOBS`. Exibe top 5 jogadores de cada time com foto, nome, posicao e nota. Cores de nota: >= 8 dourado, >= 7 verde, restante cinza.

**ObsLineups** - Reutiliza `useFixtureLineups` e `useFixtureForOBS`. Mostra formacao, titulares numerados por posicao e tecnico. Layout em duas colunas (home/away).

**ObsStandings** - Reutiliza `useStandings`. Parametros `league` e `season` via query string. Tabela compacta com posicao, escudo, nome, P, J, V, E, D, SG. Opcao `?max=10` para limitar linhas e `?highlight=teamId` para destacar time.

**ObsPredictions** - Reutiliza `usePredictions` e `useFixtureForOBS`. Barra de probabilidade tricolor, conselho, e barras de comparacao (Forma, Ataque, Defesa, H2H, Gols).

**ObsH2H** - Reutiliza `useH2H` e `useFixtureForOBS`. Resumo de vitorias/empates e lista dos ultimos 6 confrontos com data, escudos e placar.

**ObsInjuries** - Reutiliza `useInjuries` e `useFixtureForOBS`. Duas colunas com foto, nome e motivo de cada desfalque. Indicador vermelho/amarelo para tipo.

### Fixture de teste

Usar `?fixture=1492143` (Coritiba vs Sao Paulo, Serie A 2026) para testar todos os widgets baseados em fixture. Para classificacao: `?league=71&season=2026`.

