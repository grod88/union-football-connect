# Union Football Live — Widgets OBS v2

Guia atualizado e testado dos widgets OBS. Todos os widgets abaixo foram verificados em 28/02/2026.

---

## URL Base

```
https://unionfc.live
```

---

## Como Obter o ID da Partida (fixture)

O `fixture` é o ID da partida na API-Football. Você pode obter de duas formas:

1. **Via Site**: Acesse `/ao-vivo` ou `/jogos-do-dia` e veja o ID na URL ao clicar em uma partida
2. **Via API-Football**: Consulte diretamente em https://www.api-football.com/

---

## Tabela Resumo — Todos os Widgets Testados ✅

| # | Widget | URL Completa (exemplo) | Refresh | Tamanho Sugerido |
|---|--------|------------------------|---------|------------------|
| 1 | Placar Completo | `https://unionfc.live/obs/placar?fixture=1515255` | 15s | 800×200 px |
| 2 | Apenas Placar | `https://unionfc.live/obs/score?fixture=1515255` | 15s | 300×100 px |
| 3a | Estatísticas (full) | `https://unionfc.live/obs/stats?fixture=1525514&widget=full` | 30s | 500×400 px |
| 3b | Estatísticas (top) | `https://unionfc.live/obs/stats?fixture=1525514&widget=top` | 30s | 500×250 px |
| 3c | Estatísticas (bottom) | `https://unionfc.live/obs/stats?fixture=1525514&widget=bottom` | 30s | 500×250 px |
| 4 | Eventos (Timeline) | `https://unionfc.live/obs/eventos?fixture=1525514` | 15s | 400×500 px |
| 5 | Tempo de Jogo | `https://unionfc.live/obs/tempo?fixture=1525514` | 15s | 200×60 px |
| 6 | Nome da Liga | `https://unionfc.live/obs/liga?fixture=1525514` | 15s | 500×50 px |
| 7 | Time da Casa | `https://unionfc.live/obs/home?fixture=1525514` | 15s | 250×60 px |
| 8 | Time Visitante | `https://unionfc.live/obs/away?fixture=1525514` | 15s | 250×60 px |
| 9 | Enquete Interativa | `https://unionfc.live/obs/enquete?pergunta=Foi+penalti?&opcao1=SIM&opcao2=NAO` | — | 400×300 px |
| 10 | Melhores em Campo | `https://unionfc.live/obs/ratings?fixture=1492143` | 30s | 500×400 px |
| 11 | Escalação | `https://unionfc.live/obs/escalacao?fixture=1492143` | 15s | 500×600 px |
| 12 | Classificação | `https://unionfc.live/obs/classificacao?league=71&season=2026` | 60s | 500×500 px |
| 13 | Predição | `https://unionfc.live/obs/predicao?fixture=1492143` | 60s | 500×400 px |
| 14 | Confronto Direto | `https://unionfc.live/obs/h2h?fixture=1492143` | 60s | 500×500 px |
| 15 | Desfalques | `https://unionfc.live/obs/desfalques?fixture=1492143` | 60s | 400×400 px |
| 16 | Bolinha (Comentarista IA) | `https://unionfc.live/obs/bolinha` | Realtime | 400×400 px |

---

## Detalhes dos Widgets

### 1. Placar Completo (Scoreboard)

Exibe escudos dos times, placar e tempo de jogo. Flash de animação ao marcar gol.

```
https://unionfc.live/obs/placar?fixture=1515255
```

---

### 2. Apenas Placar (Score)

Exibe apenas os números do placar (ex: 2 × 1). Flash e zoom ao marcar gol.

```
https://unionfc.live/obs/score?fixture=1515255
```

---

### 3. Estatísticas

Barras comparativas com posse de bola, chutes, escanteios, faltas, cartões, impedimentos e precisão de passes.

```
# Todas (9 indicadores)
https://unionfc.live/obs/stats?fixture=1525514&widget=full

# Primeiras 4
https://unionfc.live/obs/stats?fixture=1525514&widget=top

# Estatísticas 5-8
https://unionfc.live/obs/stats?fixture=1525514&widget=bottom
```

