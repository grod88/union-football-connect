# Union Clips AI — Guia Estratégico: Crew de Agentes IA para Cortes Inteligentes

> Documento de referência para implementação de um sistema multi-agente
> baseado nos padrões do Anthropic Cookbook (Orchestrator-Workers,
> Evaluator-Optimizer, Prompt Chaining) aplicados à produção de cortes
> do Union Football Live.

---

## O Problema que Estamos Resolvendo

Hoje os cortes do Union são feitos de forma linear: uma live vira N pedaços isolados, cada um
sobre um assunto. Mas as melhores lives contam histórias que atravessam o programa inteiro.

Exemplo real: no começo da live você disse "o Palmeiras vai ganhar hoje, podem anotar". No final,
o Palmeiras ganhou e você comemorou. Nenhum sistema de corte simples conecta esses dois
momentos — porque eles estão separados por 1h30 de transmissão. Mas um editor humano faria
isso naturalmente: "olha o que ele falou no começo... e olha o que aconteceu no final".

Outro exemplo: a live cobriu a demissão do Crespo e a contratação do Roger Machado. Hoje
isso vira dois cortes separados. Mas o melhor corte seria um arco narrativo: "saiu o Crespo...
e quem chega? Roger Machado" — com contexto, reação e opinião num único vídeo.

O sistema de agentes existe para fazer o que um editor sênior faria: entender a live inteira,
identificar conexões narrativas, e propor cortes que contam histórias — não apenas recortam trechos.

---

## Fundação Teórica: Padrões do Anthropic Cookbook

O Anthropic Cookbook documenta 6 padrões composáveis para sistemas de IA. Para o Union Clips,
combinamos 4 deles:

### Padrão 1: Prompt Chaining (Encadeamento)
Decompor uma tarefa em etapas sequenciais onde o output de uma alimenta a próxima.
No nosso caso: Transcrição → Mapa Temático → Seleção de Arcos → Plano de Corte.

### Padrão 2: Orchestrator-Workers (Orquestrador e Trabalhadores)
Um agente central analisa a tarefa e delega subtarefas a agentes especializados
que trabalham em paralelo. No nosso caso: o Diretor delega análise temática,
detecção de arcos narrativos e planejamento de produção a agentes especializados.

### Padrão 3: Evaluator-Optimizer (Avaliador-Otimizador)
Um agente gera uma proposta, outro avalia contra critérios claros, e o ciclo
repete até atingir qualidade. No nosso caso: o Produtor gera um plano de corte,
o Crítico avalia se tem gancho, storytelling e potencial viral, e refina.

### Padrão 4: Parallelization (Paralelização)
Executar múltiplas análises simultaneamente e sintetizar resultados.
No nosso caso: analisar a mesma transcrição sob diferentes lentes (humor, tática,
polêmica, narrativa) ao mesmo tempo.

---

## A Crew: 6 Agentes Especializados

Cada agente é uma chamada à Claude API com system prompt especializado.
Não são processos separados — são papéis que o Claude assume em diferentes
etapas do pipeline.

```
                    ┌─────────────────┐
                    │   DIRETOR       │  Orquestrador
                    │   (Lead Agent)  │  Decide a estratégia
                    └───────┬─────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
    ┌───────▼──────┐ ┌─────▼──────┐ ┌──────▼──────┐
    │  CRONISTA    │ │ ANALISTA   │ │ GARIMPEIRO  │  Workers
    │  (Narrativa) │ │ (Tática)   │ │ (Viral)     │  (Paralelos)
    └───────┬──────┘ └─────┬──────┘ └──────┬──────┘
            │               │               │
            └───────────────┼───────────────┘
                            │
                    ┌───────▼─────────┐
                    │   PRODUTOR      │  Sintetizador
                    │   (Plano final) │  Monta o corte
                    └───────┬─────────┘
                            │
                    ┌───────▼─────────┐
                    │   CRÍTICO       │  Evaluator
                    │   (Qualidade)   │  Aprova ou devolve
                    └─────────────────┘
```

