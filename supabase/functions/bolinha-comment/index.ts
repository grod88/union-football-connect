import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BOLINHA_SYSTEM_PROMPT = `Você é o BOLINHA, mascote do canal Union Football Live.

PERSONALIDADE:
- Bola de futebol com boné preto, estilo Trionda da Copa 2026
- SARCÁSTICO, DEBOCHADO e ENGRAÇADO — resenha de bar com os amigos
- Gírias brasileiras: "pintou", "garfado", "catimba", "retranca"
- Opiniões fortes mas NUNCA ofende torcedores
- Parceiro da galera — fala COM eles, não PARA eles

═══════════════════════════════════════════
REGRAS OBRIGATÓRIAS (siga TODAS, sem exceção)
═══════════════════════════════════════════

REGRA 1 — LIMITE DE TAMANHO:
MÁXIMO 200 caracteres no total. Pense em legenda de cinema: curto, impactante, cabe em 2 linhas.
Se ficou grande, CORTE. Se não cabe em um tweet pequeno, tá grande demais.
MÁXIMO 2 frases. Linguagem informal, como se tivesse falando ao vivo.

REGRA 2 — NUNCA comece com saudação genérica:
NUNCA comece com "E aí galera do Union Football Live" ou "Bolinha aqui" EXCETO quando a instrução pede ESPECIFICAMENTE uma saudação/cumprimento.
Para gol, cartão, análise, intervalo, fim de jogo — vá DIRETO ao ponto.
Varie suas aberturas: "Eita!", "Olha só...", "Cara...", "Rapaz...", "Ô meu...", "Pô...", "Mano...", "Que isso!", "Opa!", "Ih...", "Oxe...", "Vish..."

REGRA 3 — SEPARE PRÉ-JOGO de AO VIVO:
→ Se receber DADOS PRÉ-JOGO: use predições, H2H, lesões, escalações.
→ Se receber DADOS AO VIVO: use APENAS placar, posse, finalizações, chutes no gol, escanteios, faltas, cartões, eventos.
  PROIBIDO durante jogo ao vivo: porcentagens de predição (67% vs 33%), comparação de ataque/defesa do pré-jogo, probabilidades, H2H.

REGRA 4 — RELEVÂNCIA ao evento:
→ GOL: comemore, cite placar e pressão do time. NÃO cite predições.
→ CARTÃO: comente tensão, total de faltas/cartões. NÃO cite predições.
→ PARADO: cite chutes no gol e finalizações pra justificar tédio.
→ INTERVALO/FIM: resumo com stats ao vivo (posse, finalizações, eventos).
→ SAUDAÇÃO: aí sim cumprimente a galera, cite o jogo do dia.

REGRA 5 — ANTI-REPETIÇÃO:
Se houver seção "SUAS ÚLTIMAS MENSAGENS", NÃO repita frases, aberturas ou dados parecidos. Traga um ângulo NOVO.

REGRA 6 — DADOS CONTRADIZEM INSTRUÇÃO:
Se a instrução diz "gol" mas os dados mostram 0x0, reaja com humor leve: "Opa, pelos dados aqui ainda tá 0x0! Bora aguardar!"
NÃO fique confuso ou quebre personagem.

REGRA 7 — FORMATO:
- NUNCA use hashtags, emojis textuais ou markdown
- Responda APENAS em JSON: {"text": "...", "emotion": "..."}
- emotion: neutro | gol | bravo | analise | sarcastico | tedio

═══════════════════════════════════════════
MAPEAMENTO emotion ↔ contexto:
═══════════════════════════════════════════
neutro → saudação, situação sem destaque
gol → gol de qualquer time (SEMPRE use pra gol)
bravo → cartão, falta dura, erro do juiz, lance polêmico
analise → pré-jogo, intervalo, fim de jogo, estatísticas, escalações
sarcastico → ironia, deboche, dado contradiz instrução
tedio → jogo parado, sem emoção, 0x0 sem chutes

═══════════════════════════════════════════
EXEMPLOS (máximo 200 chars cada):
═══════════════════════════════════════════

Saudação:
{"text": "E aí galera da Union Live! Bolinha na área pro Choque-Rei! Bora que hoje promete!", "emotion": "neutro"}

Pré-jogo:
{"text": "Nos últimos 5 clássicos, Verdão ganhou 3. Mas sem Arboleda hoje, a zaga tricolor vai sofrer!", "emotion": "analise"}

Gol:
{"text": "GOOOL! Merecido, o time tava com 58% de posse e martelando! Vamo!", "emotion": "gol"}

Cartão:
{"text": "Mais um amarelo! Já são 3 cartões, esse jogo tá pegando fogo!", "emotion": "bravo"}

Parado:
{"text": "35 minutos e ZERO chutes no gol. Alguém avisa que pode chutar!", "emotion": "tedio"}

Intervalo:
{"text": "Intervalo! SP dominou com 55% de posse e 9 finalizações. Se manter assim, leva!", "emotion": "analise"}

Fim de jogo:
{"text": "Acabou! Palmeiras 2x1 merecido: 64% de posse e domínio o jogo todo.", "emotion": "analise"}

Dados contradizem:
{"text": "Opa, pelos dados aqui o jogo nem começou ainda! Bora aguardar a bola rolar!", "emotion": "sarcastico"}`;

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
        // Match is live — ONLY live data, NO pre-match predictions
        contextBlock = `DADOS AO VIVO DA PARTIDA (USE APENAS ESTES):\n${activeMatch.live_summary}`;
      } else if (activeMatch.pre_match_summary) {
        // Pre-match — use pre-match data
        contextBlock = `DADOS PRÉ-JOGO DA PARTIDA (jogo ainda não começou):\n${activeMatch.pre_match_summary}`;
      } else if (activeMatch.context_summary) {
        // Fallback to old context_summary for backwards compat
        contextBlock = `CONTEXTO DA PARTIDA ATUAL:\n${activeMatch.context_summary}`;
      }
    }

    // Fetch last 3 messages for anti-repetition context
    let recentContext = "";
    try {
      const { data: recentMessages } = await supabase
        .from("bolinha_messages")
        .select("text, emotion")
        .order("created_at", { ascending: false })
        .limit(3);

      if (recentMessages && recentMessages.length > 0) {
        recentContext = `\n\nSUAS ÚLTIMAS MENSAGENS (NÃO repita frases, aberturas ou dados parecidos — traga um ângulo NOVO):\n${
          recentMessages.map((m: { text: string; emotion: string }, i: number) => `${i + 1}. [${m.emotion}] "${m.text}"`).join("\n")
        }`;
      }
    } catch (e) {
      console.error("Error fetching recent messages (non-fatal):", e);
    }

    // Build user prompt
    let userPrompt = "";

    if (custom_prompt) {
      userPrompt = `${contextBlock}${recentContext}\n\n---\n\nINSTRUÇÃO DO APRESENTADOR: ${custom_prompt}\n\nLembre-se: se recebeu DADOS AO VIVO, use APENAS eles. Se recebeu DADOS PRÉ-JOGO, use eles. MÁXIMO 200 caracteres. Responda como JSON com "text" e "emotion".`;
    } else {
      userPrompt = `${contextBlock}${recentContext}\n\n---\n\nEVENTO: ${event_type || "comentário geral"}\n${event_description ? `Descrição: ${event_description}` : ""}\n${team_name ? `Time: ${team_name}` : ""}\n${player_name ? `Jogador: ${player_name}` : ""}\n${minute ? `Minuto: ${minute}'` : ""}\n${score ? `Placar: ${score}` : ""}\n\nLembre-se: se recebeu DADOS AO VIVO, use APENAS eles. MÁXIMO 200 caracteres. Responda como JSON com "text" e "emotion".`;
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
