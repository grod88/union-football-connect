-- Add file_path column to video_sources for local video files
ALTER TABLE video_sources
ADD COLUMN IF NOT EXISTS file_path TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_video_sources_file_path ON video_sources(file_path) WHERE file_path IS NOT NULL;

COMMENT ON COLUMN video_sources.file_path IS 'Local file path to the downloaded video file';
