
CREATE TABLE IF NOT EXISTS public.bolinha_match_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id BIGINT NOT NULL,
  home_team_name TEXT,
  home_team_id BIGINT,
  away_team_name TEXT,
  away_team_id BIGINT,
  league_name TEXT,
  league_round TEXT,
  venue_name TEXT,
  match_date TIMESTAMPTZ,
  fixture_data JSONB DEFAULT '{}',
  injuries_data JSONB DEFAULT '[]',
  predictions_data JSONB DEFAULT '{}',
  h2h_data JSONB DEFAULT '[]',
  lineups_data JSONB DEFAULT '[]',
  statistics_data JSONB DEFAULT '[]',
  events_data JSONB DEFAULT '[]',
  context_summary TEXT,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_bolinha_context_fixture ON public.bolinha_match_context(fixture_id);

CREATE OR REPLACE FUNCTION public.deactivate_other_matches()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.bolinha_match_context 
    SET is_active = false 
    WHERE id != NEW.id AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_deactivate_other_matches
  BEFORE INSERT OR UPDATE ON public.bolinha_match_context
  FOR EACH ROW
  EXECUTE FUNCTION public.deactivate_other_matches();

ALTER TABLE public.bolinha_match_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read match context" ON public.bolinha_match_context
  FOR SELECT USING (true);

CREATE POLICY "Service write match context" ON public.bolinha_match_context
  FOR ALL USING (true) WITH CHECK (true);
