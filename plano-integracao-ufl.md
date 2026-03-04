# Union Football Live — Plano de Integração OBS + Dados ao Vivo

## Como Funciona o Conceito Geral

A ideia é simples: você cria **páginas web individuais** (HTML) que puxam dados de uma API de futebol e renderizam visuais específicos (campo, estatísticas, placar). No OBS, você adiciona cada página como um **Browser Source** apontando para a URL correspondente. O OBS renderiza a página como se fosse um navegador invisível, com fundo transparente se necessário.

```
[API-Football] → dados JSON → [Sua Página Web] → visual renderizado → [OBS Browser Source] → overlay na live
```

---

## PASSO 1 — Criar Conta e Obter API Key

1. Acesse **https://dashboard.api-football.com** e crie uma conta gratuita
2. Vá em **Profile** e copie sua **API-KEY**
3. O plano **Free** inclui:
   - 100 requests/dia (todas as competições e endpoints)
   - Widgets gratuitos em todos os planos
   - Dados ao vivo atualizados a cada 15 segundos
4. Para uso em live (muitos requests seguidos), considere o plano pago a partir de **$19/mês** que dá mais requests diários
5. **Importante**: No dashboard, vá em **Coverage** e verifique se o Paulistão (e outras ligas brasileiras) têm cobertura de Statistics, Events, Lineups

---

## PASSO 2 — Descobrir os IDs Necessários

Antes de montar qualquer página, você precisa dos IDs das ligas e times. No dashboard:

1. Vá em **APIs > Football > Ids > Leagues**
2. Pesquise "Paulista" ou "Serie A" para encontrar o league_id (ex: Paulistão = league_id específico do Brasil)
3. Vá em **Ids > Teams** e selecione Brasil para encontrar os IDs dos times
4. Alternativamente, use o **Live Demo** no dashboard para testar endpoints sem código:
   - Endpoint `leagues` com `country=Brazil` para ver todas as ligas
   - Endpoint `fixtures` com `league={id}&season=2026` para ver jogos

**Dica**: Anote numa planilha os IDs que mais vai usar (Paulistão, Brasileirão, Libertadores, times paulistas, etc.)

---

## PASSO 3 — Entender os Widgets Prontos da API-Football

A API-Football oferece **widgets prontos** que funcionam com copy/paste. Existem duas versões:

### Versão Antiga (1.1.8) — Simples, funcional
- **Fixtures Widget** — lista de jogos do dia
- **Fixture Widget** — detalhes de um jogo específico (eventos, estatísticas, lineups, stats de jogadores)
- **Standings Widget** — classificação de uma liga
- **Livescore Widget** — placares ao vivo

Cada widget é um bloco HTML com parâmetros configuráveis:
- `data-host` = endpoint da API
- `data-key` = sua API key
- `data-id` = ID do fixture (para widget de jogo específico)
- `data-refresh` = frequência de atualização em segundos
- `data-theme` = tema visual (white, grey, dark, blue ou false para custom)

### Versão Nova (3.1.0) — Modular, mais rica
- **Games Widget** — lista de jogos interativa
- **Game Widget** — detalhes completos de um jogo com clique
- **Standings Widget** — classificação com navegação
- **Team Widget** — perfil do time, elenco, stats
- **Player Widget** — perfil do jogador
- **H2H Widget** — confronto direto entre dois times

Os widgets novos usam web components (`<api-sports-widget>`) e permitem interligação (clicar num jogo abre detalhes em outro widget).

---

## PASSO 4 — Definir as Páginas/Telas para o OBS

Com base no layout do overlay que vocês já têm, sugiro criar **4 páginas independentes**:

