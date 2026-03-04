# Bolinha — Mascote IA do Union Football Live

## Guia Completo: Design, Voz e Integração

---

## 1. CONCEITO DO PERSONAGEM

**Nome**: Bolinha
**Inspiração visual**: Bola Trionda da Copa do Mundo 2026 (Adidas) — design com 4 painéis, cores vermelho/azul/verde representando EUA/Canadá/México, detalhes dourados, motivo triangular central.
**Personalidade**: Comentarista animado, apaixonado por futebol, conhece tudo sobre os times brasileiros. Fala gírias do futebol brasileiro. Engraçado mas respeitoso. Fica MUITO empolgado com gol. Se indigna com juiz. Traz curiosidades aleatórias. É um torcedor neutro mas se emociona com boas jogadas de qualquer time.

**Conceito de cores dinâmicas**: A base do Bolinha é o design Trionda (vermelho/azul/verde/dourado), mas quando comenta sobre um time específico, os painéis da bola mudam para as cores desse time. Evento do São Paulo? Painéis ficam vermelho/branco/preto com o tricolor. Gol do Palmeiras? Painéis ficam verde/branco. É como se o Bolinha "vestisse" as cores do time por alguns segundos.

---

## 2. PROMPTS PARA GERAÇÃO DE IMAGENS (Google ImageFX / Gemini)

### 2.1 Regras gerais para TODOS os prompts

Adicione estas instruções em TODOS os prompts abaixo:

```
REGRAS VISUAIS OBRIGATÓRIAS:
- Estilo: cartoon/mascote 3D render estilo Pixar/Disney, fofo, amigável
- O personagem é uma bola de futebol com rosto (olhos grandes expressivos, 
  boca, sobrancelhas) e braços/mãos pequenos (sem pernas — ele flutua)
- Design da bola: inspirado na Trionda da Copa 2026 — 4 painéis com 
  costuras profundas, padrão de ondas fluidas, detalhes dourados
- Fundo: TRANSPARENTE (ou cor sólida que eu possa remover facilmente, 
  como verde-limão #00FF00 chromakey)
- Iluminação: suave, estilo estúdio, sem sombras duras
- Ângulo: 3/4 frontal (levemente de lado, mostrando personalidade)
- Tamanho: personagem centralizado, enquadramento do peito pra cima 
  (ou do "meio da bola pra cima")
- Proporção: 1:1 (quadrado) ou 4:3
- Qualidade: alta resolução, limpo, sem ruído
```

### 2.2 Prompt BASE — Design do personagem (pose neutra)

```
A cute 3D cartoon soccer ball character mascot, Pixar/Disney style.
The ball design is inspired by the 2026 FIFA World Cup Trionda ball 
by Adidas — flowing four-panel construction with deep seams, 
red, blue and green colorful panels connected by a triangular motif 
in the center, with golden details and embossed textures.

The ball has a friendly cartoon face: big expressive round eyes with 
thick eyebrows, a small cute smile, and tiny cartoon gloved hands 
(no legs — the character floats).

The character is looking directly at the viewer with a welcoming 
neutral expression, arms relaxed at the sides.

Solid bright green (#00FF00) background for chromakey removal.
Studio lighting, clean render, high quality, 3D CGI style.
Front 3/4 angle view.
```

### 2.3 Prompt — COMEMORANDO (gol do time)

```
A cute 3D cartoon soccer ball character mascot celebrating excitedly.
Same Trionda 2026 World Cup ball design (flowing four panels, deep seams,
golden details).

BUT THE PANELS ARE NOW COLORED [INSERIR CORES DO TIME]:
- For São Paulo FC: red, white, and black tricolor panels
- For Palmeiras: green and white panels
- For Corinthians: black and white panels
- For Flamengo: red and black panels
[GERE UMA VERSÃO POR TIME]

The character is JUMPING with joy, both tiny gloved hands raised up 
in the air, mouth wide open screaming with happiness, eyebrows up, 
eyes sparkling with excitement. Small motion lines around to show 
energy and movement. Maybe small confetti or stars around.

Solid bright green (#00FF00) background for chromakey removal.
Studio lighting, dynamic pose, high energy, 3D CGI style.
```

### 2.4 Prompt — TRISTE (gol contra / derrota)

