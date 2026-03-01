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

// =========================================
// RESUMO PRÉ-JOGO (predições, H2H, lesões, escalações)
// =========================================
function generatePreMatchSummary(data: {
  fixture: any;
  injuries: any[];
  predictions: any;
  h2h: any[];
  lineups: any[];
}): string {
  const lines: string[] = [];

  if (data.fixture) {
    const f = data.fixture;
    const home = f.teams?.home?.name || "Time Casa";
    const away = f.teams?.away?.name || "Time Fora";
    const league = f.league?.name || "";
    const round = f.league?.round || "";
    const venue = f.fixture?.venue?.name || "";

    lines.push(`JOGO: ${home} vs ${away}`);
    lines.push(`COMPETIÇÃO: ${league} — ${round}`);
    if (venue) lines.push(`ESTÁDIO: ${venue}`);
  }

  if (data.predictions?.predictions) {
    const pred = data.predictions.predictions;
    const winner = pred.winner?.name || "indefinido";
    const advice = pred.advice || "";
    lines.push(`\nPREDIÇÃO PRÉ-JOGO:`);
    lines.push(`Favorito: ${winner}`);
    if (advice) lines.push(`Conselho: ${advice}`);

    if (data.predictions.comparison) {
      const comp = data.predictions.comparison;
      lines.push(`Forma: ${comp.form?.home || "?"} vs ${comp.form?.away || "?"}`);
      lines.push(`Ataque: ${comp.att?.home || "?"} vs ${comp.att?.away || "?"}`);
      lines.push(`Defesa: ${comp.def?.home || "?"} vs ${comp.def?.away || "?"}`);
    }
  }

  if (data.injuries?.length > 0) {
    lines.push(`\nDESFALQUES E LESÕES:`);
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
    let homeWins = 0, awayWins = 0, draws = 0;
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
    lines.push(`Resumo: ${homeWins} vitórias casa, ${awayWins} visitante, ${draws} empates`);
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

  return lines.join("\n");
}

// =========================================
// RESUMO AO VIVO (placar, stats, eventos)
// =========================================
function generateLiveMatchSummary(data: {
  fixture: any;
  statistics: any[];
  events: any[];
}): string {
  const lines: string[] = [];

  if (data.fixture) {
    const f = data.fixture;
    const home = f.teams?.home?.name || "Time Casa";
    const away = f.teams?.away?.name || "Time Fora";
    const scoreHome = f.goals?.home ?? 0;
    const scoreAway = f.goals?.away ?? 0;
    const status = f.fixture?.status?.long || "";
    const elapsed = f.fixture?.status?.elapsed || 0;

    lines.push(`PLACAR ATUAL: ${home} ${scoreHome} x ${scoreAway} ${away}`);
    lines.push(`STATUS: ${status} — ${elapsed} minutos`);
  }

  if (data.statistics?.length >= 2) {
    const home = data.statistics[0];
    const away = data.statistics[1];
    const homeName = home.team?.name || "Casa";
    const awayName = away.team?.name || "Fora";

    lines.push(`\nESTATÍSTICAS AO VIVO:`);

    const importantStats = [
      "Ball Possession",
      "Total Shots",
      "Shots on Goal",
      "Corner Kicks",
      "Fouls",
      "Yellow Cards",
      "Red Cards",
      "Offsides",
      "Passes %",
      "expected_goals",
    ];

    const homeStats = home.statistics || [];
    const awayStats = away.statistics || [];

    for (const statType of importantStats) {
      const normalize = (s: string) => s.toLowerCase().replace(/\s/g, "_");
      const hStat = homeStats.find((s: any) => normalize(s.type || "") === normalize(statType) || s.type === statType);
      const aStat = awayStats.find((s: any) => normalize(s.type || "") === normalize(statType) || s.type === statType);

      if (hStat || aStat) {
        const hVal = hStat?.value ?? 0;
        const aVal = aStat?.value ?? 0;
        const label = hStat?.type || aStat?.type || statType;
        lines.push(`${label}: ${homeName} ${hVal} — ${aVal} ${awayName}`);
      }
    }

    // Automatic dominance analysis
    const possession = homeStats.find((s: any) => s.type === "Ball Possession");
    if (possession) {
      const homeP = parseInt(String(possession.value)) || 50;
      if (homeP >= 60) lines.push(`ANÁLISE: ${homeName} DOMINA a posse de bola`);
      else if (homeP <= 40) lines.push(`ANÁLISE: ${awayName} DOMINA a posse de bola`);
    }

    const homeShotsOn = Number(homeStats.find((s: any) => s.type === "Shots on Goal")?.value || 0);
    const awayShotsOn = Number(awayStats.find((s: any) => s.type === "Shots on Goal")?.value || 0);
    if (homeShotsOn > awayShotsOn * 2 && homeShotsOn > 0) {
      lines.push(`ANÁLISE: ${homeName} muito mais perigoso, ${homeShotsOn} chutes no gol contra ${awayShotsOn}`);
    } else if (awayShotsOn > homeShotsOn * 2 && awayShotsOn > 0) {
      lines.push(`ANÁLISE: ${awayName} muito mais perigoso, ${awayShotsOn} chutes no gol contra ${homeShotsOn}`);
    }
  }

  if (data.events?.length > 0) {
    lines.push(`\nEVENTOS DO JOGO:`);
    const sorted = [...data.events].sort((a: any, b: any) =>
      (a.time?.elapsed || 0) - (b.time?.elapsed || 0)
    );
    for (const ev of sorted) {
      const min = ev.time?.elapsed || "?";
      const extra = ev.time?.extra ? `+${ev.time.extra}` : "";
      const team = ev.team?.name || "";
      const player = ev.player?.name || "";
      const assist = ev.assist?.name ? ` (assist: ${ev.assist.name})` : "";
      const type = ev.type || "";
      const detail = ev.detail || "";

      let emoji = "•";
      if (type === "Goal") emoji = "⚽";
      else if (type === "Card" && detail === "Yellow Card") emoji = "🟨";
      else if (type === "Card" && detail === "Red Card") emoji = "🟥";
      else if (type === "subst") emoji = "🔄";
      else if (type === "Var") emoji = "📺";

      lines.push(`${min}'${extra} ${emoji} ${team}: ${player} — ${type} ${detail}${assist}`);
    }

    const goals = data.events.filter((e: any) => e.type === "Goal").length;
    const yellows = data.events.filter((e: any) => e.type === "Card" && e.detail === "Yellow Card").length;
    const reds = data.events.filter((e: any) => e.type === "Card" && e.detail === "Red Card").length;
    const subs = data.events.filter((e: any) => e.type === "subst").length;
    lines.push(`\nRESUMO: ${goals} gol(s), ${yellows} amarelo(s), ${reds} vermelho(s), ${subs} substituição(ões)`);
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

    const homeTeamName = fixture?.teams?.home?.name || null;
    const homeTeamId = fixture?.teams?.home?.id || null;
    const awayTeamName = fixture?.teams?.away?.name || null;
    const awayTeamId = fixture?.teams?.away?.id || null;
    const leagueName = fixture?.league?.name || null;
    const leagueRound = fixture?.league?.round || null;
    const venueName = fixture?.fixture?.venue?.name || null;
    const matchDate = fixture?.fixture?.date || null;

    // Generate BOTH summaries
    const preMatchSummary = generatePreMatchSummary({ fixture, injuries, predictions, h2h, lineups });
    const liveSummary = generateLiveMatchSummary({ fixture, statistics, events });

    console.log(`Pre-match summary: ${preMatchSummary.length} chars, Live summary: ${liveSummary.length} chars`);

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
        pre_match_summary: preMatchSummary,
        live_summary: liveSummary,
        context_summary: null,
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
        pre_match_summary_length: preMatchSummary.length,
        live_summary_length: liveSummary.length,
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
