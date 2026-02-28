

## L1 — Tabela bolinha_messages + Realtime

### Migration SQL

Criar a tabela `bolinha_messages` com:
- Colunas: `id`, `fixture_id`, `text`, `emotion`, `team_id`, `audio_url`, `event_type`, `created_at`
- Constraint de emoções válidas via trigger (não CHECK, para evitar problemas de restore)
- Índice por `fixture_id`
- Função de limpeza automática (24h)
- RLS: leitura pública, escrita pública (edge functions usam service_role)
- Realtime habilitado via `ALTER PUBLICATION`

### Observação técnica

Usar validation trigger em vez de CHECK constraint para o campo `emotion`, conforme boas práticas do Supabase (CHECK constraints com valores enum podem causar problemas em restores).