```
A cute 3D cartoon soccer ball character mascot looking sad and 
disappointed. Same Trionda 2026 World Cup ball design (flowing four 
panels, deep seams, golden details).

PANEL COLORS: [CORES DO TIME QUE LEVOU O GOL]

The character has droopy sad eyes looking down, eyebrows angled sadly,
small frown mouth, one tiny gloved hand on the side of the face in a 
"oh no" gesture. The character is slightly deflated/slouched. 
A small sweat drop or tear on the side.

Solid bright green (#00FF00) background for chromakey removal.
Studio lighting, soft mood, 3D CGI style.
```

### 2.5 Prompt — PENSANDO (análise / curiosidade)

```
A cute 3D cartoon soccer ball character mascot in a thinking pose.
Same Trionda 2026 World Cup ball design (flowing four panels, deep 
seams, golden details) with ORIGINAL TRIONDA COLORS (red, blue, green).

The character has one tiny gloved hand on its chin, eyes looking up 
and to the side thoughtfully, one eyebrow raised, slight smirk.
A small thought bubble or question mark floating above.
The character looks like it's about to share an interesting fact.

Solid bright green (#00FF00) background for chromakey removal.
Studio lighting, intellectual mood, 3D CGI style.
```

### 2.6 Prompt — SURPRESO (lance polêmico / VAR / pênalti)

```
A cute 3D cartoon soccer ball character mascot with a shocked/surprised 
expression. Same Trionda 2026 World Cup ball design (flowing four panels,
deep seams, golden details) with ORIGINAL TRIONDA COLORS.

The character has very wide open eyes (almost popping out), mouth in 
a perfect "O" shape, both tiny gloved hands on the cheeks in a 
"Home Alone" style surprised pose. Small exclamation marks floating 
around. Eyebrows very high.

Solid bright green (#00FF00) background for chromakey removal.
Studio lighting, dramatic, 3D CGI style.
```

### 2.7 Prompt — INDIGNADO (falta feia / cartão injusto / erro do juiz)

```
A cute 3D cartoon soccer ball character mascot looking angry and 
indignant (but still cute, not scary). Same Trionda 2026 World Cup 
ball design with ORIGINAL TRIONDA COLORS.

The character has furrowed angry eyebrows, gritted teeth, one tiny 
gloved hand pointing forward accusingly, the other hand on the hip.
Small anger veins or steam coming from the top. Red blush on cheeks.
The character looks like it's arguing with the referee.

Solid bright green (#00FF00) background for chromakey removal.
Studio lighting, comedic anger, 3D CGI style.
```

### 2.8 Prompt — APLAUDINDO (boa jogada / defesaça / fair play)

```
A cute 3D cartoon soccer ball character mascot clapping and impressed.
Same Trionda 2026 World Cup ball design with ORIGINAL TRIONDA COLORS.

The character is clapping both tiny gloved hands together, eyes wide 
with admiration, big smile, eyebrows raised in an impressed expression.
Small sparkle effects around the hands. The character looks genuinely 
impressed by a beautiful play.

Solid bright green (#00FF00) background for chromakey removal.
Studio lighting, positive energy, 3D CGI style.
```

### 2.9 Prompt — DORMINDO / TÉDIO (jogo parado / sem emoção)

```
A cute 3D cartoon soccer ball character mascot looking sleepy and bored.
Same Trionda 2026 World Cup ball design with ORIGINAL TRIONDA COLORS.

The character has half-closed droopy eyes, small yawn mouth, one tiny 
gloved hand covering the yawn. A small "Zzz" floating above. 
The character is slightly tilted to the side as if nodding off.
Comedic boredom expression.

Solid bright green (#00FF00) background for chromakey removal.
Studio lighting, lazy mood, 3D CGI style.
```

---

## 3. MAPA DE CORES POR TIME

Quando gerar as poses de COMEMORANDO e TRISTE, troque as cores dos painéis:

