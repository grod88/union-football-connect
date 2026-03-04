# PROMPT PARA O LOVABLE — Union Football Live

---

## Contexto do Projeto

Crie um site completo para o **Union Football Live**, um canal de lives de futebol que conecta torcedores brasileiros com fãs de futebol ao redor do mundo. O apresentador principal mora na Nova Zelândia e assiste jogos ao vivo com parceiros no Brasil via live streaming. O slogan é **"O Futebol é Melhor Junto / Football is Better Together"**.

O site deve ser bilíngue (PT-BR como principal e inglês), ter visual escuro e premium com tons de preto, dourado, vermelho e branco — seguindo a identidade visual do logo que usa um escudo com globo terrestre, bola de futebol e as cores preto/dourado/vermelho. O estilo geral deve remeter a um estádio à noite com holofotes.

---

## Estrutura de Páginas

### 1. Landing Page (Home)

- **Hero section** com fundo escuro estilo estádio, logo grande do Union Football Live centralizado e o slogan "O Futebol é Melhor Junto / Football is Better Together"
- Espaço para vídeo de apresentação do canal (embed YouTube)
- **Links para redes sociais** com ícones grandes e clicáveis:
  - Instagram: @unionfootball.live
  - TikTok: @unionfootball.live
  - YouTube: @UnionFootballLive
  - Discord: link para o servidor (placeholder por enquanto)
- **Seção "Próximo Jogo"** em destaque (ver detalhes abaixo)
- **Seção "Como Funciona"** — 3 cards explicando o conceito:
  1. "Escolhemos o jogo" — ícone de calendário
  2. "Abrimos a live" — ícone de câmera/streaming
  3. "Assistimos juntos" — ícone de globo com pessoas
- Footer com links, redes sociais e copyright "© 2026 Union Football Live"

### 2. Próximo Jogo (seção na home + página dedicada)

- Card grande e destacado mostrando:
  - Escudos dos dois times (usar imagens da API-Football)
  - Nome dos times
  - Campeonato e fase (ex: "Paulistão 2026 — Quartas de Final")
  - Data e hora do jogo
  - **Conversão automática de fuso horário**: mostrar o horário em pelo menos 3 fusos — Brasil (BRT/UTC-3), Nova Zelândia (NZDT/UTC+13) e horário local do visitante (detectar via browser)
  - **Countdown timer** animado contando regressivamente até o início do jogo
  - Botão "Assistir Live" que linka para o YouTube/plataforma de streaming
  - Botão "Lembrar-me" que salva no calendário do usuário (gerar arquivo .ics)

### 3. Calendário de Lives

- Página com grid/lista de todos os jogos que serão cobertos nas lives
- Filtro por campeonato (Paulistão, Brasileirão, Libertadores, etc.)
- Cada card de jogo mostra: times, data/hora (com fuso), campeonato, status (Agendado / Ao Vivo / Encerrado)
- Jogos ao vivo devem ter badge pulsante "AO VIVO" em vermelho
- Jogos encerrados mostram placar final e link para replay no YouTube

### 4. Ao Vivo (Live Dashboard)

- Página que fica ativa durante as lives, mostrando dados do jogo em tempo real
- Integrar os **widgets da API-Football** (detalhes na seção de integração abaixo)
- Mostrar: placar, tempo, estatísticas comparativas, eventos (gols, cartões), escalações
- Embed do YouTube Live para quem quiser assistir direto no site
- Seção de enquete interativa ("Foi pênalti? SIM / NÃO") com votação em tempo real
- Widget de chat ou link direto para o Discord

### 5. Junte-se à Torcida

- Formulário para quem quer participar como convidado na live
- Campos: Nome, País/Cidade de onde assiste, Time do coração, Instagram/TikTok, Por que quer participar, Qual jogo quer participar
- Após enviar, mostrar mensagem de confirmação e sugerir entrar no Discord
- Os dados podem ser salvos no Supabase ou enviados por email

### 6. De Onde Você Tá Assistindo?

- **Mapa-múndi interativo** com pins/markers mostrando de onde os participantes e espectadores estão assistindo
- Reforça o conceito global do canal
- Visitantes podem adicionar sua localização (cidade + país) via formulário simples
- Mostrar contador total de países representados
- Animação de "pins aparecendo" ao carregar a página

### 7. Histórico de Lives

- Grid de cards com todas as lives anteriores
- Cada card mostra: thumbnail do YouTube, times, placar final, campeonato, data
- Link para replay no YouTube
- Filtro por campeonato e por time
- Opcional: destaques/momentos marcantes de cada live

