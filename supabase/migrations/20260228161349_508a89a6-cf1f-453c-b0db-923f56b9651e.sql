
-- Tabela bolinha_messages
CREATE TABLE IF NOT EXISTS public.bolinha_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fixture_id BIGINT,
  text TEXT NOT NULL,
  emotion TEXT NOT NULL DEFAULT 'neutro',
  team_id BIGINT,
  audio_url TEXT,
  event_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Validation trigger para emoções (em vez de CHECK constraint)
CREATE OR REPLACE FUNCTION public.validate_bolinha_emotion()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.emotion NOT IN ('neutro', 'gol', 'bravo', 'analise', 'sarcastico', 'tedio') THEN
    RAISE EXCEPTION 'Invalid emotion: %. Must be one of: neutro, gol, bravo, analise, sarcastico, tedio', NEW.emotion;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_bolinha_emotion
  BEFORE INSERT OR UPDATE ON public.bolinha_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_bolinha_emotion();

-- Índice por fixture
CREATE INDEX idx_bolinha_fixture ON public.bolinha_messages(fixture_id);

-- Função de limpeza automática (24h)
CREATE OR REPLACE FUNCTION public.clean_old_bolinha_messages()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.bolinha_messages WHERE created_at < now() - interval '24 hours';
END;
$$;

-- RLS
ALTER TABLE public.bolinha_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read bolinha" ON public.bolinha_messages
  FOR SELECT USING (true);

CREATE POLICY "Service write bolinha" ON public.bolinha_messages
  FOR INSERT WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.bolinha_messages;
