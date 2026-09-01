-- supabase/migrations/0016_tabela_parecer.sql

-- ============ parecer: histórico opt-in de pareceres salvos ============
-- A Análise Semanal em si é 100% descartável — gera, mostra, some. Esta
-- tabela existe só para o subconjunto que o dono decide guardar clicando
-- "Salvar este parecer" (nunca automático, SDD.md §10.0).
create table public.parecer (
  id                         uuid primary key default gen_random_uuid(),
  usuario_id                 uuid not null references auth.users(id) on delete cascade,
  pergunta                   smallint not null,
  pergunta_texto             text not null,
  texto                      text not null,
  aviso_falha_interpretativa boolean not null default false,
  evidencia                  jsonb not null,
  idioma                     text not null,
  criado_em                  timestamptz not null default now()
);
create index parecer_usuario_idx on public.parecer (usuario_id, criado_em desc);

alter table public.parecer enable row level security;

create policy parecer_proprio on public.parecer
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- GRANT explícito, não só RLS — sem isto o Postgres nega o OBJETO antes de
-- a RLS ser avaliada (achado real, qa/evidencias/E2E-01/correcao.md e
-- tarefa 1.2 do PROGRESS.md, mesma causa-raiz). Sem `update`: editar um
-- parecer salvo é fora de escopo (SDD.md §10.0).
grant select, insert, delete on public.parecer to authenticated;