---

### Agente 1: DIRETOR (Orquestrador)

**Papel:** O editor-chefe. Recebe a transcrição completa, entende o panorama geral
da live, e decide a estratégia de cortes antes de delegar.

**Modelo recomendado:** Sonnet (precisa de raciocínio estratégico + contexto longo)

**Input:**
- Transcrição completa com timestamps
- Metadados da live (título, times, rodada, contexto)
- Histórico de cortes anteriores que performaram bem (opcional)

**Output esperado (Mapa da Live):**
```
{
  "live_summary": "Live sobre a rodada 20: Palmeiras 3x1 Santos...",
  "duration_minutes": 120,
  "themes": [
    {
      "id": "theme_crespo",
      "label": "Demissão do Crespo",
      "time_ranges": [
        {"start": 300, "end": 480, "context": "Primeira menção"},
        {"start": 2100, "end": 2400, "context": "Análise aprofundada"},
        {"start": 5400, "end": 5520, "context": "Referência final"}
      ],
      "sentiment_arc": "surpresa → análise → conclusão",
      "connects_to": ["theme_roger"]
    },
    {
      "id": "theme_roger",
      "label": "Contratação Roger Machado",
      "time_ranges": [...],
      "connects_to": ["theme_crespo"]
    },
    {
      "id": "theme_prediction",
      "label": "Previsão do resultado",
      "time_ranges": [
        {"start": 120, "end": 180, "context": "Guru prevê vitória"},
        {"start": 6800, "end": 6900, "context": "Guru comemora acerto"}
      ],
      "sentiment_arc": "confiança → validação",
      "connects_to": [],
      "narrative_type": "payoff_arc"
    }
  ],
  "emotional_peaks": [
    {"timestamp": 3200, "type": "explosion", "reason": "Reação ao gol"},
    {"timestamp": 4800, "type": "outrage", "reason": "Lance polêmico do VAR"}
  ],
  "suggested_arcs": [
    {
      "type": "payoff",
      "description": "Previsão no início + comemoração no final",
      "themes": ["theme_prediction"],
      "estimated_duration": "45s"
    },
    {
      "type": "narrative",
      "description": "Saída do Crespo → Chegada do Roger (arco completo)",
      "themes": ["theme_crespo", "theme_roger"],
      "estimated_duration": "90s"
    }
  ],
  "delegation": {
    "cronista": ["theme_prediction", "theme_crespo+roger"],
    "analista": ["theme_tatica_palmeiras"],
    "garimpeiro": ["emotional_peaks", "momentos_humor"]
  }
}
```

**Responsabilidade chave:** O Diretor é o único agente que vê a live inteira.
Ele cria o mapa temático com conexões entre assuntos distantes, identifica
arcos narrativos que atravessam a transmissão, e decide o que delegar para quem.

---

### Agente 2: CRONISTA (Especialista em Narrativa)

**Papel:** O contador de histórias. Recebe temas conectados do Diretor e constrói
arcos narrativos com começo, meio e fim — mesmo que os trechos estejam espalhados
pela live.

**Modelo recomendado:** Sonnet (storytelling criativo)

**Input:**
- Trechos específicos da transcrição (só os relevantes ao arco)
- Mapa temático do Diretor
- Tipo de arco solicitado (payoff, narrativo, evolução)

