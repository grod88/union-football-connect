

## Validar e Atualizar monitored_leagues

### Situacao atual

A tabela `monitored_leagues` ja existe no banco com 10 ligas, mas precisa de ajustes:

1. **Coluna `country_flag` nao existe** -- a tabela nao tem esse campo. Sera adicionado via migration.
2. **Prioridades incorretas**: Premier League esta como prioridade 2 (deveria ser 3), Serie B esta como prioridade 3 (deveria ser 2).
3. **9 ligas faltando**: Europa League, Conference League, FIFA Club World Cup, Bundesliga, Ligue 1, Primeira Liga, Eredivisie, Copa Argentina, Copa de la Liga Argentina.
4. **`is_active` incorreto**: Premier League, Serie B, La Liga, Serie A estao como `false` mas deveriam ser `true`.

### Plano de execucao

#### 1. Migration SQL

Adicionar coluna `country_flag` e ajustar dados:

```text
ALTER TABLE monitored_leagues ADD COLUMN IF NOT EXISTS country_flag TEXT;
```

#### 2. Upsert de todas as 19 ligas

Usando upsert (ON CONFLICT DO UPDATE) para corrigir as 10 existentes e inserir as 9 novas:

**Prioridade 1 (4 ligas)** -- sem mudanca, apenas adicionar flag:
- 475 Paulistao, 71 Brasileirao A, 73 Copa do Brasil, 13 Libertadores

**Prioridade 2 (6 ligas)** -- corrigir Serie B (era 3), adicionar 3 novas:
- 11 Sul-Americana, 72 Serie B, 2 Champions League, 3 Europa League, 848 Conference League, 15 FIFA Club World Cup

**Prioridade 3 (9 ligas)** -- corrigir Premier League (era 2), adicionar 5 novas:
- 39 Premier League, 140 La Liga, 135 Serie A, 78 Bundesliga, 61 Ligue 1, 94 Primeira Liga, 88 Eredivisie, 128 Copa Argentina, 130 Copa de la Liga Argentina

Todas com `is_active = true`.

#### 3. Atualizar types TypeScript

A coluna `country_flag` sera refletida automaticamente no `types.ts` apos a migration. O tipo `monitored_leagues` ganhara o campo `country_flag: string | null`.

#### 4. Verificacao

Executar SELECT para confirmar 19 ligas com prioridades e flags corretas.

### Resumo de mudancas

| Acao | Detalhes |
|------|----------|
| Migration SQL | ADD COLUMN country_flag TEXT |
| Data upsert | 19 ligas (4 P1, 6 P2, 9 P3) |
| Correcoes | Premier League 2->3, Serie B 3->2, todos is_active=true |
| Types | Atualizado automaticamente com country_flag |

