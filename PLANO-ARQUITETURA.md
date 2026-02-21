# Union Football Live — Plano de Arquitetura e Desenvolvimento

## Visão Geral

Este documento define a arquitetura técnica e o plano de execução para o site Union Football Live, seguindo princípios de **Clean Architecture** e **Clean Code**.

---

## 1. Análise de Requisitos

### 1.1 Páginas do Site (11 total)

| # | Página | Fonte de Dados | Prioridade |
|---|--------|----------------|------------|
| 1 | Home/Landing | API-Football (próximo jogo) | MVP |
| 2 | Ao Vivo (Live Dashboard) | API-Football (tempo real) | MVP |
| 3 | Calendário de Lives | API-Football (fixtures) | Fase 2 |
| 4 | Junte-se à Torcida | Formulário → mailto/localStorage | MVP |
| 5 | De Onde Você Tá Assistindo | Mapa estático/localStorage | Fase 2 |
| 6 | Histórico de Lives | Dados hardcoded/YouTube API | Fase 2 |
| 7 | Comunidade | Links externos (Discord) | Fase 2 |
| 8 | Newsletter | Embed externo (Mailchimp) | Fase 2 |
| 9 | Blog/Análises | Markdown local | Fase 3 |
| 10 | Parceiros/Patrocinadores | Dados hardcoded | Fase 3 |
| 11 | NotFound | - | MVP |

### 1.2 Rotas OBS (5 overlays)

| Rota | Endpoint API | Refresh | Prioridade |
|------|--------------|---------|------------|
| `/obs/placar` | `fixtures?id={id}` | 15s | MVP |
| `/obs/stats` | `fixtures/statistics?fixture={id}` | 30s | MVP |
| `/obs/eventos` | `fixtures/events?fixture={id}` | 15s | MVP |
| `/obs/campo` | `fixtures/events?fixture={id}` | 15s | Fase 2 |
| `/obs/enquete` | Local state (URL params) | - | MVP |

---

## 2. Mapeamento API-Football → Funcionalidades

### 2.1 Endpoints Necessários

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           API-FOOTBALL v3                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  fixtures?id={id}              → Placar, tempo, status do jogo              │
│  fixtures?team={id}&next=N     → Próximos N jogos de um time                │
│  fixtures?league={id}&season=Y → Todos os jogos de uma liga/temporada       │
│  fixtures/statistics?fixture=  → Stats comparativas (posse, chutes, etc)    │
│  fixtures/events?fixture=      → Eventos (gols, cartões, substituições)     │
│  fixtures/lineups?fixture=     → Escalações e formações                     │
│  standings?league={id}&season= → Tabela de classificação                    │
│  fixtures/headtohead?h2h=      → Confronto direto entre dois times          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Matriz de Uso por Tela

```
                          ┌──────────────────────────────────────────────────────────┐
                          │                    ENDPOINTS                              │
                          ├─────────┬──────────┬────────┬─────────┬─────────┬────────┤
                          │fixtures │statistics│ events │ lineups │standings│  h2h   │
┌─────────────────────────┼─────────┼──────────┼────────┼─────────┼─────────┼────────┤
│ Home (NextMatch)        │    ✓    │          │        │         │         │        │
│ Ao Vivo (Dashboard)     │    ✓    │    ✓     │   ✓    │    ✓    │    ✓    │   ✓    │
│ Calendário              │    ✓    │          │        │         │    ✓    │        │
│ OBS Placar              │    ✓    │          │        │         │         │        │
│ OBS Stats               │         │    ✓     │        │         │         │        │
│ OBS Eventos             │         │          │   ✓    │         │         │        │
│ OBS Campo               │         │          │   ✓    │         │         │        │
└─────────────────────────┴─────────┴──────────┴────────┴─────────┴─────────┴────────┘
```

---

## 3. Arquitetura Clean