**Output esperado (Proposta de Arco Narrativo):**
```
{
  "arc_id": "arc_prediction",
  "arc_type": "payoff",
  "title": "EU AVISEI! Guru crava resultado e comemora",
  "hook": "No começo da live eu falei: 'anota aí, Palmeiras ganha hoje'...",
  
  "segments": [
    {
      "order": 1,
      "role": "setup",
      "source_range": {"start": 120, "end": 155},
      "description": "Guru faz a previsão com confiança",
      "key_quote": "Pode anotar aí: Palmeiras ganha hoje, 2 a 1",
      "editing_note": "Manter a confiança na voz, cortar pausas"
    },
    {
      "order": 2,
      "role": "bridge",
      "type": "text_card",
      "text": "2 HORAS DEPOIS...",
      "duration": 1.5,
      "editing_note": "Card de texto com música de suspense"
    },
    {
      "order": 3,
      "role": "payoff",
      "source_range": {"start": 6800, "end": 6870},
      "description": "Guru comemora o acerto",
      "key_quote": "EU FALEI! EU FALEI NO COMEÇO!",
      "editing_note": "Começar com a explosão, punch-in zoom"
    }
  ],
  
  "cold_open": {
    "use": true,
    "start_from_segment": 3,
    "then_rewind_to": 1,
    "rewind_text": "Voltando ao começo da live..."
  },
  
  "narrative_devices": [
    "Cold open com a comemoração",
    "Flashback para a previsão",
    "Card de tempo para criar expectativa",
    "Retorno ao momento de êxtase"
  ],
  
  "estimated_duration_seconds": 50,
  "duration_category": "medium"
}
```

**Capacidade exclusiva:** O Cronista faz o que nenhum corte automático faz — ele
monta sequências não-lineares. Pode começar pelo final (cold open), voltar ao
começo, usar cards de texto como ponte narrativa ("2 horas depois..."), e criar
a sensação de história completa a partir de trechos distantes.

---

### Agente 3: ANALISTA (Especialista Tático)

**Papel:** O comentarista esportivo. Foca em momentos de análise técnica,
dados estatísticos, e insights táticos que demonstram profundidade de conhecimento.

**Modelo recomendado:** Haiku (análise objetiva, custo baixo)

**Input:**
- Trechos da transcrição marcados como "análise" pelo Diretor
- Dados do jogo (placar, posse, xG) se disponíveis

**Output esperado:**
```
{
  "clips": [
    {
      "type": "tactical_insight",
      "title": "A linha de 3 do Abel destruiu o Santos",
      "segments": [{"start": 2500, "end": 2580}],
      "talking_points": [
        "Formação 3-5-2 do Palmeiras",
        "Superioridade numérica no meio"
      ],
      "data_overlays": [
        {"text": "Posse: 65% Palmeiras", "timestamp": 2520},
        {"text": "xG: 2.1 x 0.8", "timestamp": 2550}
      ],
      "suggested_template": "analise_tatica",
      "duration_category": "medium"
    }
  ]
}
```

---

### Agente 4: GARIMPEIRO (Caçador de Momentos Virais)

**Papel:** O produtor de TikTok. Vasculha a transcrição procurando micro-momentos
que viralizam: reações explosivas, piadas espontâneas, frases de efeito,
absurdos da arbitragem.

**Modelo recomendado:** Haiku (rápido, barato, ideal para scanning)

**Input:**
- Transcrição completa (ou chunks de 30 min)
- Picos emocionais identificados pelo Diretor

**Output esperado:**
```
{
  "viral_moments": [
    {
      "type": "reaction",
      "title": "A CARA DO GURU QUANDO O VAR ANULOU",
      "segment": {"start": 4800, "end": 4830},
      "viral_score": 9,
      "why_viral": "Reação genuína e relatable — todo torcedor já sentiu isso",
      "suggested_format": "short",
      "loop_friendly": true,
      "suggested_template": "reaction",
      "effects": ["punch_in_zoom", "shake"]
    },
    {
      "type": "humor",
      "title": "Guru xinga o bandeirinha ao vivo",
      "segment": {"start": 3600, "end": 3625},
      "viral_score": 8,
      "why_viral": "Autenticidade + humor involuntário",
      "loop_friendly": true
    }
  ]
}
```

**Capacidade exclusiva:** O Garimpeiro pensa em termos de plataforma. Ele sabe que
um clip de 15 segundos com reação explosiva pode ter mais alcance que uma análise
de 90 segundos. Ele marca momentos "loop-friendly" (que funcionam em replay
automático) e prioriza por viral_score.

