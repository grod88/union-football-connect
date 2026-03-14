import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const body = await req.json()
    const { name, email, country, favorite_team_id, favorite_team_name, message } = body

    // Validation
    const errors: string[] = []
    if (!name || typeof name !== 'string' || name.trim().length === 0) errors.push('Nome é obrigatório')
    if (name && name.length > 100) errors.push('Nome deve ter no máximo 100 caracteres')
    if (!email || typeof email !== 'string') errors.push('Email é obrigatório')
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Email inválido')
    if (email && email.length > 255) errors.push('Email deve ter no máximo 255 caracteres')
    if (!country || typeof country !== 'string') errors.push('País é obrigatório')
    if (message && message.length > 1000) errors.push('Mensagem deve ter no máximo 1000 caracteres')

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: errors.join(', ') }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data, error } = await supabase
      .from('community_members')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        country,
        favorite_team_id: favorite_team_id || null,
        favorite_team_name: favorite_team_name || null,
        message: message?.trim() || null,
      })
      .select('id')
      .single()

    if (error) {
      if (error.code === '23505') {
        return new Response(JSON.stringify({ error: 'Este email já está cadastrado na comunidade!' }), {
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      console.error('Insert error:', error)
      return new Response(JSON.stringify({ error: 'Erro ao salvar cadastro' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 201,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('community-register error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
