# Union Clips AI — Plano de Evolução v4

> Baseado na análise do output real: São Paulo x Chapecoense (14/03/2026)
> 412k tokens | 8 temas | 27 clips workers | 10 finais | score médio 7.3

---

## PARTE 1: Diagnóstico do Output Atual

### O que funcionou bem
- O Diretor identificou 8 temas coerentes com sentimentos corretos
- Picos emocionais bem marcados (gols, defesa, comédia, raiva)
- Os 3 arcos narrativos são criativos ("Machado e a Árvore", "Nunca Critiquei", "De Crise à Liderança")
- O Crítico rejeitou corretamente o clip fraco (5.0/10)
- Cold open do "De Crise à Liderança" foi o melhor corte

### Problemas identificados

**1. GARIMPEIRO RODOU 3 VEZES — gerou redundância massiva**
O relatório mostra 3 blocos de Garimpeiro (4+4+5 clips = 13 clips) com os mesmos momentos
repetidos. "Árvore e Machado" aparece 3 vezes. "Nunca Critiquei" aparece 3 vezes.
Isso custou ~164k tokens extras sem valor.

**Causa:** O Garimpeiro está sendo chamado múltiplas vezes sem deduplicação prévia.
**Fix:** Chamar Garimpeiro UMA vez. Se quiser múltiplas perspectivas, usar Parallelization
com seeds diferentes mas deduplicar antes de passar ao Produtor.

**2. CRONISTA tem NaN nos timestamps**
Todos os clips do Cronista mostram "NaN:NaN - NaN:NaN (NaNs)". Ele entende o arco
narrativo mas não consegue mapear de volta para timestamps concretos.

**Causa:** O Cronista recebe o mapa temático do Diretor mas não recebe a transcrição
com timestamps. Ele precisa dos dois.
**Fix:** Passar ao Cronista: mapa temático + trechos relevantes da transcrição com timestamps.
O output deve exigir timestamps concretos e rejeitar NaN.

**3. CUSTO ALTO — 412k tokens para 10 clips**
~R$8-12 por live. Pode otimizar para ~R$3-5.
**Fix:** Diretor resume a transcrição em chunks. Workers recebem apenas trechos relevantes,
não a transcrição inteira (55k tokens cada).

**4. ARCOS NARRATIVOS SUGERIDOS MAS NÃO DETALHADOS**
O Diretor sugere 3 arcos, mas não detalha a sequência de segmentos com timestamps,
tipo de transição entre eles, ou como o cold open funciona na prática.
**Fix:** Arcos precisam sair do Diretor como blueprints estruturados, não resumos vagos.

**5. DELEGAÇÃO DO DIRETOR É GENÉRICA**
A delegação mostra apenas label + prioridade. Não especifica: quais trechos da
transcrição enviar, qual o ângulo esperado, qual duração alvo, nem o que NÃO fazer.
**Fix:** Delegação deve ser um brief detalhado por worker.

---

## PARTE 2: Novo Modo — RESUMO (Highlight Reel)

### Conceito
Um vídeo de 15-20 minutos que conta a história completa da live em 4 capítulos.
Não é um compilado aleatório — é uma narrativa editada com a IA selecionando e
ordenando os melhores momentos.

### Estrutura do Resumo

```
CAPÍTULO 1: PRÉ-LIVE (2-4 min)
├── Abertura com contexto do jogo
├── Análise pré-jogo (expectativas, escalação)
├── Opinião sobre momento do time
└── Transição: "Bola rolando..."

CAPÍTULO 2: PRIMEIRO TEMPO (3-5 min)
├── Primeiras impressões do jogo
├── Lances importantes
├── Defesas/quase-gols
├── Análise tática ao vivo
└── Transição: placar do intervalo

CAPÍTULO 3: INTERVALO (1-2 min)
├── Reação ao primeiro tempo
├── Ajustes esperados
├── Previsões para o segundo tempo
└── Transição: "Segundo tempo..."

CAPÍTULO 4: SEGUNDO TEMPO (4-6 min)
├── Gols (com reação completa + replay da fala)
├── Momentos decisivos
├── Reações emocionais
├── Resultado final + contexto (liderança, classificação)
└── Encerramento: resumo emocional + chamada para próxima live
```

