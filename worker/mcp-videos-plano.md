# Union Clips AI — Guia: MCP FFmpeg + Crew de Agentes no Claude Code

> Atualização do guia de agentes incorporando MCP servers para FFmpeg
> e a capacidade de Agent Teams do Claude Code.

---

## O que Muda com MCP FFmpeg

Antes: os agentes IA geravam um JSON com o plano de corte, e um script Python
separado interpretava esse JSON e executava os comandos FFmpeg.

Agora: os agentes no Claude Code podem **chamar o FFmpeg diretamente como tool**
via MCP. O Claude Code vira o editor de vídeo. Ele pensa, decide, e executa
— tudo numa sessão.

```
ANTES (pipeline separado):
  Claude API → JSON plano → Python script → subprocess FFmpeg → output

AGORA (com MCP):
  Claude Code → pensa o corte → chama tool trim_video() → chama tool
  add_overlay() → chama tool concatenate() → output pronto
```

Isso é poderoso porque o agente pode **iterar**. Se o corte ficou com 95s e o
alvo era 60s, ele pode re-trimmar. Se o audio ficou baixo, ele ajusta. Ele tem
feedback loop real — não é fire-and-forget.

---

## MCP Servers FFmpeg Disponíveis

Existem vários. Os 3 mais relevantes pro nosso caso:

### Opção 1: `video-audio-mcp` (misbahsy) — Recomendado para começar
- 14+ tools prontos (trim, concat, overlay, transitions, silence removal)
- Python, MIT license, compatível com Claude Code
- Tem B-roll insertion, crossfade, text overlay, watermark
- Instalação: `uv sync` e configurar no `.claude/settings.json`

Tools disponíveis:
```
trim_video          — Cortar vídeo por timestamp
convert_video       — Converter formato/codec
change_resolution   — Redimensionar
adjust_speed        — Speed ramp (slow-mo/fast)
add_text_overlay    — Texto sobre vídeo
add_image_overlay   — Logo/watermark
concatenate_videos  — Juntar clips com transição
add_crossfade       — Crossfade entre clips
add_fade_effect     — Fade in/out
insert_broll        — Inserir vídeo secundário em ponto específico
remove_silence      — Detectar e remover silêncio
extract_audio       — Extrair áudio
convert_audio       — Converter formato de áudio
adjust_audio        — Ajustar volume/bitrate
```

Config no Claude Code:
```json
{
  "mcpServers": {
    "VideoAudioServer": {
      "command": "uv",
      "args": [
        "--directory", "/path/to/video-audio-mcp",
        "run", "server.py"
      ]
    }
  }
}
```

### Opção 2: `ffmpeg-mcp` (dubnium0) — Mais completo
- 40+ tools organizados em módulos
- Módulos: probe, convert, video, audio, effects, subtitles, streaming, advanced
- Tem subtitle burning, effects (zoom, shake), streaming
- Mais complexo mas cobre mais cenários

Tools adicionais relevantes:
```
apply_video_filter  — Filtros genéricos (zoom, color grade, shake)
burn_subtitles      — Queimar legendas ASS/SRT no vídeo
get_media_info      — Analisar metadados do vídeo
create_hls_stream   — Gerar stream HLS
extract_frames      — Extrair frames para thumbnail
```

### Opção 3: MCP customizado do Union (futuro)
Criar um MCP server próprio que encapsula os templates do Union
(reaction, split_horizontal, grande_momento) como tools de alto nível.

Tool exemplo:
```
apply_union_template(
  video_path="/tmp/clip.mp4",
  template="grande_momento",
  logo_path="assets/union_logo.png",
  title="GOL DE PLACA",
  secondary_video="/tmp/gol.mp4"
)
```

Isso abstrai a complexidade do filtergraph do FFmpeg em tools semânticas.

---

## Como a Crew de Agentes Funciona no Claude Code

