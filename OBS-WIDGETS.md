# Union Football Live - Widgets OBS

Guia completo para integração dos widgets no OBS Studio.

---

## URL Base

```
https://unionfc.lovable.app
```

> **Nota**: Substitua pelo domínio correto se estiver usando ambiente de desenvolvimento ou outro domínio.

---

## Como Obter o ID da Partida (fixture)

O `fixture` é o ID da partida na API-Football. Você pode obter de duas formas:

1. **Via Site**: Acesse `/ao-vivo` ou `/jogos-do-dia` e veja o ID na URL ao clicar em uma partida
2. **Via API-Football**: Consulte diretamente em https://www.api-football.com/

---

## Widgets Disponíveis

### 1. Placar Completo (Scoreboard)

**URL**: `/obs/placar?fixture=ID`

```
https://unionfc.lovable.app/obs/placar?fixture=1234567
```

| Característica | Valor |
|----------------|-------|
| Exibe | Escudos dos times, placar, tempo de jogo |
| Refresh | 15 segundos |
| Animação | Flash ao marcar gol |
| Tamanho sugerido | 800x200 px |

---

### 2. Apenas Placar (Score)

**URL**: `/obs/score?fixture=ID`

```
https://unionfc.lovable.app/obs/score?fixture=1234567
```

| Característica | Valor |
|----------------|-------|
| Exibe | Apenas números do placar (ex: 2 × 1) |
| Refresh | 15 segundos |
| Animação | Flash e zoom ao marcar gol |
| Tamanho sugerido | 300x100 px |

---

### 3. Estatísticas

**URL**: `/obs/stats?fixture=ID&widget=VARIANTE`

```
# Todas as estatísticas (9 indicadores)
https://unionfc.lovable.app/obs/stats?fixture=1234567&widget=full

# Apenas primeiras 4 estatísticas
https://unionfc.lovable.app/obs/stats?fixture=1234567&widget=top

# Estatísticas 5-8
https://unionfc.lovable.app/obs/stats?fixture=1234567&widget=bottom
```

| Parâmetro | Valores | Descrição |
|-----------|---------|-----------|
| `fixture` | número | ID da partida (obrigatório) |
| `widget` | `full`, `top`, `bottom` | Variante (padrão: `full`) |

| Característica | Valor |
|----------------|-------|
| Exibe | Posse, chutes, escanteios, faltas, cartões, etc. |
| Refresh | 30 segundos |
| Tamanho sugerido | 500x400 px (full), 500x250 px (top/bottom) |

**Estatísticas incluídas**:
1. Posse de bola
2. Total de chutes
3. Chutes no gol
4. Escanteios
5. Faltas
6. Cartões amarelos
7. Cartões vermelhos
8. Impedimentos
9. Precisão de passes

---

### 4. Eventos (Timeline)

**URL**: `/obs/eventos?fixture=ID&max=N`

```
# Últimos 8 eventos (padrão)
https://unionfc.lovable.app/obs/eventos?fixture=1234567

# Últimos 5 eventos
https://unionfc.lovable.app/obs/eventos?fixture=1234567&max=5

# Últimos 12 eventos
https://unionfc.lovable.app/obs/eventos?fixture=1234567&max=12
```

| Parâmetro | Valores | Descrição |
|-----------|---------|-----------|
| `fixture` | número | ID da partida (obrigatório) |
| `max` | número | Máximo de eventos (padrão: 8) |

| Característica | Valor |
|----------------|-------|
| Exibe | Gols, cartões, substituições, VAR |
| Refresh | 15 segundos |
| Tamanho sugerido | 400x500 px |

---

### 5. Tempo de Jogo

**URL**: `/obs/tempo?fixture=ID`

```
https://unionfc.lovable.app/obs/tempo?fixture=1234567
```