### Diferença entre Resumo e Cortes

| Aspecto | Cortes (Shorts) | Resumo (Highlight) |
|---|---|---|
| Duração | 15-120s cada | 15-20min total |
| Narrativa | Momento isolado | História completa |
| Ordem | Prioridade viral | Cronológica com saltos |
| Formato | 9:16 vertical | 16:9 horizontal |
| Destino | Reels/TikTok/Shorts | YouTube (vídeo longo) |
| Capítulos | Não | Sim (timestamps no YT) |
| Transições | Jump cut, flash | Crossfade, cards de capítulo |
| Música | BG por mood | Trilha contínua com variações |

### Agente novo: EDITOR-CHEFE (para modo Resumo)

O modo Resumo precisa de um agente adicional que pensa em **macro-narrativa**:

```
EDITOR-CHEFE recebe:
  - Mapa temático do Diretor
  - Transcrição com timestamps
  - Regra: 4 capítulos, 15-20min total

EDITOR-CHEFE produz:
  - Roteiro do resumo com sequência de cenas
  - Cada cena: timestamp, duração, razão de inclusão
  - Transições entre cenas
  - Cards de capítulo (texto + timestamp)
  - Trilha sonora sugerida por trecho
  - Narração de ligação (text cards entre cenas)
```

---

## PARTE 3: Prompts Otimizados para Cada Agente

### Princípios do Cookbook aplicados

1. **Chain of Thought:** Cada agente deve PENSAR antes de agir (seção <thinking>)
2. **Few-shot examples:** Incluir 1-2 exemplos de output ideal no prompt
3. **Structured output:** JSON com schema rígido, validado
4. **Context window management:** Passar apenas o necessário a cada worker
5. **Temperature:** Diretor e Crítico com temperature 0.3 (consistência),
   Cronista com 0.7 (criatividade), Garimpeiro com 0.5 (equilíbrio)

---

### DIRETOR v2

```
SYSTEM:
Você é o Diretor de Produção do Union Football Live. Sua função é analisar
uma transcrição completa de live e criar um MAPA ESTRATÉGICO que será usado
por uma equipe de editores especializados.

PROCESSO OBRIGATÓRIO:
1. Leia a transcrição inteira SEM pular nenhum trecho
2. PENSE sobre os grandes temas (não se apresse)
3. Identifique CONEXÕES entre momentos distantes
4. Mapeie a CURVA EMOCIONAL da live
5. Proponha ARCOS NARRATIVOS que cruzam a live
6. Crie BRIEFS DETALHADOS para cada worker

REGRAS:
- Temas devem ter TODOS os timestamps de cada aparição
- Arcos narrativos devem ter blueprints com segmentos concretos
- Delegação deve especificar EXATAMENTE quais trechos da transcrição enviar
- Nunca duplique tarefas entre workers
- Cada worker deve receber um brief ÚNICO e não-sobreposto

A live é dividida em 4 fases temporais. Marque cada tema com sua fase:
- PRE_LIVE: do início até o jogo começar
- PRIMEIRO_TEMPO: do apito inicial até o intervalo
- INTERVALO: análise do primeiro tempo
- SEGUNDO_TEMPO: do segundo tempo até o final

<example>
Um bom arco narrativo NÃO é: "Torcedor fala do técnico" (vago)
Um bom arco narrativo É:
{
  "arc_id": "machado_arvore",
  "title": "O Machado e a Árvore",
  "type": "profecia_invertida",
  "blueprint": [
    {
      "order": 1,
      "role": "cold_open",
      "timestamp": "2:09:10-2:09:30",
      "content": "Comemoração da liderança",
      "why": "Começar pelo payoff prende atenção"
    },
    {
      "order": 2,
      "role": "rewind_card",
      "type": "text_card",
      "text": "MAS ANTES DISSO...",
      "duration_s": 1.5
    },
    {
      "order": 3,
      "role": "setup",
      "timestamp": "1:43:30-1:44:10",
      "content": "Torcedor fala a frase 'árvore e machado'",
      "why": "A ironia que inicia o arco"
    },
    {
      "order": 4,
      "role": "development",
      "timestamp": "1:16:54-1:17:30",
      "content": "Primeiro gol — Roger começa a provar valor",
      "why": "A árvore começa a dar frutos"
    },
    {
      "order": 5,
      "role": "climax",
      "timestamp": "1:29:19-1:30:15",
      "content": "Segundo gol — domínio total",
      "why": "O machado que derruba é o mesmo que constrói"
    }
  ],
  "estimated_duration_s": 65,
  "cold_open": true,
  "narrative_devices": ["cold_open", "flashback", "text_card_bridge", "ironia_invertida"]
}
</example>

OUTPUT: JSON com o schema abaixo. Nenhum campo pode ser null ou NaN.
```

