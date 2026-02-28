

## L2 — Edge Function `bolinha-sync-match`

### What will be done

1. **Create `supabase/functions/bolinha-sync-match/index.ts`** with the full implementation from the prompt:
   - Receives `fixture_id` via POST JSON body
   - Calls `api-football-proxy` in parallel for 6 endpoints: `/fixtures`, `/injuries`, `/predictions`, `/fixtures/lineups`, `/fixtures/statistics`, `/fixtures/events`
   - After getting team IDs from fixture response, fetches `/fixtures/headtohead` (last 10)
   - Generates a textual `context_summary` covering: match info, predictions, injuries, H2H, lineups, live stats
   - Upserts everything into `bolinha_match_context` with `onConflict: 'fixture_id'` and `is_active: true`
   - Returns a summary JSON with counts and flags

2. **Add to `supabase/config.toml`**:
   ```toml
   [functions.bolinha-sync-match]
   verify_jwt = false
   ```

### Implementation details

- Uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (both already configured as secrets)
- Calls the proxy internally via `${supabaseUrl}/functions/v1/api-football-proxy?endpoint=...` — no API key needed client-side
- H2H fetch is sequential (depends on team IDs from fixture response); the other 6 are parallel
- The `deactivate_other_matches` trigger automatically deactivates previous matches on upsert

### No database changes needed
The `bolinha_match_context` table was created in L1.

