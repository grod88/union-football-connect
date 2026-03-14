# 🎾 BOLINHA — Documentação de Prompts e Arquitetura

## Visão Geral

O **Bolinha** é o mascote virtual do canal Union Football Live — uma bola de futebol com boné preto, estilo Trionda da Copa 2026. Ele comenta jogos ao vivo, faz análises pré-jogo, reage a eventos e interage com a galera da live.

---

## Arquitetura Atual

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  AdminBolinha    │────▶│  bolinha-sync-match   │────▶│  Supabase   │
│  (Painel Admin)  │     │  (Edge Function)      │     │  DB Tables  │
│                  │     │                       │     │             │
│  • Fixture ID    │     │  Busca 7 endpoints:   │     │ bolinha_    │
│  • Sync button   │     │  - fixture            │     │ match_      │
│  • Auto-sync     │     │  - injuries           │     │ context     │
│  • Quick actions  │     │  - predictions        │     │             │
│  • Manual/IA     │     │  - lineups            │     │ bolinha_    │
│                  │     │  - statistics          │     │ messages    │
└────────┬─────────┘     │  - events             │     └──────┬──────┘
         │               │  - h2h                 │            │
         │               │                       │            │
         │               │  Gera 2 resumos:      │            │
         │               │  - pre_match_summary  │            │
         │               │  - live_summary       │            │
         │               └──────────────────────┘            │
         │                                                     │
         ▼                                                     │
┌─────────────────┐     ┌──────────────────────┐              │
│  bolinha-comment │────▶│  Claude API          │              │
│  (Edge Function) │     │  (Anthropic)         │              │
│                  │     │                       │              │
│  Lê match_context│     │  System prompt +     │              │
│  Monta userPrompt│     │  contexto da partida │              │
│  Chama Claude    │     │  = comentário        │              │
│  Salva mensagem  │────▶│                       │              │
│  Broadcast RT    │     └──────────────────────┘              │
└─────────────────┘                                            │
                                                                │
         ┌──────────────────────────────────────────────────────┘
         ▼
