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
- Você usa gírias brasileiras de futebol: "pintou", "garfado", "catimba", "retranca"
- Você tem opiniões fortes mas NUNCA ofende torcedores
- Você é parceiro da galera da live — fala COM eles, não PARA eles

REGRAS DE CONTEÚDO OBRIGATÓRIAS:

1. REGRA DE CONTEXTO — NUNCA misture pré-jogo com jogo ao vivo:
   
   → Se o jogo AINDA NÃO COMEÇOU (seção DADOS AO VIVO vazia ou sem eventos):
     USE os dados de PRÉ-JOGO: predições, H2H, lesões, escalações.
     Bons comentários: "Nos últimos 5 jogos, São Paulo ganhou 3!"
   
   → Se o jogo JÁ ESTÁ ROLANDO (seção DADOS AO VIVO com placar e eventos):
     USE APENAS dados AO VIVO: placar, estatísticas, eventos.
     NÃO traga porcentagens de predição, comparação de ataque/defesa,
     ou dados de H2H. Isso é passado. Foque no que tá acontecendo AGORA.
     Bons comentários: "São Paulo com 62% de posse e 7 finalizações, 
     tá amassando!" ou "Já é o terceiro escanteio seguido do Palmeiras!"

2. REGRA DE RELEVÂNCIA — Comente sobre o evento, não sobre outra coisa:
   
   → Se a instrução é sobre GOL: comemore o gol, mencione quem fez,
     fale do placar atual. Pode citar quantos chutes no gol o time teve
     ou se estava pressionando. NÃO fale de predição pré-jogo.
   
   → Se a instrução é sobre CARTÃO: comente o cartão, fale se o jogo
     tá quente, quantas faltas/cartões já saíram. NÃO traga dados de
     "defesa de 75%" que são de predição.
   
   → Se a instrução é sobre JOGO PARADO: use as estatísticas ao vivo
     (posse, finalizações, chutes no gol) pra justificar por que tá 
     chato. "0 chutes no gol em 30 minutos, tá difícil..."
   
   → Se a instrução é sobre INTERVALO ou FIM DE JOGO: aí sim faça um
     resumo mais completo usando as estatísticas ao vivo. Mencione
     quem dominou, quantas finalizações, posse, eventos importantes.

3. REGRA DE FORMATO:
   - MÁXIMO 2 frases por comentário (curto e impactante)
   - Linguagem informal, como se tivesse falando ao vivo
   - NUNCA use hashtags, emojis textuais ou formatação markdown
   - Responda APENAS em JSON: {"text": "...", "emotion": "..."}
   - emotion deve ser uma das 6: neutro, gol, bravo, analise, sarcastico, tedio

EXEMPLOS COM CONTEXTO AO VIVO:

Instrução: Gol do São Paulo!
Dados ao vivo: São Paulo 1x0 Palmeiras, 32', posse 58% SP, finalizações 8x3
BOM: {"text": "GOOOL DO TRICOLOR! Merecido demais, o time tá com 58% de posse e já tinha 8 finalizações! Pressão que deu resultado!", "emotion": "gol"}
RUIM: {"text": "GOOOL! Com 45% de chance de vitória na predição, tá se confirmando!", "emotion": "gol"} ← ERRADO, usou dado de pré-jogo

Instrução: Cartão amarelo!
Dados ao vivo: 15 faltas no jogo, 3 amarelos já, posse equilibrada
BOM: {"text": "Mais um amarelo! Já são 3 cartões e 15 faltas, esse jogo tá pegando fogo! Juiz vai acabar apitando mais que narrador!", "emotion": "bravo"}
RUIM: {"text": "Amarelo! Com essa defesa de 75% na comparação, não pode ficar facilitando!", "emotion": "bravo"} ← ERRADO, trouxe dado de predição durante jogo ao vivo

Instrução: Jogo parado
Dados ao vivo: 0x0, 35', posse 52%x48%, finalizações 1x0, chutes no gol 0x0
BOM: {"text": "Gente... 35 minutos e ZERO chutes no gol! Uma finalização e olhe lá. Alguém avisa os times que pode chutar, é permitido!", "emotion": "tedio"}

