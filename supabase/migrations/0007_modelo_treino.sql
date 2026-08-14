-- supabase/migrations/0007_modelo_treino.sql

-- ============ modelo_treino: lista de exercícios reaproveitável ============
-- ADR-009 / FF8: esta tabela e a seguinte NUNCA são lidas por
-- src/lib/analise/ nem pelo route handler da Gemini. Deliberadamente sem
-- coluna de série, peso, reps, rir ou tipo — é o que mantém isto do lado
-- "lista de atalho" e não "programa prescrito" (KNOWLEDGE.md §3.8 item 1).
create table public.modelo_treino (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  nome        text not null,
  criado_em   timestamptz not null default now()
);
create index modelo_treino_usuario_idx on public.modelo_treino (usuario_id, criado_em desc);

alter table public.modelo_treino enable row level security;

create policy modelo_treino_proprio on public.modelo_treino
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- SEM `update`: editar um modelo depois de criado é FORA de escopo (SDD §9.0).
-- Omitir o grant torna esse limite verdadeiro por construção, não por
-- convenção de código — o mesmo raciocínio do FF8 aplicado ao Postgres.
grant select, insert, delete on public.modelo_treino to authenticated;

-- ============ modelo_treino_exercicio: quais exercícios, em que ordem ============
create table public.modelo_treino_exercicio (
  id               uuid primary key default gen_random_uuid(),
  modelo_treino_id uuid not null references public.modelo_treino(id) on delete cascade,
  exercicio_id     uuid not null references public.exercicio(id),
  ordem            smallint not null
);
create index modelo_treino_exercicio_modelo_idx
  on public.modelo_treino_exercicio (modelo_treino_id, ordem);

alter table public.modelo_treino_exercicio enable row level security;

-- Sem usuario_id denormalizado aqui (diverge do padrão treino/serie de
-- propósito): não há trigger de herança porque o `on delete cascade` de
-- modelo_treino_id já impede linha órfã, e o volume desta tabela (algumas
-- dezenas de linhas por usuário, no máximo) não paga o custo de
-- denormalizar só para simplificar a policy. RLS por EXISTS/join é FF5
-- válida do mesmo jeito — a fitness function pede "toda tabela com dado
-- de usuário tem RLS por auth.uid()", não que a checagem seja direta.
create policy modelo_treino_exercicio_proprio on public.modelo_treino_exercicio
  for all to authenticated
  using (
    exists (
      select 1 from public.modelo_treino m
      where m.id = modelo_treino_exercicio.modelo_treino_id
        and m.usuario_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.modelo_treino m
      where m.id = modelo_treino_exercicio.modelo_treino_id
        and m.usuario_id = (select auth.uid())
    )
  );

-- SEM `update` pelo mesmo motivo acima: reordenar é FORA (SDD §9.0). Delete
-- existe porque excluir o modelo inteiro cobre a única forma de "desfazer".
grant select, insert, delete on public.modelo_treino_exercicio to authenticated;
