

## Fix de Contexto: Pré-jogo vs Bola Rolando

### 3 changes across 3 files + 1 DB migration

**1. DB Migration** — Add `pre_match_summary` and `live_summary` columns to `bolinha_match_context`

**2. `supabase/functions/bolinha-sync-match/index.ts`**
- Replace `generateContextSummary` with two functions: `generatePreMatchSummary` (predictions, H2H, injuries, lineups, basic match info) and `generateLiveMatchSummary` (score, status, elapsed, live stats with importance filter, events list with emojis, automatic dominance analysis)
- Update upsert to save `pre_match_summary`, `live_summary`, and set `context_summary: null`

**3. `supabase/functions/bolinha-comment/index.ts`**
- Replace entire `BOLINHA_SYSTEM_PROMPT` with the new version that has explicit rules for when to use pre-match vs live data, with good/bad examples
- Update context fetch to select `pre_match_summary, live_summary` instead of `context_summary`
- Build `contextBlock` dynamically: if `live_summary` contains events data, prioritize live; otherwise use pre-match only
- Update user prompt instructions to reinforce context separation

**4. `src/presentation/pages/site/AdminBolinha.tsx`**
- Update "Ver contexto completo" dialog to show both summaries (pre-match and live) in separate labeled sections instead of the old single `context_summary`
- Update quick action prompts to hint context usage: pre-match actions say "Use DADOS PRE-JOGO", live actions say "Use DADOS AO VIVO"
- Adjust quick action emotions/labels for better alignment with the prompt system

### Technical details

- `generatePreMatchSummary`: receives `{fixture, injuries, predictions, h2h, lineups}`, outputs match info + predictions + injuries + H2H + lineups
- `generateLiveMatchSummary`: receives `{fixture, statistics, events}`, outputs score/status + filtered important stats (possession, shots, corners, fouls, cards, xG) + automatic dominance analysis + chronological event list with emoji markers + summary counts
- Context block logic in `bolinha-comment`: checks `live_summary?.includes("EVENTOS DO JOGO")` to determine if match is live
- Both edge functions will be deployed after changes