| Parâmetro | Valores | Descrição |
|-----------|---------|-----------|
| `fixture` | número | ID da partida (obrigatório) |
| `widget` | `full`, `top`, `bottom` | Variante (padrão: `full`) |

---

### 4. Eventos (Timeline)

Timeline vertical com gols ⚽, cartões 🟨🟥, substituições 🔄 e VAR.

```
# Últimos 8 eventos (padrão)
https://unionfc.live/obs/eventos?fixture=1525514

# Últimos 5 eventos
https://unionfc.live/obs/eventos?fixture=1525514&max=5
```

| Parâmetro | Valores | Descrição |
|-----------|---------|-----------|
| `fixture` | número | ID da partida (obrigatório) |
| `max` | número | Máximo de eventos (padrão: 8) |

---

### 5. Tempo de Jogo

Minuto atual (ex: 45+2') + status (AO VIVO, INTERVALO, etc.). Vermelho quando ao vivo, dourado quando parado.

```
https://unionfc.live/obs/tempo?fixture=1525514
```

---

### 6. Nome da Liga

Nome da competição + rodada (ex: "CAMPEONATO PAULISTA — Rodada 10").

```
https://unionfc.live/obs/liga?fixture=1525514
```

---

### 7. Time da Casa (Home)

Nome do time mandante com escudo em marca d'água.

```
https://unionfc.live/obs/home?fixture=1525514
```

---

### 8. Time Visitante (Away)

Nome do time visitante com escudo em marca d'água.

```
https://unionfc.live/obs/away?fixture=1525514
```

---

### 9. Enquete Interativa

Pergunta customizável com 2 a 4 opções e contagem de votos. Suporta votos simulados.

```
# 2 opções
https://unionfc.live/obs/enquete?pergunta=Foi+penalti?&opcao1=SIM&opcao2=NAO

# 3 opções
https://unionfc.live/obs/enquete?pergunta=Quem+vai+ganhar?&opcao1=Time+A&opcao2=Empate&opcao3=Time+B

# 4 opções
https://unionfc.live/obs/enquete?pergunta=Melhor+jogador?&opcao1=Jogador+1&opcao2=Jogador+2&opcao3=Jogador+3&opcao4=Jogador+4

# Com votos simulados
https://unionfc.live/obs/enquete?pergunta=Foi+penalti?&opcao1=SIM&opcao2=NAO&simular=50
```

| Parâmetro | Valores | Descrição |
|-----------|---------|-----------|
| `pergunta` | texto | Pergunta da enquete (obrigatório) |
| `opcao1` | texto | Primeira opção (obrigatório) |
| `opcao2` | texto | Segunda opção (obrigatório) |
| `opcao3` | texto | Terceira opção (opcional) |
| `opcao4` | texto | Quarta opção (opcional) |
| `simular` | número | Votos iniciais simulados (opcional) |

> **Nota**: Use `+` para espaços na URL ou codifique com `%20`

---

### 10. Melhores em Campo (Player Ratings)

Exibe os melhores jogadores de cada time com nota de desempenho. Útil para mostrar destaque da partida.

```
https://unionfc.live/obs/ratings?fixture=1492143
```

| Parâmetro | Valores | Descrição |
|-----------|---------|-----------|
| `fixture` | número | ID da partida (obrigatório) |

| Característica | Valor |
|----------------|-------|
| Exibe | Jogadores com melhor nota de cada time |
| Refresh | 30 segundos |
| Tamanho sugerido | 500×400 px |

---

### 11. Escalação (Lineups)

Exibe a escalação dos dois times com formação tática e jogadores titulares/reservas.

```
https://unionfc.live/obs/escalacao?fixture=1492143
```

| Parâmetro | Valores | Descrição |
|-----------|---------|-----------|
| `fixture` | número | ID da partida (obrigatório) |

| Característica | Valor |
|----------------|-------|
| Exibe | Formação, titulares e reservas de cada time |
| Refresh | 15 segundos |
| Tamanho sugerido | 500×600 px |

---

### 12. Classificação (Standings)

Exibe a tabela de classificação do campeonato. Usa `league` e `season` como parâmetros (não fixture).

```
https://unionfc.live/obs/classificacao?league=71&season=2026
```

| Parâmetro | Valores | Descrição |
|-----------|---------|-----------|
| `league` | número | ID da liga (obrigatório) |
| `season` | número | Ano da temporada (obrigatório) |

| Característica | Valor |
|----------------|-------|
| Exibe | Tabela com posição, pontos, vitórias, empates, derrotas, saldo |
| Refresh | 60 segundos |
| Tamanho sugerido | 500×500 px |

**IDs de ligas comuns**:
- Brasileirão Série A: `71`
- Paulistão: `475`
- Copa do Brasil: `73`
- Libertadores: `13`

---

### 13. Predição (Predictions)

Exibe a previsão da partida com probabilidades de vitória, empate e derrota.

```
https://unionfc.live/obs/predicao?fixture=1492143
```

| Parâmetro | Valores | Descrição |
|-----------|---------|-----------|
| `fixture` | número | ID da partida (obrigatório) |

| Característica | Valor |
|----------------|-------|
| Exibe | Probabilidade de vitória casa/empate/fora, conselho de aposta |
| Refresh | 60 segundos |
| Tamanho sugerido | 500×400 px |

---

### 14. Confronto Direto (H2H)

Exibe o histórico de confrontos entre os dois times da partida.

```
https://unionfc.live/obs/h2h?fixture=1492143
```

| Parâmetro | Valores | Descrição |
|-----------|---------|-----------|
| `fixture` | número | ID da partida (obrigatório) |

| Característica | Valor |
|----------------|-------|
| Exibe | Últimos jogos entre os times, placar, data |
| Refresh | 60 segundos |
| Tamanho sugerido | 500×500 px |

---

### 15. Desfalques (Injuries)

Exibe os jogadores lesionados ou suspensos de cada time.

```
https://unionfc.live/obs/desfalques?fixture=1492143
```

| Parâmetro | Valores | Descrição |
|-----------|---------|-----------|
| `fixture` | número | ID da partida (obrigatório) |

| Característica | Valor |
|----------------|-------|
| Exibe | Jogadores fora (lesão, suspensão, dúvida) com motivo |
| Refresh | 60 segundos |
| Tamanho sugerido | 400×400 px |

---

### 16. Bolinha — Comentarista Virtual IA (OBS Widget)

Overlay OBS transparente que exibe o "Bolinha" — um comentarista virtual com IA. Recebe comentários em tempo real via Supabase Realtime (broadcast) e exibe com balão de fala, emoções animadas e áudio TTS (Text-to-Speech via ElevenLabs).

```
# Tamanho padrão (md)
https://unionfc.live/obs/bolinha

# Tamanho pequeno
https://unionfc.live/obs/bolinha?size=sm

# Tamanho grande
https://unionfc.live/obs/bolinha?size=lg
```

| Parâmetro | Valores | Descrição |
|-----------|---------|-----------||
| `size` | `sm`, `md`, `lg` | Tamanho do Bolinha (padrão: `md`) |

| Característica | Valor |
|----------------|-------|
| Exibe | Mascote animado com balão de fala + áudio TTS |
| Emoções | neutro, gol, bravo, analise, sarcastico, tedio |
| Refresh | Realtime (Supabase broadcast, sem polling) |
| Tamanho sugerido | 400×400 px |
| Áudio | Reproduz automaticamente quando recebe mensagem com TTS |
| Animações | Bounce ao receber mensagem, float quando idle |
| Auto-dismiss | Balão desaparece após 8s ou fim do áudio (o que for maior) |

> **Nota**: Este widget não usa `fixture` como parâmetro. Ele recebe mensagens do painel Admin Bolinha (`/admin/bolinha`) via Supabase Realtime.

---

### 🎮 Admin Bolinha — Painel de Controle

Página administrativa para gerenciar o sistema Bolinha. **Não é um widget OBS** — é acessada pelo navegador do apresentador.

```
https://unionfc.live/admin/bolinha
```

**Funcionalidades:**

| Recurso | Descrição |
|---------|-----------||
| **Modo Manual** | Digitar texto + escolher emoção + enviar (com ou sem TTS) |
| **Modo IA** | Enviar prompt para Anthropic gerar comentário automaticamente |
| **Atalhos Rápidos** | Botões pré-configurados: GOL!, Cartão, Substituição, Juiz ladrão, etc. |
| **Preview ao Vivo** | iframe do widget OBS para ver em tempo real o que aparece no stream |
| **Histórico** | Últimas 20 mensagens enviadas com emoção e horário |

**Emoções disponíveis:**

| Emoção | Emoji | Uso |
|--------|-------|-----|
| neutro | 😏 | Comentários gerais |
| gol | ⚽ | Comemorações de gol |
| bravo | 😡 | Indignação, lances polêmicos |
| analise | 🤓 | Análise tática, estatísticas |
| sarcastico | 😒 | Humor, ironia |
| tedio | 😴 | Jogo parado, sem emoção |

**Atalhos rápidos pré-configurados:**

| Atalho | Ação |
|--------|------|
| ⚽ GOL! | Comemora gol com energia |
| 🟨 Cartão! | Comenta cartão polêmico |
| 🔄 Substituição | Comenta substituição |
| 😡 Juiz ladrão! | Indignação com arbitragem |
| 😴 Jogo chato | Reclama do jogo com humor |
| 👏 Golaço! | Elogia jogada espetacular |
| 📊 Intervalo | Resumo sarcástico do 1º tempo |
| 🏁 Fim de Jogo | Veredito final |
| 👋 Olá galera! | Cumprimento aos espectadores |

> **Dependências**: Supabase (Realtime + banco), Edge Functions (`bolinha-comment` via Anthropic, `bolinha-tts` via ElevenLabs), imagens no Supabase Storage (`bolinha-images` bucket).

---

## Configuração no OBS Studio

1. **Adicionar fonte**: Clique `+` → Selecione `Navegador` (Browser)
2. **Colar URL**: Cole a URL do widget, substituindo o ID da partida
3. **Dimensões**: Use os tamanhos sugeridos na tabela acima
4. **Fundo transparente**: Cor de fundo personalizada → RGBA: 0,0,0,0
5. **Atualização**: Automática. Para forçar: clique direito → "Atualizar"

---

## Cenários Prontos

### Placar Minimalista
```
https://unionfc.live/obs/score?fixture=ID
https://unionfc.live/obs/tempo?fixture=ID
```

### Placar Completo com Liga
```
https://unionfc.live/obs/liga?fixture=ID
https://unionfc.live/obs/placar?fixture=ID
```

### Dashboard Lateral
```
https://unionfc.live/obs/stats?fixture=ID&widget=top
https://unionfc.live/obs/eventos?fixture=ID&max=5
```

### Pré-Jogo Completo
```
https://unionfc.live/obs/predicao?fixture=ID     → Previsão
https://unionfc.live/obs/h2h?fixture=ID          → Últimos confrontos
https://unionfc.live/obs/escalacao?fixture=ID    → Escalações
https://unionfc.live/obs/desfalques?fixture=ID   → Lesionados/Suspensos
https://unionfc.live/obs/classificacao?league=LIGA&season=ANO → Tabela
```

### Transmissão Completa (Durante o Jogo)
```
https://unionfc.live/obs/liga?fixture=ID        → Topo
https://unionfc.live/obs/home?fixture=ID        → Esquerda
https://unionfc.live/obs/score?fixture=ID       → Centro
https://unionfc.live/obs/away?fixture=ID        → Direita
https://unionfc.live/obs/tempo?fixture=ID       → Abaixo do placar
https://unionfc.live/obs/stats?fixture=ID       → Lateral
https://unionfc.live/obs/eventos?fixture=ID     → Lateral inferior
https://unionfc.live/obs/ratings?fixture=ID     → Destaques do jogo
https://unionfc.live/obs/bolinha                → Comentarista IA (canto inferior)
```

### Bolinha Standalone
```
https://unionfc.live/obs/bolinha?size=lg         → Widget no OBS
https://unionfc.live/admin/bolinha               → Painel de controle (navegador do apresentador)
```

---

## Tabela Resumo Completa de URLs

| Widget | URL | Refresh |
|--------|-----|--------|
| Placar completo | `/obs/placar?fixture=ID` | 15s |
| Apenas placar | `/obs/score?fixture=ID` | 15s |
| Estatísticas | `/obs/stats?fixture=ID&widget=full\|top\|bottom` | 30s |
| Eventos | `/obs/eventos?fixture=ID&max=N` | 15s |
| Tempo | `/obs/tempo?fixture=ID` | 15s |
| Liga | `/obs/liga?fixture=ID` | 15s |
| Time casa | `/obs/home?fixture=ID` | 15s |
| Time visitante | `/obs/away?fixture=ID` | 15s |
| Enquete | `/obs/enquete?pergunta=...&opcao1=...&opcao2=...` | — |
| Melhores em Campo | `/obs/ratings?fixture=ID` | 30s |
| Escalação | `/obs/escalacao?fixture=ID` | 15s |
| Classificação | `/obs/classificacao?league=ID&season=ANO` | 60s |
| Predição | `/obs/predicao?fixture=ID` | 60s |
| Confronto Direto | `/obs/h2h?fixture=ID` | 60s |
| Desfalques | `/obs/desfalques?fixture=ID` | 60s |
| Bolinha (IA) | `/obs/bolinha?size=sm\|md\|lg` | Realtime |

---

## Páginas Administrativas

| Página | URL | Descrição |
|--------|-----|-----------||
| Admin Bolinha | `/admin/bolinha` | Painel de controle do comentarista virtual IA |

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Widget não carrega | Verifique se o ID da partida está correto |
| Dados não atualizam | Clique direito → Atualizar no OBS |
| Fundo não transparente | Configure cor de fundo como transparente (RGBA: 0,0,0,0) |
| Texto cortado | Aumente as dimensões do browser source |
| "Parâmetro necessário" | Adicione `?fixture=ID` na URL |
| Bolinha não aparece | Verifique se as imagens estão no bucket `bolinha-images` do Supabase Storage |
| Bolinha sem áudio | Verifique se a Edge Function `bolinha-tts` está deployada e `ELEVENLABS_API_KEY` configurada |
| Bolinha sem resposta IA | Verifique se a Edge Function `bolinha-comment` está deployada e `ANTHROPIC_API_KEY` configurada |
| Admin Bolinha sem histórico | Verifique se a tabela `bolinha_messages` existe no Supabase (migration aplicada) |

---

*Testado e verificado em 28/02/2026 — Todos os 16 widgets + Admin Bolinha funcionando ✅*






  URLs de Teste (substituir <FIXTURE_ID> por um ID válido como 1526432):

  | Widget        | URL                                     |
  |---------------|-----------------------------------------|
  | Placar        | /obs/placar?fixture=<FIXTURE_ID>        |
  | Estatísticas  | /obs/stats?fixture=<FIXTURE_ID>         |
  | Eventos       | /obs/eventos?fixture=<FIXTURE_ID>       |
  | Score         | /obs/score?fixture=<FIXTURE_ID>         |
  | Tempo         | /obs/tempo?fixture=<FIXTURE_ID>         |
  | Escalação     | /obs/escalacao?fixture=<FIXTURE_ID>     |
  | Ratings       | /obs/ratings?fixture=<FIXTURE_ID>       |
  | H2H           | /obs/h2h?fixture=<FIXTURE_ID>           |
  | Classificação | /obs/classificacao?fixture=<FIXTURE_ID> |
  | Predição      | /obs/predicao?fixture=<FIXTURE_ID>      |

  Para testar o cache:


