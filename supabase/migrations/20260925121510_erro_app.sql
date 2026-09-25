-- ============================================================
-- lastro · PU-07 — monitoramento de erro em produção (abertura ao público)
-- ============================================================
-- Sem conta externa (Sentry pede uma): o próprio app grava o erro numa
-- tabela e o dono lê por SQL. `instrumentation.ts` (servidor) e
-- `/api/erros` (navegador) escrevem com a service_role.
--
-- RLS ligada e NENHUMA policy: nem a própria conta lê ou escreve aqui, só a
-- service_role (que ignora RLS). O grant é revogado também, por garantia.
-- O texto é sanitizado antes de chegar (`monitoramento/sanitizar.ts`): sem
-- e-mail, sem token, rota sem query. `usuario_id` fica para achar o bug de
-- quem o relatou, e vira null se a conta for excluída.
--
-- Retenção de 30 dias, limpa por pg_cron às 03:17 UTC.
-- ============================================================

create table public.erro_app (
  id         uuid primary key default gen_random_uuid(),
  criado_em  timestamptz not null default now(),
  origem     text not null check (origem in ('servidor', 'cliente')),
  mensagem   text not null,
  pilha      text,
  rota       text,
  digest     text,
  tipo_rota  text,
  agente     text,
  usuario_id uuid references auth.users (id) on delete set null
);

alter table public.erro_app enable row level security;
revoke all on public.erro_app from anon, authenticated;

create index erro_app_criado_em_idx on public.erro_app (criado_em desc);
create index erro_app_usuario_idx on public.erro_app (usuario_id, criado_em desc)
  where usuario_id is not null;

create extension if not exists pg_cron;

select cron.schedule(
  'limpar-erro-app',
  '17 3 * * *',
  $$delete from public.erro_app where criado_em < now() - interval '30 days'$$
);