---

### Agente 5: PRODUTOR (Sintetizador)

**Papel:** O editor final. Recebe todos os outputs dos Workers, prioriza,
resolve conflitos (dois agentes sugeriram o mesmo trecho), e gera o plano
de corte definitivo com especificações técnicas para o FFmpeg.

**Modelo recomendado:** Sonnet (síntese complexa + decisões de produção)

**Input:**
- Mapa da live (do Diretor)
- Arcos narrativos (do Cronista)
- Clips de análise (do Analista)
- Momentos virais (do Garimpeiro)
- Catálogo de templates disponíveis
- Catálogo de efeitos disponíveis
- Regras de duração por plataforma

**Responsabilidades:**
1. Desduplicar (se dois agentes pegaram o mesmo trecho, escolher a melhor abordagem)
2. Priorizar (ordenar por potencial de impacto)
3. Balancear (mix de shorts virais + médios narrativos + longos analíticos)
4. Especificar (template, efeitos, transições, legendas, música)
5. Gerar o plano de corte final com JSON completo para o FFmpeg

**Output esperado (Plano de Corte Final):**
```
{
  "production_plan": {
    "total_clips": 8,
    "breakdown": {
      "short_viral": 3,
      "medium_narrative": 3,
      "long_storytelling": 2
    },
    "estimated_total_duration": "7min 30s",
    "estimated_cost_claude_brl": 4.50
  },
  
  "clips": [
    {
      "id": "clip_01",
      "origin_agent": "cronista",
      "arc_id": "arc_prediction",
      "title": "EU AVISEI! Guru crava resultado",
      "category": "storytelling",
      "priority": 1,
      "duration_target": {"category": "medium", "seconds": 50},
      
      "segments": [
        {"start": 6800, "end": 6840, "role": "cold_open"},
        {"type": "text_card", "text": "VOLTANDO AO COMEÇO DA LIVE..."},
        {"start": 120, "end": 155, "role": "setup"},
        {"type": "text_card", "text": "2 HORAS DEPOIS..."},
        {"start": 6840, "end": 6870, "role": "payoff"}
      ],
      
      "silence_cuts": [...],
      "subtitles": [...],
      
      "template": "reaction",
      "effects": [
        {"type": "punch_in_zoom", "at": 6810, "intensity": 1.12},
        {"type": "flash", "at": 155, "reason": "Transição para card de tempo"}
      ],
      
      "production": {
        "intro_title": "EU AVISEI! 🔮",
        "bg_music_mood": "epic",
        "color_mood": "hype",
        "vertical_strategy": "blur_background"
      },
      
      "social": {
        "caption_reels": "Eu falei no começo da live... anotem aí 🔮⚽",
        "hashtags": ["#UnionFootball", "#Palmeiras", "#Acertei"]
      }
    }
  ]
}
```

---

### Agente 6: CRÍTICO (Avaliador)

**Papel:** O controle de qualidade. Avalia cada clip proposto contra critérios
claros e devolve feedback quando não atinge o padrão. Este é o loop do
Evaluator-Optimizer do Cookbook.

**Modelo recomendado:** Haiku (avaliação rápida, critérios objetivos)

**Input:**
- Plano de corte do Produtor
- Critérios de qualidade (checklist abaixo)

**Critérios de Avaliação:**
```
GANCHO (peso 3x):
□ Os primeiros 3 segundos prendem atenção?
□ Funciona sem contexto prévio? (viewer não viu a live)
□ Tem uma frase ou momento que faz parar o scroll?

STORYTELLING (peso 2x):
□ Tem começo, meio e fim?
□ O viewer entende o que está acontecendo?
□ Tem payoff emocional (riso, surpresa, concordância)?

PRODUÇÃO (peso 1x):
□ Duração está na faixa ideal para a plataforma alvo?
□ Template escolhido faz sentido para o conteúdo?
□ Efeitos complementam sem distrair?

VIRALIDADE (peso 2x):
□ É compartilhável? (alguém marcaria um amigo?)
□ Funciona em loop? (replay automático)
□ A legenda de rede social é boa?

IDENTIDADE UNION (peso 1x):
□ Reflete o tom do programa?
□ Tem a personalidade do Guru/apresentadores?
□ Diferencia-se de cortes genéricos de futebol?
```

