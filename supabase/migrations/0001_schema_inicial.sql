-- ============================================================
-- lastro · Fase 1 · Tarefa 1.1 — schema inicial
-- Fonte: SDD.md §3.2 (DDL), §3.2 (trigger), §3.3 (RLS)
-- Materialização literal da spec — não redesenhar aqui.
-- ============================================================

-- ============ grupo_muscular: lookup, dado público ============
create table public.grupo_muscular (
  id    text primary key,          -- 'peito', 'costas', 'quadriceps', ...
  nome  text not null              -- rótulo PT-BR para UI
);

-- ============ exercicio: CATÁLOGO CURADO, dado compartilhado ============
create table public.exercicio (
  id                       uuid primary key default gen_random_uuid(),
  nome                     text not null unique,
  grupo_muscular_primario  text not null references public.grupo_muscular(id),
  -- ATRIBUTO DO EXERCÍCIO, não da série (DECISIONS.md 2026-08-04 "Unilateral").
  -- Rosca alternada é sempre unilateral; não é o dono quem decide isso toda
  -- série. O agregador dobra o volume quando este flag é true (§4.5, T-V4).
  unilateral               boolean not null default false,
  dica_execucao            text,          -- CURADA, nunca gerada (FF7). Fase 4.
  criado_em                timestamptz not null default now()
);

-- ============ treino: uma ida à academia ============
create table public.treino (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  data        date not null,
  iniciado_em timestamptz not null default now(),
  criado_em   timestamptz not null default now()
);
create index treino_usuario_data_idx on public.treino (usuario_id, data desc);

-- ============ serie: a unidade atômica do produto ============
create table public.serie (
  id                    uuid    primary key default gen_random_uuid(),
  usuario_id            uuid    not null references auth.users(id) on delete cascade,
  treino_id             uuid    not null references public.treino(id) on delete cascade,
  exercicio_id          uuid    not null references public.exercicio(id),
  ordem                 smallint not null,
  tipo                  text    not null,
  reps                  smallint not null,
  peso                  numeric(6,2) not null,
  unidade               text    not null default 'kg',
  rir                   smallint,
  -- `unilateral` NÃO mora aqui — é atributo do exercício (ver tabela acima).
  -- Marcado assim porque cada série já poderia divergir do catálogo, e a
  -- decisão registrada é que ele não diverge: a série herda do exercício.
  peso_corporal_incluso boolean not null default false,
  criado_em             timestamptz not null default now(),

  constraint serie_tipo_valido  check (tipo in ('aquecimento', 'valendo')),
  constraint serie_reps_positiva check (reps > 0 and reps <= 200),
  constraint serie_peso_valido   check (peso >= 0 and peso <= 1000),
  constraint serie_unidade_valida check (unidade in ('kg', 'lb')),
  -- rir 0 É VÁLIDO: RIR 0 = falha (KNOWLEDGE §1). Escrever `rir > 0` aqui
  -- ressuscita exatamente o bug que o Inspetor achou na Fase 0.
  constraint serie_rir_valido    check (rir is null or (rir >= 0 and rir <= 10)),
  -- RIR é campo de série valendo (PRD §9).
  constraint serie_rir_so_valendo check (rir is null or tipo = 'valendo')
);
create index serie_usuario_criado_idx on public.serie (usuario_id, criado_em desc);
create index serie_treino_idx         on public.serie (treino_id, ordem);

-- ============ trigger de consistência do usuario_id denormalizado ============
-- SEM `security definer`, de propósito: rodando com os privilégios do
-- chamador, a RLS de `treino` esconde o treino de outro usuário, o SELECT
-- volta vazio e o INSERT falha explicitamente aqui — em vez de depender
-- do WITH CHECK lá na frente.
create or replace function public.serie_herda_usuario()
returns trigger language plpgsql set search_path = public as $$
begin
  select t.usuario_id into new.usuario_id from public.treino t where t.id = new.treino_id;
  if new.usuario_id is null then
    raise exception 'treino_id % inexistente', new.treino_id;
  end if;
  return new;
end $$;

create trigger serie_usuario_id_bi before insert or update of treino_id
  on public.serie for each row execute function public.serie_herda_usuario();

-- ============================================================
-- RLS — §3.3, e a armadilha do catálogo
-- ============================================================
alter table public.treino          enable row level security;
alter table public.serie           enable row level security;
alter table public.exercicio       enable row level security;
alter table public.grupo_muscular  enable row level security;

-- Dado de usuário: isolamento total por auth.uid() (FF5).
create policy treino_proprio on public.treino
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

create policy serie_propria on public.serie
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- ⚠️ ARMADILHA: exercicio e grupo_muscular são CATÁLOGO COMPARTILHADO,
-- não dado de usuário. Aplicar `auth.uid()` aqui QUEBRA o catálogo:
-- ninguém enxerga exercício nenhum, porque catálogo não tem dono.
-- Elas precisam de RLS LIGADA (senão o PostgREST expõe escrita), com
-- policy de leitura para autenticado e ESCRITA SÓ POR MIGRAÇÃO/SEED.
-- Não "corrigir" isto depois: está correto assim, e por escrito.
create policy exercicio_leitura on public.exercicio
  for select to authenticated using (true);
create policy grupo_muscular_leitura on public.grupo_muscular
  for select to authenticated using (true);

-- `(select auth.uid())` em vez de `auth.uid()` puro é intencional: o
-- planner avalia a subquery uma vez por statement em vez de por linha.
