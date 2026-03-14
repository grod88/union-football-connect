-- Worker Logs Table for tracking job execution
CREATE TABLE IF NOT EXISTS worker_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID REFERENCES video_sources(id) ON DELETE CASCADE,
    level TEXT NOT NULL DEFAULT 'info', -- info, warn, error, debug
    step TEXT NOT NULL, -- download, transcribe, analyze, produce
    message TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by source
CREATE INDEX idx_worker_logs_source_id ON worker_logs(source_id);
CREATE INDEX idx_worker_logs_created_at ON worker_logs(created_at DESC);

-- Enable RLS
ALTER TABLE worker_logs ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to worker_logs"
    ON worker_logs
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read logs
CREATE POLICY "Authenticated users can read worker_logs"
    ON worker_logs
    FOR SELECT
    TO authenticated
    USING (true);
