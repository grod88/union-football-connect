# Union Football Live - Documentação de Arquitetura

## Índice
1. [Visão Geral](#1-visão-geral)
2. [Arquitetura Clean Architecture](#2-arquitetura-clean-architecture)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Páginas e Rotas](#4-páginas-e-rotas)
5. [Supabase/Lovable - Tabelas e Edge Functions](#5-supabaselovable---tabelas-e-edge-functions)
6. [Integração API-Football](#6-integração-api-football)
7. [Fluxo de Dados](#7-fluxo-de-dados)
8. [Tecnologias Utilizadas](#8-tecnologias-utilizadas)

---

## 1. Visão Geral

**Union Football Live** é uma aplicação React + TypeScript para acompanhamento de partidas de futebol em tempo real, com widgets para streaming via OBS Studio. O projeto utiliza **Clean Architecture** com 4 camadas bem definidas.

### Principais Funcionalidades
- Dashboard de partidas ao vivo
- Estatísticas em tempo real
- Timeline de eventos (gols, cartões, substituições)
- Widgets OBS para transmissões
- Cadastro de membros da comunidade
- Suporte a múltiplos fusos horários

---

## 2. Arquitetura Clean Architecture

O projeto implementa **Clean Architecture** com 4 camadas:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                              │
│         (React Components, Pages, UI Handling)                      │
├─────────────────────────────────────────────────────────────────────┤
│                     APPLICATION LAYER                               │
│    (Custom Hooks, Services, Business Logic Orchestration)           │
├─────────────────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE LAYER                             │
│        (API-Football Client, HTTP, Database Clients)                │
├─────────────────────────────────────────────────────────────────────┤
│                        CORE LAYER                                   │
│     (Entities, Enums, Interfaces/Ports, Domain Logic)               │
└─────────────────────────────────────────────────────────────────────┘
```

**Princípio**: Dependências fluem apenas para dentro. Presentation depende de Application, que depende de Infrastructure e Core.

### Padrões Utilizados
- **Repository Pattern**: Interface `IFootballRepository` no core, implementação na infrastructure
- **Mapper Pattern**: DTOs (API) → Entidades de Domínio
- **Factory Pattern**: `createFixture()`, `createTeam()` para criação de entidades
- **Ports & Adapters**: Portas no core, adaptadores na infrastructure

---

## 3. Estrutura de Pastas

```
src/
├── core/                          # CAMADA CORE (Domínio)
│   ├── domain/
│   │   ├── entities/              # Entidades de negócio
│   │   │   ├── fixture.ts         # Partida
│   │   │   ├── team.ts            # Time
│   │   │   ├── league.ts          # Liga/Competição
│   │   │   ├── event.ts           # Eventos da partida
│   │   │   ├── lineup.ts          # Escalações
│   │   │   ├── standing.ts        # Classificação
│   │   │   └── statistic.ts       # Estatísticas
│   │   └── enums/
│   │       ├── match-status.ts    # Status: NS, 1H, HT, 2H, FT...
│   │       └── event-type.ts      # Tipos: GOAL, CARD, SUBSTITUTION...
│   └── ports/
│       └── football-repository.port.ts  # Interface do repositório
│
├── infrastructure/                # CAMADA INFRASTRUCTURE
│   └── api-football/
│       ├── client.ts              # Cliente HTTP (via Edge Function)
│       ├── repository.ts          # Implementação do repositório
│       ├── dtos/                  # Data Transfer Objects
│       │   ├── fixture.dto.ts
│       │   ├── events.dto.ts
│       │   ├── lineups.dto.ts
│       │   ├── standings.dto.ts
│       │   └── statistics.dto.ts
│       └── mappers/               # Conversores DTO → Entity
│           ├── fixture.mapper.ts
│           ├── events.mapper.ts
│           ├── lineups.mapper.ts
│           ├── standings.mapper.ts
│           └── statistics.mapper.ts
│
├── application/                   # CAMADA APPLICATION
│   ├── hooks/                     # Hooks React Query
│   │   ├── useFixture.ts
│   │   ├── useFixtureStatistics.ts
│   │   ├── useFixtureEvents.ts
│   │   ├── useFixtureLineups.ts
│   │   ├── useNextMatch.ts
│   │   ├── useLiveFixtures.ts
│   │   ├── useCalendarFixtures.ts
│   │   ├── useTodayFixtures.ts
│   │   └── useStandings.ts
│   └── services/
│       ├── timezone.service.ts    # Conversão de fusos
│       ├── calendar.service.ts    # Geração de ICS
│       └── poll.service.ts        # Gerenciamento de enquetes
│
├── presentation/                  # CAMADA PRESENTATION
│   ├── pages/
│   │   ├── site/                  # Páginas do site
│   │   │   ├── LiveDashboard.tsx
│   │   │   ├── TodayMatches.tsx
│   │   │   └── JoinUs.tsx
│   │   ├── obs/                   # Widgets OBS
│   │   │   ├── ObsScoreboard.tsx
│   │   │   ├── ObsStats.tsx
│   │   │   ├── ObsEvents.tsx
│   │   │   ├── ObsPoll.tsx
│   │   │   ├── ObsLeagueName.tsx
│   │   │   ├── ObsHomeTeam.tsx
│   │   │   ├── ObsAwayTeam.tsx
│   │   │   ├── ObsScore.tsx
│   │   │   └── ObsMatchTime.tsx
│   │   └── blog/
│   └── components/
│       ├── match/                 # Componentes de partida
│       ├── statistics/            # Componentes de estatísticas
│       ├── events/                # Componentes de eventos
│       ├── lineup/                # Componentes de escalação
│       ├── poll/                  # Componentes de enquete
│       ├── common/                # Componentes comuns
│       └── layout/                # Layouts
│
├── components/ui/                 # shadcn-ui (40+ componentes)
├── config/                        # Configurações
│   ├── api.config.ts
│   ├── routes.ts
│   └── constants.ts
├── integrations/supabase/         # Cliente Supabase
├── lib/                           # Utilitários
└── i18n/                          # Internacionalização

supabase/
├── functions/                     # Edge Functions
│   ├── api-football-proxy/
│   ├── sync-teams/
│   └── community-register/
├── migrations/                    # Migrações SQL
└── config.toml                    # Configuração Supabase
```

---

## 4. Páginas e Rotas

### 4.1 Páginas Públicas (Site)

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | `Index` | Landing page com hero, próxima partida, vídeos |
| `/ao-vivo` | `LiveDashboard` | Dashboard de partidas ao vivo com estatísticas |
| `/jogos-do-dia` | `TodayMatches` | Jogos do dia com múltiplos fusos horários |
| `/junte-se` | `JoinUs` | Cadastro de membros da comunidade |
| `/comunidade` | Redirect → `/junte-se` | Redirecionamento legado |
| `*` | `NotFound` | Página 404 |

### 4.2 Widgets OBS (Overlays para Streaming)

Todos os widgets OBS possuem fundo transparente e aceitam o parâmetro `?fixture=FIXTURE_ID`.

| Rota | Componente | Descrição | Refresh |
|------|------------|-----------|---------|
| `/obs/placar` | `ObsScoreboard` | Placar completo com times e timer | 15s |
| `/obs/stats` | `ObsStats` | Estatísticas lado a lado | 30s |
| `/obs/eventos` | `ObsEvents` | Timeline de eventos | 15s |
| `/obs/enquete` | `ObsPoll` | Enquete interativa | - |
| `/obs/liga` | `ObsLeagueName` | Nome da liga e rodada | 15s |
| `/obs/home` | `ObsHomeTeam` | Nome do time mandante | 15s |
| `/obs/away` | `ObsAwayTeam` | Nome do time visitante | 15s |
| `/obs/score` | `ObsScore` | Apenas placar numérico | 15s |
| `/obs/tempo` | `ObsMatchTime` | Tempo de jogo | 15s |

#### Parâmetros Especiais

**ObsStats** (`/obs/stats`):
- `?widget=full` - Todas as 9 estatísticas
- `?widget=top` - Primeiras 4 estatísticas
- `?widget=bottom` - Estatísticas 5-8

**ObsEvents** (`/obs/eventos`):
- `?max=8` - Máximo de eventos exibidos

**ObsPoll** (`/obs/enquete`):
- `?pergunta=TEXTO` - Pergunta da enquete
- `?opcao1=TEXTO` - Opção 1
- `?opcao2=TEXTO` - Opção 2
- `?opcao3=TEXTO` - Opção 3 (opcional)
- `?opcao4=TEXTO` - Opção 4 (opcional)
- `?simular=N` - Simular N votos iniciais

**Exemplo**: `/obs/enquete?pergunta=Foi+penalti?&opcao1=SIM&opcao2=NAO`

---

## 5. Supabase/Lovable - Tabelas e Edge Functions

### 5.1 Configuração do Cliente

**Arquivo**: `src/integrations/supabase/client.ts`

```typescript
const supabase = createClient<Database>(
  "https://wnnyfgtvgnfvkqmyftti.supabase.co",
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
```

### 5.2 Tabelas do Banco de Dados

#### Tabela: `teams`
Cache de times da API-Football por país.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | BIGINT | PRIMARY KEY | ID do time na API-Football |
| `name` | TEXT | NOT NULL | Nome do time |
| `logo` | TEXT | NULLABLE | URL do escudo |
| `country` | TEXT | NOT NULL | Código do país (BR, PT, etc.) |
| `country_name` | TEXT | NULLABLE | Nome completo do país |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Data de criação |

**Índices**: `idx_teams_country` em `country`

**RLS Policies**:
- SELECT: Público ("Teams are publicly readable")

---

#### Tabela: `community_members`
Cadastro de membros da comunidade.

| Coluna | Tipo | Constraints | Descrição |
|--------|------|-------------|-----------|
| `id` | UUID | PRIMARY KEY DEFAULT gen_random_uuid() | ID único |
| `name` | TEXT | NOT NULL | Nome (máx 100 chars) |
| `email` | TEXT | NOT NULL, UNIQUE | Email único |
| `country` | TEXT | NOT NULL | Código do país |
| `favorite_team_id` | BIGINT | FK → teams(id) | ID do time favorito |
| `favorite_team_name` | TEXT | NULLABLE | Nome do time favorito |
| `message` | TEXT | NULLABLE | Mensagem opcional (máx 1000 chars) |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Data de cadastro |

**RLS Policies**:
- INSERT: Público ("Anyone can register")
- SELECT/UPDATE/DELETE: Restrito (dados privados)

---

### 5.3 Edge Functions

#### Function: `api-football-proxy`
**Propósito**: Proxy para API-Football (bypass CORS)

**Endpoint**: GET `?endpoint=/fixtures&id=123`

**Endpoints Permitidos**:
- `/fixtures`
- `/standings`
- `/teams`
- `/players`

**CORS**: Permite `localhost:8080`, `localhost:5173`, `*.lovable.app`, `*.lovableproject.com`

**Configuração**: `verify_jwt = false` (acesso público)

---

#### Function: `sync-teams`
**Propósito**: Sincronizar times de um país da API-Football para o banco

**Endpoint**: GET `?country=BR`

**Países Suportados**: BR, NZ, AU, PT, US, AR, UY, CL, CO, MX, GB, ES, DE, FR, IT

**Resposta**:
```json
{
  "teams": [{ "id": 123, "name": "...", "logo": "...", "country": "BR" }],
  "count": 50
}
```

---

#### Function: `community-register`
**Propósito**: Registrar membros da comunidade

**Endpoint**: POST

**Body**:
```json
{
  "name": "string",
  "email": "string",
  "country": "string",
  "favorite_team_id": number | null,
  "favorite_team_name": "string" | null,
  "message": "string" | null
}
```

**Validações**:
- `name`: 1-100 caracteres
- `email`: Formato válido, máx 255 chars, único
- `message`: máx 1000 caracteres

**Resposta Sucesso (201)**:
```json
{ "success": true, "id": "uuid" }
```

**Erros**: 400 (validação), 409 (email duplicado)

---

## 6. Integração API-Football

### 6.1 Arquitetura da Integração

```
┌─────────────────────────────────────────────────────────────┐
│                  API-Football v3                            │
│            v3.football.api-sports.io                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Supabase Edge Function                         │
│              (api-football-proxy)                           │
│  - Adiciona API Key                                         │
│  - Gerencia CORS                                            │
│  - Valida endpoints                                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              ApiFootballClient                              │
│              (client.ts)                                    │
│  - Singleton instance                                       │
│  - Método get<T>(endpoint)                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              ApiFootballRepository                          │
│              (repository.ts)                                │
│  Implementa IFootballRepository                             │
│  Métodos: getFixtureById, getLiveFixtures, etc.             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Mappers                                        │
│  mapFixtureFromDTO, mapEventsFromDTO, etc.                  │
│  Convertem DTOs → Entidades de Domínio                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Domain Entities                                │
│  Fixture, Team, League, FixtureEvent, etc.                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              React Query Cache                              │
│  - Stale time: 10-300s                                      │
│  - Refresh intervals: 15-300s                               │
│  - 2 retries em falha                                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Custom Hooks                                   │
│  useFixture, useFixtureStatistics, useFixtureEvents, etc.   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              React Components (UI)                          │
│  Scoreboard, StatComparison, EventTimeline, etc.            │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Endpoints Utilizados

| Endpoint | Método Repository | Descrição |
|----------|-------------------|-----------|
| `/fixtures?id={id}` | `getFixtureById()` | Partida por ID |
| `/fixtures?team={id}&season={s}` | `getFixturesByTeam()` | Partidas de um time |
| `/fixtures?league={id}&season={s}` | `getFixturesByLeague()` | Partidas de uma liga |
| `/fixtures?live=all` | `getLiveFixtures()` | Partidas ao vivo |
| `/fixtures/statistics?fixture={id}` | `getFixtureStatistics()` | Estatísticas |
| `/fixtures/events?fixture={id}` | `getFixtureEvents()` | Eventos |
| `/fixtures/lineups?fixture={id}` | `getFixtureLineups()` | Escalações |
| `/fixtures/headtohead?h2h={t1}-{t2}` | `getHeadToHead()` | Confronto direto |
| `/standings?league={id}&season={s}` | `getStandings()` | Classificação |

### 6.3 DTOs (Data Transfer Objects)

#### FixtureDTO
```typescript
interface FixtureDTO {
  fixture: {
    id: number;
    referee: string | null;
    timezone: string;
    date: string;
    timestamp: number;
    status: { long: string; short: string; elapsed: number | null };
    venue: { id: number | null; name: string | null; city: string | null };
  };
  league: { id: number; name: string; country: string; logo: string; round: string };
  teams: { home: TeamDTO; away: TeamDTO };
  goals: { home: number | null; away: number | null };
  score: { halftime, fulltime, extratime, penalty };
}
```

#### StatisticsDTO
```typescript
interface StatisticsDTO {
  team: { id: number; name: string; logo: string };
  statistics: Array<{ type: string; value: number | string | null }>;
}
// Types: 'Shots on Goal', 'Ball Possession', 'Corner Kicks', 'Fouls', etc.
```

#### EventDTO
```typescript
interface EventDTO {
  time: { elapsed: number; extra: number | null };
  team: { id: number; name: string; logo: string };
  player: { id: number | null; name: string };
  assist: { id: number | null; name: string | null };
  type: string;   // 'Goal', 'Card', 'subst', 'Var'
  detail: string; // 'Normal Goal', 'Yellow Card', etc.
}
```

#### LineupDTO
```typescript
interface LineupDTO {
  team: { id: number; name: string; logo: string };
  formation: string;  // "4-3-3"
  startXI: Array<{ player: { id, name, number, pos, grid } }>;
  substitutes: Array<{ player: { id, name, number, pos } }>;
  coach: { id: number | null; name: string; photo: string | null };
}
```

### 6.4 Entidades de Domínio

#### Fixture (Partida)
```typescript
interface Fixture {
  id: number;
  date: Date;
  timestamp: number;
  timezone: string;
  status: MatchStatus;
  elapsed: number | null;
  league: League;
  homeTeam: Team;
  awayTeam: Team;
  goalsHome: number | null;
  goalsAway: number | null;
  venue?: { name: string; city: string };
  referee?: string;
}

// Helpers: isFixtureLive(), isFixtureFinished(), getScoreDisplay()
```

#### MatchStatus (Enum)
```typescript
enum MatchStatus {
  NOT_STARTED = 'NS',
  FIRST_HALF = '1H',
  HALFTIME = 'HT',
  SECOND_HALF = '2H',
  EXTRA_TIME = 'ET',
  PENALTIES = 'PEN',
  FINISHED = 'FT',
  POSTPONED = 'PST',
  CANCELLED = 'CANC',
  // ... outros
}
```

#### FixtureEvent (Evento)
```typescript
interface FixtureEvent {
  id: number;
  fixtureId: number;
  timeElapsed: number;
  timeExtra: number | null;
  team: Team;
  player: { id: number | null; name: string };
  assist: { id: number | null; name: string | null } | null;
  type: EventType;  // GOAL, CARD, SUBSTITUTION, VAR
  detail: string;
}

// Helpers: isGoalEvent(), isCardEvent(), isYellowCard(), isRedCard()
```

### 6.5 Intervalos de Atualização

| Dados | Stale Time | Refresh Interval |
|-------|------------|------------------|
| Partida ao vivo | 10s | 15s |
| Estatísticas | 15s | 30s |
| Eventos | 10s | 15s |
| Escalações | 300s | - (estável) |
| Classificação | 300s | 300s |
| Calendário | 60s | 300s |

### 6.6 Constantes de Configuração

```typescript
// Ligas
LEAGUES = {
  PAULISTAO: 475,
  BRASILEIRAO_A: 71,
  BRASILEIRAO_B: 72,
  LIBERTADORES: 13,
  COPA_DO_BRASIL: 73,
  SULAMERICANA: 11,
}

// Times
TEAMS = {
  SAO_PAULO: 126,
  PALMEIRAS: 121,
  CORINTHIANS: 131,
  SANTOS: 128,
  FLAMENGO: 127,
  // ... outros
}

CURRENT_SEASON = 2026
```

---

## 7. Fluxo de Dados

### 7.1 Fluxo de Partida ao Vivo

```
1. Usuário acessa /ao-vivo
                    ↓
2. LiveDashboard.tsx renderiza
                    ↓
3. useFixture(fixtureId) é chamado
                    ↓
4. React Query verifica cache
   ├─ Cache válido → retorna dados
   └─ Cache expirado → continua
                    ↓
5. footballRepository.getFixtureById(id)
                    ↓
6. apiFootballClient.get('/fixtures?id={id}')
                    ↓
7. Edge Function (api-football-proxy)
   ├─ Valida endpoint
   ├─ Adiciona API key
   └─ Faz request para API-Football
                    ↓
8. API-Football retorna JSON
                    ↓
9. mapFixtureFromDTO(dto) → Fixture entity
                    ↓
10. React Query armazena em cache
                    ↓
11. Componentes renderizam dados
                    ↓
12. Se partida ao vivo: refetch em 15s
```

### 7.2 Fluxo de Cadastro de Membro

```
1. Usuário acessa /junte-se
                    ↓
2. Detecção automática de país (ipapi.co)
                    ↓
3. Busca times do país
   ├─ Verifica cache local (DB)
   └─ Se vazio → sync-teams Edge Function
                    ↓
4. Usuário preenche formulário
                    ↓
5. Validação client-side (Zod)
                    ↓
6. Submit → community-register Edge Function
   ├─ Validação server-side
   ├─ Normalização (lowercase email, trim)
   └─ INSERT em community_members
                    ↓
7. Resposta sucesso/erro
```

---

## 8. Tecnologias Utilizadas

### Core
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| React | 18.3.1 | Framework UI |
| TypeScript | 5.8.3 | Tipagem estática |
| Vite | 5.4.19 | Build tool |
| React Router | v6 | Roteamento |

### Estado e Dados
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| TanStack React Query | 5.83.0 | Cache e fetching |
| Supabase | 2.97.0 | Backend e Edge Functions |
| Zod | 3.25.76 | Validação de schemas |

### UI
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| Tailwind CSS | 3.4.17 | Estilização |
| shadcn-ui | - | Componentes base (40+) |
| Radix UI | - | Componentes acessíveis |
| Framer Motion | 12.34.3 | Animações |
| Lucide React | 0.462.0 | Ícones |

### Desenvolvimento
| Tecnologia | Versão | Uso |
|------------|--------|-----|
| ESLint | 9.32.0 | Linting |
| Vitest | 3.2.4 | Testes unitários |
| SWC | - | Compilador rápido |

---

## Diagrama Resumo

```
┌────────────────────────────────────────────────────────────────────┐
│                        UNION FOOTBALL LIVE                         │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐ │
│  │   SITE       │    │   OBS        │    │    BACKEND           │ │
│  │   PAGES      │    │   WIDGETS    │    │    (Supabase)        │ │
│  │              │    │              │    │                      │ │
│  │ • Home       │    │ • Placar     │    │ • Edge Functions     │ │
│  │ • Ao Vivo    │    │ • Stats      │    │   - api-football-    │ │
│  │ • Jogos Dia  │    │ • Eventos    │    │     proxy            │ │
│  │ • Junte-se   │    │ • Enquete    │    │   - sync-teams       │ │
│  │              │    │ • Liga       │    │   - community-       │ │
│  │              │    │ • Times      │    │     register         │ │
│  │              │    │ • Score      │    │                      │ │
│  │              │    │ • Tempo      │    │ • Tables             │ │
│  │              │    │              │    │   - teams            │ │
│  │              │    │              │    │   - community_       │ │
│  │              │    │              │    │     members          │ │
│  └──────┬───────┘    └──────┬───────┘    └──────────┬───────────┘ │
│         │                   │                       │             │
│         └───────────────────┼───────────────────────┘             │
│                             │                                     │
│                             ▼                                     │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                    API-FOOTBALL v3                           │ │
│  │              v3.football.api-sports.io                       │ │
│  │                                                              │ │
│  │  Endpoints: /fixtures, /standings, /teams, /players          │ │
│  │  Dados: Partidas, Estatísticas, Eventos, Escalações          │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

*Documento gerado automaticamente em 23/02/2026*
