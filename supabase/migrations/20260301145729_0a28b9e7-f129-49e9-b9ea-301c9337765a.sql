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