

## Fix: CORS blocking API calls from custom domain `https://unionfc.live`

### Problema

A funcao `isOriginAllowed` no edge function `api-football-proxy` so permite origins de `*.lovable.app`, `*.lovableproject.com` e `localhost`. O novo dominio `https://unionfc.live` nao esta na lista, entao o CORS bloqueia todas as chamadas da API quando acessado pelo dominio customizado.

### Solucao

Editar `supabase/functions/api-football-proxy/index.ts` para adicionar `https://unionfc.live` e `https://www.unionfc.live` na funcao `isOriginAllowed`.

### Mudanca

```text
Arquivo: supabase/functions/api-football-proxy/index.ts
Linha 15-21: isOriginAllowed()

Adicionar:
  if (origin === "https://unionfc.live" || origin === "https://www.unionfc.live") return true;
```

### Arquivo impactado

- `supabase/functions/api-football-proxy/index.ts` (1 linha adicionada na funcao `isOriginAllowed`)

