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

function getCacheTTL(endpoint: string, fixtureStatus?: string | null, isLiveMode: boolean = false): number {
  // ── LIVE MODE (OBS widgets): cache ultra-curto ──
  if (isLiveMode) {
    if (endpoint.startsWith('/fixtures/statistics')) return 10;  // 10s
    if (endpoint.startsWith('/fixtures/events')) return 10;      // 10s
    if (endpoint.startsWith('/fixtures/players')) return 20;     // 20s
    if (endpoint.startsWith('/fixtures/lineups')) return 30;     // 30s
    if (endpoint.startsWith('/fixtures')) return 10;             // 10s (placar)
    if (endpoint.startsWith('/standings')) return 60;            // 1min
    return 15;
  }

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

// Helper function to fetch from API-Football with error handling
async function fetchFromAPI(url: string, apiKey: string): Promise<unknown | null> {
  const response = await fetch(url, {
    headers: {
      'x-apisports-key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API-Football error (${response.status}):`, errorText);

    // Se rate limited, NÃO jogar erro — retornar null
    // para que o cache stale seja usado
    if (response.status === 429) {
      console.warn('[RATE LIMITED] API-Football retornou 429');
      return null;
    }

    throw new Error(`API error: ${response.status}`);
  }

  const json = await response.json();
  return json;
}

function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
  if (origin === "https://unionfc.live" || origin === "https://www.unionfc.live") return true;
  if (origin === "http://localhost:8080" || origin === "http://localhost:5173" || origin === "http://localhost:3000") return true;
  if (origin.endsWith(".vercel.app") && origin.startsWith("https://")) return true;
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

    // --- CACHE LAYER WITH LOCK + STALE-WHILE-REVALIDATE ---
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Safety net: limpar locks travados (mais de 30s)
    await supabase
      .from('api_cache')
      .update({ is_refreshing: false, refresh_started_at: null })
      .eq('is_refreshing', true)
      .lt('refresh_started_at', new Date(Date.now() - 30000).toISOString());

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

    const isLiveMode = url.searchParams.get('live') === 'true';
    const ttlSeconds = getCacheTTL(endpoint, fixtureStatus, isLiveMode);
    const apiHost = "v3.football.api-sports.io";
    const apiUrl = `https://${apiHost}${endpoint}`;

    if (isLiveMode) {
      console.log(`[LIVE MODE] ${cacheKey} — TTL: ${ttlSeconds}s`);
    }

    // ---- CACHE READ WITH LOCK LOGIC ----
    const { data: cached } = await supabase
      .from('api_cache')
      .select('data, cached_at, is_refreshing, refresh_started_at')
      .eq('cache_key', cacheKey)
      .single();

    const now = Date.now();

    if (cached?.data && cached?.cached_at) {
      const ageMs = now - new Date(cached.cached_at).getTime();
      const ttlMs = ttlSeconds * 1000;
      const staleLimitMs = ttlMs * 5; // stale aceito por até 5x o TTL

      // CASO A: Cache fresco (dentro do TTL) → retorna direto
      if (ageMs < ttlMs) {
        console.log(`[CACHE HIT] ${cacheKey} — age: ${Math.round(ageMs/1000)}s, ttl: ${ttlSeconds}s`);
        const cachedData = typeof cached.data === 'string' ? JSON.parse(cached.data) : cached.data;
        return new Response(JSON.stringify(cachedData), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Cache': 'HIT',
            'X-Cache-Age': String(Math.round(ageMs / 1000)),
            'X-Cache-TTL': String(ttlSeconds),
          },
        });
      }

      // CASO B: Cache expirado mas dentro do stale limit
      if (ageMs < staleLimitMs) {
        // Verificar se alguém já está fazendo refresh
        const isLocked = cached.is_refreshing === true &&
          cached.refresh_started_at &&
          (now - new Date(cached.refresh_started_at).getTime()) < 30000; // lock timeout 30s

        if (isLocked) {
          // Outra instância já está buscando → retorna stale sem fazer nada
          console.log(`[CACHE STALE-LOCKED] ${cacheKey} — outra instância está atualizando`);
          const cachedData = typeof cached.data === 'string' ? JSON.parse(cached.data) : cached.data;
          return new Response(JSON.stringify(cachedData), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json',
              'X-Cache': 'STALE_LOCKED',
              'X-Cache-Age': String(Math.round(ageMs / 1000)),
            },
          });
        }

        // Ninguém está buscando → EU vou buscar
        // Primeiro: adquirir o lock
        await supabase
          .from('api_cache')
          .update({
            is_refreshing: true,
            refresh_started_at: new Date().toISOString()
          })
          .eq('cache_key', cacheKey);

        console.log(`[CACHE STALE-REFRESH] ${cacheKey} — buscando dados frescos`);

        // Fazer refresh
        try {
          const freshData = await fetchFromAPI(apiUrl, apiKey);
          if (freshData) {
            await supabase
              .from('api_cache')
              .upsert({
                cache_key: cacheKey,
                data: freshData,
                cached_at: new Date().toISOString(),
                is_refreshing: false,
                refresh_started_at: null,
              }, { onConflict: 'cache_key' });
            console.log(`[CACHE REFRESHED] ${cacheKey}`);
            // Retornar dado FRESCO
            return new Response(JSON.stringify(freshData), {
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'X-Cache': 'REFRESHED',
                'X-Cache-TTL': String(ttlSeconds),
              },
            });
          }
        } catch (fetchError) {
          // API falhou → liberar lock e retornar stale
          console.error(`[CACHE REFRESH FAILED] ${cacheKey}:`, fetchError);
          await supabase
            .from('api_cache')
            .update({ is_refreshing: false, refresh_started_at: null })
            .eq('cache_key', cacheKey);
        }

        // Se o refresh falhou ou retornou null (rate limited), retorna stale
        console.log(`[CACHE STALE-FALLBACK] ${cacheKey} — retornando dado antigo`);
        const cachedData = typeof cached.data === 'string' ? JSON.parse(cached.data) : cached.data;
        return new Response(JSON.stringify(cachedData), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'X-Cache': 'STALE_FALLBACK',
            'X-Cache-Age': String(Math.round(ageMs / 1000)),
          },
        });
      }
    }

    // CASO C: Cache não existe ou stale demais → fetch bloqueante
    console.log(`[CACHE MISS] ${cacheKey} — buscando da API`);

    // Adquirir lock antes de buscar (se já existe entrada no cache)
    if (cached) {
      await supabase
        .from('api_cache')
        .update({ is_refreshing: true, refresh_started_at: new Date().toISOString() })
        .eq('cache_key', cacheKey);
    }

    try {
      const data = await fetchFromAPI(apiUrl, apiKey);

      if (data) {
        // Save to cache (upsert) with lock fields
        await supabase
          .from('api_cache')
          .upsert({
            cache_key: cacheKey,
            data: data,
            cached_at: new Date().toISOString(),
            is_refreshing: false,
            refresh_started_at: null,
          }, { onConflict: 'cache_key' });
        console.log(`[CACHE STORED] ${cacheKey}`);

        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS", "X-Cache-TTL": String(ttlSeconds) },
        });
      } else {
        // API retornou null (provavelmente rate limited)
        // Liberar lock e retornar erro
        if (cached) {
          await supabase
            .from('api_cache')
            .update({ is_refreshing: false, refresh_started_at: null })
            .eq('cache_key', cacheKey);
        }
        return new Response(
          JSON.stringify({ error: "API temporarily unavailable" }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } catch (fetchError) {
      // Liberar lock em caso de erro
      if (cached) {
        await supabase
          .from('api_cache')
          .update({ is_refreshing: false, refresh_started_at: null })
          .eq('cache_key', cacheKey);
      }
      throw fetchError;
    }
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