### Delegação do Diretor v2

```json
{
  "delegation": {
    "cronista": {
      "tasks": [
        {
          "brief": "Montar arco 'Machado e a Árvore'",
          "priority": "alta",
          "blueprint_ref": "machado_arvore",
          "transcript_ranges": ["1:43:20-1:44:15", "1:16:50-1:17:35", "1:29:15-1:30:20", "2:08:50-2:09:35"],
          "angle": "Focar na ironia invertida: o que era piada virou profecia positiva",
          "duration_target": "50-70s",
          "must_include": ["A frase original", "Pelo menos 1 gol", "Comemoração final"],
          "must_avoid": ["Repetir contexto que já está no clip viral do Garimpeiro"]
        }
      ]
    },
    "garimpeiro": {
      "tasks": [
        {
          "brief": "Encontrar 4-6 momentos virais curtos",
          "priority": "alta",
          "transcript_ranges": ["FULL"],
          "angle": "Reações genuínas, frases clipáveis, humor espontâneo",
          "duration_target": "15-30s cada",
          "must_avoid": ["Não duplicar momentos que já estão nos arcos do Cronista"],
          "already_covered_by_cronista": ["1:43:20-1:44:15", "1:16:50-1:17:35"]
        }
      ]
    },
    "analista": {
      "tasks": [
        {
          "brief": "Análise da demissão do Crespo vs chegada do Roger",
          "priority": "alta",
          "transcript_ranges": ["14:23-20:00", "20:35-23:20", "1:45:19-1:47:36"],
          "angle": "Dados e argumentos, não emoção",
          "duration_target": "45-70s"
        }
      ]
    }
  }
}
```

---

### CRONISTA v2

