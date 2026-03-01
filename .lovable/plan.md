

## Fix: "ON CONFLICT DO UPDATE" Error in bolinha-sync-match

### Root Cause

The `trg_deactivate_other_matches` trigger fires `BEFORE INSERT OR UPDATE` on `bolinha_match_context`. When the upsert updates an existing row (re-sync):

1. Upsert updates row with `fixture_id=1388522`, setting `is_active=true`
2. Trigger fires → runs `UPDATE ... SET is_active = false WHERE id != NEW.id AND is_active = true`
3. That UPDATE on other rows fires the **same trigger** recursively
4. The recursive trigger tries to update the original row (from step 1) → Postgres error: "cannot affect row a second time"

### Fix — 1 migration

Replace the trigger function with a recursion guard using `pg_trigger_depth()`:

```sql
CREATE OR REPLACE FUNCTION public.deactivate_other_matches()
  RETURNS trigger
  LANGUAGE plpgsql
  SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.is_active = true AND pg_trigger_depth() = 1 THEN
    UPDATE public.bolinha_match_context 
    SET is_active = false 
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;
```

Two guards:
- `NEW.is_active = true` — only run when activating a match (not when deactivating)
- `pg_trigger_depth() = 1` — prevent recursive trigger execution

No changes to edge functions or frontend code needed.

