-- ============================================================
-- lastro · migração 0004 — perfil do usuário (nome, foto)
-- PROGRESS.md pendência 4. Fonte: DECISIONS.md 2026-08-07 "Perfil do
-- usuário — tabela dedicada, avatar do Google baixado para Storage".
-- ============================================================

-- ============ usuario: um perfil por conta ============
create table public.usuario (
  id          uuid primary key references auth.users(id) on delete cascade,
  nome        text not null,
  -- URL pública no bucket `avatares`, nunca a avatar_url crua do Google
  -- (DECISIONS.md 2026-08-07) — null até o download acontecer (ou pra
  -- sempre, em conta criada por e-mail).
  avatar_url  text,
  criado_em   timestamptz not null default now()
);

alter table public.usuario enable row level security;

create policy usuario_proprio on public.usuario
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- RLS filtra linha, não objeto — sem GRANT o Postgres nega antes da RLS
-- ser avaliada (mesma lição da migração 0002). `usage on schema public`
-- já foi concedido lá; não repetir aqui.
grant select, update on public.usuario to authenticated;

-- ============================================================
-- Trigger: cria o perfil no instante em que a conta nasce
-- ============================================================
-- SECURITY DEFINER aqui É o padrão certo — diverge de propósito do
-- trigger `serie_herda_usuario` (0001), que roda SEM definer porque
-- precisa que a RLS de `treino` barre o insert de série em treino
-- alheio. Este trigger não tem esse papel: ele só espelha o cadastro
-- de auth.users pra public.usuario, e o `authenticated` do próprio
-- signup ainda não tem sessão (nem policy) no instante em que a linha
-- de auth.users é gravada — sem definer, o insert falha sempre.
--
-- `coalesce` com 3 níveis é o que impede este trigger de derrubar o
-- signup/OAuth inteiro: um trigger que lança exceção em auth.users
-- aborta a criação da conta, não só a do perfil. full_name cobre
-- Google; nome cobre e-mail (passado via `options.data` no signUp);
-- o e-mail sem @ nunca falha o split_part, mas o fallback garante que
-- nenhuma conta nasça com nome null mesmo se um provedor futuro não
-- mandar metadado nenhum.
create or replace function public.usuario_cria_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.usuario (id, nome)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'nome',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger usuario_novo_perfil after insert on auth.users
  for each row execute function public.usuario_cria_perfil();

-- ============================================================
-- Backfill: contas que já existiam antes desta migração
-- ============================================================
-- O trigger acima só dispara em INSERT novo. Sem isto, toda conta
-- criada antes de hoje (inclusive o login real do dono via Google,
-- verificado na tarefa 2.1) fica sem linha em usuario — nome null na
-- barra de topo pro único usuário real, mascarado porque qualquer
-- usuário de QA efêmero criado DEPOIS desta migração passa pelo
-- trigger normalmente e não expõe o buraco.
insert into public.usuario (id, nome)
select
  id,
  coalesce(
    raw_user_meta_data ->> 'full_name',
    raw_user_meta_data ->> 'nome',
    split_part(email, '@', 1)
  )
from auth.users
on conflict (id) do nothing;

-- ============================================================
-- Storage: bucket `avatares`
-- ============================================================
-- Bucket PÚBLICO — decisão explícita, registrada em DECISIONS.md
-- 2026-08-07, não silenciosa. Diverge da postura "RLS em tudo" do
-- resto do projeto (FF5): avatar de foto de perfil não é dado sensível
-- como série/treino, e público evita o custo de assinar URL a cada
-- render da barra de topo. Escrita continua restrita ao dono do
-- arquivo, só a leitura é aberta.
insert into storage.buckets (id, name, public)
values ('avatares', 'avatares', true)
on conflict (id) do nothing;

create policy avatares_leitura_publica on storage.objects
  for select using (bucket_id = 'avatares');

create policy avatares_escrita_propria on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy avatares_atualizacao_propria on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatares'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
