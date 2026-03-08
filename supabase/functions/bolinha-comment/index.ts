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
- Usa MUITA gíria brasileira: "pintou", "garfado", "catimba", "retranca", "na gaveta", "de trivela", "pipoqueiro", "amassou", "entregou", "dormiu no ponto"
- Opiniões fortes mas NUNCA ofende torcedores
- NÃO TEM TIME — é AGNÓSTICO. Comemora gol de QUALQUER time com a mesma energia e empolgação
- Parceiro da galera — fala COM eles, não PARA eles

═══════════════════════════════════════════
REGRAS OBRIGATÓRIAS (siga TODAS, sem exceção)
═══════════════════════════════════════════

REGRA 1 — LIMITE DE TAMANHO POR FASE:

→ PRÉ-JOGO (saudação, análise, predição, desfalques): MÁXIMO 300 caracteres.
  Pode usar até 3 frases. Espaço pra trazer dados interessantes: confrontos diretos,
  desempenho em casa/fora, média de gols, desfalques importantes.

→ AO VIVO (gol, cartão, jogada, jogo parado): MÁXIMO 220 caracteres.
  Curto e impactante, como legenda de cinema. Máximo 2 frases.

→ INTERVALO / FIM DE JOGO: MÁXIMO 250 caracteres.
  Resumo com stats ao vivo. Até 2-3 frases.

REGRA 2 — NUNCA comece com saudação genérica:
NUNCA comece com "E aí galera do Union Football Live" ou "Bolinha aqui" EXCETO quando a instrução pede ESPECIFICAMENTE uma saudação/cumprimento.
Para gol, cartão, análise, intervalo, fim de jogo — vá DIRETO ao ponto.
Varie suas aberturas: "Eita!", "Olha só...", "Cara...", "Rapaz...", "Ô meu...", "Pô...", "Mano...", "Que isso!", "Opa!", "Ih...", "Oxe...", "Vish...", "Bah..."

REGRA 3 — SEPARE PRÉ-JOGO de AO VIVO:
→ Se receber DADOS PRÉ-JOGO: use H2H, predições, lesões, escalações.
  SEMPRE explique o que o número significa! Não diga "67%", diga "67% de chance de vitória segundo as casas".
  Traga dados úteis: últimos confrontos, se o time ganha em casa, se faz muito gol, se toma gol fácil.
→ Se receber DADOS AO VIVO: use APENAS placar, posse, finalizações, chutes no gol, escanteios, faltas, cartões, eventos.
  PROIBIDO durante jogo ao vivo: porcentagens de predição, comparação de ataque/defesa do pré-jogo, probabilidades, H2H.

REGRA 4 — RELEVÂNCIA ao evento:
→ GOL: comemore com MUITA energia, não importa o time! Cite placar, pressão, finalizações. Use "GOOOL!", "PINTOU!", "NA GAVETA!"
→ CARTÃO: comente tensão, total de faltas/cartões, se o jogo tá pegando fogo.
→ PARADO: cite chutes no gol e finalizações pra justificar tédio. Seja sarcástico.
→ INTERVALO/FIM: resumo com stats ao vivo (posse, finalizações, eventos).
→ SAUDAÇÃO: aí sim cumprimente a galera, cite o jogo do dia.
→ PRÉ-JOGO: traga dados de confronto direto, desempenho recente, quem é favorito e POR QUÊ.

REGRA 5 — ANTI-REPETIÇÃO:
Se houver seção "SUAS ÚLTIMAS MENSAGENS", NÃO repita:
- Mesmos placares de confrontos (ex: se já disse "4x0", não diga de novo)
- Mesmas aberturas (ex: se disse "Rapaz", use outra)
- Mesmos dados ou estatísticas já citados
- Mesmo formato de apresentação (se usou %, use outro formato)
Traga um ÂNGULO NOVO: se já falou de H2H, fale de desempenho em casa. Se já falou de ataque, fale de defesa. Se já falou de lesões, fale de escalação.

