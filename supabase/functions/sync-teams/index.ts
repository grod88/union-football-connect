import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const COUNTRY_MAP: Record<string, string> = {
  BR: 'Brazil',
  NZ: 'New Zealand',
  AU: 'Australia',
  PT: 'Portugal',
  US: 'USA',
  AR: 'Argentina',
  UY: 'Uruguay',
  CL: 'Chile',
  CO: 'Colombia',
  MX: 'Mexico',
  GB: 'England',
  ES: 'Spain',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const countryCode = url.searchParams.get('country')?.toUpperCase()

    if (!countryCode) {
      return new Response(JSON.stringify({ error: 'Missing country parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const countryName = COUNTRY_MAP[countryCode]
    if (!countryName) {
      return new Response(JSON.stringify({ error: `Unsupported country: ${countryCode}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Fetch teams from API-Football
    const apiKey = Deno.env.get('API_FOOTBALL_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'API key not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiRes = await fetch(
      `https://v3.football.api-sports.io/teams?country=${encodeURIComponent(countryName)}`,
      { headers: { 'x-apisports-key': apiKey } },
    )

    if (!apiRes.ok) {
      return new Response(JSON.stringify({ error: 'API-Football request failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiData = await apiRes.json()
    const teamsRaw = apiData?.response ?? []

    if (teamsRaw.length === 0) {
      return new Response(JSON.stringify({ teams: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Map to our schema
    const teams = teamsRaw.map((t: any) => ({
      id: t.team.id,
      name: t.team.name,
      logo: t.team.logo ?? '',
      country: countryCode,
      country_name: countryName,
    }))

    // Upsert into database
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { error: upsertError } = await supabase
      .from('teams')
      .upsert(teams, { onConflict: 'id' })

    if (upsertError) {
      console.error('Upsert error:', upsertError)
      return new Response(JSON.stringify({ error: 'Failed to save teams' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ teams, count: teams.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('sync-teams error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
