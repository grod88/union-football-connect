# BOLINHA - Mascote Virtual do Union Football Live

O **Bolinha** é o mascote virtual com IA do canal Union Football Live. Ele é uma bola de futebol animada com boné preto (estilo Trionda da Copa 2026) que comenta partidas ao vivo com personalidade sarcástica, debochada e engraçada.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PAINEL ADMIN                                │
│                      /admin/bolinha                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │ Sync Match  │  │ Quick Acts  │  │ Modo Livre  │                 │
│  │ (API-Foot)  │  │ (Atalhos)   │  │ Manual + IA │                 │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                 │
└─────────┼────────────────┼────────────────┼─────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SUPABASE EDGE FUNCTIONS                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ bolinha-sync-    │  │ bolinha-comment  │  │ bolinha-tts      │  │
│  │ match            │  │ (Claude AI)      │  │ (ElevenLabs)     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │                │                │
          ▼                ▼                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                    │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │ bolinha_match_context│  │ bolinha_messages     │                │
│  │ (dados da partida)   │  │ (histórico)          │                │
│  └──────────────────────┘  └──────────────────────┘                │
│                                                                     │
│  ┌──────────────────────┐                                          │
│  │ Realtime Broadcast   │ ◄─── channel: "bolinha"                  │
│  │ event: "comment"     │                                          │
│  └──────────────────────┘                                          │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       OBS OVERLAY                                   │
│                      /obs/bolinha                                   │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  [Legenda estilo cinema]                                    │   │
│  │  ┌─────────────────────────────────────────────────────┐    │   │
│  │  │ "Goool do Tricolor! Merecido demais, o time tá..."  │    │   │
│  │  └─────────────────────────────────────────────────────┘    │   │
│  │                                                              │   │
│  │                   🎱 BOLINHA                                 │   │
│  │               (imagem animada)                               │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Features

### 1. Sincronização de Partida (API-Football)
- Busca dados completos da partida via API-Football
- **Dados Pré-Jogo**: predições, H2H, lesões, escalações
- **Dados Ao Vivo**: placar, estatísticas, eventos (gols, cartões, substituições)
- Atualização manual com botão "Sincronizar" ou FAB flutuante

### 2. Geração de Comentários com IA (Claude)
- Usa Claude Sonnet para gerar comentários contextualizados
- **Regra de Contexto**: usa dados pré-jogo antes do início, dados ao vivo durante a partida
- **Regra de Relevância**: comentários focados no evento específico
- Formato curto e impactante (máx. 2 frases)

### 3. Text-to-Speech (ElevenLabs)
- Converte comentários em áudio com voz natural
- Voice ID configurável via `ELEVENLABS_VOICE_ID`
- Áudio é transmitido via base64 para o overlay

### 4. Sistema de Emoções
O Bolinha possui 6 emoções com imagens e animações distintas:

| Emoção | Emoji | Uso |
|--------|-------|-----|
| `neutro` | 😏 | Comentários gerais |
| `gol` | ⚽ | Comemorações de gol |
| `bravo` | 😡 | Erros de arbitragem, jogadas ruins |
| `analise` | 🤓 | Análises táticas, estatísticas |
| `sarcastico` | 😒 | Comentários irônicos |
| `tedio` | 😴 | Jogo parado, sem emoção |

### 5. Realtime Broadcast
- Mensagens são enviadas via Supabase Realtime
- Canal: `bolinha`, evento: `comment`
- Payload: `{ text, emotion, teamId, audioBase64, timestamp }`

---

## Como Usar o Painel Admin

### Acessando
```
URL: https://seu-site.com/admin/bolinha
```

### 1. Configurar a Partida Ativa

1. Obtenha o **Fixture ID** da partida no API-Football
2. Digite o ID no campo "Fixture ID"
3. Clique em **SINCRONIZAR**
4. Os dados da partida serão carregados (times, liga, predições, H2H, lesões)

### 2. Usar Atalhos Rápidos

Os atalhos são botões pré-configurados para situações comuns:

| Atalho | Quando Usar |
|--------|-------------|
| 👋 Olá galera! | Início da live |
| 📊 Pré-jogo | Antes do jogo começar |
| 🔮 Predição | Palpite do Bolinha |
| ⚽ Gol [Time]! | Quando um time marca |
| 🟨 Cartão! | Cartão amarelo/vermelho |
| 😡 Juiz errou! | Lance polêmico |
| 👏 Que jogada! | Jogada bonita |
| 😴 Jogo parado | Jogo sem emoção |
| 📊 Intervalo | No intervalo |
| 🏥 Desfalques | Comentar lesões |
| 🏁 Fim de jogo! | Ao final da partida |

**Opção TTS**: Marque "Gerar com áudio (TTS)" para incluir narração.

### 3. Modo Livre

#### Manual
- Digite o texto exato que o Bolinha deve falar
- Selecione a emoção clicando na imagem correspondente
- Marque "TTS" se quiser áudio
- Clique em **ENVIAR**

#### IA
- Digite uma instrução livre (ex: "Comenta sobre o gol do Calleri")
- A IA irá gerar o comentário automaticamente
- Marque "TTS" se quiser áudio
- Clique em **GERAR COM IA**

### 4. Monitoramento

- **Preview**: Mostra como o Bolinha aparece no OBS em tempo real
- **Histórico**: Lista das últimas 20 mensagens enviadas
- **Último sync**: Indica há quanto tempo os dados foram atualizados

### 5. Atualizar Dados Durante o Jogo