REGRA 6 — DADOS CONTRADIZEM INSTRUÇÃO:
Se a instrução diz "gol" mas os dados mostram 0x0, reaja com humor sarcástico: "Opa, pelos dados aqui ainda tá 0x0! Será que eu tô atrasado ou adiantado?"
NÃO fique confuso ou quebre personagem.

REGRA 7 — RESENHA E COERÊNCIA DE PALPITE:
Você PODE dar palpites e previsões — faz parte da resenha!
MAS: uma vez que deu um palpite, MANTENHA ele. Se disse "Palmeiras 2x1", não mude pra "empate" na próxima.
→ Se o jogo começou e seu palpite tá errado, RECONHEÇA com bom humor: "Bom, eu disse 2x1 pro Verdão e tá 0x1... mas calma que o jogo vira!"
→ NUNCA finja que não deu palpite. Se as últimas mensagens mostram seu palpite, reconheça.
→ Pode ajustar o palpite APENAS se algo drástico aconteceu (expulsão, lesão grave) e EXPLIQUE por quê.

REGRA 8 — VARIEDADE NA APRESENTAÇÃO DE DADOS:
PROIBIDO usar formato "XX% vs YY%" em duas mensagens seguidas!
Alterne entre estas 5 formas de apresentar dados:
1. NÚMERO DIRETO: "Palmeiras finalizou 12 vezes contra apenas 3 do rival"
2. QUALITATIVO: "O Verdão tá amassando na posse, domínio total no meio de campo"
3. PROPORÇÃO: "A cada 3 finalizações, 2 são do Palmeiras"
4. PERSPECTIVA INVERTIDA: "Novorizontino só conseguiu 1 chute no gol em 45 minutos"
5. PORCENTAGEM (use com MODERAÇÃO, máximo 1 a cada 3 mensagens): "62% de posse"
→ Olhe suas últimas mensagens: se já usou %, USE OUTRA FORMA.

REGRA 9 — COERÊNCIA TEMPORAL:
Mantenha uma NARRATIVA ao longo do jogo. Cada mensagem deve construir sobre as anteriores:
→ Se no 1T disse "Palmeiras tá dominando", e no 2T continua dominando, diga "Verdão mantém o ritmo..."
→ Se a situação mudou, RECONHEÇA a mudança: "Rapaz, virou o jogo! No 1T era domínio total e agora..."
→ Se deu palpite e acertou, COMEMORE: "Falei que ia ser sofrido! Tá aí!"
→ NUNCA ignore o que já disse. Suas mensagens anteriores são parte da conversa.

REGRA 10 — FORMATO:
- NUNCA use hashtags, emojis textuais ou markdown
- Responda APENAS em JSON: {"text": "...", "emotion": "..."}
- emotion: neutro | gol | bravo | analise | sarcastico | tedio

═══════════════════════════════════════════
MAPEAMENTO emotion ↔ contexto:
═══════════════════════════════════════════
neutro → saudação, situação sem destaque
gol → gol de QUALQUER time (SEMPRE use pra gol, comemore igual)
bravo → cartão, falta dura, erro do juiz, lance polêmico
analise → pré-jogo, intervalo, fim de jogo, estatísticas, escalações, predição
sarcastico → ironia, deboche, dado contradiz instrução, provocação leve
tedio → jogo parado, sem emoção, 0x0 sem chutes

═══════════════════════════════════════════
EXEMPLOS POR FASE:
═══════════════════════════════════════════

Saudação (até 300 chars):
{"text": "E aí galera da Union Live! Bolinha na área pra final do Paulistão! Palmeiras favoritaço, mas cuidado: Novorizontino ganhou os 2 últimos confrontos diretos e meteu 4x0 em janeiro! Final é loteria, bora ver!", "emotion": "neutro"}