### 3.1 Diagrama de Camadas

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              PRESENTATION LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │  Pages: Home, LiveDashboard, Calendar, OBS/*, JoinUs, etc.                      ││
│  │  Components: Scoreboard, StatBar, EventTimeline, VirtualField, etc.             ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                        │                                             │
│                                        ▼                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                              APPLICATION LAYER                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │  Hooks: useFixture, useStatistics, useEvents, useNextMatch, useCalendar         ││
│  │  Services: TimezoneService, CalendarService (ICS), PollService                  ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                        │                                             │
│                                        ▼                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                DOMAIN LAYER                                          │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │  Entities: Fixture, Team, League, Statistic, Event, Lineup, Player              ││
│  │  Enums: MatchStatus (NS, 1H, HT, 2H, FT, etc.)                                  ││
│  │  Ports: IFootballRepository (interface)                                          ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
│                                        │                                             │
│                                        ▼                                             │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                            INFRASTRUCTURE LAYER                                      │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐│
│  │  ApiFootballClient: HTTP client com headers configurados                        ││
│  │  ApiFootballRepository: Implementa IFootballRepository                          ││
│  │  DTOs: FixtureDTO, StatisticsDTO, EventDTO (tipos da API externa)               ││
│  │  Mappers: FixtureMapper, StatisticsMapper (DTO → Entity)                        ││
│  └─────────────────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Estrutura de Pastas

```
src/
├── core/                          # Camada de Domínio (pura, sem dependências)
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── fixture.ts         # Entidade Jogo
│   │   │   ├── team.ts            # Entidade Time
│   │   │   ├── league.ts          # Entidade Liga
│   │   │   ├── statistic.ts       # Entidade Estatística
│   │   │   ├── event.ts           # Entidade Evento (gol, cartão, etc)
│   │   │   ├── lineup.ts          # Entidade Escalação
│   │   │   ├── standing.ts        # Entidade Classificação
│   │   │   └── index.ts           # Barrel export
│   │   │
│   │   └── enums/
│   │       ├── match-status.ts    # NS, 1H, HT, 2H, FT, etc
│   │       ├── event-type.ts      # Goal, Card, Subst, etc
│   │       └── index.ts
│   │
│   └── ports/                     # Interfaces/Contratos
│       └── football-repository.port.ts
│
├── infrastructure/                # Implementações Externas
│   └── api-football/
│       ├── client.ts              # HTTP client configurado
│       ├── endpoints.ts           # Constantes de URLs
│       ├── dtos/                  # Tipos de resposta da API
│       │   ├── fixture.dto.ts
│       │   ├── statistics.dto.ts
│       │   ├── events.dto.ts
│       │   ├── lineups.dto.ts
│       │   └── index.ts
│       ├── mappers/               # Conversão DTO → Entity
│       │   ├── fixture.mapper.ts
│       │   ├── statistics.mapper.ts
│       │   ├── events.mapper.ts
│       │   ├── lineups.mapper.ts
│       │   └── index.ts
│       └── repository.ts          # Implementa IFootballRepository
│
├── application/                   # Casos de Uso e Serviços
│   ├── hooks/                     # React Query hooks
│   │   ├── useFixture.ts
│   │   ├── useFixtureStatistics.ts
│   │   ├── useFixtureEvents.ts
│   │   ├── useFixtureLineups.ts
│   │   ├── useNextMatch.ts
│   │   ├── useCalendarFixtures.ts
│   │   ├── useStandings.ts
│   │   └── index.ts
│   │
│   └── services/
│       ├── timezone.service.ts    # Conversão de fusos
│       ├── calendar.service.ts    # Geração de .ics
│       └── poll.service.ts        # Gerenciamento de enquetes
│
├── presentation/                  # Camada de UI
│   ├── components/
│   │   ├── common/                # Componentes genéricos
│   │   │   ├── LoadingSpinner.tsx
│   │   │   ├── ErrorMessage.tsx
│   │   │   ├── LiveBadge.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── match/                 # Componentes de jogo
│   │   │   ├── Scoreboard.tsx
│   │   │   ├── MatchTimer.tsx
│   │   │   ├── MatchStatus.tsx
│   │   │   ├── TeamBadge.tsx
│   │   │   ├── MatchCard.tsx
│   │   │   ├── CountdownTimer.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── statistics/            # Componentes de estatísticas
│   │   │   ├── StatBar.tsx
│   │   │   ├── StatComparison.tsx
│   │   │   ├── PossessionBar.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── events/                # Componentes de eventos
│   │   │   ├── EventTimeline.tsx
│   │   │   ├── EventItem.tsx
│   │   │   ├── EventIcon.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── lineup/                # Componentes de escalação
│   │   │   ├── LineupDisplay.tsx
│   │   │   ├── Formation.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── field/                 # Campo virtual
│   │   │   ├── VirtualField.tsx
│   │   │   ├── FieldEventMarker.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── poll/                  # Enquetes
│   │   │   ├── Poll.tsx
│   │   │   ├── PollOption.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── layout/                # Layouts
│   │       ├── OBSLayout.tsx      # Layout transparente para OBS
│   │       └── index.ts
│   │
│   └── pages/                     # Páginas (já organizadas)
│       ├── Index.tsx              # / (Home)
│       ├── LiveDashboard.tsx      # /ao-vivo
│       ├── Calendar.tsx           # /calendario
│       ├── JoinUs.tsx             # /junte-se
│       ├── WorldMap.tsx           # /de-onde-assiste
│       ├── History.tsx            # /historico
│       ├── Community.tsx          # /comunidade
│       ├── Newsletter.tsx         # /newsletter
│       ├── Partners.tsx           # /parceiros
│       ├── blog/
│       │   ├── BlogList.tsx       # /blog
│       │   └── BlogPost.tsx       # /blog/:slug
│       └── obs/                   # Rotas OBS
│           ├── ObsScoreboard.tsx  # /obs/placar
│           ├── ObsStats.tsx       # /obs/stats
│           ├── ObsEvents.tsx      # /obs/eventos
│           ├── ObsField.tsx       # /obs/campo
│           └── ObsPoll.tsx        # /obs/enquete
│
├── config/
│   ├── constants.ts               # IDs de ligas, times, etc
│   ├── api.config.ts              # Config da API
│   └── routes.ts                  # Definição de rotas
│
└── lib/                           # Utilitários (já existe)
    └── utils.ts
```

---

## 4. Entidades do Domínio

### 4.1 Fixture (Jogo)

```typescript
interface Fixture {
  id: number;
  date: Date;
  timestamp: number;
  status: MatchStatus;
  elapsed: number | null;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  goalsHome: number | null;
  goalsAway: number | null;
  venue: string | null;
}
```

### 4.2 Team (Time)

```typescript
interface Team {
  id: number;
  name: string;
  logo: string;
  shortName?: string;
}
```

### 4.3 Statistic (Estatística)

```typescript
interface FixtureStatistics {
  fixtureId: number;
  homeStats: StatisticSet;
  awayStats: StatisticSet;
}

interface StatisticSet {
  shotsOnGoal: number;
  shotsOffGoal: number;
  totalShots: number;
  blockedShots: number;
  insideBoxShots: number;
  outsideBoxShots: number;
  fouls: number;
  corners: number;
  offsides: number;
  possession: number;        // percentual (ex: 55)
  yellowCards: number;
  redCards: number;
  goalkeeperSaves: number;
  totalPasses: number;
  accuratePasses: number;
  passAccuracy: number;      // percentual
}
```

### 4.4 Event (Evento)

```typescript
interface FixtureEvent {
  id: number;
  fixtureId: number;
  elapsed: number;
  extraTime: number | null;
  team: Team;
  player: string;
  assist: string | null;
  type: EventType;           // Goal, Card, Subst, Var
  detail: string;            // Normal Goal, Yellow Card, etc
}
```

### 4.5 MatchStatus (Enum)

```typescript
enum MatchStatus {
  NOT_STARTED = 'NS',
  FIRST_HALF = '1H',
  HALFTIME = 'HT',
  SECOND_HALF = '2H',
  EXTRA_TIME = 'ET',
  PENALTIES = 'PEN',
  FINISHED = 'FT',
  FINISHED_EXTRA_TIME = 'AET',
  BREAK = 'BT',
  SUSPENDED = 'SUSP',
  INTERRUPTED = 'INT',
  POSTPONED = 'PST',
  CANCELLED = 'CANC',
  ABANDONED = 'ABD',
  NOT_PLAYED = 'AWD',
  LIVE = 'LIVE',
}
```

---

## 5. Fluxo de Dados

### 5.1 Exemplo: Página Ao Vivo

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  LiveDashboard  │────▶│   useFixture()   │────▶│  React Query Cache  │
│     (Page)      │     │   useStats()     │     │                     │
│                 │     │   useEvents()    │     └──────────┬──────────┘
└─────────────────┘     └──────────────────┘                │
                                                            ▼
                                               ┌────────────────────────┐
                                               │  FootballRepository    │
                                               │  .getFixture(id)       │
                                               │  .getStatistics(id)    │
                                               │  .getEvents(id)        │
                                               └───────────┬────────────┘
                                                           │
                                                           ▼
                                               ┌────────────────────────┐
                                               │  ApiFootballClient     │
                                               │  fetch() with headers  │
                                               └───────────┬────────────┘
                                                           │
                                                           ▼
                                               ┌────────────────────────┐
                                               │  Mappers               │
                                               │  DTO → Entity          │
                                               └───────────┬────────────┘
                                                           │
                                                           ▼
                                               ┌────────────────────────┐
                                               │  Components recebem    │
                                               │  Entities tipadas      │
                                               └────────────────────────┘
```

### 5.2 Exemplo: OBS Placar (polling)

```
┌─────────────────┐     ┌──────────────────────────┐     ┌───────────────┐
│  ObsScoreboard  │────▶│  useFixture(id, {        │────▶│   API-Football│
│  ?fixture=123   │     │    refetchInterval: 15s  │◀────│   /fixtures   │
└─────────────────┘     │  })                      │     └───────────────┘
        │               └──────────────────────────┘
        ▼
┌─────────────────┐
│  <Scoreboard>   │
│  <MatchTimer>   │
│  <TeamBadge>    │
└─────────────────┘
```

---

## 6. Plano de Execução

### Fase 0: Setup Inicial

| Task | Descrição |
|------|-----------|
| 0.1 | Criar estrutura de pastas |
| 0.2 | Criar arquivo `.env.example` com variáveis |
| 0.3 | Configurar path aliases no tsconfig |
| 0.4 | Instalar dependências necessárias |

### Fase 1: Core Domain + Infrastructure

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 1.1 | Definir entidades do domínio | `core/domain/entities/*.ts` |
| 1.2 | Definir enums | `core/domain/enums/*.ts` |
| 1.3 | Definir interface do repositório | `core/ports/football-repository.port.ts` |
| 1.4 | Criar HTTP client | `infrastructure/api-football/client.ts` |
| 1.5 | Definir DTOs | `infrastructure/api-football/dtos/*.ts` |
| 1.6 | Criar mappers | `infrastructure/api-football/mappers/*.ts` |
| 1.7 | Implementar repositório | `infrastructure/api-football/repository.ts` |

### Fase 2: Application Layer (Hooks)

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 2.1 | Hook useFixture | `application/hooks/useFixture.ts` |
| 2.2 | Hook useFixtureStatistics | `application/hooks/useFixtureStatistics.ts` |
| 2.3 | Hook useFixtureEvents | `application/hooks/useFixtureEvents.ts` |
| 2.4 | Hook useFixtureLineups | `application/hooks/useFixtureLineups.ts` |
| 2.5 | Hook useNextMatch | `application/hooks/useNextMatch.ts` |
| 2.6 | Hook useCalendarFixtures | `application/hooks/useCalendarFixtures.ts` |
| 2.7 | Hook useStandings | `application/hooks/useStandings.ts` |
| 2.8 | Serviço de timezone | `application/services/timezone.service.ts` |
| 2.9 | Serviço de calendário (.ics) | `application/services/calendar.service.ts` |

### Fase 3: Componentes Base

| Task | Descrição | Arquivos |
|------|-----------|----------|
| 3.1 | Componentes comuns | `presentation/components/common/*.tsx` |
| 3.2 | Componentes de match | `presentation/components/match/*.tsx` |
| 3.3 | Componentes de statistics | `presentation/components/statistics/*.tsx` |
| 3.4 | Componentes de events | `presentation/components/events/*.tsx` |
| 3.5 | Layout OBS | `presentation/components/layout/OBSLayout.tsx` |

### Fase 4: Páginas OBS (MVP)

| Task | Descrição | Rota |
|------|-----------|------|
| 4.1 | OBS Placar | `/obs/placar?fixture={id}` |
| 4.2 | OBS Stats | `/obs/stats?fixture={id}` |
| 4.3 | OBS Eventos | `/obs/eventos?fixture={id}` |
| 4.4 | OBS Enquete | `/obs/enquete?pergunta=...` |

### Fase 5: Páginas do Site (MVP)

| Task | Descrição | Rota |
|------|-----------|------|
| 5.1 | Refatorar Home para usar API real | `/` |
| 5.2 | Página Ao Vivo | `/ao-vivo` |
| 5.3 | Página Junte-se à Torcida | `/junte-se` |
| 5.4 | Configurar rotas no App.tsx | - |

### Fase 6: Páginas do Site (Fase 2)

| Task | Descrição | Rota |
|------|-----------|------|
| 6.1 | Calendário de Lives | `/calendario` |
| 6.2 | Histórico de Lives | `/historico` |
| 6.3 | De Onde Você Assiste | `/de-onde-assiste` |
| 6.4 | Comunidade | `/comunidade` |
| 6.5 | Newsletter | `/newsletter` |
| 6.6 | OBS Campo (virtual field) | `/obs/campo` |

### Fase 7: Páginas do Site (Fase 3)

| Task | Descrição | Rota |
|------|-----------|------|
| 7.1 | Blog/Análises | `/blog`, `/blog/:slug` |
| 7.2 | Parceiros | `/parceiros` |

---

## 7. Configurações Importantes

### 7.1 Variáveis de Ambiente (.env)

```env
# API-Football
VITE_API_FOOTBALL_KEY=f549745a93c4d6d8a848d69cf7382e62
VITE_API_FOOTBALL_HOST=v3.football.api-sports.io

# IDs padrão (para desenvolvimento)
VITE_DEFAULT_LEAGUE_ID=475
VITE_DEFAULT_TEAM_ID=126
VITE_DEFAULT_SEASON=2026
```

### 7.2 Constantes do Projeto

```typescript
// config/constants.ts
export const LEAGUES = {
  PAULISTAO: 475,
  BRASILEIRAO_A: 71,
  LIBERTADORES: 13,
  COPA_DO_BRASIL: 73,
} as const;

export const TEAMS = {
  SAO_PAULO: 126,
  PALMEIRAS: 121,
  CORINTHIANS: 131,
  SANTOS: 128,
} as const;

export const CURRENT_SEASON = 2026;

export const REFRESH_INTERVALS = {
  LIVE_FIXTURE: 15_000,      // 15 segundos
  STATISTICS: 30_000,        // 30 segundos
  EVENTS: 15_000,            // 15 segundos
  STANDINGS: 300_000,        // 5 minutos
  NEXT_MATCH: 300_000,       // 5 minutos
  CALENDAR: 300_000,         // 5 minutos
} as const;
```

### 7.3 Rotas

```typescript
// config/routes.ts
export const ROUTES = {
  HOME: '/',
  LIVE: '/ao-vivo',
  CALENDAR: '/calendario',
  JOIN_US: '/junte-se',
  WHERE_FROM: '/de-onde-assiste',
  HISTORY: '/historico',
  COMMUNITY: '/comunidade',
  NEWSLETTER: '/newsletter',
  BLOG: '/blog',
  BLOG_POST: '/blog/:slug',
  PARTNERS: '/parceiros',

  // OBS routes
  OBS_SCOREBOARD: '/obs/placar',
  OBS_STATS: '/obs/stats',
  OBS_EVENTS: '/obs/eventos',
  OBS_FIELD: '/obs/campo',
  OBS_POLL: '/obs/enquete',
} as const;
```

---

## 8. Decisões Técnicas

### 8.1 Por que Clean Architecture?

1. **Testabilidade**: Entidades puras podem ser testadas sem mock de APIs
2. **Manutenibilidade**: Mudança de API (ex: trocar API-Football) não afeta componentes
3. **Reutilização**: Mesmas entidades para site e OBS overlays
4. **Clareza**: Cada camada tem responsabilidade clara

### 8.2 Por que React Query?

1. **Cache automático**: Evita requests duplicados
2. **Polling nativo**: `refetchInterval` para dados ao vivo
3. **Estados de loading/error**: Built-in
4. **Stale-while-revalidate**: UX melhor

### 8.3 Sobre Banco de Dados

**Para MVP**: Não usar banco de dados
- Formulário "Junte-se": mailto: link ou localStorage
- Enquetes OBS: estado local + URL params
- Mapa "De Onde Assiste": hardcoded ou localStorage

**Para futuro (se necessário)**:
- Airtable API (gratuito, simples)
- Google Sheets como "banco"
- Supabase (quando escalar)

---

## 9. Checklist de Qualidade

### Code Style
- [ ] TypeScript strict mode
- [ ] ESLint sem warnings
- [ ] Nomes descritivos (sem abreviações)
- [ ] Funções pequenas (< 20 linhas)
- [ ] Componentes focados (single responsibility)

### Performance
- [ ] Lazy loading de páginas
- [ ] Imagens otimizadas
- [ ] Cache de API configurado
- [ ] Bundle size monitorado

### UX
- [ ] Loading states em todas as páginas
- [ ] Error handling com mensagens úteis
- [ ] Mobile-first responsive
- [ ] Acessibilidade básica (aria-labels)

---

## 10. Próximos Passos

Confirme se este plano está alinhado com sua visão, e podemos começar a execução pela **Fase 0** (setup) seguida pela **Fase 1** (domínio e infraestrutura).

Dúvidas a esclarecer:
1. **API Key**: Usar a key diretamente no frontend ou implementar proxy?
2. **Enquetes**: Usar apenas estado local ou precisa persistir votos?
3. **Mapa**: Implementar com dados reais ou mockado para MVP?
