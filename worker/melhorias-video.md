# Union Clips AI — Pesquisa: Tempos Ideais & Catálogo de Efeitos

---

## PARTE 1: Tempo Ideal dos Cortes por Plataforma

### Resumo Executivo

Não existe "um tempo ideal" — existe o tempo certo pra cada **objetivo** e **plataforma**.
A regra de ouro: **o vídeo deve durar exatamente o tempo que o conteúdo merece, nem mais nem menos.**
Dito isso, os dados mostram faixas claras.

### Dados por Plataforma (2025-2026)

| Plataforma | Viral / Alcance Máximo | Engajamento / Storytelling | Limite Máximo |
|---|---|---|---|
| **TikTok** | 11-18s (loops, replays) | 30-60s (narrativa) | 10 min |
| **Instagram Reels** | 15-30s (completion rate alta) | 60-90s (storytelling) | 3 min* |
| **YouTube Shorts** | 25-40s (watch-through) | 30-60s (educacional) | 3 min |
| **Twitter/X** | 15-30s (autoplay feed) | 30-45s | 2:20 min |

*Reels acima de 3 minutos não são mostrados a novas audiências.

### O que Funciona pro Union Football Live

Para um canal de futebol com comentário/reação, os cortes se dividem em:

| Tipo de Corte | Tempo Ideal | Por Quê | Plataforma Alvo |
|---|---|---|---|
| **Reação a gol/lance** | **15-30s** | Impacto rápido, loopável, compartilhável | Reels, TikTok, Shorts |
| **Polêmica/VAR** | **30-60s** | Precisa de contexto + reação + opinião | TikTok, Reels |
| **Análise tática** | **45-90s** | Profundidade técnica, público fiel | YouTube Shorts, TikTok |
| **Storytelling/história** | **60-120s** | Setup → climax → payoff completo | TikTok (longo), Reels |
| **Grande Momento** | **45-90s** | Quadro especial, produção elaborada | YouTube, Reels |
| **Compilação pré-jogo** | **60-90s** | Múltiplos clips + CTA | Reels, YouTube |

### Regras Universais (baseadas nos dados)

1. **Primeiros 3 segundos são tudo** — o hook decide se o viewer fica ou scrolla
2. **Completion rate > duração** — um vídeo de 20s assistido até o final vale mais que um de 60s com 30% de retenção
3. **Looping multiplica views** — vídeos curtos (15-25s) que terminam bem geram replay automático
4. **Legendas são obrigatórias** — 75%+ do consumo mobile é sem som
5. **Ritmo rápido vence** — jump cuts e remoção de silêncio mantêm atenção
6. **Vertical primeiro** — 9:16 é o formato primário em todas as plataformas

### Recomendação para o Prompt

Atualizar o prompt do Claude para gerar 3 categorias de corte por live:

```
- SHORT (15-30s): reações rápidas, momentos virais, loops
- MEDIUM (30-60s): polêmicas, debates, análises curtas  
- LONG (60-120s): storytelling completo, quadros especiais
```

A IA deve indicar a categoria e o tempo-alvo, e o FFmpeg ajusta (removendo silêncios)
para que o clip final fique dentro da faixa.

---

## PARTE 2: Catálogo de Efeitos de Edição (viáveis via FFmpeg)

### Efeitos que Fazem Diferença em Cortes Virais

Classificados por impacto e dificuldade de implementação no FFmpeg.

---

### 🟢 FÁCIL — Já temos ou implementamos rápido

#### 1. Jump Cut (Remoção de Silêncio)
**O que é:** Remove pausas entre falas, criando ritmo rápido estilo podcast editado.
**Por que funciona:** Mantém atenção, elimina tempo morto, cria sensação de energia.
**FFmpeg:** Cortar segmentos + concatenar com `concat` ou `xfade` de 0.1s.
**Status:** ✅ Já no pipeline v3 (silence_cuts)

#### 2. Fade In/Out
**O que é:** Transição gradual de/para preto no início e fim do clip.
**FFmpeg:** `fade=t=in:st=0:d=0.5` / `fade=t=out:st={dur-0.5}:d=0.5`
**Status:** ✅ Já implementado

