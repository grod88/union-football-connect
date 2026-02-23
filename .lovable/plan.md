

## Fix: Confronto Direto overflow no grid de 2 colunas

### Problema

No `PreMatchDetailPanel`, o grid `md:grid-cols-2` divide o espaco entre Predicao e H2H. O H2HCard usa `shrink-0` nos containers dos logos, impedindo que encolham quando o espaco e limitado. Resultado: o logo do time 2 (Club Brugge) extravasa o card.

### Solucao

Editar `src/presentation/components/match/H2HCard.tsx`:

1. Remover `shrink-0` dos containers dos logos de time (linhas 66 e 86) - permitir que encolham
2. Adicionar `min-w-0` no container flex principal do summary para permitir shrink dos filhos
3. Adicionar `overflow-hidden` no card root para cortar qualquer overflow residual
4. Reduzir logo sizes para `w-6 h-6` no mobile (era `w-7 h-7`)
5. Reduzir `max-w` dos nomes dos times para `max-w-[48px]` no mobile

### Mudancas tecnicas

| Linha | De | Para |
|-------|----|------|
| Root div (linha 55) | `card-surface rounded-xl p-4 md:p-6` | `card-surface rounded-xl p-4 md:p-6 overflow-hidden` |
| Summary container (linha 65) | `flex items-center justify-center gap-2 sm:gap-4 md:gap-8 mb-6` | `flex items-center justify-center gap-1.5 sm:gap-4 md:gap-8 mb-6 min-w-0` |
| Logo containers (linhas 66, 86) | `shrink-0` | `shrink min-w-0` |
| Logo img (linhas 67, 87) | `w-7 h-7 sm:w-10 sm:h-10` | `w-6 h-6 sm:w-10 sm:h-10` |
| Nome truncate (linhas 68, 88) | `max-w-[56px]` | `max-w-[48px]` |
| Stats gap (linha 71) | `gap-2 sm:gap-3` | `gap-1.5 sm:gap-3` |

### Arquivo impactado

- `src/presentation/components/match/H2HCard.tsx`