┌─────────────────┐
│  ObsBolinha      │
│  (Widget OBS)    │
│                  │
│  Ouve Realtime:  │
│  - Broadcast     │
│  - DB changes    │
│  Exibe imagem +  │
│  legenda cinema  │
│  Toca áudio TTS  │
└─────────────────┘
```

---

## Emoções do Bolinha (6)

| Emotion | Emoji | Uso | Imagem |
|---------|-------|-----|--------|
| `neutro` | 😏 | Saudação, sem contexto claro | `BOLINHA-NEUTRO.png` |
| `gol` | ⚽ | Gol de qualquer time | `BOLINHA-GOL.png` |
| `bravo` | 😡 | Cartão, falta, erro do juiz | `BOLINHA-BRAVO.png` |
| `analise` | 🤓 | Pré-jogo, intervalo, fim de jogo, estatísticas | `BOLINHA-ANALISE.png` |
| `sarcastico` | 😒 | Ironia, deboche, provocação | `BOLINHA-SARCASTICO.png` |
| `tedio` | 😴 | Jogo parado, sem emoção, 0x0 sem chutes | `BOLINHA-TEDIO.png` |

---

## Atalhos Rápidos do Admin (12 botões)

### Fase PRÉ-JOGO (antes da bola rolar)
| # | Botão | Emoção esperada | Usa dados de |
|---|-------|-----------------|--------------|
| 1 | 👋 Olá galera! | `neutro` | Pré-jogo (times, liga) |
| 2 | 📊 Pré-jogo | `analise` | Pré-jogo (predição, H2H, lesões, escalações) |
| 3 | 🔮 Predição | `analise` | Pré-jogo (predição, comparação) |
| 4 | 🏥 Desfalques | `analise` | Pré-jogo (injuries) |

### Fase AO VIVO (jogo rolando)
| # | Botão | Emoção esperada | Usa dados de |
|---|-------|-----------------|--------------|
| 5 | ⚽ Gol Time Casa | `gol` | Ao vivo (placar, chutes, posse) |
| 6 | ⚽ Gol Time Fora | `gol` | Ao vivo (placar, finalizações, posse) |
| 7 | 🟨 Cartão! | `bravo` | Ao vivo (faltas, cartões, tensão) |
| 8 | 😡 Juiz errou! | `bravo` | Ao vivo (lance polêmico) |
| 9 | 👏 Que jogada! | `analise` ou `gol` | Ao vivo |
| 10 | 😴 Jogo parado | `tedio` | Ao vivo (chutes no gol, finalizações, posse) |

### Fase INTERVALO / PÓS-JOGO
| # | Botão | Emoção esperada | Usa dados de |
|---|-------|-----------------|--------------|
| 11 | 📊 Intervalo | `analise` | Ao vivo (resumo 1º tempo completo) |
| 12 | 🏁 Fim de jogo! | `analise` | Ao vivo (veredito final, placar, stats) |

---

## Fluxo de Dados

### Sync (botão SINCRONIZAR no Admin)
1. Admin clica "SINCRONIZAR" com um `fixture_id`
2. Edge Function `bolinha-sync-match` busca 7 endpoints da API-Football (via proxy)
3. Gera `pre_match_summary` (predições, H2H, lesões, escalações)
4. Gera `live_summary` (placar, estatísticas, eventos)
5. Salva tudo em `bolinha_match_context`
6. Auto-sync opcionalmente a cada 2 minutos

### Comentário (atalho rápido ou prompt IA)
1. Admin clica atalho ou escreve prompt
2. Edge Function `bolinha-comment` lê `bolinha_match_context` ativo
3. Monta `contextBlock` com pre_match ou live_summary
4. Envia para Claude com system prompt
5. Claude retorna `{"text": "...", "emotion": "..."}`
6. Salva em `bolinha_messages` + broadcast via Realtime
7. Opcionalmente gera TTS via `bolinha-tts` (ElevenLabs)

### Widget OBS (exibição)
1. `ObsBolinha` ouve canal Realtime `bolinha`
2. Ao receber mensagem: troca imagem da emoção, exibe legenda cinema, toca áudio
3. Após áudio terminar (ou timeout), volta para `neutro` com animação idle

---

## Problemas Identificados (Análise de 80+ mensagens)

### PROBLEMA 1: Mensagens longas demais (150-250+ chars)
**Exemplos:**
- "E aí galera do Union Football Live! Bolinha aqui prontíssimo pra resenha! Olha só que loucura: Tottenham chegou com 9 desfalques..." (~195 chars)
- "Palmeiras favorito e com razão! Defesa do Verdão tá 67% contra 33% do Tricolor, e nos últimos 5 clássicos foram 3 vitórias alviverdes..." (~175 chars)

**Causa**: Prompt diz "MÁXIMO 2 frases" mas não tem limite de chars. Exemplos no prompt já são longos.

**Fix**: Limite explícito de 200 chars total. Exemplos mais curtos. Pensar em "legenda de cinema".

### PROBLEMA 2: Dados de predição durante jogo ao vivo
**Exemplos:**
- "Defesa do Verdão tá 67% contra 33% do Tricolor" (durante jogo ao vivo)
- "defesa de 75% que eles têm" (durante Corinthians ao vivo)

**Causa**: O `contextBlock` inclui dados de pré-jogo mesmo com jogo ao vivo. Claude mistura.

**Fix na lógica**: Quando jogo ao vivo, NÃO enviar pré-jogo no contextBlock (remover fallback). Fix no prompt: reforçar proibição.

### PROBLEMA 3: Repetição extrema (sem memória)
**Exemplos** (mesmo jogo Palmeiras x SP, fixture 1526432):
- 15+ mensagens pré-jogo quase idênticas
- Todas citam "nos últimos 5 clássicos, Palmeiras ganhou 3..."
- Todas começam com "E aí galera do Union Football Live!"

**Causa**: Claude não sabe o que já disse. Não há mecanismo anti-repetição.

**Fix**: Buscar últimas 3 mensagens do DB e injetar no prompt como contexto. Claude vai evitar repetir.

### PROBLEMA 4: Saudação como abertura padrão vs atalho dedicado
**Observação**: O atalho 👋 "Olá galera!" é para saudação — é CORRETO começar com "E aí galera da Union Football Live!" NESSE caso.

**MAS**: Todos os outros atalhos (pré-jogo, gol, cartão) também começam com "E aí galera...", o que é ERRADO.

**Fix**: No prompt, deixar claro que saudação é SÓ quando a instrução pede. Nos outros atalhos, ir direto ao ponto.

### PROBLEMA 5: Emoções incorretas em alguns casos
**Exemplos:**
- "GOL DO SAO PAULO. LUCAS" → emotion `neutro` (deveria ser `gol`)
- Mensagens de análise profunda → emotion `neutro` (deveria ser `analise`)

**Causa**: Mensagens manuais nem sempre têm a emoção correta selecionada. IA também erra às vezes.

**Fix**: Reforçar no prompt o mapeamento emoção ↔ contexto.

### PROBLEMA 6: Confusão quando dados contradizem instrução
**Exemplos:**
- "Você disse que teve gol do Vélez, mas pelos dados aqui o jogo ainda nem começou"
- "Peraí galera, vocês estão vendo dados ao vivo aí?"

**Causa**: Apresentador clicou "Gol" mas o jogo ainda não começou (dados desatualizados).

**Fix**: Isso é válido e BOM que o Bolinha questione! Mas o tom deve ser leve, não confuso. Fix no prompt: dar instrução clara para esse caso.

---

## Plano de Melhorias (3 Etapas)

### ETAPA 1: Melhorar System Prompt

#### 1A — Limite de caracteres
Adicionar no início das REGRAS:
```
MÁXIMO 200 caracteres no total. Pense em legenda de cinema: 
curto, impactante, cabe em 2 linhas. Se ficou grande, CORTE.
```

#### 1B — Regra anti-saudação padrão
```
NUNCA comece com "E aí galera do Union Football Live" a menos que 
a instrução seja ESPECIFICAMENTE de saudação/cumprimento.
Para atalhos de gol, cartão, análise — vá DIRETO ao ponto.
```

#### 1C — Proibir predição durante jogo (reforço)
```
PROIBIDO durante jogo ao vivo: porcentagens de predição (67% vs 33%),
comparação de ataque/defesa do pré-jogo, probabilidades.
Use APENAS: placar, posse, finalizações, chutes no gol, escanteios,
cartões, faltas, impedimentos, substituições.
```

#### 1D — Forçar variedade
```
NUNCA comece duas mensagens seguidas da mesma forma.
Varie: 'Eita!', 'Olha só...', 'Cara...', 'Peraí...', 'Rapaz...',
'Ô meu...', 'Pô...', 'Mano...', 'Que isso!', 'Opa!'
```

#### 1E — Exemplos mais curtos e adequados por fase

**Pré-jogo:**
```json
{"text": "Nos últimos 5 clássicos, Verdão ganhou 3! Mas hoje sem Arboleda, vai ser tenso.", "emotion": "analise"}
```

**Saudação:**
```json
{"text": "E aí galera da Union Live! Bolinha na área pro Choque-Rei! Bora que hoje promete!", "emotion": "neutro"}
```

**Gol ao vivo:**
```json
{"text": "GOOOL! Merecido, o time tava com 58% de posse e martelando! Vamo!", "emotion": "gol"}
```

**Cartão ao vivo:**
```json
{"text": "Mais um amarelo! Já são 3 cartões, esse jogo tá pegando fogo!", "emotion": "bravo"}
```

**Jogo parado:**
```json
{"text": "35 minutos e ZERO chutes no gol. Alguém avisa que pode chutar!", "emotion": "tedio"}
```

**Intervalo:**
```json
{"text": "Intervalo! São Paulo dominou com 55% de posse e 9 finalizações. Se continuar assim, leva!", "emotion": "analise"}
```

**Fim de jogo:**
```json
{"text": "Acabou! Palmeiras 2x1 merecido: 64% de posse e dominou o jogo todo.", "emotion": "analise"}
```

**Dados contradizem instrução:**
```json
{"text": "Opa, pelos dados aqui o jogo nem começou ainda! Bora aguardar a bola rolar!", "emotion": "sarcastico"}
```

### ETAPA 2: Injetar contexto de mensagens anteriores (código)

Na Edge Function `bolinha-comment`, ANTES de chamar o Claude:

```typescript
// Buscar últimas 3 mensagens
const { data: recentMessages } = await supabase
  .from('bolinha_messages')
  .select('text, emotion')
  .order('created_at', { ascending: false })
  .limit(3);

