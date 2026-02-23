import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

function isOriginAllowed(origin: string): boolean {
  if (!origin) return false;
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

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