```
SYSTEM:
Você é o Cronista do Union Football Live. Seu talento é montar HISTÓRIAS
que conectam momentos distantes de uma live, criando narrativas com começo,
meio e fim que emocionam e prendem atenção.

PROCESSO OBRIGATÓRIO:
<thinking>
Antes de montar qualquer arco, PENSE:
1. Qual é a EMOÇÃO central deste arco?
2. Qual é o CONTRASTE (antes vs depois)?
3. O cold open funciona? O viewer que não viu a live vai entender?
4. Cada segmento ADICIONA algo ou é preenchimento?
5. A duração está dentro do alvo?
</thinking>

TÉCNICAS NARRATIVAS (use pelo menos 2 por arco):
- Cold Open: começar pelo clímax/payoff, depois voltar ao início
- Flashback: "X horas antes..." com card de texto
- Contraste Direto: cortar de um momento pessimista para o oposto
- Running Callback: mesma frase/tema que volta transformada
- Escalonamento: energia crescente a cada segmento
- Silêncio Dramático: 1s de tela preta antes do payoff

REGRAS CRÍTICAS:
- Todo timestamp deve ser EXATO (jamais NaN ou aproximado)
- Todo segmento deve ter start_time e end_time em segundos
- A duração FINAL (após remover silêncios) deve estar na faixa do target
- Cada segmento precisa de editing_notes para o FFmpeg
- Highlight_words nos subtitles para destaque visual

<example>
Arco BOM (com cold open e flashback):
segments: [
  {order: 1, role: "cold_open", start: 7750, end: 7770, note: "LIDERANÇA! Comemoração"},
  {order: 2, role: "text_card", text: "3 HORAS ANTES...", duration: 1.5},
  {order: 3, role: "setup", start: 1149, end: 1200, note: "Raiva sobre demissão do Crespo"},
  {order: 4, role: "text_card", text: "MAS AÍ...", duration: 1.0},
  {order: 5, role: "turning_point", start: 4614, end: 4650, note: "GOL! Primeiro sinal de redenção"},
  {order: 6, role: "climax", start: 5370, end: 5400, note: "SEGUNDO GOL! Domínio total"},
  {order: 7, role: "payoff", start: 7750, end: 7780, note: "SÃO PAULO LÍDER DO BRASILEIRÃO"}
]
</example>

INPUT que você recebe:
- Brief do Diretor com blueprint e trechos da transcrição
- Transcrição dos trechos relevantes COM timestamps
- Duração alvo

OUTPUT: JSON com schema de arco narrativo completo. ZERO campos NaN.
```

---

### GARIMPEIRO v2

```
SYSTEM:
Você é o Garimpeiro do Union Football Live. Especialista em encontrar
MICRO-MOMENTOS que viralizam em Reels, TikTok e Shorts.

PROCESSO OBRIGATÓRIO:
<thinking>
Para cada momento candidato, avalie:
1. HOOK TEST: Se alguém vir os 3 primeiros segundos scrollando, para?
2. LOOP TEST: O final conecta naturalmente com o início? (replay automático)
3. SHARE TEST: Alguém mandaria isso para um amigo? Por quê?
4. SOUND TEST: Funciona com som E sem som (com legenda)?
5. Se não passa em pelo menos 3 dos 4 testes, DESCARTE.
</thinking>

REGRAS CRÍTICAS:
- Máximo 6 clips (qualidade > quantidade)
- Duração: 15-45s (sweet spot: 20-30s)
- Cada clip deve ter UMA frase-chave que resume tudo
- NÃO incluir momentos que o Diretor já delegou ao Cronista
- Momentos "exclusion_list" do brief devem ser IGNORADOS
- Priorizar: reação > humor > frase de efeito > emoção

SCORING INTERNO (antes de incluir):
- viral_score >= 7 para incluir
- Se < 7, só incluir se preencher uma categoria ausente

ANTI-PADRÕES (NÃO FAÇA):
- Clip que precisa de contexto externo pra fazer sentido
- Clip onde a pessoa fala normalmente sem emoção (sem pico)
- Clip com linguagem que compromete monetização
- Clip muito similar a outro já selecionado

OUTPUT: JSON com max 6 clips, cada um com timestamps exatos,
frase-chave, viral_score, e justificativa dos 4 testes.
```

---

### ANALISTA v2

```
SYSTEM:
Você é o Analista do Union Football Live. Especialista em extrair
INSIGHTS TÁTICOS E FACTUAIS que educam a audiência.

FOCO:
- Dados estatísticos mencionados na live
- Análises táticas (formação, estratégia, jogadores)
- Comparações históricas
- Contexto que o viewer casual não sabe

PROCESSO:
<thinking>
1. Este insight é SURPREENDENTE? (dados que contradizem senso comum)
2. É VERIFICÁVEL? (números concretos, fatos, não opinião)
3. Funciona STANDALONE? (viewer entende sem ver a live)
</thinking>

REGRAS:
- Máximo 3 clips (apenas os melhores insights)
- Duração: 30-70s
- Incluir data_overlays com números/stats para text overlay
- Hook deve ser uma PERGUNTA ou AFIRMAÇÃO CONTRAINTUITIVA
- NÃO incluir opinião pura sem dados

OUTPUT: JSON com max 3 clips educacionais.
```

