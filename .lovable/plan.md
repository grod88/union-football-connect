
# Plano: Melhorias na Pagina Junte-se + Correcao Comunidade

## Problemas Identificados

1. **Pagina Comunidade quebrada**: O Header tem link para `/comunidade` mas nao existe componente nem rota registrada no `App.tsx`. Resultado: pagina 404.
2. **Time do Coracao e campo de texto livre**: precisa virar combo dinamico baseado no pais.
3. **Formulario nao grava dados**: apenas faz `console.log`.

---

## O Que Sera Feito

### 1. Corrigir pagina Comunidade
- Redirecionar `/comunidade` para `/junte-se` (sao a mesma funcionalidade), adicionando a rota no `App.tsx` como redirect. Assim o link no menu para de dar erro.

### 2. Criar tabelas no banco de dados

**Tabela `teams`** (cache de times por pais):
- `id` (bigint, PK) -- ID do time na API-Football
- `name` (text)
- `logo` (text)
- `country` (text) -- codigo ISO (BR, NZ, etc.)
- `country_name` (text) -- nome completo
- `created_at` (timestamptz)
- RLS: SELECT publico (sem login necessario)

**Tabela `community_members`** (cadastros):
- `id` (uuid, PK)
- `name` (text)
- `email` (text, unique)
- `country` (text)
- `favorite_team_id` (bigint, FK para teams, nullable)
- `favorite_team_name` (text, nullable)
- `message` (text, nullable)
- `created_at` (timestamptz)
- RLS: INSERT publico, SELECT bloqueado (dados privados)

### 3. Criar Edge Function `sync-teams`

Nova funcao que:
- Recebe `?country=BR`
- Converte codigo ISO para nome (BR -> Brazil, NZ -> New Zealand, etc.)
- Chama API-Football `/teams?country=Brazil`
- Faz upsert na tabela `teams`
- Retorna os times salvos

### 4. Criar Edge Function `community-register`

Nova funcao que:
- Recebe POST com dados do formulario
- Valida campos (nome e email obrigatorios, limites de tamanho)
- Insere na tabela `community_members`
- Trata erro de email duplicado com mensagem amigavel

### 5. Atualizar formulario JoinUs.tsx

- **Deteccao automatica de pais**: usar a API gratuita `https://ipapi.co/json/` para detectar o pais do usuario e pre-selecionar no combo
- **Combo de times dinamico**: ao selecionar um pais, buscar times da tabela `teams` via Supabase client. Se nao houver times para aquele pais, chamar `sync-teams` para popular o cache, depois recarregar
- **Substituir campo texto** "Time do Coracao" por um select com busca (lista de times com logo)
- **Submit real**: chamar `community-register` ao enviar o formulario
- **Validacao**: usar zod para validar campos no frontend

### 6. Atualizar config.toml

Adicionar as duas novas Edge Functions:
```text
[functions.sync-teams]
verify_jwt = false

[functions.community-register]
verify_jwt = false
```

---

## Detalhes Tecnicos

### Fluxo de carregamento de times

```text
Pagina carrega
  -> Chama ipapi.co/json para detectar pais
  -> Pre-seleciona pais no combo
  -> Busca times: SELECT * FROM teams WHERE country = 'BR' ORDER BY name
  -> Se vazio: chama sync-teams?country=BR
  -> Recarrega combo de times
```

### Mapeamento de paises

| Codigo | Nome API-Football |
|--------|-------------------|
| BR | Brazil |
| NZ | New Zealand |
| AU | Australia |
| PT | Portugal |
| US | USA |

### Arquivos a criar/modificar

| Arquivo | Acao |
|---------|------|
| Migration SQL | Criar tabelas `teams` e `community_members` com RLS |
| `supabase/functions/sync-teams/index.ts` | Nova Edge Function |
| `supabase/functions/community-register/index.ts` | Nova Edge Function |
| `supabase/config.toml` | Adicionar config (automatico) |
| `src/presentation/pages/site/JoinUs.tsx` | Refatorar formulario completo |
| `src/App.tsx` | Adicionar redirect de `/comunidade` para `/junte-se` |

### Validacao do formulario (zod)

- `name`: 1-100 caracteres, obrigatorio
- `email`: email valido, max 255, obrigatorio
- `country`: obrigatorio
- `favorite_team_id`: numero opcional
- `message`: max 1000 caracteres, opcional