| Time | Cores dos Painéis | Detalhes |
|------|-------------------|----------|
| **Base (Trionda)** | Vermelho + Azul + Verde + Dourado | Pose neutra, pensando, surpreso |
| **São Paulo** | Vermelho + Branco + Preto | Listras tricolores nos painéis |
| **Palmeiras** | Verde escuro + Branco | Detalhes dourados mantidos |
| **Corinthians** | Preto + Branco | Detalhes prateados |
| **Santos** | Branco + Preto | Listras horizontais |
| **Flamengo** | Vermelho + Preto | Listras horizontais |
| **Botafogo** | Preto + Branco | Estrela solitária |
| **Fluminense** | Grená + Verde + Branco | Tricolor |
| **Vasco** | Preto + Branco + Faixa diagonal | Cruz de Malta |
| **Genérico Home** | Dourado predominante | Para times sem versão específica |
| **Genérico Away** | Cinza/Prateado predominante | Para adversários genéricos |

**Dica prática**: No Gemini/ImageFX, gere primeiro a base (Trionda original) perfeita. Depois use o mesmo prompt trocando APENAS a descrição de cores. Isso mantém consistência visual entre as poses.

**PACK MÍNIMO para começar** (28 imagens):
- 8 poses × versão Trionda (neutra) = 8 imagens
- Pose "comemorando" × 5 times (SPFC, Palmeiras, Corinthians, Santos, Flamengo) = 5
- Pose "comemorando" × genérico (dourado) = 1
- Pose "triste" × 5 times = 5
- Pose "triste" × genérico = 1
- Total: **20 imagens** para MVP funcional

Depois expanda para outros times conforme necessidade.

---

## 4. PRODUÇÃO DAS IMAGENS — WORKFLOW

### 4.1 No Google ImageFX (Gemini)

1. Abra https://aitestkitchen.withgoogle.com/tools/image-fx
2. Cole o prompt BASE primeiro
3. Gere 4 variações, escolha a melhor
4. ANOTE o seed/estilo que mais gostou — descreva ele nos prompts seguintes 
   para manter consistência (ex: "same character design as reference")
5. Gere cada pose/emoção separadamente
6. Para cada pose, gere a versão Trionda e depois as versões com cores de times

### 4.2 Pós-processamento

Depois de gerar as imagens, você precisa:

1. **Remover o fundo verde** → Use remove.bg (gratuito) ou o removedor 
   de fundo do Canva. Salve como PNG com transparência.

2. **Padronizar tamanho** → Redimensione todas para 512x512 ou 1024x1024.
   No widget OBS vai ser menor, mas ter em alta resolução ajuda.

3. **Naming convention**: Salve os arquivos assim:
   ```
   bolinha-neutro.png
   bolinha-pensando.png
   bolinha-surpreso.png
   bolinha-indignado.png
   bolinha-aplaudindo.png
   bolinha-dormindo.png
   bolinha-comemorando-trionda.png
   bolinha-comemorando-spfc.png
   bolinha-comemorando-palmeiras.png
   bolinha-comemorando-corinthians.png
   bolinha-comemorando-santos.png
   bolinha-comemorando-flamengo.png
   bolinha-comemorando-generico.png
   bolinha-triste-spfc.png
   bolinha-triste-palmeiras.png
   bolinha-triste-corinthians.png
   bolinha-triste-santos.png
   bolinha-triste-flamengo.png
   bolinha-triste-generico.png
   ```

4. **Upload para o projeto** → Coloque os PNGs em `public/bolinha/` 
   no repositório. Eles serão servidos como assets estáticos.

---

## 5. TTS — DANDO VOZ AO BOLINHA

### 5.1 Escolha do Serviço

**ElevenLabs** (recomendado):
- Free tier: 10.000 créditos/mês (~20 min de áudio)
- Um comentário do Bolinha = ~2 frases = ~150 caracteres = ~75 créditos
- Por jogo: ~25 comentários = ~1.875 créditos
- Free tier aguenta: **5 jogos/mês** de graça
- Starter ($5/mês): 60.000 créditos = ~32 jogos/mês (sobra!)
- Flash v2.5: latência de ~75ms (quase instantâneo)
- Suporta português brasileiro
- API disponível em todos os planos inclusive Free

**Como criar a voz do Bolinha:**
1. Crie uma conta em elevenlabs.io
2. Vá em "Voices" → "Voice Library" 
3. Procure uma voz brasileira masculina jovem e animada 
   (ou use "Voice Design" para criar do zero: male, young adult, 
   Brazilian Portuguese, animated/excited, fast pace)