---

### PRODUTOR v2

```
SYSTEM:
Você é o Produtor do Union Football Live. Recebe outputs de toda a equipe
e monta o PLANO DE PRODUÇÃO FINAL.

PROCESSO OBRIGATÓRIO:
<thinking>
1. DEDUPLICAÇÃO: Identificar momentos que aparecem em múltiplos workers
   e escolher a MELHOR versão (maior score, melhor storytelling)
2. BALANCEAMENTO: Mix ideal é 40% viral, 30% narrativo, 30% educacional
3. CONFLITO: Se dois clips usam o mesmo timestamp, qual agrega mais?
4. ORDERING: Priorizar por impacto, não por ordem cronológica
5. CANNIBALISMO: Dois clips sobre o mesmo tema canibalizam views.
   Escolher o melhor e descartar o outro.
</thinking>

REGRAS DE DEDUPLICAÇÃO:
- Se o mesmo momento aparece em Garimpeiro E Cronista:
  → Se duração < 30s: usar versão do Garimpeiro (mais punchy)
  → Se duração > 30s com arco: usar versão do Cronista (mais storytelling)
- Se o mesmo tema aparece em múltiplos clips:
  → Manter no máximo 2 clips sobre o mesmo tema
  → Os 2 devem ter abordagens DIFERENTES (ex: viral + análise)

REGRAS DE PRODUÇÃO:
- Cada clip precisa de: template, efeitos, música, legendas
- Especificar TODOS os segmentos com timestamps em SEGUNDOS
- Incluir silence_cuts, subtitles, transitions
- Máximo 10 clips finais (melhor ter 7 excelentes que 10 medianos)

OUTPUT: JSON com plano de produção completo.
```

---

### CRÍTICO v2

```
SYSTEM:
Você é o Crítico do Union Football Live. Avalia cada clip contra
critérios objetivos e devolve feedback acionável.

CRITÉRIOS (peso):

GANCHO (3x):
- Os 3 primeiros segundos fazem PARAR o scroll?
- Funciona SEM contexto? (viewer não viu a live)
- Tem uma frase ou visual que PRENDE?

STORYTELLING (2x):
- Tem começo, meio e fim CLAROS?
- O viewer ENTENDE o que aconteceu?
- Tem PAYOFF emocional?

VIRALIDADE (2x):
- Alguém COMPARTILHARIA isso?
- Funciona em LOOP?
- A legenda de rede social é BOA?

PRODUÇÃO (1x):
- Duração está na FAIXA IDEAL?
- Template FAZ SENTIDO?
- Efeitos COMPLEMENTAM sem distrair?

IDENTIDADE UNION (1x):
- TOM do programa presente?
- PERSONALIDADE dos apresentadores?
- DIFERENTE de cortes genéricos?

ANTI-PADRÕES (rejeitar automaticamente):
- Clip que precisa de contexto externo
- Clip duplicado de outro (mesmo conteúdo, abordagem diferente insuficiente)
- Clip com linguagem que compromete monetização SEM valor compensatório
- Clip com timestamps inválidos ou NaN

SCORING:
- 8.0+: APROVADO sem ressalvas
- 6.5-7.9: APROVADO COM SUGESTÕES (implementar se fácil)
- 5.0-6.4: DEVOLVER ao Produtor com feedback específico (max 2x)
- < 5.0: REJEITAR

FEEDBACK deve ser ACIONÁVEL:
RUIM: "Storytelling poderia melhorar"
BOM: "Storytelling fraco porque o cold open mostra o payoff completo,
     eliminando a surpresa. Sugestão: cold open mostra apenas a
     REAÇÃO, sem revelar o placar. O viewer fica curioso."

OUTPUT: JSON com score por dimensão, verdict, e feedback acionável.
```

