-- Add lock columns for cache refresh deduplication
-- Prevents race condition where multiple widgets trigger simultaneous API calls

ALTER TABLE api_cache ADD COLUMN IF NOT EXISTS is_refreshing BOOLEAN DEFAULT false;
ALTER TABLE api_cache ADD COLUMN IF NOT EXISTS refresh_started_at TIMESTAMPTZ;

-- Index for efficient lock cleanup queries
CREATE INDEX IF NOT EXISTS idx_api_cache_refreshing ON api_cache (is_refreshing, refresh_started_at) WHERE is_refreshing = true;
