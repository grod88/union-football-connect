-- Add missing columns for Produtor and Critico agents

-- clip_production_plans: add columns for full produtor output
ALTER TABLE clip_production_plans
ADD COLUMN IF NOT EXISTS plan JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dropped_clips JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS summary TEXT;

-- clip_evaluations: restructure for batch evaluations
-- First, drop the old constraint that requires per-clip structure
ALTER TABLE clip_evaluations
DROP COLUMN IF EXISTS clip_id,
DROP COLUMN IF EXISTS verdict,
DROP COLUMN IF EXISTS score,
DROP COLUMN IF EXISTS scores,
DROP COLUMN IF EXISTS feedback;

-- Add new columns for batch evaluation
ALTER TABLE clip_evaluations
ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES clip_production_plans(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS evaluations JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS summary JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS overall_feedback TEXT,
ADD COLUMN IF NOT EXISTS raw_response JSONB;

-- Index for plan_id
CREATE INDEX IF NOT EXISTS idx_clip_evaluations_plan ON clip_evaluations(plan_id);
