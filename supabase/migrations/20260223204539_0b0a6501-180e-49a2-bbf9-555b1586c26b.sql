-- ===================================================================
-- Tabela de ligas monitoradas (administração do canal)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.monitored_leagues (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  season INTEGER NOT NULL,
  priority INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT true,
  logo TEXT,
  coverage JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed com as ligas monitoradas
INSERT INTO public.monitored_leagues (id, name, country, season, priority, is_active) VALUES
  (475, 'Paulistão A1', 'Brazil', 2026, 1, true),
  (71, 'Brasileirão Série A', 'Brazil', 2026, 1, true),
  (73, 'Copa do Brasil', 'Brazil', 2026, 1, true),
  (13, 'Copa Libertadores', 'South-America', 2026, 1, true),
  (11, 'Copa Sul-Americana', 'South-America', 2026, 2, true),
  (72, 'Brasileirão Série B', 'Brazil', 2026, 3, false),
  (2, 'Champions League', 'World', 2025, 2, true),
  (39, 'Premier League', 'England', 2025, 2, false),
  (140, 'La Liga', 'Spain', 2025, 3, false),
  (135, 'Serie A', 'Italy', 2025, 3, false)
ON CONFLICT (id) DO UPDATE SET 
  season = EXCLUDED.season,
  priority = EXCLUDED.priority,
  is_active = EXCLUDED.is_active;

-- ===================================================================
-- Cache de classificação (atualiza periodicamente)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.standings_cache (
  league_id BIGINT NOT NULL,
  season INTEGER NOT NULL,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (league_id, season)
);

-- ===================================================================
-- Cache de artilheiros
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.top_scorers_cache (
  league_id BIGINT NOT NULL,
  season INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'goals',
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (league_id, season, type)
);

-- ===================================================================
-- Fixtures agendados (próximos jogos monitorados)
-- ===================================================================
CREATE TABLE IF NOT EXISTS public.upcoming_fixtures_cache (
  fixture_id BIGINT PRIMARY KEY,
  league_id BIGINT NOT NULL,
  home_team_id BIGINT,
  away_team_id BIGINT,
  match_date TIMESTAMPTZ NOT NULL,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_upcoming_fixtures_date 
  ON public.upcoming_fixtures_cache(match_date);

CREATE INDEX IF NOT EXISTS idx_upcoming_fixtures_league 
  ON public.upcoming_fixtures_cache(league_id);

-- Função de limpeza
CREATE OR REPLACE FUNCTION public.clean_old_fixtures()
RETURNS void AS $$
BEGIN
  DELETE FROM public.upcoming_fixtures_cache 
  WHERE match_date < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ===================================================================
-- RLS Policies (acesso público de leitura)
-- ===================================================================
ALTER TABLE public.monitored_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.standings_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.top_scorers_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upcoming_fixtures_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read monitored_leagues" ON public.monitored_leagues
  FOR SELECT USING (true);
  
CREATE POLICY "Public read standings_cache" ON public.standings_cache
  FOR SELECT USING (true);
  
CREATE POLICY "Public read top_scorers_cache" ON public.top_scorers_cache
  FOR SELECT USING (true);
  
CREATE POLICY "Public read upcoming_fixtures_cache" ON public.upcoming_fixtures_cache
  FOR SELECT USING (true);