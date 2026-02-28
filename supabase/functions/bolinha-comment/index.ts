import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BOLINHA_SYSTEM_PROMPT = `Você é o BOLINHA, mascote do canal Union Football Live.

PERSONALIDADE:
- Você é uma bola de futebol com boné preto, estilo da Trionda da Copa 2026
- Você é SARCÁSTICO, DEBOCHADO e ENGRAÇADO — estilo resenha de bar com os amigos
- Você usa gírias brasileiras de futebol: "é gol", "pintou", "garfado", "catimba"
- Você tem opiniões fortes mas NUNCA ofende torcedores de outros times
- Você traz curiosidades e dados estatísticos quando está no modo análise
- Você se indigna com erros de arbitragem de forma cômica
- Você fica genuinamente EMPOLGADO com gols bonitos de qualquer time
- Quando o jogo está chato, você reclama com humor (quer dormir, pede café)
- Você é parceiro da galera da live — fala COM eles, não PARA eles

REGRAS:
- MÁXIMO 2 frases por comentário (curto e impactante)
- Use linguagem informal, como se estivesse falando ao vivo
- NUNCA use hashtags, emojis textuais ou formatação markdown
- Cada resposta DEVE incluir um campo "emotion" que é uma das 6 opções:
  neutro, gol, bravo, analise, sarcastico, tedio
- Responda APENAS em formato JSON válido com os campos: text, emotion

EXEMPLOS:
Evento: gol do São Paulo
{"text": "GOOOL DO TRICOLOR! Calleri de cabeça, esse cara é uma máquina! Décimo segundo gol na temporada, artilheiro tá on fire!", "emotion": "gol"}

Evento: cartão vermelho injusto
{"text": "Ah não, vai tomar! Esse juiz tá de sacanagem, isso nunca foi pra vermelho. Tô indignado, gente!", "emotion": "bravo"}

Evento: 0x0 aos 70 minutos
{"text": "Gente... alguém me traz um café porque esse jogo tá me dando sono. Zero a zero e os dois times parecem que combinaram de não jogar.", "emotion": "tedio"}

Evento: análise de dados
{"text": "Olha só esse dado: o São Paulo não perde em casa há 14 jogos. A última derrota no Morumbi foi em outubro do ano passado. Isso pesa, hein.", "emotion": "analise"}

Evento: gol de bicicleta
{"text": "Cara... para tudo. Que golaço absurdo! De bicicleta, sem condição. Tenho que tirar o chapéu, sem clubismo nenhum.", "emotion": "gol"}

Evento: pênalti polêmico
{"text": "Eita, pênalti polêmico! Pra mim não foi nada, mas quem sou eu né, sou só uma bola. O VAR que se vire.", "emotion": "sarcastico"}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      event_type,
      event_description,
      fixture_id,
      team_id,
      team_name,
      player_name,
      minute,
      score,
      fixture_context,
      custom_prompt,
      generate_audio,
    } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Claude API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Montar o prompt do usuário baseado no contexto
    let userPrompt = "";

    if (custom_prompt) {
      userPrompt = custom_prompt;
    } else {
      userPrompt = `Evento: ${event_type || "comentário geral"}
${event_description ? `Descrição: ${event_description}` : ""}
${team_name ? `Time: ${team_name}` : ""}
${player_name ? `Jogador: ${player_name}` : ""}
${minute ? `Minuto: ${minute}'` : ""}
${score ? `Placar: ${score}` : ""}
${fixture_context ? `Contexto: ${fixture_context}` : ""}

Responda como JSON com os campos "text" e "emotion".`;
    }

    // Chamar Claude API
    const claudeResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 200,
        system: BOLINHA_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      console.error("Claude API error:", errText);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const claudeData = await claudeResponse.json();
    const rawText = claudeData.content[0]?.text || "";

    // Parsear JSON da resposta do Claude
    let commentText = "";
    let emotion = "neutro";

    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        commentText = parsed.text || rawText;
        emotion = parsed.emotion || "neutro";
      } else {
        commentText = rawText;
      }
    } catch {
      commentText = rawText;
    }

    // Validar emoção
    const validEmotions = ["neutro", "gol", "bravo", "analise", "sarcastico", "tedio"];
    if (!validEmotions.includes(emotion)) {
      emotion = "neutro";
    }

    // Gerar áudio TTS (se solicitado)
    let audioBase64 = null;

    if (generate_audio !== false) {
      try {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
        const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
        const ttsResponse = await fetch(`${SUPABASE_URL}/functions/v1/bolinha-tts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ text: commentText }),
        });

        if (ttsResponse.ok) {
          const ttsData = await ttsResponse.json();
          audioBase64 = ttsData.audioBase64 || null;
        }
      } catch (ttsError) {
        console.error("TTS error (non-fatal):", ttsError);
      }
    }

    // Salvar no banco + broadcast via Realtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from("bolinha_messages").insert({
      fixture_id: fixture_id || null,
      text: commentText,
      emotion: emotion,
      team_id: team_id || null,
      audio_url: audioBase64 ? "generated" : null,
      event_type: event_type || "manual",
    });

    await supabase.channel("bolinha").send({
      type: "broadcast",
      event: "comment",
      payload: {
        text: commentText,
        emotion: emotion,
        teamId: team_id || null,
        audioBase64: audioBase64,
        timestamp: new Date().toISOString(),
      },
    });

    return new Response(
      JSON.stringify({
        text: commentText,
        emotion: emotion,
        audioBase64: audioBase64,
        teamId: team_id || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in bolinha-comment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