### 8. Comunidade

- Seção com link grande para o Discord ("Entre na 6ª FILA")
- Explicação do que é a comunidade e o que acontece lá
- Preview de membros/países participantes
- Links para todas as redes sociais

### 9. Newsletter / Notificações

- Formulário de cadastro para receber notificação do próximo jogo
- Campos: Email, Nome, Time preferido
- Opção de receber por email
- Integração com serviço de email (Resend, Mailchimp ou similar)

### 10. Blog / Análises

- Seção de posts curtos sobre os jogos comentados
- Cada post: título, imagem, texto, data, tags (campeonato, times)
- Página de listagem com filtro por campeonato/time
- Página individual do post

### 11. Parceiros / Patrocinadores

- Seção simples (inicialmente na home ou footer) com espaço para logos de parceiros
- Página dedicada "Seja Parceiro" com informações para contato comercial
- Placeholder para quando tiver patrocinadores

---

## Integração API-Football — Widgets e Dados ao Vivo

### Configuração da API

- **API Provider**: API-Football (api-sports.io)
- **API Key**: `f549745a93c4d6d8a848d69cf7382e62`
- **Host**: `v3.football.api-sports.io`
- **Documentação**: https://www.api-football.com/documentation-v3
- **Widgets Docs**: https://www.api-football.com/widgets

### IDs para Testes

- **Liga**: Paulistão A1 — league_id = `475` (API v3) / `7949` (API v2)
- **Time foco**: São Paulo FC — team_id = `126`
- **Season**: `2026`

### Widgets Prontos (Versão 3.1.0 — Recomendada)

Os widgets novos usam web components e são a versão mais atual. Para integrar, incluir o script uma vez na página e usar as tags:

```html
<!-- Script do widget (incluir uma vez por página, antes de </body>) -->
<script type="module" src="https://widgets.api-sports.io/3.1.0/widgets.js"></script>

<!-- Widget de configuração global (incluir uma vez por página) -->
<api-sports-widget
  data-type="config"
  data-key="f549745a93c4d6d8a848d69cf7382e62"
  data-sport="football"
  data-refresh="15"
  data-show-logos="true"
  data-favorite="true"
></api-sports-widget>
```

#### Widget: Games (Lista de Jogos do Dia)
Mostra todos os jogos de uma data, com status ao vivo, finalizados e agendados. Ideal para a página de Calendário e para a Home.

```html
<api-sports-widget
  data-type="games"
  data-league="475"
  data-season="2026"
></api-sports-widget>
```

#### Widget: Game (Detalhes de um Jogo Específico)
Mostra detalhes completos de um jogo: gols, cartões, substituições, estatísticas, escalações. Ideal para a página Ao Vivo.

```html
<api-sports-widget
  data-type="game"
  data-id="FIXTURE_ID_AQUI"
></api-sports-widget>
```

#### Widget: Standings (Classificação)
Mostra a tabela de classificação da liga. Ideal para sidebar ou seção dedicada.

```html
<api-sports-widget
  data-type="standings"
  data-league="475"
  data-season="2026"
></api-sports-widget>
```

#### Widget: Team (Perfil do Time)
Mostra perfil do time, elenco, competições e estatísticas.

```html
<api-sports-widget
  data-type="team"
  data-id="126"
></api-sports-widget>
```

#### Widget: H2H (Confronto Direto)
Mostra histórico de confrontos entre dois times. Ideal para a seção de pré-jogo.

```html
<api-sports-widget
  data-type="h2h"
  data-team-1="TEAM_A_ID"
  data-team-2="TEAM_B_ID"
></api-sports-widget>
```

#### Widget: Player (Perfil do Jogador)
Mostra carreira, stats e informações de um jogador.

```html
<api-sports-widget
  data-type="player"
  data-id="PLAYER_ID_AQUI"
></api-sports-widget>
```

### Widgets Prontos (Versão 1.1.8 — Alternativa Simples)

Se a versão 3.1.0 der problema, usar a versão antiga como fallback:

```html
<!-- Script do widget (incluir uma vez por página) -->
<script type="module" src="https://widgets.api-sports.io/football/1.1.8/widget.js"></script>

<!-- Widget de Fixtures (jogos do dia) -->
<div
  id="wg-api-football-fixtures"
  data-host="v3.football.api-sports.io"
  data-key="f549745a93c4d6d8a848d69cf7382e62"
  data-date="2026-02-21"
  data-league="475"
  data-season="2026"
  data-refresh="60"
  data-theme="dark"
  data-show-errors="false"
  class="api_football_loader"
></div>

<!-- Widget de Fixture específico (detalhes de um jogo) -->
<div
  id="wg-api-football-fixture"
  data-host="v3.football.api-sports.io"
  data-key="f549745a93c4d6d8a848d69cf7382e62"
  data-id="FIXTURE_ID_AQUI"
  data-refresh="15"
  data-theme="dark"
  data-show-errors="false"
  class="api_football_loader"
></div>

<!-- Widget de Standings (classificação) -->
<div
  id="wg-api-football-standings"
  data-host="v3.football.api-sports.io"
  data-key="f549745a93c4d6d8a848d69cf7382e62"
  data-league="475"
  data-season="2026"
  data-refresh="300"
  data-theme="dark"
  data-show-errors="false"
  class="api_football_loader"
></div>
```

**Temas disponíveis para data-theme**: `""` (branco padrão), `"dark"`, `"grey"`, `"blue"`, `"false"` (sem tema, para customização total via CSS).

### API Direta — Endpoints para Páginas Customizadas

Se precisar de dados raw para montar componentes customizados (ex: card de próximo jogo, placar estilizado):

```javascript
// Header padrão para todas as chamadas
const headers = {
  "x-rapidapi-key": "f549745a93c4d6d8a848d69cf7382e62",
  "x-rapidapi-host": "v3.football.api-sports.io"
};

// Buscar próximos jogos do Paulistão
fetch("https://v3.football.api-sports.io/fixtures?league=475&season=2026&next=5", { headers })

// Buscar próximo jogo de um time específico (SPFC)
fetch("https://v3.football.api-sports.io/fixtures?team=126&next=1", { headers })

// Buscar dados ao vivo de um jogo específico
fetch("https://v3.football.api-sports.io/fixtures?id=FIXTURE_ID", { headers })

// Buscar estatísticas de um jogo
fetch("https://v3.football.api-sports.io/fixtures/statistics?fixture=FIXTURE_ID", { headers })

// Buscar eventos de um jogo (gols, cartões, substituições)
fetch("https://v3.football.api-sports.io/fixtures/events?fixture=FIXTURE_ID", { headers })

// Buscar escalações de um jogo
fetch("https://v3.football.api-sports.io/fixtures/lineups?fixture=FIXTURE_ID", { headers })

// Buscar classificação
fetch("https://v3.football.api-sports.io/standings?league=475&season=2026", { headers })

// Buscar H2H entre dois times
fetch("https://v3.football.api-sports.io/fixtures/headtohead?h2h=TEAM1_ID-TEAM2_ID", { headers })
```

**Estrutura de resposta do endpoint fixtures** (para montar card de próximo jogo):
```json
{
  "fixture": {
    "id": 123456,
    "date": "2026-02-22T20:00:00+00:00",
    "status": { "short": "NS", "elapsed": null }
  },
  "league": {
    "id": 475,
    "name": "Paulista - A1",
    "logo": "https://..."
  },
  "teams": {
    "home": { "id": 126, "name": "Sao Paulo", "logo": "https://..." },
    "away": { "id": 121, "name": "Palmeiras", "logo": "https://..." }
  },
  "goals": { "home": null, "away": null }
}
```

**Status de jogo possíveis**:
- `NS` = Not Started
- `1H` = First Half
- `HT` = Halftime
- `2H` = Second Half
- `ET` = Extra Time
- `PEN` = Penalties
- `FT` = Full Time
- `AET` = After Extra Time

---

## Páginas Especiais para OBS (Overlay da Live)

Além do site público, criar **4 rotas/páginas especiais** otimizadas para serem usadas como Browser Source no OBS Studio. Essas páginas devem:

- Ter **fundo totalmente transparente** (`background: transparent`)
- Não ter header, footer, navegação — apenas o conteúdo puro
- Aceitar parâmetro de URL `?fixture=FIXTURE_ID` para selecionar o jogo
- Aceitar parâmetro `?mode=obs` para ativar o modo transparente/limpo
- Atualizar automaticamente (polling) sem necessidade de refresh manual

### Rota: `/obs/placar?fixture=FIXTURE_ID`
- Mostra apenas: escudos dos times, placar grande (ex: "1 - 0"), tempo do jogo e status
- Fundo transparente
- Fonte grande e legível para stream
- Atualiza a cada 15 segundos via endpoint `fixtures?id={fixture_id}`
- Estilo: tipografia bold, cores dourado e branco sobre transparente