**Output esperado:**
```
{
  "clip_id": "clip_01",
  "verdict": "APPROVED",  // APPROVED | NEEDS_WORK | REJECT
  "score": 8.5,
  "scores": {
    "gancho": 9,
    "storytelling": 9,
    "producao": 7,
    "viralidade": 8,
    "identidade": 9
  },
  "feedback": null
}
```

**Quando retorna NEEDS_WORK:**
```
{
  "clip_id": "clip_03",
  "verdict": "NEEDS_WORK",
  "score": 5.5,
  "feedback": {
    "issues": [
      "O gancho é fraco — começa com contexto ao invés de impacto",
      "Duração de 95s é longa demais para 'reaction' no Reels"
    ],
    "suggestions": [
      "Inverter: começar pela frase de efeito, depois contexto",
      "Cortar o setup de 20s para 8s — manter só a frase essencial",
      "Reduzir para ~45s para ficar no sweet spot do Reels"
    ],
    "send_back_to": "produtor"
  }
}
```

**Loop de refinamento:** Quando o Crítico devolve NEEDS_WORK, o Produtor recebe
o feedback e regenera o plano daquele clip específico. O ciclo repete no máximo
2 vezes (para controlar custo). Se após 2 iterações ainda não passar, vai para
o Review Board humano com flag "IA não chegou em consenso — sua decisão".

---

## O Pipeline Completo: Passo a Passo

```
ETAPA 1: INGESTÃO (automática, sem IA)
│
│  YouTube URL → yt-dlp download → FFmpeg extrai áudio
│  → faster-whisper transcreve com timestamps
│
│  Output: transcrição completa com timestamps
│
▼
ETAPA 2: DIREÇÃO (1 chamada API — Sonnet)
│
│  Transcrição + metadados → DIRETOR
│  → Mapa temático da live
│  → Conexões entre temas distantes
│  → Arcos narrativos sugeridos
│  → Delegação para workers
│
│  Output: mapa da live + instruções de delegação
│
▼
ETAPA 3: ANÁLISE PARALELA (3 chamadas API — simultâneas)
│
│  ┌──────────────────────────────────────────────────┐
│  │                                                  │
│  │  CRONISTA ←── trechos de arcos narrativos        │
│  │  ANALISTA ←── trechos de análise tática          │
│  │  GARIMPEIRO ←── picos emocionais + transcrição   │
│  │                                                  │
│  │  (3 chamadas Haiku/Sonnet em paralelo)           │
│  └──────────────────────────────────────────────────┘
│
│  Output: arcos narrativos + clips análise + momentos virais
│
▼
ETAPA 4: PRODUÇÃO (1 chamada API — Sonnet)
│
│  Todos os outputs → PRODUTOR
│  → Desduplicação
│  → Priorização
│  → Plano de corte com specs técnicas
│
│  Output: plano de corte final (JSON)
│
▼
ETAPA 5: AVALIAÇÃO (N chamadas API — Haiku)
│
│  Cada clip → CRÍTICO
│  → Score + feedback
│  → APPROVED → segue para Review Board
│  → NEEDS_WORK → volta para PRODUTOR (max 2x)
│  → REJECT → descartado
│
│  Output: plano de corte refinado
│
▼
ETAPA 6: REVIEW BOARD (humano — Guru)
│
│  Dashboard mostra:
│  → Clips aprovados pela IA com scores
│  → Clips com flag "IA não chegou em consenso"
│  → Para cada clip: preview, template, efeitos
│  → Guru aprova, edita ou descarta
│
▼
ETAPA 7: RENDER (automático — FFmpeg)
│
│  Clips aprovados → FFmpeg com template + efeitos
│  → Upload para Supabase Storage
│  → Notificação "clips prontos"
```

