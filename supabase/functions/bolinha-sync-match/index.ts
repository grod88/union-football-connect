import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchFromAPI(supabaseUrl: string, endpoint: string, params: Record<string, string>) {
  const queryString = new URLSearchParams(params).toString();
  const fullEndpoint = `${endpoint}${queryString ? "?" + queryString : ""}`;
  const url = `${supabaseUrl}/functions/v1/api-football-proxy?endpoint=${encodeURIComponent(fullEndpoint)}`;

  try {
    const response = await fetch(url, {
      headers: { "Content-Type": "application/json" },
    });
    if (!response.ok) {
      console.error(`API error for ${endpoint}:`, response.status);
      return null;
    }
    const data = await response.json();
    return data?.response || data;
  } catch (error) {
    console.error(`Fetch error for ${endpoint}:`, error);
    return null;
  }
}

function generateContextSummary(data: {
  fixture: any;
  injuries: any[];
  predictions: any;
  h2h: any[];
  lineups: any[];
  statistics: any[];
}): string {
  const lines: string[] = [];

  if (data.fixture) {
    const f = data.fixture;
    const home = f.teams?.home?.name || "Time Casa";
    const away = f.teams?.away?.name || "Time Fora";
    const league = f.league?.name || "";
    const round = f.league?.round || "";
    const venue = f.fixture?.venue?.name || "";
    const status = f.fixture?.status?.long || "";
    const scoreHome = f.goals?.home ?? "-";
    const scoreAway = f.goals?.away ?? "-";

    lines.push(`JOGO: ${home} vs ${away}`);
    lines.push(`COMPETIÇÃO: ${league} — ${round}`);
    if (venue) lines.push(`ESTÁDIO: ${venue}`);
    lines.push(`STATUS: ${status} | Placar: ${scoreHome} x ${scoreAway}`);
  }

  if (data.predictions?.predictions) {
    const pred = data.predictions.predictions;
    const winner = pred.winner?.name || "indefinido";
    const advice = pred.advice || "";
    lines.push(`\nPREDIÇÃO: Favorito: ${winner}`);
    if (advice) lines.push(`CONSELHO: ${advice}`);

    if (data.predictions.comparison) {
      const comp = data.predictions.comparison;
      lines.push(
        `COMPARAÇÃO: Forma: ${comp.form?.home || "?"} vs ${comp.form?.away || "?"}, Ataque: ${comp.att?.home || "?"} vs ${comp.att?.away || "?"}, Defesa: ${comp.def?.home || "?"} vs ${comp.def?.away || "?"}`
      );
    }
  }

  if (data.injuries?.length > 0) {
    lines.push(`\nLESÕES E DESFALQUES:`);
    const grouped: Record<string, string[]> = {};
    for (const inj of data.injuries) {
      const team = inj.team?.name || "Time";
      const player = inj.player?.name || "Jogador";
      const type = inj.player?.type || "Lesão";
      const reason = inj.player?.reason || "";
      if (!grouped[team]) grouped[team] = [];
      grouped[team].push(`${player} (${type}: ${reason})`);
    }
    for (const [team, players] of Object.entries(grouped)) {
      lines.push(`${team}: ${players.join(", ")}`);
    }
  }

  if (data.h2h?.length > 0) {
    lines.push(`\nÚLTIMOS CONFRONTOS DIRETOS:`);
    let homeWins = 0,
      awayWins = 0,
      draws = 0;
    const last5 = data.h2h.slice(0, 5);
    for (const match of last5) {
      const hg = match.goals?.home ?? 0;
      const ag = match.goals?.away ?? 0;
      const hn = match.teams?.home?.name || "Casa";
      const an = match.teams?.away?.name || "Fora";
      const date = match.fixture?.date?.substring(0, 10) || "";
      lines.push(`${date}: ${hn} ${hg} x ${ag} ${an}`);
      if (match.teams?.home?.winner) homeWins++;
      else if (match.teams?.away?.winner) awayWins++;
      else draws++;
    }
    lines.push(`Nos últimos ${last5.length}: ${homeWins} vitórias casa, ${awayWins} visitante, ${draws} empates`);
  }

  if (data.lineups?.length > 0) {
    lines.push(`\nESCALAÇÕES:`);
    for (const lineup of data.lineups) {
      const team = lineup.team?.name || "Time";
      const formation = lineup.formation || "?";
      const coach = lineup.coach?.name || "Técnico";
      const starters = (lineup.startXI || []).map((p: any) => p.player?.name || "?").join(", ");
      lines.push(`${team} (${formation}) — Técnico: ${coach}`);
      lines.push(`Titulares: ${starters}`);
    }
  }

  if (data.statistics?.length >= 2) {
    lines.push(`\nESTATÍSTICAS AO VIVO:`);
    const home = data.statistics[0];
    const away = data.statistics[1];
    const homeName = home.team?.name || "Casa";
    const awayName = away.team?.name || "Fora";

    const stats = home.statistics || [];
    for (const stat of stats) {
      const type = stat.type || "";
      const hVal = stat.value ?? 0;
      const aVal = (away.statistics || []).find((s: any) => s.type === type)?.value ?? 0;
      if (hVal !== 0 || aVal !== 0) {
        lines.push(`${type}: ${homeName} ${hVal} — ${aVal} ${awayName}`);
      }
    }
  }

  return lines.join("\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { fixture_id } = await req.json();

    if (!fixture_id) {
      return new Response(JSON.stringify({ error: "fixture_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Syncing match context for fixture ${fixture_id}...`);

    // Fetch 6 endpoints in parallel
    const [fixtureRaw, injuriesRaw, predictionsRaw, lineupsRaw, statisticsRaw, eventsRaw] = await Promise.all([
      fetchFromAPI(supabaseUrl, "/fixtures", { id: String(fixture_id) }),
      fetchFromAPI(supabaseUrl, "/injuries", { fixture: String(fixture_id) }),
      fetchFromAPI(supabaseUrl, "/predictions", { fixture: String(fixture_id) }),
      fetchFromAPI(supabaseUrl, "/fixtures/lineups", { fixture: String(fixture_id) }),
      fetchFromAPI(supabaseUrl, "/fixtures/statistics", { fixture: String(fixture_id) }),
      fetchFromAPI(supabaseUrl, "/fixtures/events", { fixture: String(fixture_id) }),
    ]);

    const fixture = Array.isArray(fixtureRaw) ? fixtureRaw[0] : fixtureRaw;
    const injuries = Array.isArray(injuriesRaw) ? injuriesRaw : [];
    const predictions = Array.isArray(predictionsRaw) ? predictionsRaw[0] : predictionsRaw;
    const lineups = Array.isArray(lineupsRaw) ? lineupsRaw : [];
    const statistics = Array.isArray(statisticsRaw) ? statisticsRaw : [];
    const events = Array.isArray(eventsRaw) ? eventsRaw : [];

    // Fetch H2H sequentially (needs team IDs from fixture)
    let h2h: any[] = [];
    if (fixture?.teams?.home?.id && fixture?.teams?.away?.id) {
      const homeId = fixture.teams.home.id;
      const awayId = fixture.teams.away.id;
      const h2hRaw = await fetchFromAPI(supabaseUrl, "/fixtures/headtohead", {
        h2h: `${homeId}-${awayId}`,
        last: "10",
      });
      h2h = Array.isArray(h2hRaw) ? h2hRaw : [];
    }

    // Extract basic info
    const homeTeamName = fixture?.teams?.home?.name || null;
    const homeTeamId = fixture?.teams?.home?.id || null;
    const awayTeamName = fixture?.teams?.away?.name || null;
    const awayTeamId = fixture?.teams?.away?.id || null;
    const leagueName = fixture?.league?.name || null;
    const leagueRound = fixture?.league?.round || null;
    const venueName = fixture?.fixture?.venue?.name || null;
    const matchDate = fixture?.fixture?.date || null;

    // Generate textual summary for Claude
    const contextSummary = generateContextSummary({
      fixture,
      injuries,
      predictions,
      h2h,
      lineups,
      statistics,
    });

    console.log(`Context summary generated (${contextSummary.length} chars)`);

    // Upsert into bolinha_match_context
    const { error } = await supabase.from("bolinha_match_context").upsert(
      {
        fixture_id,
        home_team_name: homeTeamName,
        home_team_id: homeTeamId,
        away_team_name: awayTeamName,
        away_team_id: awayTeamId,
        league_name: leagueName,
        league_round: leagueRound,
        venue_name: venueName,
        match_date: matchDate,
        fixture_data: fixture || {},
        injuries_data: injuries,
        predictions_data: predictions || {},
        h2h_data: h2h,
        lineups_data: lineups,
        statistics_data: statistics,
        events_data: events,
        context_summary: contextSummary,
        last_synced_at: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: "fixture_id" }
    );

    if (error) {
      console.error("Supabase upsert error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        fixture_id,
        home: homeTeamName,
        away: awayTeamName,
        league: leagueName,
        injuries_count: injuries.length,
        h2h_count: h2h.length,
        has_predictions: !!predictions?.predictions,
        has_lineups: lineups.length > 0,
        has_statistics: statistics.length > 0,
        has_events: events.length > 0,
        context_summary_length: contextSummary.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in bolinha-sync-match:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