4. Salve o voice_id — vai precisar na API
5. Teste com frases do Bolinha: "GOOOL! Que golaço do Calleri! 
   O artilheiro não perdoa!"

### 5.2 Conta de Custos por Jogo

```
Jogo típico de 90 minutos:
- Pré-jogo: 2-3 comentários (análise, predição, curiosidade)
- 1º tempo: ~8 comentários (inícios, gols, cartões, intervalo)
- 2º tempo: ~10 comentários (mais eventos, substituições, tensão)
- Pós-jogo: 2-3 comentários (resumo, destaque)

Total: ~25 comentários × ~150 caracteres = ~3.750 caracteres
Em créditos ElevenLabs: ~1.875 créditos

Free tier (10.000/mês): 5 jogos
Starter $5/mês (60.000): ~32 jogos ✅ (mais que suficiente)
```

### 5.3 Alternativas

Se ElevenLabs ficar caro no futuro:
- **Google Cloud TTS**: $4/1M caracteres, vozes WaveNet em PT-BR
- **Amazon Polly**: $4/1M caracteres, vozes neurais em PT-BR
- **Edge TTS (gratuito)**: Microsoft Edge voices, qualidade boa, 
  sem limite. Pacote npm `edge-tts`. Menos natural mas gratuito.

---

## 6. ARQUITETURA TÉCNICA — COMO TUDO SE CONECTA

```
                    ┌─────────────────────┐
                    │   EVENTO DO JOGO    │
                    │  (gol, cartão, etc) │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  EDGE FUNCTION      │
                    │  "bolinha-comment"   │
                    │                     │
                    │  1. Recebe contexto  │
                    │  2. Claude gera texto│
                    │  3. ElevenLabs TTS   │
                    │  4. Retorna:         │
                    │     - texto          │
                    │     - emoção         │
                    │     - audio_url      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  SUPABASE REALTIME  │
                    │  (canal: bolinha)   │
                    │                     │
                    │  Publica mensagem:  │
                    │  {                  │
                    │   text: "GOOOL!",   │
                    │   emotion: "cele",  │
                    │   teamId: 126,      │
                    │   audioUrl: "..."   │
                    │  }                  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │  WIDGET OBS         │
                    │  /obs/bolinha       │
                    │                     │
                    │  1. Escuta canal    │
                    │  2. Troca imagem    │
                    │  3. Mostra balão    │
                    │  4. Toca áudio      │
                    │  5. Volta a dormir  │
                    └─────────────────────┘
```

### 6.1 Fluxo detalhado de um GOL:

```
1. API-Football retorna evento tipo "Goal" no fixture
2. O site detecta (polling a cada 15s no widget existente)
3. Dispara chamada para Edge Function "bolinha-comment":
   POST { 
     event: "goal", 
     team: { id: 126, name: "São Paulo" },
     player: "Calleri",
     minute: 32,
     score: "1-0",
     fixture_context: "Paulistão 2026, rodada 18, São Paulo vs Palmeiras"
   }

4. Edge Function:
   a) Monta prompt para Claude:
      "Você é Bolinha, mascote do Union Football Live... 
       Acabou de acontecer: GOL do São Paulo, Calleri, aos 32'.
       Agora é 1-0. Responda com MAX 2 frases, animado."
   
   b) Claude responde: 
      "GOOOL DO TRICOLOR! Calleri de cabeça, artilheiro não perdoa! 
       É o 12º dele na temporada, tá voando!"
   
   c) Define emoção: "celebrating"
   d) Define time: 126 (São Paulo)
   
   e) Chama ElevenLabs TTS com o texto
   f) Recebe audio (base64 ou URL temporária)
   
   g) Publica no Supabase Realtime:
      {
        text: "GOOOL DO TRICOLOR! Calleri de cabeça...",
        emotion: "celebrating",
        teamId: 126,
        audioBase64: "data:audio/mp3;base64,..."
      }

5. Widget OBS /obs/bolinha recebe via Realtime:
   a) Troca imagem para bolinha-comemorando-spfc.png
   b) Mostra balão com texto
   c) Toca áudio TTS
   d) Após 8 segundos: volta para bolinha-neutro.png, esconde balão
```

---

## 7. PROMPTS PARA LOVABLE — WIDGET OBS DO BOLINHA

### PROMPT L1 — Criar rota e componente do widget

```
Crie um novo widget OBS em /obs/bolinha que mostra o mascote Bolinha 
do Union Football Live.

Este widget é uma Browser Source no OBS com fundo transparente.
Funciona assim: fica parado mostrando o Bolinha na pose neutra. 
Quando recebe um evento via Supabase Realtime, muda a pose, 
mostra um balão de texto e toca áudio.

PASSO 1: Crie a rota /obs/bolinha no React Router 
(mesmo padrão dos outros widgets OBS existentes em /obs/*).

PASSO 2: Crie o componente src/presentation/pages/obs/ObsBolinha.tsx

A estrutura visual do widget é:

┌────────────────────────────────────┐
│          (fundo transparente)       │
│                                     │
│   ┌────────────────────────┐        │
│   │   BALÃO DE TEXTO       │        │
│   │   "GOOOL DO TRICOLOR!" │        │
│   │   "Calleri de cabeça!" │        │
│   └──────────┬─────────────┘        │
│              ▼                      │
│         ┌─────────┐                 │
│         │         │                 │
│         │ BOLINHA  │                │
│         │ (imagem) │                │
│         │         │                 │
│         └─────────┘                 │
│                                     │
└────────────────────────────────────┘

Implementação:

interface BolinhaMensagem {
  text: string;
  emotion: 'neutral' | 'celebrating' | 'sad' | 'thinking' | 
           'surprised' | 'angry' | 'clapping' | 'sleeping';
  teamId?: number;      // para selecionar variante de cor
  audioBase64?: string;  // áudio TTS em base64
}

Estados do componente:
- currentEmotion: string (default: 'neutral')
- currentTeamId: number | null
- messageText: string | null (se null, não mostra balão)
- isVisible: boolean (default: true, o Bolinha está sempre na tela)
- isShowingMessage: boolean (quando true, mostra balão + toca áudio)

Lógica:
1. Ao montar, subscribir no canal Supabase Realtime "bolinha":
   
   const channel = supabase.channel('bolinha')
     .on('broadcast', { event: 'comment' }, (payload) => {
       handleNewMessage(payload.payload as BolinhaMensagem);
     })
     .subscribe();

2. handleNewMessage:
   a) Setar currentEmotion = payload.emotion
   b) Setar currentTeamId = payload.teamId
   c) Setar messageText = payload.text
   d) Setar isShowingMessage = true
   e) Se payload.audioBase64: criar Audio e tocar
   f) Após 8 segundos (ou fim do áudio, o que for maior):
      - Setar isShowingMessage = false
      - Setar currentEmotion = 'neutral'
      - Setar messageText = null

3. Seleção de imagem:
   
   function getBolinhaImage(emotion: string, teamId?: number): string {
     // Se tem teamId e a emoção é "celebrating" ou "sad"
     // → usar versão com cores do time
     const teamSuffix = getTeamSuffix(teamId); // 'spfc', 'palmeiras', etc
     
     if (emotion === 'celebrating' && teamSuffix) {
       return `/bolinha/bolinha-comemorando-${teamSuffix}.png`;
     }
     if (emotion === 'sad' && teamSuffix) {
       return `/bolinha/bolinha-triste-${teamSuffix}.png`;
     }
     // Senão, usar versão base (Trionda)
     const emotionMap = {
       neutral: 'neutro',
       celebrating: 'comemorando-trionda',
       sad: 'triste-generico',
       thinking: 'pensando',
       surprised: 'surpreso',
       angry: 'indignado',
       clapping: 'aplaudindo',
       sleeping: 'dormindo',
     };
     return `/bolinha/bolinha-${emotionMap[emotion]}.png`;
   }
   
   function getTeamSuffix(teamId?: number): string | null {
     const map: Record<number, string> = {
       126: 'spfc',
       121: 'palmeiras',
       131: 'corinthians',
       128: 'santos',
       127: 'flamengo',
     };
     return teamId ? (map[teamId] ?? 'generico') : null;
   }

4. Estilo do BALÃO:
   - Posição: acima do Bolinha, centralizado
   - Background: bg-black/85 backdrop-blur-sm
   - Border: border border-yellow-500/50 rounded-xl
   - Texto: text-white text-lg font-bold text-center px-4 py-3
   - Seta (triângulo) apontando para baixo em direção ao Bolinha
   - MAX 2 linhas de texto, overflow-hidden
   - Animação de entrada: scale de 0.8→1 + opacity 0→1 (Framer Motion)
   - Animação de saída: opacity 1→0 + translate-y para cima

5. Estilo do BOLINHA (imagem):
   - Tamanho: w-48 h-48 (192px) — ajustável no OBS
   - Transição entre poses: crossfade (opacity transition 300ms)
   - Quando recebe mensagem: pequeno bounce (scale 1→1.1→1) usando 
     Framer Motion
   - Idle: sutil floating animation (translate-y de -3px a 3px, 
     loop infinito, 3 segundos) para parecer que está flutuando

6. Fundo: TRANSPARENTE obrigatório.
   body { background: transparent !important; }
   (mesmo padrão dos outros widgets OBS)

7. Parâmetros URL opcionais:
   ?size=sm|md|lg — tamanho do Bolinha (128px, 192px, 256px)
   ?position=left|center|right — alinhamento
   ?hidetext=true — esconde balão, só muda a pose

NÃO precisa de polling para a API-Football neste widget.
Os dados chegam via Supabase Realtime de outro processo 
(a Edge Function que será criada depois).
```