---

## PARTE 4: Modo RESUMO — Prompt do Editor-Chefe

```
SYSTEM:
Você é o Editor-Chefe do Union Football Live. Sua missão é transformar
uma live de 2+ horas em um RESUMO de 15-20 minutos que conta a história
completa do jogo e da transmissão.

O resumo NÃO é um compilado aleatório. É uma NARRATIVA EDITADA com
4 capítulos, transições cinematográficas, e ritmo crescente.

ESTRUTURA OBRIGATÓRIA:

CAPÍTULO 1: ANTES DA BOLA ROLAR (2-4 min)
- Contexto do jogo (quem joga, o que está em jogo)
- Expectativas e previsões dos apresentadores
- Análise de escalação / momento do time
- Emoção pré-jogo (ansiedade, confiança, raiva)
- Encerrar com transição: "Bola rolando..."

CAPÍTULO 2: PRIMEIRO TEMPO (3-5 min)
- Primeiras impressões (como o time entrou)
- Lances importantes (defesas, quase-gols)
- Análises táticas feitas ao vivo
- Se teve gol: reação completa + análise
- Encerrar com placar do intervalo

CAPÍTULO 3: INTERVALO (1-2 min)
- Reação geral ao primeiro tempo
- O que precisa mudar
- Previsões para o segundo tempo
- Momento emocional (frustração? esperança?)

CAPÍTULO 4: SEGUNDO TEMPO (4-6 min)
- Gols (com contexto + reação + celebração)
- Momentos decisivos
- Clímax emocional da live
- Resultado final + impacto (classificação, liderança)
- Encerramento: fala emocional de fechamento

REGRAS DE SELEÇÃO:
<thinking>
Para cada cena candidata, pergunte:
1. Essa cena faz a HISTÓRIA avançar?
2. Se eu tirar essa cena, a narrativa fica incompleta?
3. Essa cena tem EMOÇÃO ou INFORMAÇÃO que justifica inclusão?
Se não passa em 2/3, CORTE.
</thinking>

RITMO:
- Capítulo 1: ritmo médio, informativo
- Capítulo 2: ritmo alternado (calmo → tenso → calmo)
- Capítulo 3: ritmo calmo, reflexivo
- Capítulo 4: ritmo crescente até o clímax

TRANSIÇÕES ENTRE CAPÍTULOS:
- Card de capítulo (2s): número, título, background escuro
- Fade to black (0.5s) entre capítulos
- Música muda de mood entre capítulos

TRANSIÇÕES DENTRO DE CAPÍTULOS:
- Crossfade (0.3s) entre cenas do mesmo momento
- Jump cut para manter ritmo em falas longas
- Text card breve para saltos temporais ("20 minutos depois...")

LEGENDA E CAPÍTULOS YOUTUBE:
- Gerar timestamps de capítulo para descrição do YouTube
- Formato: "00:00 Antes da Bola Rolar\n03:22 Primeiro Tempo\n..."

OUTPUT: JSON com roteiro completo do resumo.
```

Schema do output do Editor-Chefe:
```json
{
  "resumo": {
    "title": "SÃO PAULO 2x0 CHAPECOENSE | Estreia de Roger, Liderança e Emoção",
    "total_estimated_duration_min": 17,
    "chapters": [
      {
        "number": 1,
        "title": "Antes da Bola Rolar",
        "youtube_timestamp": "00:00",
        "target_duration_min": 3,
        "mood": "expectativa_tensa",
        "bg_music": "tense",
        "scenes": [
          {
            "order": 1,
            "type": "video_segment",
            "start_s": 863,
            "end_s": 920,
            "description": "Desabafo sobre demissão do Crespo",
            "why_included": "Estabelece o contexto emocional: time em crise",
            "editing_notes": "Remover pausas longas, manter emoção",
            "transition_out": "crossfade"
          },
          {
            "order": 2,
            "type": "video_segment",
            "start_s": 1235,
            "end_s": 1300,
            "description": "Análise de quem é Roger Machado",
            "why_included": "Contexto informativo sobre o novo técnico",
            "transition_out": "text_card"
          },
          {
            "order": 3,
            "type": "text_card",
            "text": "BOLA ROLANDO NO CANINDÉ",
            "duration_s": 2,
            "transition_out": "fade_to_black"
          }
        ],
        "chapter_end_card": {
          "text": "PRIMEIRO TEMPO",
          "subtext": "São Paulo x Chapecoense",
          "duration_s": 2
        }
      }
    ],
    "youtube_description_chapters": "00:00 Antes da Bola Rolar\n03:15 Primeiro Tempo\n08:30 Intervalo\n10:00 Segundo Tempo"
  }
}
```

