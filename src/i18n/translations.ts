export const translations = {
  'pt-BR': {
    // Nav
    nav: {
      home: 'Início',
      live: 'Ao Vivo',
      todayMatches: 'Jogos do Dia',
      joinUs: 'Junte-se',
      community: 'Comunidade',
    },
    // Hero
    hero: {
      tagline: 'O Futebol é Melhor Junto',
      taglineSub: 'Football is Better Together',
    },
    // Next Match
    nextMatch: {
      title: 'Próximas Lives',
      loading: 'Carregando...',
      error: 'Não foi possível carregar o próximo jogo.',
      watchLive: 'Assistir Live',
      days: 'Dias',
      hours: 'Horas',
      min: 'Min',
      sec: 'Seg',
    },
    // How It Works
    howItWorks: {
      title: 'Como Funciona',
      step1Title: 'Escolhemos o Jogo',
      step1Desc: 'Selecionamos os melhores jogos da rodada para assistir juntos.',
      step2Title: 'Abrimos a Live',
      step2Desc: 'Entramos ao vivo no YouTube com comentários e reações em tempo real.',
      step3Title: 'Assistimos Juntos',
      step3Desc: 'Torcedores do Brasil, Nova Zelândia e do mundo inteiro conectados pelo futebol.',
    },
    // Video
    video: {
      title: 'Conheça o Canal',
      description: 'Assista um pouco de como são nossas lives — emoção, zoeira e futebol de verdade!',
      placeholder: 'Vídeo de apresentação em breve',
    },
    // Footer
    footer: {
      copyright: '© 2026 Union Football Live. O Futebol é Melhor Junto.',
    },
    // Today Matches
    todayMatches: {
      title: 'Jogos do Dia',
      subtitle: 'Campeonato Paulista 2026',
      noMatches: 'Nenhum jogo programado para hoje.',
      loading: 'Carregando jogos...',
      error: 'Erro ao carregar jogos.',
      venue: 'Local',
      referee: 'Árbitro',
      round: 'Rodada',
      notStarted: 'Não Iniciado',
      finished: 'Encerrado',
      live: 'AO VIVO',
      halftime: 'Intervalo',
      kickoff: 'Início',
      allMatches: 'Todos os jogos de hoje',
    },
  },
  en: {
    nav: {
      home: 'Home',
      live: 'Live',
      todayMatches: "Today's Matches",
      joinUs: 'Join Us',
      community: 'Community',
    },
    hero: {
      tagline: 'Football is Better Together',
      taglineSub: 'O Futebol é Melhor Junto',
    },
    nextMatch: {
      title: 'Upcoming Lives',
      loading: 'Loading...',
      error: 'Could not load the next match.',
      watchLive: 'Watch Live',
      days: 'Days',
      hours: 'Hours',
      min: 'Min',
      sec: 'Sec',
    },
    howItWorks: {
      title: 'How It Works',
      step1Title: 'We Pick the Match',
      step1Desc: 'We select the best matches of the round to watch together.',
      step2Title: 'We Go Live',
      step2Desc: 'We stream live on YouTube with real-time commentary and reactions.',
      step3Title: 'We Watch Together',
      step3Desc: 'Fans from Brazil, New Zealand and around the world connected by football.',
    },
    video: {
      title: 'Discover Our Channel',
      description: 'Watch a bit of what our streams look like — emotion, banter and real football!',
      placeholder: 'Intro video coming soon',
    },
    footer: {
      copyright: '© 2026 Union Football Live. Football is Better Together.',
    },
    todayMatches: {
      title: "Today's Matches",
      subtitle: 'Campeonato Paulista 2026',
      noMatches: 'No matches scheduled for today.',
      loading: 'Loading matches...',
      error: 'Error loading matches.',
      venue: 'Venue',
      referee: 'Referee',
      round: 'Round',
      notStarted: 'Not Started',
      finished: 'Finished',
      live: 'LIVE',
      halftime: 'Half Time',
      kickoff: 'Kick-off',
      allMatches: "All today's matches",
    },
  },
} as const;

export type Locale = keyof typeof translations;

// Use a generic shape so both locales are assignable
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends string ? string : DeepStringify<T[K]>;
};
export type TranslationKeys = DeepStringify<typeof translations['pt-BR']>;