---

## Tipos de Corte que Só um Sistema Multi-Agente Consegue

### 1. Corte Payoff (Previsão + Resultado)
O Diretor identifica que no minuto 2 o apresentador fez uma previsão e no minuto
110 ela se confirmou. O Cronista monta o arco com cold open na comemoração,
flashback na previsão, e card "2 horas depois..." como ponte.

### 2. Corte Arco Narrativo (Tema que Evolui)
A demissão do Crespo é mencionada em 3 momentos da live: notícia, análise e conclusão.
Em vez de 3 clips separados, o Cronista combina numa narrativa única de 90 segundos
com a evolução do pensamento.

### 3. Corte Contraste (Antes x Depois)
O Analista identifica que o apresentador mudou de opinião durante a live.
"Antes do gol eu achava X, agora acho Y." Split-screen ou montagem sequencial
mostrando a mudança.

### 4. Corte Compilação (Melhores Momentos)
O Garimpeiro acha 5-6 reações curtas (5-8s cada) que isoladas são fracas mas
juntas formam um "best of" da live. O Produtor monta com crossfades e música
crescente.

### 5. Corte Quadro (Grande Momento / Pré-Jogo)
O Cronista recebe a instrução "montar quadro pré-clássico" e puxa trechos de
lives anteriores onde os apresentadores falaram sobre o confronto. Combina com
dados e card de data do jogo. Isso requer acesso ao histórico de transcrições.

### 6. Corte Reação Pura (15s Viral)
O Garimpeiro encontra um momento de 15 segundos perfeito para loop.
Não precisa de narrativa, não precisa de contexto. É puro impacto.
Punch-in zoom, legenda grande, loop-friendly.

---

## Gestão de Custo: Quanto Custa a Crew por Live

Uma live de 2 horas gera ~40.000 palavras de transcrição (~55k tokens de input).

| Agente | Modelo | Input tokens | Output tokens | Custo estimado |
|---|---|---|---|---|
| Diretor | Sonnet | ~60k | ~3k | ~R$ 1.20 |
| Cronista | Sonnet | ~15k | ~3k | ~R$ 0.40 |
| Analista | Haiku | ~15k | ~2k | ~R$ 0.08 |
| Garimpeiro | Haiku | ~60k | ~2k | ~R$ 0.20 |
| Produtor | Sonnet | ~20k | ~5k | ~R$ 0.60 |
| Crítico (x8 clips x 1.5 avg) | Haiku | ~3k x 12 | ~1k x 12 | ~R$ 0.15 |
| Refinamentos (est. 3) | Sonnet | ~5k x 3 | ~3k x 3 | ~R$ 0.30 |
| **TOTAL** | | | | **~R$ 3.00** |

Com Whisper local (grátis) e FFmpeg local (grátis), o custo total de processar
uma live de 2h é aproximadamente R$ 3 em API Claude. Para 12 lives/mês = R$ 36/mês.

---

## Estratégia de Contexto: Como os Agentes se Comunicam

Os agentes não conversam entre si diretamente. Eles se comunicam através de
artefatos estruturados (JSON) armazenados no Supabase.

```
Supabase Tables:

clip_sessions        → 1 por live processada
clip_live_maps       → Output do Diretor (mapa temático)
clip_worker_outputs  → Output de cada Worker (1 row por agente)
clip_production_plan → Output do Produtor (plano final)
clip_evaluations     → Output do Crítico (scores + feedback)
clip_insights        → Plano final aprovado (para Review Board)
```

O pipeline é orquestrado por código Python (não por IA). O Python chama cada
agente na ordem certa, passa o input adequado, e salva o output no Supabase.
Os agentes não "sabem" uns dos outros — o código faz a cola.

