

## Plano: Labels maiores no widget de eventos OBS + remover badge Lovable

### 1. Labels maiores e em negrito no EventItem (variante OBS)

No arquivo `src/presentation/components/events/EventItem.tsx`, na variante `obs` (linhas 32-61):

- **Tempo**: Mudar de `text-sm` para `text-base font-bold` (linha 41)
- **Nome do jogador**: Mudar de `text-sm font-semibold` para `text-lg font-bold` (linha 51)
- **Assist**: Mudar de `text-xs` para `text-sm font-bold` (linha 55)

### 2. Remover badge "Edit in Lovable"

O badge do Lovable nao pode ser removido por codigo. Para desativa-lo:
- Abra **Settings** do projeto (clique no nome do projeto no canto superior esquerdo)
- Ative a opcao **"Hide 'Lovable' Badge"**
- Isso requer um plano pago (Pro ou superior)

### Resumo tecnico

| Alteracao | Arquivo | O que muda |
|-----------|---------|------------|
| Tempo do evento | `EventItem.tsx` linha 41 | `text-sm` -> `text-base font-bold` |
| Nome jogador | `EventItem.tsx` linha 51 | `text-sm font-semibold` -> `text-lg font-bold` |
| Texto assist | `EventItem.tsx` linha 55 | `text-xs` -> `text-sm font-bold` |
| Badge Lovable | Settings do projeto | Ativar "Hide Lovable Badge" |

