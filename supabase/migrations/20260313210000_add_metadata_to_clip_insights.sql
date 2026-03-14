-- Add metadata column to clip_insights for v3 production data
ALTER TABLE clip_insights
ADD COLUMN IF NOT EXISTS metadata JSONB;
