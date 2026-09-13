-- ============================================================
-- lastro · 0026 — o tipo da conta é escolhido UMA vez, no nascimento
-- (PRD §11, emenda 2026-09-13; DECISIONS 2026-09-13 (1))
-- ============================================================
-- A 0025 abriu `ativar_area_de_trabalho` para QUALQUER conta: quem já
-- treinava informava o CREF e ganhava a fila. O dono corrigiu a regra:
--
--   · conta que nasce USUÁRIO continua usuário para sempre;
--   · os dois modos (treino / trabalho) são só de quem NASCEU personal;
--   · personal nasce pelo cadastro com e-mail (cápsula) OU pelo Google —
--     e no Google a escolha acontece logo depois do primeiro login, com
--     CREF e WhatsApp obrigatórios se a escolha for PERSONAL.
--
-- O Google não passa pela cápsula, então a conta nasce SEM tipo escolhido
-- (`tipo_escolhido = false`). Enquanto estiver assim, o app manda para a
-- tela de escolha. Escolheu, acabou: `escolher_tipo_conta` só roda uma
-- vez por conta.
--
-- Ninguém usou o caminho aberto pela 0025: conferido em 2026-09-13, as
-- únicas contas `personal` do banco nasceram personal no cadastro.
--
-- COMPATIBILIDADE COM A `main`: toda conta existente recebe
-- `tipo_escolhido = true` (quem já existe já é o que é). O código vivo não
-- lê a coluna nova.
-- ============================================================


-- ============================================================
-- 1. A conta sabe se o tipo já foi escolhido
-- ============================================================
alter table public.usuario
  add column if not exists tipo_escolhido boolean not null default true;

comment on column public.usuario.tipo_escolhido is
  'false só em conta recém-criada sem tipo no cadastro (Google). Vira true em escolher_tipo_conta(), uma vez. Fora do GRANT de update: a conta não reabre a própria escolha.';


-- ============================================================
-- 2. O trigger de cadastro marca quem nasceu sem escolher
-- ============================================================
-- Corpo da 0025, mais `tipo_escolhido`. O cadastro por e-mail do app
-- SEMPRE manda `tipo_conta` no metadado (cápsula), então só o Google — ou
-- um signUp direto sem metadado — nasce pendente. Continua sem levantar
-- exceção: roda dentro do insert em `auth.users`.
create or replace function public.usuario_cria_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_telefone text := nullif(new.raw_user_meta_data ->> 'telefone_whatsapp', '');
  v_tipo     text := nullif(new.raw_user_meta_data ->> 'tipo_conta', '');
  v_cref     text := nullif(new.raw_user_meta_data ->> 'cref', '');
  v_escolhido boolean := v_tipo is not null;
begin
  if v_telefone is not null and v_telefone !~ '^[1-9][0-9]{9,14}$' then
    v_telefone := null;
  end if;

  if v_tipo is distinct from 'personal' then
    v_tipo := 'aluno';
  end if;

  if v_cref is not null and not public.cref_valido(v_cref) then
    v_cref := null;
  end if;

  insert into public.usuario (id, nome, telefone_whatsapp, tipo_conta, cref, modo_ativo, tipo_escolhido)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'nome',
      split_part(new.email, '@', 1)
    ),
    v_telefone,
    v_tipo,
    v_cref,
    case when v_tipo = 'personal' then 'trabalho' else 'treino' end,
    v_escolhido
  )
  on conflict (id) do nothing;
  return new;
end $$;

revoke execute on function public.usuario_cria_perfil() from public, anon, authenticated;


-- ============================================================
-- 3. A escolha do tipo, uma vez só
-- ============================================================
create or replace function public.escolher_tipo_conta(
  p_tipo text,
  p_cref text,
  p_telefone_whatsapp text
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_id        uuid := (select auth.uid());
  v_escolhido boolean;
begin
  if v_id is null then
    raise exception 'sem sessão';
  end if;

  select tipo_escolhido into v_escolhido from public.usuario where id = v_id;
  if v_escolhido is distinct from false then
    raise exception 'tipo já escolhido';
  end if;

  if p_tipo = 'aluno' then
    update public.usuario
       set tipo_conta = 'aluno', modo_ativo = 'treino', tipo_escolhido = true
     where id = v_id;
    return;
  end if;

  if p_tipo is distinct from 'personal' then
    raise exception 'tipo inválido';
  end if;

  -- Personal termina AQUI, com os dados obrigatórios. Não existe
  -- "personal pendente" criado por esta função.
  if not public.cref_valido(p_cref) then
    raise exception 'cref inválido';
  end if;

  if p_telefone_whatsapp is null or p_telefone_whatsapp !~ '^[1-9][0-9]{9,14}$' then
    raise exception 'telefone inválido';
  end if;

  update public.usuario
     set tipo_conta = 'personal',
         cref = p_cref,
         telefone_whatsapp = p_telefone_whatsapp,
         modo_ativo = 'trabalho',
         tipo_escolhido = true
   where id = v_id;
end $$;

revoke all on function public.escolher_tipo_conta(text, text, text) from public, anon;
grant execute on function public.escolher_tipo_conta(text, text, text) to authenticated;


-- ============================================================
-- 4. Completar CREF: só para quem já é personal
-- ============================================================
-- Continua existindo porque `personal` com `cref` nulo é legítimo (o
-- trigger anula CREF fora da régua). Conta de usuário não passa.
create or replace function public.ativar_area_de_trabalho(
  p_cref text,
  p_telefone_whatsapp text
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_id   uuid := (select auth.uid());
  v_tipo text;
  v_cref text;
begin
  if v_id is null then
    raise exception 'sem sessão';
  end if;

  select tipo_conta, cref into v_tipo, v_cref from public.usuario where id = v_id;
  if v_tipo is distinct from 'personal' then
    raise exception 'conta de usuário não vira personal';
  end if;

  if v_cref is not null then
    raise exception 'cref já informado';
  end if;

  if not public.cref_valido(p_cref) then
    raise exception 'cref inválido';
  end if;

  if p_telefone_whatsapp is null or p_telefone_whatsapp !~ '^[1-9][0-9]{9,14}$' then
    raise exception 'telefone inválido';
  end if;

  update public.usuario
     set cref = p_cref,
         telefone_whatsapp = p_telefone_whatsapp,
         modo_ativo = 'trabalho'
   where id = v_id;
end $$;

revoke all on function public.ativar_area_de_trabalho(text, text) from public, anon;
grant execute on function public.ativar_area_de_trabalho(text, text) to authenticated;
