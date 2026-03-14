-- ============================================================
-- Union Clips AI — Database Schema
-- Migration: clips_tables
-- ============================================================

-- Video sources (YouTube lives/videos being processed)
CREATE TABLE IF NOT EXISTS video_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  youtube_url TEXT NOT NULL,
  youtube_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER,
  context TEXT,                        -- "Palmeiras 3x1 Santos - Rod 20"

  -- Storage paths
  video_storage_path TEXT,             -- Supabase Storage path
  audio_storage_path TEXT,

  -- Transcription
  transcript_json JSONB,               -- Array of { start, end, text }
  transcript_text TEXT,                -- Formatted text for Claude

  -- Pipeline status
  status TEXT DEFAULT 'pending',       -- pending | downloading | transcribing | transcribed | analyzing | analyzed | error
  error_message TEXT,
  progress NUMERIC(3,2) DEFAULT 0.00,  -- 0.00 to 1.00

  -- Metadata from yt-dlp
  metadata JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Clip insights (AI suggestions before human approval)
CREATE TABLE IF NOT EXISTS clip_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_source_id UUID REFERENCES video_sources(id) ON DELETE CASCADE,

  -- AI-generated content
  title TEXT NOT NULL,                 -- "GOLAÇO DO VEIGA"
  hook TEXT,                           -- First 3 seconds hook
  category TEXT NOT NULL,              -- viral | analise | debate | storytelling | bolinha
  priority INTEGER DEFAULT 0,

  -- Timestamps (seconds)
  start_time FLOAT NOT NULL,
  end_time FLOAT NOT NULL,
  duration FLOAT GENERATED ALWAYS AS (end_time - start_time) STORED,

  -- Storytelling
  storytelling JSONB,                  -- { setup, climax, payoff }

  -- Production hints from AI
  production_hints JSONB,              -- { text_overlays, transitions, thumbnail_offset, energy_level }

  -- Social media suggestions
  social_metadata JSONB,               -- { caption_reels, caption_twitter, hashtags, best_platform }

  -- AI reasoning
  ai_reasoning TEXT,
  suggested_template TEXT DEFAULT 'reaction',
  ai_model_used TEXT,

  -- Human review
  status TEXT DEFAULT 'draft',         -- draft | approved | rejected | producing | done | error
  editor_notes TEXT,                   -- Notes from editor for AI refinement
  editor_template_override TEXT,       -- Template chosen by editor
  editor_time_override JSONB,          -- { start_time, end_time } adjusted by editor

  -- Secondary video (for split layouts)
  secondary_video_url TEXT,
  secondary_video_path TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Produced clips (after FFmpeg rendering)
CREATE TABLE IF NOT EXISTS produced_clips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_id UUID REFERENCES clip_insights(id) ON DELETE CASCADE,
  video_source_id UUID REFERENCES video_sources(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,

  -- Final files (Supabase Storage paths)
  horizontal_path TEXT,                -- 16:9
  vertical_path TEXT,                  -- 9:16 (optional)
  thumbnail_path TEXT,

  -- Production metadata
  duration_seconds FLOAT,
  resolution TEXT,                     -- "1920x1080"
  file_size_bytes BIGINT,
  ffmpeg_command TEXT,                 -- Command used (for debugging)

  -- Rendering status
  status TEXT DEFAULT 'rendering',     -- rendering | done | error
  error_message TEXT,
  render_time_seconds FLOAT,

  -- Publication tracking
  published_platforms JSONB,           -- [{ platform, url, published_at }]

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_video_sources_status ON video_sources(status);
CREATE INDEX IF NOT EXISTS idx_video_sources_created ON video_sources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clip_insights_source ON clip_insights(video_source_id);
CREATE INDEX IF NOT EXISTS idx_clip_insights_status ON clip_insights(status);
CREATE INDEX IF NOT EXISTS idx_produced_clips_insight ON produced_clips(insight_id);
CREATE INDEX IF NOT EXISTS idx_produced_clips_status ON produced_clips(status);

-- Row Level Security (disabled for now - single user)
ALTER TABLE video_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE clip_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE produced_clips ENABLE ROW LEVEL SECURITY;

-- Public read/write policies (no auth for MVP)
CREATE POLICY "Allow all on video_sources" ON video_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on clip_insights" ON clip_insights FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on produced_clips" ON produced_clips FOR ALL USING (true) WITH CHECK (true);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_video_sources_updated_at ON video_sources;
CREATE TRIGGER update_video_sources_updated_at
  BEFORE UPDATE ON video_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clip_insights_updated_at ON clip_insights;
CREATE TRIGGER update_clip_insights_updated_at
  BEFORE UPDATE ON clip_insights
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