#### 3. Logo Overlay (Watermark)
**O que é:** Logo semi-transparente fixo no canto do vídeo.
**FFmpeg:** `overlay=W-w-20:20` com `colorchannelmixer=aa=0.7`
**Status:** ✅ Já no pipeline v3

#### 4. Text Overlay (Lower Third)
**O que é:** Texto na parte inferior do vídeo (placar, nome, contexto).
**FFmpeg:** `drawtext=` com box, enable por timestamp.
**Status:** ✅ Já implementado

#### 5. Legendas Estilizadas (ASS/SSA)
**O que é:** Subtitles com fonte custom, highlight de palavras-chave em cor diferente.
**FFmpeg:** Burn `.ass` file com `ass=` filter.
**Status:** ✅ Já no pipeline v3

---

### 🟡 MÉDIO — Implementável com filtergraph

#### 6. Punch-In Zoom (Emphasis Zoom)
**O que é:** Zoom sutil (105-115%) no rosto/centro durante momento de impacto.
Cria sensação de "chegou mais perto" sem câmera se mover.
**Por que funciona:** Direciona atenção, aumenta tensão no clímax.
**FFmpeg:**
```
# Zoom de 100% para 110% centrado, durante 2 segundos a partir de t=5
scale=2*iw:2*ih,
zoompan=z='if(between(in_time,5,7),min(zoom+0.001,1.1),1)':
x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':
d=1:s=1920x1080:fps=30
```
**Alternativa mais simples (crop-based):**
```python
def punch_in_zoom(input_path, output_path, start, end, zoom=1.1):
    """Zoom suave via crop progressivo."""
    duration = end - start
    # Escala up → crop centro → escala down
    vf = (
        f"scale=iw*{zoom}:ih*{zoom},"
        f"crop=iw/{zoom}:ih/{zoom}:(iw-iw/{zoom})/2:(ih-ih/{zoom})/2"
    )
    # Aplicar só no trecho com enable
    # Na prática: extrair trecho, aplicar zoom, reinserir
```
**Quando usar:** Clímax do clip, frase de impacto, momento de reação forte.
**Dificuldade:** ⭐⭐ (precisa extrair trecho, aplicar, reinserir)

#### 7. Slow Zoom Contínuo (Ken Burns em Vídeo)
**O que é:** Zoom muito lento e constante durante todo o clip (tipo 100% → 105% em 60s).
**Por que funciona:** Cria sensação cinematográfica sutil, mantém olho engajado.
**FFmpeg:**
```
# Zoom lento de 1.0 para 1.05 ao longo de todo o clip
zoompan=z='1+0.00002*in':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':
d={total_frames}:s=1920x1080:fps=30
```
**Quando usar:** Análises táticas, storytelling calmo, momentos reflexivos.
**Dificuldade:** ⭐⭐

#### 8. Flash Branco (Impact Flash)
**O que é:** Flash branco rápido (0.1-0.2s) entre dois momentos pra criar impacto.
**Por que funciona:** Sinaliza mudança de momento, cria "boom" visual.
**FFmpeg:**
```python
def flash_transition(duration=0.15):
    """Gera frame branco rápido entre dois segmentos."""
    # Criar clipe branco
    cmd = f"color=c=white:s=1920x1080:d={duration}"
    # Concatenar: segmento_A + flash + segmento_B
```
**Alternativa via filtergraph:**
```
# Clarear a imagem brevemente
eq=brightness=0.5:enable='between(t,{ts},{ts+0.15})'
```
**Quando usar:** Transição para replay, momento de gol, punchline.
**Dificuldade:** ⭐⭐

#### 9. Picture-in-Picture (PiP)
**O que é:** Vídeo pequeno sobreposto ao vídeo principal (ex: lance no canto).
**FFmpeg:**
```
# PiP no canto inferior direito, 30% do tamanho
[1:v]scale=iw*0.3:-1[pip];
[0:v][pip]overlay=W-w-20:H-h-20
```
**Quando usar:** Template split, reação + lance, replay no canto.
**Dificuldade:** ⭐⭐

#### 10. Split Screen (Horizontal / Vertical)
**O que é:** Dois vídeos dividindo a tela (lado a lado ou empilhados).
**FFmpeg:**
```
# Empilhado (comentário em cima, lance embaixo)
[0:v]crop=iw:ih/2:0:0[top];
[1:v]crop=iw:ih/2:0:0[bottom];
[top][bottom]vstack[out]

# Lado a lado
[0:v]scale=960:1080[left];
[1:v]scale=960:1080[right];
[left][right]hstack[out]
```
**Quando usar:** Template GOL_GRANDE_MOMENTO, comparações, antes/depois.
**Dificuldade:** ⭐⭐

#### 11. Crossfade (Dissolve entre Clips)
**O que é:** Transição suave onde um clip se dissolve no próximo.
**FFmpeg:**
```
# xfade com dissolve de 0.5s
[0:v][1:v]xfade=transition=fade:duration=0.5:offset={clip1_duration - 0.5}
```
**Transições disponíveis no xfade:**
fade, fadeblack, fadewhite, dissolve, wipeleft, wiperight, wipeup, wipedown,
slideleft, slideright, slideup, slidedown, circlecrop, circleopen, circleclose,
vertopen, vertclose, horzopen, horzclose, diagtl, diagtr, diagbl, diagbr,
hlslice, hrslice, vuslice, vdslice, smoothleft, smoothright, smoothup, smoothdown
**Quando usar:** Entre segmentos de storytelling, compilações.
**Dificuldade:** ⭐⭐

#### 12. Shake / Tremor (Camera Shake)
**O que é:** Vibração sutil da imagem simulando impacto ou emoção.
**FFmpeg:**
```
# Shake aleatório de ±5 pixels
crop=iw-10:ih-10:
'5+random(1)*5':'5+random(2)*5'
```
**Quando usar:** Momento de gol, reação explosiva, polêmica.
**Dificuldade:** ⭐⭐⭐

---

### 🔴 AVANÇADO — Possível mas complexo

#### 13. Speed Ramp (Câmera Lenta / Rápida)
**O que é:** Desacelerar um momento chave (0.5x) ou acelerar transições (1.5x).
**FFmpeg:**
```python
# Slow motion 50% em trecho específico
setpts='if(between(T,{start},{end}),2*PTS,PTS)'
# + atempo=0.5 para o áudio correspondente
```
**Quando usar:** Replay de gol em slow-mo, acelerar contexto/setup.
**Dificuldade:** ⭐⭐⭐

#### 14. Borda/Moldura Temática
**O que é:** Moldura colorida ao redor do vídeo (vermelha pra polêmica, dourada pra gol).
**FFmpeg:**
```
# Borda vermelha de 5px
pad=iw+10:ih+10:5:5:color=red
```
**Para borda animada (pulsa):**
```
# Alternar entre vermelho e laranja a cada 0.5s
pad=iw+10:ih+10:5:5:
color='if(lt(mod(t,1),0.5),0xFF0000,0xFF4400)'
```
**Quando usar:** Template RESENHA (esquentou), destaques.
**Dificuldade:** ⭐⭐⭐

#### 15. Audio Waveform Overlay
**O que é:** Visualização da onda sonora sobreposta ao vídeo.
**FFmpeg:**
```
# Gerar waveform e sobrepor na parte inferior
[0:a]showwaves=s=1920x200:mode=cline:
colors=0x58A6FF@0.7:rate=30[wave];
[0:v][wave]overlay=0:H-200[out]
```
**Quando usar:** Template GRANDE_MOMENTO, podcasts, análises.
**Dificuldade:** ⭐⭐⭐

#### 16. Glitch / Distorção Digital
**O que é:** Efeito de "TV quebrada" rápido entre cortes.
**FFmpeg:**
```
# Deslocar canais RGB brevemente
rgbashift=rh=-5:bh=5:rv=3:bv=-3:
enable='between(t,{ts},{ts+0.2})'
```
**Quando usar:** Momentos de erro/falha, humor, transição de impacto.
**Dificuldade:** ⭐⭐⭐