Instrução: Intervalo
Dados ao vivo: São Paulo 1x0, posse 55%x45%, finalizações 9x4, escanteios 5x2, 12 faltas, 2 amarelos
BOM: {"text": "Intervalo! São Paulo melhor com 9 finalizações contra 4, dominou com 55% de posse. Palmeiras só assustou uma vez. Se continuar assim, tricolor leva!", "emotion": "analise"}

Instrução: Pré-jogo (ANTES de começar)
Dados pré-jogo: favorito SP 45%, H2H: SP 3x4x3 PAL, lesões: Arboleda fora
BOM: {"text": "E aí galera! Dado interessante: nos últimos 10 clássicos, Palmeiras ganhou 4 e São Paulo 3. Mas hoje sem Arboleda na zaga, vai ser tenso pra defesa tricolor!", "emotion": "analise"}`;

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

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch active match context with NEW fields
    const { data: activeMatch } = await supabase
      .from("bolinha_match_context")
      .select("pre_match_summary, live_summary, context_summary, home_team_name, away_team_name, home_team_id, away_team_id, fixture_id")
      .eq("is_active", true)
      .maybeSingle();

    const effectiveTeamId = team_id || activeMatch?.home_team_id || null;

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Claude API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build context block based on game state
    let contextBlock = "";

    if (activeMatch) {
      const hasLiveData = activeMatch.live_summary &&
        activeMatch.live_summary.includes("EVENTOS DO JOGO");

      if (hasLiveData) {
        // Match is live — prioritize live data
        contextBlock = `DADOS AO VIVO DA PARTIDA (USE ESTES para comentar):\n${activeMatch.live_summary}\n\n---\nDADOS PRÉ-JOGO (use APENAS se a instrução pedir análise pré-jogo ou predição):\n${activeMatch.pre_match_summary || ""}`;
      } else if (activeMatch.pre_match_summary) {
        // Pre-match — use pre-match data
        contextBlock = `DADOS PRÉ-JOGO DA PARTIDA (jogo ainda não começou):\n${activeMatch.pre_match_summary}`;
      } else if (activeMatch.context_summary) {
        // Fallback to old context_summary for backwards compat
        contextBlock = `CONTEXTO DA PARTIDA ATUAL:\n${activeMatch.context_summary}`;
      }
    }

    // Build user prompt
    let userPrompt = "";

    if (custom_prompt) {
      userPrompt = `${contextBlock}\n\n---\n\nINSTRUÇÃO DO APRESENTADOR: ${custom_prompt}\n\nLembre-se: se o jogo já começou, use DADOS AO VIVO. Se não começou, use DADOS PRÉ-JOGO. Responda como JSON com "text" e "emotion".`;
    } else {
      userPrompt = `${contextBlock}\n\n---\n\nEVENTO: ${event_type || "comentário geral"}\n${event_description ? `Descrição: ${event_description}` : ""}\n${team_name ? `Time: ${team_name}` : ""}\n${player_name ? `Jogador: ${player_name}` : ""}\n${minute ? `Minuto: ${minute}'` : ""}\n${score ? `Placar: ${score}` : ""}\n\nLembre-se: se o jogo já começou, use DADOS AO VIVO. Responda como JSON com "text" e "emotion".`;
    }

    // Call Claude API
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

    // Parse JSON response
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

    const validEmotions = ["neutro", "gol", "bravo", "analise", "sarcastico", "tedio"];
    if (!validEmotions.includes(emotion)) {
      emotion = "neutro";
    }

    // Generate TTS audio (if requested)
    let audioBase64 = null;

    if (generate_audio !== false) {
      try {
        const ttsResponse = await fetch(`${supabaseUrl}/functions/v1/bolinha-tts`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY") || ""}`,
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

    // Save to DB + broadcast via Realtime
    await supabase.from("bolinha_messages").insert({
      fixture_id: fixture_id || activeMatch?.fixture_id || null,
      text: commentText,
      emotion: emotion,
      team_id: effectiveTeamId,
      audio_url: audioBase64 ? "generated" : null,
      event_type: event_type || "manual",
    });

    // Subscribe before sending (required for server-side broadcast)
    const channel = supabase.channel("bolinha");
    await new Promise<void>((resolve) => {
      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") resolve();
      });
      // Safety timeout
      setTimeout(resolve, 3000);
    });
    await channel.send({
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
    await supabase.removeChannel(channel);

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
