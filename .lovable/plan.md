

## L3 — Update `bolinha-comment` to Use Match Context

### Changes to `supabase/functions/bolinha-comment/index.ts`

1. **Move Supabase client creation earlier** — right after parsing the request body, before building the prompt
2. **Fetch active match context** from `bolinha_match_context` using `.maybeSingle()` (safer than `.single()`)
3. **Inject `context_summary`** into both `custom_prompt` and event-based prompt paths
4. **Use `activeMatch` fallbacks** for `team_id` and `fixture_id` when not provided in the request body
5. **No changes** to `BOLINHA_SYSTEM_PROMPT`, TTS logic, or broadcast logic

### Specific edits

- Lines ~68-95 (after body parse, before Claude call): insert Supabase client + context fetch
- Lines ~96-110 (prompt building): replace with context-enriched versions
- Lines ~140-150 (db insert + broadcast): use `effectiveTeamId` and `activeMatch?.fixture_id` fallbacks
- Move the existing Supabase client creation (currently around line 140) up, reuse for both context fetch and db operations