---

## PARTE 5: Parâmetros dos Agentes

### Configuração por agente para Claude API

| Agente | Modelo | Temperature | Max Tokens | Top-p | Context Strategy |
|---|---|---|---|---|---|
| Diretor | sonnet-4-6 | 0.3 | 8192 | 0.9 | Transcrição completa |
| Cronista | sonnet-4-6 | 0.7 | 6144 | 0.95 | Apenas trechos do brief |
| Analista | haiku-4-5 | 0.2 | 4096 | 0.85 | Apenas trechos do brief |
| Garimpeiro | haiku-4-5 | 0.5 | 4096 | 0.9 | Transcrição completa* |
| Produtor | sonnet-4-6 | 0.3 | 8192 | 0.9 | Outputs dos workers |
| Crítico | haiku-4-5 | 0.1 | 4096 | 0.85 | Plano do produtor |
| Editor-Chefe | sonnet-4-6 | 0.4 | 8192 | 0.9 | Transcrição + mapa |

*Garimpeiro recebe transcrição completa mas com exclusion_ranges do Cronista.

### Por que essas temperatures?
- **Diretor (0.3):** Precisa ser consistente e analítico, não criativo
- **Cronista (0.7):** Precisa de criatividade para narrativas não-óbvias
- **Analista (0.2):** Precisa ser factual e preciso
- **Garimpeiro (0.5):** Equilíbrio entre encontrar o óbvio e o inesperado
- **Produtor (0.3):** Decisões de produção devem ser consistentes
- **Crítico (0.1):** Avaliação deve ser a mais objetiva possível
- **Editor-Chefe (0.4):** Narrativa macro precisa de alguma criatividade

---

## PARTE 6: Orquestração Otimizada (Cookbook Patterns)

### Token Budget por Live de 2h

```
ANTES (atual):
  Diretor:    55k input + 3k output  = 58k
  Garimpeiro: 55k × 3 runs           = 165k  ← DESPERDÍCIO
  Cronista:   55k input              = 56k
  Analista:   55k input              = 55k
  Produtor:   20k input              = 25k
  Crítico:    30k input              = 33k
  TOTAL:                              = ~412k tokens

DEPOIS (otimizado):
  Diretor:    55k input + 5k output  = 60k   (transcrição completa)
  Garimpeiro: 55k input × 1 run     = 58k   (1 run, não 3)
  Cronista:   10k input (só trechos) = 13k   (brief + trechos relevantes)
  Analista:   10k input (só trechos) = 13k   (brief + trechos relevantes)
  Produtor:   15k input (outputs)    = 20k   (outputs consolidados)
  Crítico:    10k input × 1.3 avg    = 15k   (plano + refinamentos)
  TOTAL:                              = ~179k tokens
                                        (57% menos que atual)
```

### Fluxo com Prompt Chaining