### Rota: `/obs/stats?fixture=FIXTURE_ID`
- Mostra barras horizontais comparativas estilo Bet365:
  - Posse de bola (%)
  - Finalizações totais
  - Finalizações no gol
  - Escanteios
  - Faltas
  - Cartões amarelos
  - Cartões vermelhos
- Barras com cores dos times (ou vermelho vs verde)
- Números nas pontas de cada barra
- Fundo transparente
- Atualiza a cada 30 segundos via endpoint `fixtures/statistics?fixture={fixture_id}`

### Rota: `/obs/eventos?fixture=FIXTURE_ID`
- Mostra timeline vertical de eventos do jogo (gols, cartões, substituições)
- Cada evento com: ícone (⚽ gol, 🟨 cartão amarelo, 🟥 cartão vermelho, 🔄 substituição), minuto, nome do jogador
- Eventos do time A à esquerda, time B à direita
- Fundo transparente
- Atualiza a cada 15 segundos via endpoint `fixtures/events?fixture={fixture_id}`

### Rota: `/obs/campo?fixture=FIXTURE_ID`
- Representação visual de um campo de futebol (retângulo verde com linhas brancas)
- Eventos plotados no campo como ícones (gols, faltas, escanteios marcados nas posições)
- Alternativa: usar o widget de Fixture da API-Football com tema customizado e fundo transparente
- Fundo transparente
- Atualiza a cada 15 segundos

### Rota: `/obs/enquete`
- Mostra uma enquete com pergunta customizável e 2-4 opções
- Barra de progresso mostrando % de cada opção
- Aceita parâmetros: `?pergunta=Foi+penalti?&opcao1=SIM&opcao2=NAO`
- Sistema de votação simples (pode usar Supabase realtime)
- Fundo transparente

---

## Design e Identidade Visual

### Cores
- **Primária**: Preto (#0a0a0a) — fundo principal
- **Secundária**: Dourado (#d4a853 ou #c9a84c) — destaques, bordas, títulos
- **Acento**: Vermelho (#c0392b ou #e74c3c) — botões de ação, badges "Ao Vivo"
- **Texto**: Branco (#ffffff) e cinza claro (#b0b0b0)
- **Cards/Superfícies**: Cinza escuro (#1a1a1a, #2a2a2a) com bordas sutis douradas

### Tipografia
- Títulos: Font bold, impactante (Oswald, Bebas Neue ou similar)
- Corpo: Inter, Roboto ou similar — clean e legível
- Números/Placar: Mono ou condensed para dados numéricos

### Elementos Visuais
- Bordas douradas sutis nos cards
- Efeitos de brilho/glow nos elementos em destaque
- Fundo com textura sutil de estádio/grama escurecida
- Ícones de futebol (bola, campo, apito, cartão) como decoração
- Animações suaves nas transições e no countdown
- Badge "AO VIVO" com animação de pulsação em vermelho

### Logo
- O logo do Union Football Live será fornecido como imagem (PNG com fundo transparente)
- Usar no header do site, favicon, e nas páginas OBS como marca d'água

### Responsividade
- Mobile-first: muitos usuários acessarão pelo celular durante os jogos
- Desktop: layout mais amplo com sidebar para widgets de classificação/stats
- Tablet: layout intermediário

---

## Tecnologias Sugeridas

- **Frontend**: React/Next.js (ou o que o Lovable usar)
- **Estilização**: Tailwind CSS com tema escuro
- **Backend/DB**: Supabase para formulários, enquetes, dados de usuários
- **API de Futebol**: API-Football v3 (api-sports.io)
- **Internacionalização**: i18n com PT-BR e EN
- **Email**: Resend ou serviço similar para newsletter

---

## Resumo de Prioridades (MVP)

**Fase 1 — Ir ao ar:**
1. Landing page com logo, slogan, redes sociais
2. Seção "Próximo Jogo" com countdown
3. Página "Ao Vivo" com widgets da API-Football integrados
4. Formulário "Junte-se à Torcida"
5. Rotas OBS (placar, stats, eventos) com fundo transparente

**Fase 2 — Crescimento:**
6. Calendário de lives
7. Histórico de lives com replays
8. Mapa "De onde você tá assistindo?"
9. Newsletter
10. Blog/análises

**Fase 3 — Monetização:**
11. Seção de parceiros/patrocinadores
12. Enquetes avançadas
13. Perfis de usuário / comunidade