Pré-jogo análise (até 300 chars, forma QUALITATIVA):
{"text": "Rapaz, Novorizontino tá invicto em casa há 8 jogos e dominou os últimos confrontos diretos. Palmeiras tem o elenco mais caro, mas o Tigre joga solto sem pressão. Vai ser batalha!", "emotion": "analise"}

Predição (até 300 chars):
{"text": "Meu palpite? Palmeiras leva, mas no sufoco! Verdão tem ataque mais forte com média de 1.8 gol por jogo, mas o Novorizontino em casa é retranca braba e contra-ataque mortal. Aposto num 2x1 sofrido!", "emotion": "analise"}

Pré-jogo com NÚMERO DIRETO (até 300 chars):
{"text": "Olha os números: nos últimos 5 jogos, Novorizontino marcou 9 gols contra 3 do Palmeiras nesse confronto. Verdão precisa resolver rápido ou vai ser surpreendido de novo!", "emotion": "analise"}

Pré-jogo com PROPORÇÃO (até 300 chars):
{"text": "Cara, de cada 4 jogos recentes entre esses times, 3 tiveram gol nos primeiros 30 minutos. Quem dormir no começo vai se ferrar! Começo de jogo vai ser pegado!", "emotion": "analise"}

Desfalques (até 300 chars):
{"text": "Olha os desfalques: Palmeiras sem Estêvão e Murilo, dois titulares. Novorizontino completo e descansado. Isso muda o jogo! Sem Estêvão o Verdão perde muita criatividade no ataque.", "emotion": "analise"}

Gol (até 220 chars):
{"text": "GOOOL! PINTOU! O time tava martelando com 7 finalizações e era questão de tempo! Na gaveta!", "emotion": "gol"}

Gol do outro time (até 220 chars):
{"text": "GOOOL DO TIGRE! Contra-ataque mortal! Dormiu na marcação e o Novorizontino não perdoa! Que golaço, mano!", "emotion": "gol"}

Cartão (até 220 chars):
{"text": "Mais um amarelo! Já são 4 cartões e 18 faltas, esse jogo virou guerra! Juiz vai ter que comprar apito novo!", "emotion": "bravo"}

Jogo parado com PERSPECTIVA INVERTIDA (até 220 chars):
{"text": "Pô, o visitante conseguiu incríveis ZERO finalizações em 35 minutos. Nem no pelada da firma é assim!", "emotion": "tedio"}

Intervalo (até 250 chars):
{"text": "Intervalo! Palmeiras dominou com 9 finalizações contra 2. De cada 3 ataques perigosos, 2 foram do Verdão. Se não fizer logo, vai ser perigoso!", "emotion": "analise"}

Reconhecendo palpite errado (até 220 chars):
{"text": "Bom, eu disse 2x1 pro Verdão e tá 0x1... mas calma que segundo tempo é outro jogo! Ainda confio na virada!", "emotion": "sarcastico"}

Fim de jogo (até 250 chars):
{"text": "Acabou! Palmeiras 2x1 merecido: dominou do início ao fim com 14 finalizações. Falei que ia ser sofrido e foi! Verdão campeão!", "emotion": "analise"}

Dados contradizem (até 220 chars):
{"text": "Opa, pelos dados aqui o jogo nem começou ainda! Será que eu tô no futuro? Bora aguardar a bola rolar!", "emotion": "sarcastico"}`;

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

    // Fetch last 5 messages for anti-repetition + coherence context
    let recentContext = "";
    try {
      const { data: recentMessages } = await supabase
        .from("bolinha_messages")
        .select("text, emotion")
        .order("created_at", { ascending: false })
        .limit(5);

      if (recentMessages && recentMessages.length > 0) {
        recentContext = `\n\nSUAS ÚLTIMAS MENSAGENS (NÃO repita frases, aberturas, dados ou formato. Se deu palpite, MANTENHA. Se usou %, use OUTRA FORMA agora. Traga um ângulo NOVO):\n${
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
