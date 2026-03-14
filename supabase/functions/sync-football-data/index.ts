import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const API_HOST = "v3.football.api-sports.io";
const DELAY_MS = 7000; // 7s between API calls to respect rate limits

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchFromAPI(endpoint: string, apiKey: string) {
  const url = `https://${API_HOST}${endpoint}`;
  console.log(`Fetching: ${url}`);
  const res = await fetch(url, {
    headers: { "x-apisports-key": apiKey },
  });
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return await res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("API_FOOTBALL_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!apiKey || !supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Parse optional body for single league sync
    let targetLeagueId: number | null = null;
    if (req.method === "POST") {
      try {
        const body = await req.json();
        if (body?.league_id) targetLeagueId = body.league_id;
      } catch {
        // No body or invalid JSON — sync all
      }
    }

    // Fetch active monitored leagues
    let query = supabase
      .from("monitored_leagues")
      .select("*")
      .eq("is_active", true);

    if (targetLeagueId) {
      query = query.eq("id", targetLeagueId);
    }

    const { data: leagues, error: leaguesError } = await query;

    if (leaguesError || !leagues?.length) {
      return new Response(
        JSON.stringify({ error: "No active leagues found", details: leaguesError }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const report: Record<string, { standings: boolean; scorers: boolean; assists: boolean; fixtures: number }> = {};

    for (const league of leagues) {
      const leagueReport = { standings: false, scorers: false, assists: false, fixtures: 0 };

      try {
        // 1. Standings
        const standingsData = await fetchFromAPI(
          `/standings?league=${league.id}&season=${league.season}`,
          apiKey
        );
        await supabase.from("standings_cache").upsert({
          league_id: league.id,
          season: league.season,
          data: standingsData,
          fetched_at: new Date().toISOString(),
        });
        leagueReport.standings = true;
        await sleep(DELAY_MS);

        // 2. Top Scorers
        const scorersData = await fetchFromAPI(
          `/players/topscorers?league=${league.id}&season=${league.season}`,
          apiKey
        );
        await supabase.from("top_scorers_cache").upsert({
          league_id: league.id,
          season: league.season,
          type: "goals",
          data: scorersData,
          fetched_at: new Date().toISOString(),
        });
        leagueReport.scorers = true;
        await sleep(DELAY_MS);

        // 3. Top Assists
        const assistsData = await fetchFromAPI(
          `/players/topassists?league=${league.id}&season=${league.season}`,
          apiKey
        );
        await supabase.from("top_scorers_cache").upsert({
          league_id: league.id,
          season: league.season,
          type: "assists",
          data: assistsData,
          fetched_at: new Date().toISOString(),
        });
        leagueReport.assists = true;
        await sleep(DELAY_MS);

        // 4. Upcoming fixtures (next 10)
        const fixturesData = await fetchFromAPI(
          `/fixtures?league=${league.id}&season=${league.season}&next=10`,
          apiKey
        );
        const fixtures = fixturesData?.response || [];
        for (const fix of fixtures) {
          await supabase.from("upcoming_fixtures_cache").upsert({
            fixture_id: fix.fixture.id,
            league_id: league.id,
            home_team_id: fix.teams.home.id,
            away_team_id: fix.teams.away.id,
            match_date: fix.fixture.date,
            data: fix,
            fetched_at: new Date().toISOString(),
          });
        }
        leagueReport.fixtures = fixtures.length;
        await sleep(DELAY_MS);
      } catch (err) {
        console.error(`Error syncing league ${league.id} (${league.name}):`, err);
      }

      report[league.name] = leagueReport;
    }

    // Clean old fixtures
    await supabase.rpc("clean_old_fixtures");

    return new Response(
      JSON.stringify({ success: true, synced: leagues.length, report }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