| Característica | Valor |
|----------------|-------|
| Exibe | Minuto atual (ex: 45+2') + status (AO VIVO, INTERVALO, etc.) |
| Refresh | 15 segundos |
| Cor | Vermelho quando ao vivo, dourado quando parado |
| Tamanho sugerido | 200x60 px |

---

### 6. Nome da Liga

**URL**: `/obs/liga?fixture=ID`

```
https://unionfc.lovable.app/obs/liga?fixture=1234567
```

| Característica | Valor |
|----------------|-------|
| Exibe | Nome da competição + rodada |
| Refresh | 15 segundos |
| Exemplo | "CAMPEONATO PAULISTA — Rodada 10" |
| Tamanho sugerido | 500x50 px |

---

### 7. Time da Casa (Home)

**URL**: `/obs/home?fixture=ID`

```
https://unionfc.lovable.app/obs/home?fixture=1234567
```

| Característica | Valor |
|----------------|-------|
| Exibe | Nome do time mandante com escudo em marca d'água |
| Refresh | 15 segundos |
| Tamanho sugerido | 250x60 px |

---

### 8. Time Visitante (Away)

**URL**: `/obs/away?fixture=ID`

```
https://unionfc.lovable.app/obs/away?fixture=1234567
```

| Característica | Valor |
|----------------|-------|
| Exibe | Nome do time visitante com escudo em marca d'água |
| Refresh | 15 segundos |
| Tamanho sugerido | 250x60 px |

---

### 9. Enquete Interativa

**URL**: `/obs/enquete?pergunta=TEXTO&opcao1=TEXTO&opcao2=TEXTO`

```
# Enquete simples (2 opções)
https://unionfc.lovable.app/obs/enquete?pergunta=Foi+penalti?&opcao1=SIM&opcao2=NAO

# Enquete com 3 opções
https://unionfc.lovable.app/obs/enquete?pergunta=Quem+vai+ganhar?&opcao1=Time+A&opcao2=Empate&opcao3=Time+B

# Enquete com 4 opções
https://unionfc.lovable.app/obs/enquete?pergunta=Melhor+jogador?&opcao1=Jogador+1&opcao2=Jogador+2&opcao3=Jogador+3&opcao4=Jogador+4

# Com votos simulados iniciais
https://unionfc.lovable.app/obs/enquete?pergunta=Foi+penalti?&opcao1=SIM&opcao2=NAO&simular=50
```

| Parâmetro | Valores | Descrição |
|-----------|---------|-----------|
| `pergunta` | texto | Pergunta da enquete (obrigatório) |
| `opcao1` | texto | Primeira opção (obrigatório) |
| `opcao2` | texto | Segunda opção (obrigatório) |
| `opcao3` | texto | Terceira opção (opcional) |
| `opcao4` | texto | Quarta opção (opcional) |
| `simular` | número | Votos iniciais simulados (opcional) |

| Característica | Valor |
|----------------|-------|
| Exibe | Pergunta + opções com contagem de votos |
| Interativo | Sim (clicável) |
| Tamanho sugerido | 400x300 px |

> **Nota**: Use `+` para espaços na URL ou codifique com `%20`

---

## Configuração no OBS Studio

### Passo a Passo

1. **Adicionar fonte**:
   - Clique em `+` na seção "Fontes"
   - Selecione `Navegador` (Browser)

2. **Configurar URL**:
   - Cole a URL do widget desejado
   - Substitua `ID` pelo número da partida

3. **Configurar dimensões**:
   - Largura: conforme sugerido acima
   - Altura: conforme sugerido acima

4. **Fundo transparente**:
   - Marque a opção "Usar cor de fundo personalizada"
   - Deixe a cor totalmente transparente (RGBA: 0,0,0,0)
   - Ou deixe em branco se o OBS suportar

5. **Atualização**:
   - Os widgets atualizam automaticamente
   - Para forçar: clique direito → "Atualizar"

---

## Exemplos de Configuração por Cenário

### Cenário 1: Placar Minimalista
```
/obs/score?fixture=1234567
/obs/tempo?fixture=1234567
```

### Cenário 2: Placar Completo com Liga
```
/obs/liga?fixture=1234567
/obs/placar?fixture=1234567
```

### Cenário 3: Dashboard Lateral
```
/obs/stats?fixture=1234567&widget=top
/obs/eventos?fixture=1234567&max=5
```

### Cenário 4: Transmissão Completa
```
/obs/liga?fixture=1234567        → Topo da tela
/obs/home?fixture=1234567        → Esquerda
/obs/score?fixture=1234567       → Centro
/obs/away?fixture=1234567        → Direita
/obs/tempo?fixture=1234567       → Abaixo do placar
/obs/stats?fixture=1234567       → Lateral
/obs/eventos?fixture=1234567     → Lateral inferior
```

---

## Tabela Resumo de URLs

| Widget | URL | Refresh |
|--------|-----|---------|
| Placar completo | `/obs/placar?fixture=ID` | 15s |
| Apenas placar | `/obs/score?fixture=ID` | 15s |
| Estatísticas | `/obs/stats?fixture=ID&widget=full\|top\|bottom` | 30s |
| Eventos | `/obs/eventos?fixture=ID&max=N` | 15s |
| Tempo | `/obs/tempo?fixture=ID` | 15s |
| Liga | `/obs/liga?fixture=ID` | 15s |
| Time casa | `/obs/home?fixture=ID` | 15s |
| Time visitante | `/obs/away?fixture=ID` | 15s |
| Enquete | `/obs/enquete?pergunta=...&opcao1=...&opcao2=...` | - |

---

## Dicas

1. **Testar antes**: Abra a URL no navegador antes de adicionar no OBS
2. **ID correto**: Certifique-se de usar o ID correto da partida
3. **Partida ao vivo**: Os widgets funcionam melhor com partidas em andamento
4. **Cache do navegador**: Se não atualizar, limpe o cache do browser source no OBS
5. **Múltiplos widgets**: Você pode usar vários widgets do mesmo jogo simultaneamente

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Widget não carrega | Verifique se o ID da partida está correto |
| Dados não atualizam | Clique direito → Atualizar no OBS |
| Fundo não transparente | Configure cor de fundo como transparente nas propriedades |
| Texto cortado | Aumente as dimensões do browser source |
| "Parâmetro necessário" | Adicione `?fixture=ID` na URL |

---

*Documento gerado em 24/02/2026*