#### 17. Blur de Fundo (para Vertical)
**O que é:** Quando converte 16:9 → 9:16, usa o próprio vídeo borrado como fundo.
**FFmpeg:**
```
# Fundo borrado + vídeo original centralizado
[0:v]scale=1080:1920:force_original_aspect_ratio=increase,
crop=1080:1920,gblur=sigma=20[bg];
[0:v]scale=1080:-1:force_original_aspect_ratio=decrease[fg];
[bg][fg]overlay=(W-w)/2:(H-h)/2[out]
```
**Quando usar:** TODO clip vertical (muito melhor que crop centro).
**Dificuldade:** ⭐⭐⭐

#### 18. Color Grade / Mood Filter
**O que é:** Ajuste de cor pra criar mood (mais quente, mais frio, mais contrastado).
**FFmpeg:**
```
# Mais contrastado e saturado (hype)
eq=contrast=1.2:saturation=1.3:brightness=0.05

# Mais frio (tense)
colorbalance=bs=0.1:ms=0.05

# Vintage/quente
colortemperature=temperature=5500,eq=saturation=0.9
```
**Quando usar:** Variado por mood do clip.
**Dificuldade:** ⭐⭐

---

## PARTE 3: Matriz de Efeitos x Templates

| Efeito | reaction | split_h | grande_momento | resenha | stories | versus |
|---|---|---|---|---|---|---|
| Jump Cut | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Legendas ASS | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Logo Overlay | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Intro/Outro | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| BG Music | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Punch-In Zoom | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| Slow Zoom | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Flash | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| PiP | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Split Screen | ❌ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Crossfade | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Shake | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Speed Ramp | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Borda Temática | ❌ | ❌ | ❌ | ✅ | ❌ | ✅ |
| Waveform | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Blur Fundo | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Color Grade | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## PARTE 4: O que o Claude Deve Decidir por Clip

O prompt da IA deve retornar, além do que já temos, estes novos campos:

```json
{
  "duration_target": {
    "category": "short|medium|long",
    "min_seconds": 15,
    "max_seconds": 30,
    "platform_primary": "reels"
  },
  
  "effects": [
    {
      "type": "punch_in_zoom",
      "start": 1245.0,
      "end": 1247.0,
      "intensity": 1.1,
      "reason": "Clímax da reação ao gol"
    },
    {
      "type": "flash",
      "timestamp": 1250.0,
      "reason": "Transição para replay"
    },
    {
      "type": "speed_ramp",
      "start": 1251.0,
      "end": 1255.0,
      "speed": 0.5,
      "reason": "Slow-mo no replay do gol"
    }
  ],
  
  "color_mood": "hype",
  
  "vertical_strategy": "blur_background",
  
  "energy_curve": [
    {"time_pct": 0, "energy": 0.3},
    {"time_pct": 0.2, "energy": 0.5},
    {"time_pct": 0.7, "energy": 0.9},
    {"time_pct": 1.0, "energy": 1.0}
  ]
}
```

---

## PARTE 5: Prioridade de Implementação

### Sprint 1 (Já funciona ou fácil)
1. ✅ Jump cuts (silence removal)
2. ✅ Legendas ASS com highlight
3. ✅ Logo overlay
4. ✅ Intro/outro cards
5. ✅ BG music com ducking
6. 🆕 **Blur de fundo para vertical** (alto impacto, médio esforço)
7. 🆕 **Crossfade entre segmentos** (substitui concat seco)

### Sprint 2 (Médio esforço, alto impacto)
8. 🆕 **Punch-in zoom** no clímax
9. 🆕 **Flash branco** entre momentos
10. 🆕 **Color grade** por mood
11. 🆕 **Duração por categoria** (short/medium/long)

### Sprint 3 (Avançado)
12. 🆕 Split screen (para template split_horizontal)
13. 🆕 PiP (para vídeo secundário)
14. 🆕 Speed ramp
15. 🆕 Shake + borda temática (template resenha)
16. 🆕 Audio waveform (template grande_momento)
17. 🆕 Glitch transition