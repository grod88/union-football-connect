import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const ALLOWED_ENDPOINT_PREFIXES = [
  "/fixtures",
  "/standings",
  "/teams",
  "/players",
  "/predictions",
  "/injuries",
  "/coachs",
  "/venues",
  "/leagues",
];

// ============================================================
// CACHE INTELIGENTE — TTL dinâmico por endpoint e status do jogo
// ============================================================

const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE', 'INT'];

function getCacheTTL(endpoint: string, fixtureStatus?: string | null): number {
  const isLive = LIVE_STATUSES.includes(fixtureStatus || '');

  // Dados estáticos — cache longo sempre
  if (endpoint.startsWith('/teams')) return 86400;       // 24h
  if (endpoint.startsWith('/leagues')) return 86400;     // 24h
  if (endpoint.startsWith('/venues')) return 86400;      // 24h
  if (endpoint.startsWith('/coachs')) return 86400;      // 24h

  // Dados pré-jogo — cache médio
  if (endpoint.startsWith('/predictions')) return 3600;  // 1h
  if (endpoint.startsWith('/injuries')) return 3600;     // 1h
  if (endpoint.startsWith('/fixtures/headtohead')) return 3600; // 1h

  // Standings
  if (endpoint.startsWith('/standings')) return isLive ? 120 : 1800; // 2min live, 30min normal

  // Dados de fixture — cache depende do status
  if (isLive) {
    if (endpoint.startsWith('/fixtures/statistics')) return 30;  // 30s
    if (endpoint.startsWith('/fixtures/events')) return 30;      // 30s
    if (endpoint.startsWith('/fixtures/players')) return 60;     // 1min
    if (endpoint.startsWith('/fixtures/lineups')) return 120;    // 2min
    if (endpoint.startsWith('/fixtures')) return 30;             // 30s (placar)
    return 30;
  } else {
    // NS ou FT — cache mais longo
    if (endpoint.startsWith('/fixtures/statistics')) return 300; // 5min
    if (endpoint.startsWith('/fixtures/events')) return 300;     // 5min
    if (endpoint.startsWith('/fixtures/players')) return 600;    // 10min
    if (endpoint.startsWith('/fixtures/lineups')) return 600;    // 10min
    if (endpoint.startsWith('/fixtures')) return 300;            // 5min
    return 300;
  }
}

function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  if (origin === "https://unionfc.live" || origin === "https://www.unionfc.live") return true;
  if (origin === "http://localhost:8080" || origin === "http://localhost:5173") return true;
  if (origin.endsWith(".lovable.app") && origin.startsWith("https://")) return true;
  if (origin.endsWith(".lovableproject.com") && origin.startsWith("https://")) return true;
  return false;
}

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const allowed = isOriginAllowed(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin : "https://unionfc.lovable.app",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Credentials": "true",
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const endpoint = url.searchParams.get("endpoint");

    if (!endpoint || !endpoint.startsWith("/")) {
      return new Response(
        JSON.stringify({ error: "Invalid endpoint parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate endpoint against allowed prefixes
    const isAllowed = ALLOWED_ENDPOINT_PREFIXES.some((prefix) => endpoint.startsWith(prefix));
    if (!isAllowed) {
      return new Response(
        JSON.stringify({ error: "Endpoint not allowed" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("API_FOOTBALL_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- CACHE LAYER ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build a stable cache key from the endpoint
    const cacheKey = endpoint;

    // Try to determine fixture status for dynamic TTL
    let fixtureStatus: string | null = null;
    const fixtureIdMatch = endpoint.match(/[?&](?:fixture|id)=(\d+)/);
    if (fixtureIdMatch) {
      // Quick lookup: check if we have this fixture cached and its status
      const { data: cachedFixture } = await supabase
        .from('api_cache')
        .select('data')
        .eq('cache_key', `/fixtures?id=${fixtureIdMatch[1]}`)
        .single();

      if (cachedFixture?.data) {
        try {
          const parsed = typeof cachedFixture.data === 'string' ? JSON.parse(cachedFixture.data) : cachedFixture.data;
          fixtureStatus = parsed?.response?.[0]?.fixture?.status?.short || null;
        } catch { /* ignore parse errors */ }
      }
    }

    // Check live fixtures endpoint to detect live status from the response's own fixture
    const ttlSeconds = getCacheTTL(endpoint, fixtureStatus);

    // Check cache
    const { data: cached } = await supabase
      .from('api_cache')
      .select('data, cached_at')
      .eq('cache_key', cacheKey)
      .single();

    if (cached?.data && cached?.cached_at) {
      const age = Date.now() - new Date(cached.cached_at).getTime();
      if (age < ttlSeconds * 1000) {
        console.log(`Cache HIT for ${cacheKey} (age: ${Math.round(age/1000)}s, TTL: ${ttlSeconds}s)`);
        const cachedData = typeof cached.data === 'string' ? JSON.parse(cached.data) : cached.data;
        return new Response(JSON.stringify(cachedData), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "HIT", "X-Cache-Age": String(Math.round(age/1000)), "X-Cache-TTL": String(ttlSeconds) },
        });
      }
    }

    // Cache MISS — fetch from API-Football
    console.log(`Cache MISS for ${cacheKey} (TTL: ${ttlSeconds}s) — fetching from API`);

    const apiHost = "v3.football.api-sports.io";
    const apiUrl = `https://${apiHost}${endpoint}`;

    console.log(`Proxying request to: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-apisports-key": apiKey,
      },
    });

    const data = await response.json();

    // Save to cache (upsert)
    if (response.ok && data) {
      await supabase
        .from('api_cache')
        .upsert({
          cache_key: cacheKey,
          data: data,
          cached_at: new Date().toISOString(),
        }, { onConflict: 'cache_key' })
        .then(() => console.log(`Cached ${cacheKey}`))
        .catch((err: Error) => console.error(`Cache write error:`, err));
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS", "X-Cache-TTL": String(ttlSeconds) },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
