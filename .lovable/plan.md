

## L4 — Rewrite AdminBolinha with Match Context

### What will be done

Complete rewrite of `src/presentation/pages/site/AdminBolinha.tsx` with 3 main sections:

**1. PARTIDA ATIVA (top)**
- Input for `fixture_id` + "SINCRONIZAR" button calling `bolinha-sync-match`
- On mount: loads active match from `bolinha_match_context` where `is_active = true`
- Match info card showing: teams, league/round, venue, predictions summary, injury count, H2H summary, lineups availability, last sync time
- Gold left border accent (`border-l-4 border-yellow-500`)
- "Ver contexto completo" button opens a Dialog with the raw `context_summary` in monospace

**2. ATALHOS RAPIDOS (middle)**
- 12 context-aware quick action buttons using real team names from `matchContext`
- Prompts dynamically reference `homeName`, `awayName`, `leagueName`
- Global "Gerar com audio (TTS)" checkbox applies to all quick actions
- Grid: `grid-cols-2 md:grid-cols-4`, hover border yellow accent
- Loading state with spinner overlay on active button

**3. MODO LIVRE (bottom)**
- Two sub-sections side by side (stacked on mobile):
  - **Manual**: textarea + emotion selector (6 images) + send button with optional TTS via broadcast channel
  - **IA**: prompt textarea + generate button calling `bolinha-comment`
- Last generated text preview

**4. PREVIEW + HISTORICO (bottom)**
- Side by side: iframe `/obs/bolinha?size=sm` + history list
- History with realtime subscription for live updates
- Badge colors per emotion

### Files changed
- `src/presentation/pages/site/AdminBolinha.tsx` — full rewrite

### Key implementation details
- `matchContext` state holds the full row from `bolinha_match_context`
- Quick actions are computed via `useMemo` depending on `matchContext`
- H2H summary calculated from `h2h_data` array (count home/away wins + draws)
- Predictions summary extracted from `predictions_data.predictions.winner`
- Injuries count from `injuries_data.length`
- Uses existing Dialog component for context summary modal
- All existing broadcast + persist logic preserved from current implementation

