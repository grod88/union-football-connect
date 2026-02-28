

## L1 — Create `bolinha_match_context` Table

### What will be done

1. **Create migration** with the provided SQL to add the `bolinha_match_context` table, including:
   - All columns for fixture info, cached API data (JSONB), and context summary
   - Unique index on `fixture_id`
   - Trigger to deactivate other matches when a new one is set active
   - RLS policies: public read, service write

2. **TypeScript types** will auto-update after migration runs — no manual edit needed.

### Notes
- The trigger function `deactivate_other_matches()` ensures only one match is active at a time
- The `context_summary` field will be populated by the L2 edge function (next prompt)
- RLS follows the same pattern as `bolinha_messages`: public read, open write (edge functions use service role key)

