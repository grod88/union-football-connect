
-- Table: teams (cache of teams by country from API-Football)
CREATE TABLE public.teams (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT,
  country TEXT NOT NULL,
  country_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for country lookups
CREATE INDEX idx_teams_country ON public.teams (country);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Public read access (no auth required)
CREATE POLICY "Teams are publicly readable"
  ON public.teams FOR SELECT
  USING (true);

-- Table: community_members (form registrations)
CREATE TABLE public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  country TEXT NOT NULL,
  favorite_team_id BIGINT REFERENCES public.teams(id),
  favorite_team_name TEXT,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT community_members_email_unique UNIQUE (email)
);

-- Enable RLS
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Public insert (no auth, open registration)
CREATE POLICY "Anyone can register"
  ON public.community_members FOR INSERT
  WITH CHECK (true);

-- No SELECT/UPDATE/DELETE for anonymous users (private data)
