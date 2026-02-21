# Copilot Instructions — Union Football Live

## Project Overview

Union Football Live is a bilingual (PT-BR primary, EN secondary) football live-streaming website connecting Brazilian fans with global audiences. The presenter is based in New Zealand; co-hosts are in Brazil. The brand slogan is **"O Futebol é Melhor Junto / Football is Better Together"**.

This project is built and deployed via **Lovable** (AI app builder). The main design spec is in `prompt-lovable-union-football-live.md`. Reference images are in `imagens-base/`. The PDF `plano-integracao-ufl.md.pdf` details the OBS overlay integration plan.

## Architecture & Key Components

The application follows a **frontend-only, API-driven** stack (no database):

- **Platform**: Lovable (for development and deployment)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui, dark theme
- **State Management**: TanStack React Query for API data fetching/caching
- **Football data**: API-Football v3 (`v3.football.api-sports.io`) — direct REST calls for custom pages
- **i18n**: PT-BR (primary) and EN
- **Forms**: Display-only or direct email via `mailto:` links (no database storage)

### Architecture Principles

1. **No Database**: All data comes from API-Football. No Supabase, no backend database.
2. **API-First**: Custom pages fetch data directly from API-Football and display results.
3. **Stateless**: Each page load fetches fresh data from the API; no persistent user data.
4. **Lovable-native**: Deploy directly through Lovable's publishing system.

### Site Pages (11 total)

1. **Home/Landing** — hero, next-match card, "Como Funciona" cards, social links
2. **Próximo Jogo** — countdown timer, timezone conversion (BRT, NZDT, visitor-local), .ics export
3. **Calendário de Lives** — filterable grid, live badge, replay links (API-Football data)
4. **Ao Vivo (Live Dashboard)** — real-time stats via API-Football REST + YouTube embed + Discord chat
5. **Junte-se à Torcida** — simple form with mailto: link (no database)
6. **De Onde Você Tá Assistindo?** — interactive world map (visual/static for MVP)
7. **Histórico de Lives** — replay grid with YouTube thumbnails (hardcoded or YouTube API)
8. **Comunidade** — Discord ("6ª FILA") hub
9. **Newsletter** — email signup via external service (Mailchimp/Buttondown embed)
10. **Blog/Análises** — posts can be hardcoded markdown or external CMS
11. **Parceiros/Patrocinadores** — sponsor logos + "Seja Parceiro" page

### OBS Overlay Routes (transparent background, no chrome)

All accept `?fixture=FIXTURE_ID` and `?mode=obs`. Auto-poll via React Query, no manual refresh.

| Route | Purpose | Refresh |
|---|---|---|
| `/obs/placar` | Scoreboard + match time | 15s |
| `/obs/stats` | Comparative stat bars (Bet365 style) | 30s |
| `/obs/eventos` | Event timeline (goals, cards, subs) | 15s |
| `/obs/campo` | Virtual pitch with plotted events | 15s |
| `/obs/enquete` | Live poll (local state only, no persistence) | - |

## API-Football Integration

- **Host**: `v3.football.api-sports.io`
- **Key header**: `x-rapidapi-key` / `x-rapidapi-host`
- **Test IDs**: Paulistão league `475`, São Paulo FC team `126`, season `2026`
- **Match statuses**: `NS` (not started), `1H`, `HT`, `2H`, `ET`, `PEN`, `FT`, `AET`

### Fetching Data Pattern (React Query)

```typescript
// src/lib/api-football.ts
const API_KEY = import.meta.env.VITE_API_FOOTBALL_KEY;
const API_HOST = "v3.football.api-sports.io";

export async function fetchFixture(fixtureId: string) {
  const res = await fetch(`https://${API_HOST}/fixtures?id=${fixtureId}`, {
    headers: {
      "x-rapidapi-key": API_KEY,
      "x-rapidapi-host": API_HOST,
    },
  });
  return res.json();
}

// In component:
const { data, isLoading } = useQuery({
  queryKey: ["fixture", fixtureId],
  queryFn: () => fetchFixture(fixtureId),
  refetchInterval: 15000, // 15 seconds for live data
});
```

### Key Endpoints

| Endpoint | Usage |
|---|---|
| `/fixtures?team=126&next=1` | Next match for São Paulo FC |
| `/fixtures?league=475&season=2026` | All Paulistão matches |
| `/fixtures?id={FIXTURE_ID}` | Specific match details |
| `/fixtures/statistics?fixture={ID}` | Match statistics |
| `/fixtures/events?fixture={ID}` | Goals, cards, subs |
| `/fixtures/lineups?fixture={ID}` | Team lineups |
| `/standings?league=475&season=2026` | League standings |

## Design System

| Token | Value | Usage |
|---|---|---|
| Primary bg | `#0a0a0a` | Main background |
| Gold | `#d4a853` | Highlights, borders, titles |
| Red accent | `#c0392b` / `#e74c3c` | CTAs, "AO VIVO" badge (pulsing) |
| Text | `#ffffff`, `#b0b0b0` | Body text |
| Card surface | `#1a1a1a`, `#2a2a2a` | Cards with subtle gold borders |

- **Fonts**: Oswald/Bebas Neue for headings; Inter/Roboto for body; monospace for scores
- **Vibe**: stadium-at-night with floodlights; subtle grass/stadium texture on backgrounds
- **Mobile-first** responsive design

## Conventions When Generating Code

- Always use **dark theme** Tailwind classes; never default to light backgrounds
- Timezone display must always include **BRT (UTC-3)**, **NZDT (UTC+13)**, and **visitor-detected** local time
- OBS pages: `background: transparent !important`, no header/footer/nav, URL-param driven
- Bilingual: every user-facing string needs PT-BR and EN variants
- **NO database calls** — all dynamic data comes from API-Football REST endpoints
- Use **React Query** (`@tanstack/react-query`) for data fetching with appropriate `refetchInterval`
- Store API key in `.env` as `VITE_API_FOOTBALL_KEY` (never commit to repo)
- Forms that need to "submit" should use `mailto:` links or external embeds

## MVP Phasing

**Phase 1 (launch):** Home, Próximo Jogo, Ao Vivo dashboard (API-driven), OBS overlays
**Phase 2 (growth):** Calendar, History, World Map, Newsletter (external embed)
**Phase 3 (monetization):** Sponsors, Blog, advanced features

## Development Workflow

1. Make changes locally or via Lovable interface
2. Test with `npm run dev`
3. Commit to GitHub (auto-syncs with Lovable)
4. Deploy via Lovable's "Share → Publish"
