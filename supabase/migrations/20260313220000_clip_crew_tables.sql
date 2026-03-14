-- Clip Crew AI Tables
-- Sistema multi-agente para análise e produção de clips

-- Sessões de processamento (1 por live)
CREATE TABLE IF NOT EXISTS clip_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_source_id UUID NOT NULL REFERENCES video_sources(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    -- Status: pending | director | workers | producer | critic | completed | error
    current_agent TEXT,
    progress REAL DEFAULT 0,
    total_cost_tokens INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mapa temático da live (output do Diretor)
CREATE TABLE IF NOT EXISTS clip_live_maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES clip_sessions(id) ON DELETE CASCADE,
    live_summary TEXT,
    duration_minutes REAL,
    themes JSONB DEFAULT '[]',
    -- Array de: {id, label, time_ranges[], sentiment_arc, connects_to[]}
    emotional_peaks JSONB DEFAULT '[]',
    -- Array de: {timestamp, type, reason}
    suggested_arcs JSONB DEFAULT '[]',
    -- Array de: {type, description, themes[], estimated_duration}
    delegation JSONB DEFAULT '{}',
    -- {cronista: [...], analista: [...], garimpeiro: [...]}
    raw_response JSONB,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outputs dos agentes workers
CREATE TABLE IF NOT EXISTS clip_agent_outputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES clip_sessions(id) ON DELETE CASCADE,
    agent_type TEXT NOT NULL,
    -- Agent: garimpeiro | cronista | analista
    clips JSONB DEFAULT '[]',
    -- Array de clips sugeridos pelo agente
    raw_response JSONB,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Plano de produção final (output do Produtor)
CREATE TABLE IF NOT EXISTS clip_production_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES clip_sessions(id) ON DELETE CASCADE,
    iteration INTEGER DEFAULT 1,
    -- Iteração (pode ter refinamentos do Crítico)
    total_clips INTEGER,
    breakdown JSONB DEFAULT '{}',
    -- {short_viral: N, medium_narrative: N, long_storytelling: N}
    clips JSONB DEFAULT '[]',
    -- Array completo de clips com specs de produção
    raw_response JSONB,
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Avaliações do Crítico
CREATE TABLE IF NOT EXISTS clip_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES clip_sessions(id) ON DELETE CASCADE,
    clip_id TEXT NOT NULL,
    -- ID do clip dentro do plano
    iteration INTEGER DEFAULT 1,
    verdict TEXT NOT NULL,
    -- APPROVED | NEEDS_WORK | REJECTED
    score REAL,
    scores JSONB DEFAULT '{}',
    -- {gancho, storytelling, producao, viralidade, identidade}
    feedback JSONB,
    -- Se NEEDS_WORK: {issues[], suggestions[], send_back_to}
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_clip_sessions_video_source ON clip_sessions(video_source_id);
CREATE INDEX IF NOT EXISTS idx_clip_sessions_status ON clip_sessions(status);
CREATE INDEX IF NOT EXISTS idx_clip_live_maps_session ON clip_live_maps(session_id);
CREATE INDEX IF NOT EXISTS idx_clip_agent_outputs_session ON clip_agent_outputs(session_id);
CREATE INDEX IF NOT EXISTS idx_clip_agent_outputs_type ON clip_agent_outputs(agent_type);
CREATE INDEX IF NOT EXISTS idx_clip_production_plans_session ON clip_production_plans(session_id);
CREATE INDEX IF NOT EXISTS idx_clip_evaluations_session ON clip_evaluations(session_id);
CREATE INDEX IF NOT EXISTS idx_clip_evaluations_verdict ON clip_evaluations(verdict);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_clip_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clip_sessions_updated_at ON clip_sessions;
CREATE TRIGGER clip_sessions_updated_at
    BEFORE UPDATE ON clip_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_clip_sessions_updated_at();
