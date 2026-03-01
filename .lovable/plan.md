

## Root Cause

The `deactivate_other_matches` trigger filters by `id != NEW.id`. During an upsert:
1. PostgreSQL attempts an INSERT with a **new generated UUID** as `NEW.id`
2. The BEFORE INSERT trigger fires and runs `UPDATE ... WHERE id != NEW.id AND is_active = true`
3. Since the new UUID differs from the existing row's `id`, the trigger **updates the existing row** for the same fixture (setting `is_active = false`)
4. The INSERT then conflicts on `fixture_id`, so `ON CONFLICT DO UPDATE` tries to update that **same existing row** again
5. PostgreSQL throws: "cannot affect row a second time"

The `pg_trigger_depth()` fix only prevents recursion — it doesn't prevent this same-row double-touch.

## Fix

Change the trigger to filter by `fixture_id` instead of `id`:

```sql
CREATE OR REPLACE FUNCTION public.deactivate_other_matches()
  RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.is_active = true AND pg_trigger_depth() = 1 THEN
    UPDATE public.bolinha_match_context 
    SET is_active = false 
    WHERE fixture_id != NEW.fixture_id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;
```

This ensures the trigger never touches the row being upserted, regardless of whether the `id` matches.

**One migration, no code changes needed.**

