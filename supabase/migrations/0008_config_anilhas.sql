-- supabase/migrations/0008_config_anilhas.sql
-- backlog C3 — calculadora de anilhas configurável (decisão do dono,
-- 2026-08-13: inventário varia por academia, sem padrão chutado).
-- Colunas em public.usuario, não tabela nova: é config pessoal de baixo
-- volume, mesmo raciocínio de custo/benefício já usado em
-- modelo_treino_exercicio (SDD §9.1) — RLS e grant de usuario já cobrem.

alter table public.usuario
  add column peso_barra numeric(6,2) not null default 20,
  add column anilhas_disponiveis numeric(6,2)[] not null default
    array[20, 15, 10, 5, 2.5, 1.25]::numeric(6,2)[];

-- grant já existe (migração 0004: select, update on public.usuario) —
-- colunas novas herdam o mesmo grant de tabela, nada a conceder aqui.