const recentContext = recentMessages?.length 
  ? `\n\nSUAS ÚLTIMAS MENSAGENS (NÃO repita nada parecido):\n${
      recentMessages.map((m, i) => `${i+1}. [${m.emotion}] "${m.text}"`).join('\n')
    }`
  : '';

// Injetar no userPrompt
userPrompt = `${contextBlock}${recentContext}\n\n---\n\nINSTRUÇÃO: ...`;
```

### ETAPA 3: Melhorar lógica do contextBlock (código)

Na Edge Function `bolinha-comment`:
- Quando jogo ao vivo: enviar APENAS `live_summary`, SEM pré-jogo
- Quando pré-jogo: enviar APENAS `pre_match_summary`
- Remover a inclusão de pré-jogo como "fallback" durante jogo ao vivo

```typescript
if (hasLiveData) {
  // APENAS dados ao vivo, sem pré-jogo
  contextBlock = `DADOS AO VIVO DA PARTIDA:\n${activeMatch.live_summary}`;
} else if (activeMatch.pre_match_summary) {
  contextBlock = `DADOS PRÉ-JOGO (jogo ainda não começou):\n${activeMatch.pre_match_summary}`;
}
```

### ETAPA 4 (Futura): Organizar atalhos por fase no Admin

Separar os 12 atalhos em 3 seções visuais:

```
┌─── PRÉ-JOGO ────────────────────┐
│ 👋 Saudação  📊 Análise  🔮 Palpite  🏥 Desfalques │
└──────────────────────────────────┘

