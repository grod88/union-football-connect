-- API Cache table for api-football-proxy intelligent caching
-- Dynamic TTL based on endpoint type and match status

CREATE TABLE IF NOT EXISTS public.api_cache (
  cache_key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups by cache_key (already PK, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_api_cache_cached_at ON public.api_cache (cached_at);

-- Enable RLS
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;

-- Allow service_role full access (Edge Functions use service_role)
CREATE POLICY "Service role full access to api_cache"
  ON public.api_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Allow anon to read cache (for debugging if needed)
CREATE POLICY "Anon can read api_cache"
  ON public.api_cache
  FOR SELECT
  USING (true);

-- Cleanup function: remove entries older than 24 hours
CREATE OR REPLACE FUNCTION public.cleanup_api_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.api_cache
  WHERE cached_at < now() - interval '24 hours';
END;
$$;