### Página 1: PLACAR + TEMPO
- **O que mostra**: Escudos dos times, placar (0x0), tempo do jogo (45' 1T), status (Ao Vivo / Intervalo / Encerrado)
- **Fonte de dados**: Endpoint `fixtures?id={fixture_id}` — retorna goals.home, goals.away, fixture.status.elapsed, fixture.status.short
- **Refresh**: A cada 15-30 segundos
- **No OBS**: Browser Source com fundo transparente, posicionado na área "PLACAR" e "TEMPO" do overlay

### Página 2: ESTATÍSTICAS (barras comparativas)
- **O que mostra**: Posse de bola, finalizações, finalizações no gol, escanteios, faltas, cartões — em barras horizontais comparativas estilo Bet365
- **Fonte de dados**: Endpoint `fixtures/statistics?fixture={fixture_id}` — retorna array com todas as stats dos dois times
- **Stats disponíveis**: Shots on Goal, Shots off Goal, Total Shots, Blocked Shots, Shots insidebox, Shots outsidebox, Fouls, Corner Kicks, Offsides, Ball Possession, Yellow Cards, Red Cards, Goalkeeper Saves, Total passes, Passes accurate, Passes %
- **Refresh**: A cada 30-60 segundos
- **No OBS**: Browser Source posicionado na área "ESTATÍSTICAS"

### Página 3: CAMPO VIRTUAL (estilo Bet365)
- **O que mostra**: Representação visual do campo com eventos plotados (gols, cartões, substituições) e possivelmente posição da bola
- **Fonte de dados**: Endpoint `fixtures/events?fixture={fixture_id}` — retorna lista de eventos com tipo, tempo, jogador, assistência
- **Complexidade**: Esta é a mais trabalhosa — precisa desenhar um campo SVG/Canvas e plotar os eventos. Considerar usar a representação do **Fixture Widget** da API-Football que já mostra eventos em timeline
- **Alternativa prática**: Usar o widget de Fixture pronto da API-Football que já mostra eventos, lineups e timeline visual, apenas customizando o CSS
- **No OBS**: Browser Source posicionado na área "CAMPO"

### Página 4: ENQUETE INTERATIVA
- **O que mostra**: Pergunta + opções + porcentagem de votos (ex: "Foi pênalti? SIM 66% / NÃO 34%")
- **Fonte de dados**: Pode ser integrado via Straw Poll, Slido, ou sistema próprio simples
- **No OBS**: Browser Source posicionado na área "ENQUETE"

---

## PASSO 5 — Abordagens de Implementação (do mais fácil ao mais customizado)

### Opção A: Widgets Prontos (Zero código / Copy-Paste)
**Nível**: Iniciante | **Tempo**: 1-2 horas | **Custo**: Grátis

1. Criar uma página HTML por widget
2. Colar o código do widget da API-Football
3. Customizar via CSS (cores, fontes, tamanhos)
4. Hospedar localmente ou num servidor simples
5. Apontar o Browser Source do OBS para cada página

**Prós**: Rápido, sem manutenção, atualiza sozinho
**Contras**: Visual limitado aos temas disponíveis, difícil de deixar idêntico ao layout do overlay

### Opção B: Widgets Customizados (CSS avançado)
**Nível**: Intermediário | **Tempo**: 1-2 dias | **Custo**: Grátis

1. Usar os widgets da Opção A
2. Definir `data-theme="false"` para desabilitar o tema padrão
3. Baixar o CSS do widget (disponível na versão 1.1.8)
4. Customizar completamente cores, tipografia, layout, fundo transparente
5. Seguir o tutorial "How Custom API-Football Widgets" para detalhes

**Prós**: Visual totalmente personalizado mantendo a lógica de dados automática
**Contras**: Precisa conhecer CSS, pode quebrar com updates do widget

### Opção C: Páginas Custom com API Direta (Full control)
**Nível**: Avançado | **Tempo**: 1-2 semanas | **Custo**: Depende do plano API

1. Criar páginas HTML/React/Vue que chamam a API diretamente
2. Endpoint principal: `GET https://v3.football.api-sports.io/fixtures?id={id}`
3. Parsear o JSON e renderizar os visuais como quiser
4. Implementar polling (setInterval) para atualizar dados
5. Usar Canvas/SVG para o campo virtual

**Prós**: Controle total do visual e comportamento
**Contras**: Mais trabalho, consome mais requests da API, precisa cuidar de cache e segurança da API key

### Opção D: BeSoccer Streaming Widgets (específico para live)
**Nível**: Intermediário | **Tempo**: Depende do contato com eles | **Custo**: Pago (sob consulta)

A BeSoccer (api.besoccer.com) tem **widgets específicos para streaming** que incluem:
- Módulo superior customizável com título
- Módulo lateral mostrando eventos do jogo (gols, assistências, cartões)
- Módulo inferior com resultado (se vários jogos, mostra gol de outro jogo brevemente)
- Módulo lateral com classificação, outros jogos ao vivo
- QR code para interação

**Prós**: Feito especificamente para streamers/YouTubers, visual profissional
**Contras**: Pago, menos controle sobre customização, depende de contato comercial

---

## PASSO 6 — Configurar o OBS

### Adicionando Browser Source
1. No OBS, na cena da live, clique em **+** nos Sources
2. Selecione **Browser** (Browser Source)
3. Configure:
   - **URL**: URL da sua página (local `file:///` ou hospedada `https://`)
   - **Width/Height**: Ajustar ao tamanho da área no overlay (ex: 400x300 para estatísticas)
   - **Custom CSS**: Pode sobrescrever estilos adicionais aqui
   - **FPS**: 30 é suficiente
   - **Refresh browser when scene becomes active**: Ativar
4. Posicionar e redimensionar o Browser Source sobre a área correspondente do overlay

### Fundo Transparente
Para que a página não tape o overlay, definir no CSS da página:
```
body { background: transparent !important; }
```
E no OBS, deixar a opção de transparência ativa no Browser Source.

### Múltiplos Browser Sources
Você pode ter vários Browser Sources na mesma cena:
- 1 para Placar/Tempo
- 1 para Estatísticas
- 1 para Campo/Eventos
- 1 para Enquete
Cada um com URL e tamanho diferentes, posicionados sobre o template de fundo.

---

## PASSO 7 — Segurança e Otimização

### Proteger a API Key
A API key fica exposta no código HTML. Para proteger:

1. **Whitelist de domínio**: No dashboard da API-Football, configure o domínio permitido (seu site)
2. **BunnyCDN como proxy** (recomendado pela API-Football):
   - Criar Pull Zone no BunnyCDN
   - Configurar para enviar a API key no header automaticamente
   - Suas páginas chamam a URL do BunnyCDN (sem key exposta)
   - BunnyCDN faz cache dos dados (reduz requests)
   - Configurar Allowed Referrers no BunnyCDN para seu domínio

### Cachear para Economizar Requests
- Dados ao vivo mudam a cada 15 segundos — mas você não precisa atualizar tão rápido
- Configure `data-refresh="60"` nos widgets (1 minuto) para reduzir consumo
- Se usar API direta, faça polling a cada 30-60 segundos
- Com BunnyCDN, configure cache de 15-30 segundos para ter dados frescos sem gastar requests

---

## PASSO 8 — Integração com o Site (Lovable)

No site que vai criar no Lovable, as mesmas páginas de widgets podem ter dupla função:

1. **Na live (OBS)**: Browser Source renderiza só o widget, sem header/footer, fundo transparente
2. **No site (visitantes)**: Mesma página embarcada dentro do layout do site, com contexto visual completo

Para isso, usar parâmetros na URL para controlar o modo:
- `suapagina.com/stats?fixture=123&mode=obs` → limpo, transparente, para OBS
- `suapagina.com/stats?fixture=123` → com layout do site, para visitantes

O site no Lovable pode ter uma página de "Ao Vivo" que mostra os mesmos dados que aparecem no OBS, permitindo que quem não está assistindo a live veja as stats em tempo real.

---

## PASSO 9 — Fluxo de Trabalho no Dia da Live

1. **Antes da live**: Encontrar o `fixture_id` do jogo no dashboard da API-Football
2. **Configurar**: Atualizar o parâmetro do fixture nas URLs dos Browser Sources (ou na página se tiver um seletor)
3. **Testar**: Abrir as páginas no navegador para confirmar que os dados estão aparecendo
4. **Iniciar OBS**: Verificar que todos os Browser Sources estão renderizando
5. **Durante a live**: Os widgets atualizam automaticamente — não precisa fazer nada
6. **Idealmente**: Criar um painel admin simples onde você digita o fixture_id e todas as páginas atualizam automaticamente (via localStorage, WebSocket ou parâmetro compartilhado)

---

## Recomendação Final

Para começar **rápido** e ir ao ar logo:

1. ✅ **Comece com Opção A/B** (Widgets prontos customizados)
2. ✅ Use o **Fixture Widget** para estatísticas e eventos — já vem tudo pronto
3. ✅ Use o **Standings Widget** para classificação na hora dos intervalos
4. ✅ Customize o CSS para combinar com o visual do Union Football Live
5. ✅ Hospede as páginas no mesmo servidor do site Lovable

Para **evoluir** depois:

6. 🔄 Migre para **Opção C** (páginas custom) quando quiser controle total do visual
7. 🔄 Implemente o **campo virtual SVG** com eventos plotados
8. 🔄 Adicione **BunnyCDN** para segurança e cache
9. 🔄 Crie o **painel admin** para trocar fixture_id sem mexer no OBS
10. 🔄 Avalie os **BeSoccer Streaming Widgets** se quiser uma solução all-in-one profissional

---

## Endpoints Principais da API-Football v3

| Endpoint | O que retorna | Uso no projeto |
|---|---|---|
| `fixtures?id={id}` | Dados do jogo (placar, status, tempo) | Placar + Tempo |
| `fixtures/statistics?fixture={id}` | Stats comparativas (posse, chutes, etc) | Barras de estatísticas |
| `fixtures/events?fixture={id}` | Eventos (gols, cartões, substituições) | Campo virtual / Timeline |
| `fixtures/lineups?fixture={id}` | Escalações com formação | Tela de escalação |
| `fixtures/players?fixture={id}` | Stats individuais dos jogadores | Stats detalhadas |
| `standings?league={id}&season={year}` | Classificação da liga | Widget de classificação |
| `fixtures?live=all` | Todos os jogos ao vivo agora | Seletor de jogos |
| `odds/live?fixture={id}` | Odds ao vivo | Opcional para comparação |

---

## Alternativas à API-Football

| Provedor | Prós | Contras |
|---|---|---|
| **API-Football** | Widgets prontos, docs completa, plano free | 100 req/dia no free |
| **Sportmonks** | Widgets configuráveis via dashboard, boa cobertura | Mais caro, 14 dias trial |
| **BeSoccer** | Widget específico para streaming | Pago, contato comercial |
| **Football-Data.org** | Gratuita, simples | Sem widgets, cobertura limitada |
| **AllSportsAPI** | Widgets prontos gratuitos | Menos ligas brasileiras |