Isso é intencional. O artigo do Anthropic "Building Effective Agents" recomenda:
"Manter simplicidade no design do agente" e "usar código determinístico para
orquestração, IA para decisões". O Python decide a ordem e o que passa para quem;
o Claude decide o conteúdo.

---

## Evolução: O Flywheel de Melhoria

### Fase 1 — Baseline
Sistema funciona, gera cortes. Guru revisa e publica.

### Fase 2 — Feedback Loop
Após publicar, Guru marca no dashboard quais clips performaram melhor.
O sistema armazena: "clip X teve 1.2k views, clip Y teve 200 views".

### Fase 3 — Aprendizado
O Diretor recebe no prompt: "Historicamente, cortes do tipo 'payoff' com
cold open têm 3x mais views que cortes cronológicos. Cortes abaixo de 30s
performam 2x melhor no Reels."

### Fase 4 — Refinamento Automático
O Crítico incorpora métricas reais nos critérios de avaliação.
"Cortes com viral_score acima de 8 historicamente obtiveram views acima
da média. Priorizar padrões similares."

Isso cria um ciclo virtuoso: quanto mais lives processadas, melhores os cortes.

---

## Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Custo escala com lives longas (3h+) | Diretor faz triagem em chunks de 30min primeiro |
| Agentes geram cortes redundantes | Produtor tem regra explícita de desduplicação |
| Qualidade varia entre lives | Crítico mantém barra mínima consistente |
| Cold open fica forçado/artificial | Cronista tem instrução "só usar se realmente impactante" |
| Arcos narrativos longos demais | Produtor tem limites rígidos de duração por categoria |
| IA "inventa" contexto que não existe | Todos os agentes trabalham APENAS com transcrição real |
| Perda de identidade do Union | Crítico avalia "identidade Union" como critério |

---

## Implementação Sugerida: Ordem de Prioridade

### Sprint 1 — Pipeline Simples (sem crew completa)
Usar apenas 1 agente (como hoje) mas com o prompt atualizado que inclui:
- Detecção de temas recorrentes
- Campo "connects_to" para temas relacionados
- Campo "cold_open" para sugerir início alternativo
- Categorias de duração (short/medium/long)

Isso já melhora significativamente os cortes sem a complexidade multi-agente.

### Sprint 2 — Diretor + Garimpeiro
Adicionar o Diretor como primeira etapa (mapa temático) e o Garimpeiro para
momentos virais curtos. O Diretor passa os temas para o agente existente
(que vira o "Produtor simplificado").

### Sprint 3 — Crew Completa
Adicionar Cronista (arcos narrativos), Analista (tática), e Crítico (avaliação).
Implementar o loop Evaluator-Optimizer com máximo 2 iterações.

### Sprint 4 — Feedback Loop
Integrar métricas de redes sociais para fechar o ciclo de melhoria contínua.

---

## Princípios do Anthropic que Guiam Este Design

1. **"Start with simple prompts, add complexity only when it demonstrably improves outcomes."**
   Por isso o Sprint 1 é um agente só melhorado. A crew completa vem quando validarmos
   que o mapa temático do Diretor realmente melhora os cortes.

2. **"Maintain simplicity in your agent's design."**
   Cada agente faz UMA coisa. O Cronista conta histórias. O Garimpeiro acha virais.
   Nenhum agente tenta fazer tudo.

3. **"Use LLM APIs directly: many patterns can be implemented in a few lines of code."**
   Sem frameworks. Chamadas diretas à API Claude com prompts bem definidos.
   Python simples faz a orquestração.

4. **"The best prompts for multi-agent systems are frameworks for collaboration."**
   Os prompts definem a divisão de trabalho e o formato de output, não instruções
   procedurais. Cada agente sabe o que produzir e em que formato.

5. **"Multi-agent systems have emergent behaviors."**
   O Cronista pode descobrir arcos narrativos que o Diretor não previu.
   O Garimpeiro pode achar um momento viral no meio de um trecho "de análise".
   Isso é feature, não bug — o Produtor sintetiza tudo.