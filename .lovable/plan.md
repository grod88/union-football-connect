

## Correção: Próximas Lives com jogos específicos

### Problema
O `NextMatchCard` só aceita `teamId`, então busca o próximo jogo genérico do time. O usuário quer especificamente:
1. **Palmeiras vs Novorizontino** — Final do Paulistão (liga 475)
2. **São Paulo vs Chapecoense** — próximo jogo do São Paulo

### Alterações

**1. `src/presentation/components/match/NextMatchCard.tsx`**
- Adicionar prop `leagueId` ao componente
- Passar `leagueId` para o hook `useNextMatch`

**2. `src/components/NextMatchSection.tsx`**
- Passar `leagueId={LEAGUES.PAULISTAO}` (475) no card do Palmeiras para garantir que busca o jogo da final do Paulistão
- Manter o card do São Paulo como está (busca genérica pelo próximo jogo)
- Links do YouTube já estão corretos

### Resultado
O card do Palmeiras vai buscar especificamente o próximo jogo do Palmeiras no Paulistão (liga 475), que será a final contra o Novorizontino. O card do São Paulo busca o próximo jogo dele normalmente.