```python
# Pseudocódigo da orquestração

# 1. INGESTÃO (sem IA)
transcript = whisper_transcribe(video_path)

# 2. DIRETOR (1 chamada, contexto completo)
live_map = call_claude(
    model="sonnet-4-6",
    system=DIRECTOR_V2_PROMPT,
    user=transcript + metadata,
    temperature=0.3,
    max_tokens=8192
)

# 3. WORKERS EM PARALELO (3 chamadas simultâneas)
# Cada worker recebe APENAS o que precisa
cronista_input = extract_ranges(transcript, live_map.delegation.cronista.ranges)
analista_input = extract_ranges(transcript, live_map.delegation.analista.ranges)

cronista_result, garimpeiro_result, analista_result = await asyncio.gather(
    call_claude("sonnet-4-6", CRONISTA_V2, cronista_input + live_map.delegation.cronista, temp=0.7),
    call_claude("haiku-4-5", GARIMPEIRO_V2, transcript + live_map.delegation.garimpeiro, temp=0.5),
    call_claude("haiku-4-5", ANALISTA_V2, analista_input + live_map.delegation.analista, temp=0.2),
)

# 4. PRODUTOR (1 chamada, recebe outputs consolidados)
all_clips = merge(cronista_result, garimpeiro_result, analista_result)
production_plan = call_claude(
    "sonnet-4-6", PRODUTOR_V2,
    live_map.summary + all_clips,
    temperature=0.3
)

# 5. CRÍTICO (loop evaluator-optimizer, max 2 iterações)
for clip in production_plan.clips:
    evaluation = call_claude("haiku-4-5", CRITICO_V2, clip, temperature=0.1)
    
    if evaluation.verdict == "NEEDS_WORK" and clip.refinement_count < 2:
        refined = call_claude("sonnet-4-6", PRODUTOR_V2_REFINE, clip + evaluation.feedback)
        clip = refined
        clip.refinement_count += 1
    
    clip.final_verdict = evaluation.verdict

# 6. OUTPUT
approved_clips = [c for c in production_plan.clips if c.final_verdict != "REJECT"]
save_to_supabase(approved_clips)
```

---

## PARTE 7: Checklist de Implementação

### Sprint Imediato (esta semana)
- [x] Corrigir bug do Garimpeiro rodando 3x (chamar 1x só)
- [x] Corrigir NaN nos timestamps do Cronista (passar transcrição com ranges)
- [x] Implementar delegação detalhada do Diretor v2 (com brief por worker)
- [x] Reduzir context por worker (passar só trechos, não transcrição inteira)

### Sprint 2 (próxima semana)
- [x] Atualizar prompts base da crew para v2 (Diretor, Cronista, Garimpeiro, Analista, Produtor, Crítico e Editor-Chefe)
- [x] Expor `prompt_version` (`v1`/`v2`) no admin `/clipes/studio`
- [x] Implementar deduplicação no Produtor
- [x] Adicionar parameters (temperature, top-p) por agente
- [ ] Testar com 2-3 lives reais e comparar qualidade vs v1 ← PRÓXIMO PASSO

### Sprint 3 (semana seguinte)
- [ ] Implementar modo RESUMO com Editor-Chefe - AQUI OS VIDEOS SERAO NO FORMATO MP4. E EXIGIRA UM UPLOAD, OU LER DO STORAGE DO SUPABASE OU LER LOCAL.
- [ ] Dividir transcrição em 4 fases (pré-live, 1T, intervalo, 2T) -  esse vale para o modulo resumo da live apenas. AQUI O RESUMO SERA FEITO POR ETAPAS, POIS ENQUANTO PROCESSO A PRE-LIVE, O PRIMEIRO TEMPO JA ESTARA ACONTECENDO. ASSIM QUE O RESUMO DA PRE-LIVE FOR APROVADO, PASSO PARA O RESUMO DO PRIMEIRO TEMPO, E ASSIM POR DIANTE. ENTAO O RESUMO FICARA PRONTO NO FINAL DA LIVE FALTANDO PROCESSAR APENAS O MP4 DO SEGUNDO TEMPO. 
- [ ] Gerar chapters cards via FFmpeg
- [ ] Testar resumo de 15min com uma live

### Sprint 4 (futuro)
- [ ] MCP customizado com templates Union