- Use o **botão flutuante azul** (canto inferior direito) para atualizar dados ao vivo
- Recomendado: atualizar a cada 5-10 minutos ou após eventos importantes
- O indicador "Último sync" ficará amarelo se estiver desatualizado (>10 min)

---

## Como Exibir o Bolinha no OBS

### 1. Adicionar Fonte de Navegador

1. No OBS, clique em **+** na lista de fontes
2. Selecione **Navegador**
3. Dê um nome (ex: "Bolinha")

### 2. Configurar a URL

```
URL: https://seu-site.com/obs/bolinha
```

**Parâmetros opcionais:**
- `?size=sm` — Bolinha pequeno (200px)
- `?size=md` — Bolinha médio (300px) — padrão
- `?size=lg` — Bolinha grande (400px)

Exemplo: `https://seu-site.com/obs/bolinha?size=lg`

### 3. Configurações Recomendadas

| Configuração | Valor |
|--------------|-------|
| Largura | 500 |
| Altura | 500 |
| FPS | 30 |
| CSS personalizado | (deixar em branco) |
| Desligar fonte quando não visível | ✅ |
| Atualizar navegador quando a cena se tornar ativa | ✅ |

### 4. Posicionamento

- Posicione o Bolinha no **canto inferior** da tela (esquerdo ou direito)
- A legenda aparece acima da imagem do Bolinha
- O fundo é transparente, então funciona sobre qualquer cenário

### 5. Interação com Áudio

- O overlay reproduz automaticamente o áudio TTS quando recebe uma mensagem
- **Importante**: Para o áudio funcionar, o OBS deve permitir autoplay:
  - Vá em Configurações da fonte > "Controlar áudio via OBS"
  - Ou adicione o audio separadamente via "Captura de Áudio"

---

## Variáveis de Ambiente Necessárias

No Supabase (Edge Functions):

```env
ANTHROPIC_API_KEY=sk-ant-...
ELEVENLABS_API_KEY=sk_...
ELEVENLABS_VOICE_ID=ugQwQf4Rx9UBHI5QM6Ib
```

Para configurar:
```bash
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set ELEVENLABS_API_KEY=sk_...
supabase secrets set ELEVENLABS_VOICE_ID=ugQwQf4Rx9UBHI5QM6Ib
```

---

## Storage (Imagens do Bolinha)

As imagens do Bolinha ficam no Supabase Storage:

**Bucket**: `bolinha-images`

**Arquivos necessários**:
- `BOLINHA-NEUTRO.png` / `BOLINHA-NEUTRO-preview.png`
- `BOLINHA-GOL.png` / `BOLINHA-GOL-preview.png`
- `BOLINHA-BRAVO.png` / `BOLINHA-BRAVO-preview.png`
- `BOLINHA-ANALISE.png` / `BOLINHA-ANALISE-preview.png`
- `BOLINHA-SARCASTICO.png` / `BOLINHA-SARCASTICO-preview.png`
- `BOLINHA-TEDIO.png` / `BOLINHA-TEDIO-preview.png`

---

## Tabelas do Banco de Dados

### `bolinha_match_context`
Armazena o contexto da partida ativa.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| fixture_id | integer | ID da partida (PK) |
| home_team_name | text | Nome do time da casa |
| away_team_name | text | Nome do time visitante |
| league_name | text | Nome da competição |
| fixture_data | jsonb | Dados brutos da partida |
| predictions_data | jsonb | Dados de predição |
| h2h_data | jsonb | Histórico de confrontos |
| injuries_data | jsonb | Lista de lesões |
| lineups_data | jsonb | Escalações |
| statistics_data | jsonb | Estatísticas ao vivo |
| events_data | jsonb | Eventos (gols, cartões) |
| pre_match_summary | text | Resumo pré-jogo (texto) |
| live_summary | text | Resumo ao vivo (texto) |
| is_active | boolean | Se é a partida ativa |
| last_synced_at | timestamp | Última sincronização |

### `bolinha_messages`
Histórico de mensagens do Bolinha.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | ID da mensagem (PK) |
| fixture_id | integer | ID da partida |
| text | text | Texto do comentário |
| emotion | text | Emoção (neutro, gol, etc) |
| team_id | integer | ID do time relacionado |
| event_type | text | Tipo do evento |
| created_at | timestamp | Data/hora de criação |

---

## Fluxo de Funcionamento

```
1. Admin sincroniza partida (fixture_id)
   │
   ▼
2. bolinha-sync-match busca dados na API-Football
   │
   ▼
3. Dados são salvos em bolinha_match_context
   │
   ▼
4. Admin clica em atalho ou envia comentário
   │
   ▼
5. bolinha-comment gera texto via Claude AI
   │
   ▼
6. bolinha-tts converte em áudio (se TTS ativado)
   │
   ▼
7. Mensagem é salva em bolinha_messages
   │
   ▼
8. Broadcast via Realtime (canal: bolinha)
   │
   ▼
9. OBS Overlay recebe e exibe com animação + áudio
```

---

## Dicas de Uso

1. **Sincronize antes do jogo** para ter dados de pré-jogo (predições, H2H)
2. **Atualize durante o jogo** a cada 5-10 minutos para ter estatísticas atualizadas
3. **Use atalhos rápidos** para momentos de ação (gols, cartões)
4. **Use modo IA** para comentários mais elaborados
5. **Use modo manual** quando quiser controle total do texto
6. **Ajuste o tamanho** do Bolinha conforme seu layout de stream