O Claude Code tem Agent Teams (experimental, habilitado com
`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). Isso permite múltiplas instâncias
do Claude Code trabalhando coordenadas — exatamente o modelo Orchestrator-Workers
do Cookbook.

Porém, para o Union Clips, a abordagem mais pragmática é usar
**Claude Code como orquestrador único** que assume diferentes papéis
sequencialmente, com o MCP FFmpeg como toolbox:

```
Claude Code (sessão única)
│
├── PAPEL: Diretor
│   Lê transcrição, identifica temas e arcos
│   Output: mapa temático (mantido em memória/arquivo)
│
├── PAPEL: Garimpeiro
│   Relê transcrição focando em momentos virais
│   Output: lista de momentos curtos
│
├── PAPEL: Cronista
│   Analisa temas conectados, propõe arcos narrativos
│   Output: sequências não-lineares com cold open
│
├── PAPEL: Produtor
│   Sintetiza tudo, gera plano final
│   Output: plano de corte priorizado
│
├── PAPEL: Crítico
│   Avalia cada clip contra critérios
│   Output: aprovação ou feedback
│
└── PAPEL: Editor (NOVO — executa via MCP FFmpeg)
    Para cada clip aprovado:
    ├── tool: trim_video() — cortar segmentos
    ├── tool: remove_silence() — jump cuts
    ├── tool: concatenate_videos() — juntar com crossfade
    ├── tool: add_image_overlay() — logo
    ├── tool: burn_subtitles() — legendas
    ├── tool: add_fade_effect() — intro/outro
    ├── tool: insert_broll() — vídeo secundário
    └── verificar resultado, ajustar se necessário
```

A alternativa com Agent Teams (quando estiver estável) seria:

```
Team Lead (Diretor)
├── Teammate 1: Garimpeiro (escaneia momentos virais)
├── Teammate 2: Cronista (monta arcos narrativos)
├── Teammate 3: Analista (extrai insights táticos)
└── Após convergência → Produtor → Crítico → Editor (MCP FFmpeg)
```

Teammates 1-3 trabalham em paralelo, cada um com acesso à transcrição,
e depositam seus outputs em tasks compartilhadas. O Lead sintetiza.

---

## O Fluxo Completo com MCP

### Pré-requisitos no ambiente Claude Code
```
Workspace:
├── .claude/
│   └── settings.json          ← Config MCP servers
├── CLAUDE.md                  ← Instruções do projeto
├── assets/
│   ├── union_logo.png
│   ├── fonts/Montserrat-Bold.ttf
│   └── audio/
│       ├── intro_sting.mp3
│       └── bg/
│           ├── hype.mp3
│           ├── tense.mp3
│           └── chill.mp3
├── transcripts/
│   └── live_2025_06_15.txt    ← Transcrição com timestamps
├── source_videos/
│   └── live_2025_06_15.mp4    ← Vídeo da live
├── secondary_videos/           ← Vídeos de gols, replays
│   ├── gol_veiga.mp4
│   └── lance_var.mp4
├── output/                     ← Clips finais
└── prompts/
    ├── director.md
    ├── miner.md
    ├── chronicler.md
    ├── producer.md
    └── critic.md
```

### O Prompt Master para Claude Code (CLAUDE.md)

Este é o arquivo que o Claude Code lê ao iniciar. Ele define todo o
comportamento da crew e como usar os MCP tools:

```markdown
# Union Clips AI — Sistema de Cortes Inteligentes

## Missão
Você é o sistema de produção de cortes do Union Football Live.
Seu objetivo é analisar transcrições de lives e produzir cortes
profissionais prontos para publicação nas redes sociais.

## Ferramentas Disponíveis (MCP)
Você tem acesso ao FFmpeg via MCP server "VideoAudioServer".
Use as tools para executar operações de vídeo diretamente.

## Workflow
Ao receber o comando "processar live", execute estas etapas:

### Etapa 1: Ingestão
- Ler o arquivo de transcrição indicado
- Ler os metadados da live (título, times, contexto)

### Etapa 2: Direção
Assuma o papel de DIRETOR. Analise a transcrição completa e gere:
- Mapa de temas com timestamps
- Conexões entre temas distantes
- Picos emocionais
- Arcos narrativos sugeridos (payoff, contraste, evolução)
Salve em `output/01_live_map.json`

### Etapa 3: Análise Paralela
Para cada dimensão, assuma o papel correspondente:

GARIMPEIRO: Releia a transcrição buscando micro-momentos virais
(15-30s). Foque em reações explosivas, piadas, frases de efeito.
Salve em `output/02_viral_moments.json`

CRONISTA: Com base no mapa do Diretor, construa arcos narrativos
que conectam momentos distantes da live. Use cold open quando
o payoff for forte. Salve em `output/02_narrative_arcs.json`

ANALISTA: Identifique momentos de análise tática profunda que
demonstram conhecimento. Salve em `output/02_tactical_clips.json`

### Etapa 4: Produção
Assuma o papel de PRODUTOR. Leia todos os outputs das etapas anteriores e:
- Desduplique (mesmo trecho sugerido por múltiplos agentes)
- Priorize por potencial de impacto
- Balanceie o mix (shorts + médios + longos)
- Para cada clip, especifique: template, efeitos, música, legendas
- Salve em `output/03_production_plan.json`

### Etapa 5: Avaliação
Assuma o papel de CRÍTICO. Para cada clip do plano:
- Avalie gancho (3s iniciais), storytelling, produção, viralidade
- Score de 1-10
- Se score < 7: gere feedback e peça ao Produtor para refinar
- Máximo 2 iterações de refinamento
- Salve em `output/04_evaluation.json`

### Etapa 6: Execução (MCP FFmpeg)
Para cada clip aprovado pelo Crítico:

1. CORTAR segmentos do vídeo fonte:
   → Use trim_video() para cada segment
   
2. REMOVER silêncios (jump cuts):
   → Use remove_silence() com threshold adequado
   
3. CONCATENAR segmentos:
   → Use concatenate_videos() com crossfade de 0.15s
   
4. APLICAR logo:
   → Use add_image_overlay() com union_logo.png no canto superior direito
   
5. QUEIMAR legendas:
   → Gere arquivo .srt a partir dos subtitles do plano
   → Use burn_subtitles()
   
6. ADICIONAR intro/outro:
   → Use add_fade_effect() para criar cards
   → Use concatenate_videos() para juntar intro + clip + outro
   
7. MIXAR música de fundo:
   → Selecione música pelo mood do clip
   → Use ferramentas de áudio para mix com ducking
   
8. GERAR versão vertical (se aplicável):
   → Use change_resolution() para 1080x1920
   
9. VERIFICAR resultado:
   → Use get_media_info() para confirmar duração e qualidade
   → Se duração fora da faixa alvo, re-trimmar

Salvar clips finais em `output/clips/`

### Etapa 7: Relatório
Gere um resumo em `output/05_report.md` com:
- Quantos clips gerados
- Duração total
- Breakdown por categoria (viral/narrativo/análise)
- Legendas sugeridas para cada rede social
- Custo estimado da sessão (tokens usados)

## Regras de Duração
- SHORT (viral): 15-30s → Reels, TikTok, Shorts
- MEDIUM (narrativa): 30-60s → TikTok, Reels
- LONG (storytelling): 60-120s → TikTok, YouTube

## Templates
- reaction: corte simples com logo e legendas
- split_horizontal: comentário em cima, lance embaixo
- grande_momento: estilo TV Cultura com banner
- resenha: zoom progressivo + moldura vermelha

## Identidade Union Football
- Tom: descontraído + técnico
- Humor: ácido sobre arbitragem e VAR
- Autenticidade: manter reações genuínas
- Mascote: Bolinha (mencionar em overlays quando relevante)
```

---

## O que Ganhamos com MCP vs Script Python

| Aspecto | Script Python (antes) | MCP no Claude Code (agora) |
|---|---|---|
| Iteração | Fire-and-forget | Loop: executa → verifica → ajusta |
| Feedback | Nenhum até o final | Cada tool retorna resultado |
| Flexibilidade | Template fixo no código | Agente decide a melhor abordagem |
| Debug | Logs de subprocess | Claude explica cada decisão |
| Novos efeitos | Precisa codar novo filtergraph | Claude descobre sozinho combinando tools |
| Custo dev | Alto (Python + FFmpeg expertise) | Baixo (prompt engineering) |
| Reprodutibilidade | Alta (determinístico) | Média (pode variar entre runs) |

O ponto mais importante: **Claude + MCP pode descobrir combinações criativas
de efeitos que você não programou**. Se o agente tem acesso a trim, zoom, speed,
overlay, e crossfade como tools, ele pode inventar um efeito composto
(ex: slow-mo + zoom + flash) que não estava no template original.

---

## Limitações e Mitigações

### 1. MCP servers existentes não cobrem tudo
Os MCP servers genéricos não têm: sidechain compression pra ducking de música,
ASS subtitle com highlight de palavras, nem templates compostos como
`grande_momento`. Para funcionalidades específicas do Union, há duas opções:

**Opção A: Estender um MCP existente** — fork do `video-audio-mcp` e adicionar
tools customizadas (ex: `apply_union_intro`, `burn_ass_subtitles`,
`mix_with_ducking`). É Python, relativamente simples.

**Opção B: MCP próprio do Union** — criar um `union-clips-mcp` focado nos
templates e efeitos específicos. Mais trabalho inicial, mas resultado
mais limpo.

Recomendação: começar com Opção A (fork), migrar pra B quando estabilizar.

### 2. Agent Teams ainda é experimental
O sistema de teammates do Claude Code tem limitações conhecidas (sem resumption
de sessão, sem teams aninhados). Para o MVP, usar o modelo de papéis
sequenciais na mesma sessão é mais confiável. Migrar pra teams quando
amadurecer.

### 3. Contexto longo de transcrição
Uma live de 2h gera ~55k tokens de transcrição. O Claude Code suporta isso
no contexto, mas pode ficar lento. Estratégia: o Diretor processa a
transcrição completa, mas os Workers recebem apenas os trechos relevantes
(conforme delegação do Diretor). Isso reduz tokens por agente.

### 4. Reprodutibilidade
Scripts Python são determinísticos — mesmo input, mesmo output. Agentes IA
não. Para mitigar: salvar todos os JSONs intermediários (mapa, planos, avaliações)
e o plano final. Se um clip precisar ser re-renderizado, usar o plano salvo
em vez de re-analisar.

---

## Plano de Implementação com MCP

### Sprint 1 — Setup MCP + Primeiro Corte
1. Instalar `video-audio-mcp` no ambiente Claude Code
2. Configurar no `.claude/settings.json`
3. Testar tools básicos: trim, concat, overlay
4. Processar 1 clip manualmente via Claude Code (sem crew, apenas comandos diretos)
5. Validar qualidade do output

### Sprint 2 — CLAUDE.md com Workflow Básico
1. Escrever CLAUDE.md com workflow de Diretor → Produtor → Editor
2. Testar com uma live real completa
3. Validar: mapa temático faz sentido? Clips gerados são bons?
4. Iterar no prompt até qualidade satisfatória

### Sprint 3 — Crew Completa
1. Adicionar papéis de Garimpeiro, Cronista, Analista
2. Adicionar Crítico com loop de avaliação
3. Testar arcos narrativos (payoff, contraste)
4. Adicionar cards de texto como ponte narrativa ("2 horas depois...")

### Sprint 4 — MCP Customizado
1. Fork do video-audio-mcp
2. Adicionar tools: ASS subtitles, ducking, union_intro, union_outro
3. Adicionar tools de template: apply_reaction, apply_split_horizontal
4. Testar templates compostos

### Sprint 5 — Integração com UI
1. Conectar output dos clips ao Review Board (frontend existente)
2. Supabase: salvar planos, avaliações, clips finais
3. Dashboard mostra clips com scores do Crítico
4. Guru aprova/edita antes de publicar

---

## Resumo: A Stack Final

```
┌────────────────────────────────────────────────────────┐
│                    CLAUDE CODE                          │
│                                                        │
│  CLAUDE.md (workflow completo da crew)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐               │
│  │ Diretor  │→│ Workers  │→│ Produtor │               │
│  └──────────┘ │Garimpeiro│ └────┬─────┘               │
│               │Cronista  │      │                      │
│               │Analista  │      ▼                      │
│               └──────────┘ ┌──────────┐               │
│                            │ Crítico  │               │
│                            └────┬─────┘               │
│                                 │ aprovado             │
│                                 ▼                      │
│  MCP FFmpeg ◄──────────── Editor (executa cortes)      │
│  ┌─────────────────────────────────────┐               │
│  │ trim | concat | overlay | subtitle  │               │
│  │ fade | speed | silence | b-roll     │               │
│  └─────────────────────────────────────┘               │
│                                                        │
│  Outputs: clips finais em output/clips/                │
└────────────────────────────────┬───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │      SUPABASE           │
                    │  clip_insights          │
                    │  produced_clips         │
                    │  Storage (clips finais) │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   REVIEW BOARD (React)  │
                    │   unionfc.live/clipes   │
                    │   Guru aprova/publica   │
                    └─────────────────────────┘
```

Custo total estimado por live de 2h:
- Claude API (crew de agentes): ~R$ 3-5
- FFmpeg (local): R$ 0
- Whisper (local com GPU): R$ 0
- Infra (seu PC): R$ 0
- **Total: ~R$ 3-5 por live processada**