┌─── AO VIVO ──────────────────────┐
│ ⚽ Gol Casa  ⚽ Gol Fora  🟨 Cartão │
│ 😡 Juiz errou  👏 Jogada  😴 Parado │
└──────────────────────────────────┘

┌─── INTERVALO / FIM ──────────────┐
│ 📊 Intervalo  🏁 Fim de jogo     │
└──────────────────────────────────┘
```

---

## Tabelas do Supabase

### `bolinha_match_context`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `fixture_id` | BIGINT | ID da partida (API-Football) |
| `home_team_name` | TEXT | Nome do time da casa |
| `away_team_name` | TEXT | Nome do time visitante |
| `home_team_id` / `away_team_id` | BIGINT | IDs dos times |
| `league_name` / `league_round` | TEXT | Liga e rodada |
| `venue_name` | TEXT | Estádio |
| `match_date` | TIMESTAMPTZ | Data/hora do jogo |
| `fixture_data` | JSONB | Dados brutos da fixture |
| `injuries_data` | JSONB | Lista de lesões |
| `predictions_data` | JSONB | Predições e comparações |
| `h2h_data` | JSONB | Últimos confrontos |
| `lineups_data` | JSONB | Escalações |
| `statistics_data` | JSONB | Estatísticas ao vivo |
| `events_data` | JSONB | Eventos (gols, cartões, subs) |
| `pre_match_summary` | TEXT | Resumo pré-jogo (texto) |
| `live_summary` | TEXT | Resumo ao vivo (texto) |
| `context_summary` | TEXT | (legado) Resumo antigo |
| `last_synced_at` | TIMESTAMPTZ | Último sync |
| `is_active` | BOOLEAN | Partida ativa (trigger desativa outras) |

### `bolinha_messages`
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | PK |
| `fixture_id` | BIGINT | FK partida (nullable) |
| `text` | TEXT | Texto do comentário |
| `emotion` | TEXT | Uma das 6 emoções (check constraint via trigger) |
| `team_id` | BIGINT | Time relacionado |
| `audio_url` | TEXT | "generated" se tem TTS |
| `event_type` | TEXT | Tipo do evento ou "manual" |
| `created_at` | TIMESTAMPTZ | Timestamp |

---

## Edge Functions

| Function | Propósito | Chama |
|----------|-----------|-------|
| `bolinha-sync-match` | Busca dados da partida, gera resumos, salva no DB | API-Football via proxy |
| `bolinha-comment` | Gera comentário via Claude, salva, broadcast | Claude API + bolinha-tts |
| `bolinha-tts` | Gera áudio via ElevenLabs | ElevenLabs API |

---

## Configuração de Secrets

```bash
supabase secrets set API_FOOTBALL_KEY=<key>
supabase secrets set ANTHROPIC_API_KEY=<key>
supabase secrets set ELEVENLABS_API_KEY=<key>
supabase secrets set ELEVENLABS_VOICE_ID=<voice_id>
```

---

## Notas Importantes

1. **OBS widgets NÃO devem usar cache da API** — os dados do Bolinha vêm do Supabase DB (tabelas), não da API-Football diretamente
2. **Sync é feito pelo Admin** — o apresentador clica "SINCRONIZAR" ou habilita auto-sync (2min)
3. **Realtime é essencial** — o widget OBS recebe mensagens via Supabase Realtime (broadcast + postgres_changes)
4. **TTS é opcional** — checkbox no admin, usa ElevenLabs
5. **Emoções são validadas** — trigger no banco rejeita emoções inválidas
6. **Auto-cleanup** — mensagens com mais de 24h são deletadas automaticamente