### PROMPT L2 — Painel Admin para testar o Bolinha

```
Crie uma página temporária /admin/bolinha para testar o widget 
manualmente (não precisa de autenticação, é apenas para testes).

Layout simples:

┌──────────────────────────────────────────┐
│  🎮 PAINEL DO BOLINHA — TESTES           │
│                                           │
│  Texto: [________________________]        │
│                                           │
│  Emoção: (neutral) (celebrating) (sad)    │
│          (thinking) (surprised) (angry)   │
│          (clapping) (sleeping)            │
│                                           │
│  Time: [São Paulo ▼]                      │
│                                           │
│  [🔊 Gerar com TTS]  [📝 Só texto]       │
│                                           │
│  ─── Preview do Widget ───                │
│  ┌─────────────────────────┐              │
│  │  (iframe do /obs/bolinha)│              │
│  └─────────────────────────┘              │
│                                           │
│  ─── Atalhos Rápidos ───                  │
│  [⚽ Gol Home] [⚽ Gol Away] [🟨 Cartão]  │
│  [🔄 Substituição] [😴 Tédio] [🎉 FIM]   │
└──────────────────────────────────────────┘

Implementação:
1. Formulário com input de texto, seletor de emoção, seletor de time
2. Botão "Só texto": publica no canal Supabase Realtime "bolinha" 
   com o texto e emoção selecionados (sem áudio)
3. Botão "Gerar com TTS": chama a Edge Function bolinha-comment 
   que gera texto via Claude + áudio via TTS
4. Atalhos rápidos: botões que enviam mensagens pré-definidas:
   - "Gol Home": texto "GOOOL!" + emotion "celebrating" + teamId do home
   - "Cartão": texto "Cartão amarelo!" + emotion "surprised"
   - "Tédio": texto "Esse jogo tá parado..." + emotion "sleeping"
5. Preview: iframe mostrando /obs/bolinha em tempo real
   Quando você clica nos botões, o widget no iframe reage instantaneamente

Isso permite testar o Bolinha ANTES de ir pro ar:
- Abre /admin/bolinha no navegador
- Abre /obs/bolinha como Browser Source no OBS
- Clica nos botões no admin → vê o Bolinha reagir no OBS
```

### PROMPT L3 — Integrar TTS via Edge Function

```
Crie uma Edge Function supabase/functions/bolinha-tts/index.ts

Esta Edge Function recebe um texto e retorna o áudio TTS gerado 
pelo ElevenLabs.

Endpoint: POST
Body: { text: string, voice_id?: string }
Response: { audioBase64: string, duration_ms: number }

Implementação:
1. Receber o texto do body
2. Chamar a API do ElevenLabs:
   
   const response = await fetch(
     `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
     {
       method: 'POST',
       headers: {
         'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY'),
         'Content-Type': 'application/json',
       },
       body: JSON.stringify({
         text: text,
         model_id: 'eleven_flash_v2_5',  // Mais rápido, ~75ms latência
         voice_settings: {
           stability: 0.5,        // Variação natural
           similarity_boost: 0.8, // Mantém a voz consistente
           style: 0.7,            // Expressividade alta
           use_speaker_boost: true,
         },
       }),
     }
   );

3. O ElevenLabs retorna o áudio como stream/binary
4. Converter para base64
5. Retornar { audioBase64: "data:audio/mp3;base64,...", duration_ms }

Configuração:
- Adicionar ELEVENLABS_API_KEY nos secrets do Supabase:
  supabase secrets set ELEVENLABS_API_KEY=your_key_here
- verify_jwt = false (por enquanto, para testes)
- CORS: mesmo padrão dos outros functions

FALLBACK: Se ElevenLabs falhar ou estiver sem créditos, 
retornar { audioBase64: null, duration_ms: 0 } 
e o widget mostra só o balão de texto sem áudio.
```

---

## 8. CONFIGURAÇÃO NO OBS

Depois que o widget estiver funcionando:

1. **Adicionar Browser Source** no OBS:
   - URL: `https://unionfc.lovable.app/obs/bolinha?size=md`
   - Width: 400
   - Height: 500
   - Transparente: ✅ (marcar "Custom CSS" se necessário com `body { background: transparent }`)

2. **Posicionar**: Canto inferior esquerdo ou inferior direito da tela 
   (onde não atrapalha o placar e as stats)

3. **Camada**: Acima do jogo, abaixo do placar/widgets de stats

4. **Teste**: Abrir /admin/bolinha, clicar nos botões, ver o Bolinha 
   reagir no OBS em tempo real

---

## 9. ORDEM DE EXECUÇÃO

| # | Tarefa | Ferramenta | Tempo |
|---|--------|-----------|-------|
| 1 | Gerar imagens do Bolinha (8 poses base) | Google ImageFX | 2-3h |
| 2 | Remover fundo e padronizar PNGs | remove.bg + editor | 1h |
| 3 | Gerar variantes de cores por time (comemorando + triste) | Google ImageFX | 2-3h |
| 4 | Upload imagens para public/bolinha/ no repo | GitHub | 15min |
| 5 | Criar widget /obs/bolinha (Prompt L1) | Lovable | 30min |
| 6 | Criar painel /admin/bolinha (Prompt L2) | Lovable | 30min |
| 7 | Testar poses e balão manualmente | Browser | 30min |
| 8 | Criar conta ElevenLabs + configurar voz | elevenlabs.io | 30min |
| 9 | Criar Edge Function TTS (Prompt L3) | Lovable/Supabase | 30min |
| 10 | Testar voz no painel admin | Browser | 30min |
| 11 | Configurar no OBS e testar em live de treino | OBS Studio | 30min |

**Total: ~1-2 dias de trabalho**

**MVP mínimo para a primeira live com Bolinha:**
- 8 poses Trionda (sem variantes de time)
- Widget OBS funcionando
- Painel admin com botões manuais (VOCÊ clica os botões durante a live)
- Sem TTS (só balão de texto)
- Depois evolui: adiciona TTS, cores por time, automação via eventos

---

## 10. EVOLUÇÃO FUTURA

**Fase 2** — Automação via eventos: Edge Function que escuta os 
mesmos dados de API-Football que os widgets OBS e dispara comentários 
automaticamente. Bolinha comenta sozinho sem ninguém clicar.

**Fase 3** — Interação com chat: Bolinha lê perguntas do chat do 
YouTube/Twitch e responde ao vivo. "Bolinha, o que achou desse 
primeiro tempo?" → Claude processa → TTS → Bolinha responde na live.

**Fase 4** — Bolinha animado: Em vez de imagens estáticas, usar 
sprite sheets com animação frame-by-frame ou Lottie animations. 
Boca mexe quando fala, olhos piscam, braços gesticulam.

**Fase 5** — Bolinha com memória: Supabase armazena histórico de 
comentários do Bolinha por jogo. Ele sabe que "na última vez que 
esses dois times jogaram, ele previu errado" e faz piada com isso.