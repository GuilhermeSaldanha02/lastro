-- ============================================================
-- lastro · 0024 — CONTA de personal (PRD §11, emenda de 2026-09-11 (2))
-- ============================================================
-- A migração 0022 foi escrita sobre a premissa "não existe conta de
-- personal; o vínculo é o papel". O dono decidiu o contrário: a escolha
-- acontece no CADASTRO, conta de personal exige CREF, e a casca do app
-- difere (personal não tem "iniciar treino").
--
-- Esta migração é ADITIVA e compatível com o que já roda:
--   · `tipo_conta` nasce com default 'aluno', então toda conta existente
--     — inclusive a do dono — continua exatamente o que era;
--   · `cref` é nulo em todas elas, e nulo é estado legítimo (ver §3);
--   · a única regra que APERTA é quem pode convidar, e hoje não existe
--     nenhum convite de conta que não seja do dono.
-- ============================================================


-- ============================================================
-- 1. As duas colunas
-- ============================================================

-- `not null` com default é seguro aqui, ao contrário do telefone: este
-- valor não vem do cadastro, ele tem um padrão correto ('aluno'). Toda
-- linha existente vira aluno, que é o que ela é.
alter table public.usuario
  add column if not exists tipo_conta text not null default 'aluno';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'usuario_tipo_conta_valido'
  ) then
    alter table public.usuario
      add constraint usuario_tipo_conta_valido
        check (tipo_conta in ('aluno', 'personal'));
  end if;
end $$;

-- CREF — credencial profissional. Resolução CONFEF 053/2003: seis dígitos,
-- hífen, categoria G (graduado) ou P (provisionado), barra, UF, e sufixo
-- `-S` opcional para registro secundário. Guardado SEM o prefixo "CREF ".
alter table public.usuario
  add column if not exists cref text;

-- A CHECK É DE FORMA, E DE PROPÓSITO FROUXA.
--
-- Mesma lição do `telefone_whatsapp` na 0022: validação apertada no banco
-- vira porta trancada sem mensagem. O aperto de verdade (seis dígitos, UF
-- que existe) mora no formulário de cadastro, onde a pessoa LÊ o erro e
-- pode corrigir. Aqui só barra lixo evidente, e aceita nulo sempre.
--
-- E NÃO existe constraint "personal implica cref not null": conta de
-- personal criada por Google nasce sem CREF e é estado LEGÍTIMO — a
-- obrigatoriedade é cumprida pelo app, que não abre a área de personal
-- antes da complementação. Constraint aqui abortaria o cadastro por
-- Google dentro do insert em `auth.users`, que é exatamente o modo de
-- falha que a 0022 documentou.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'usuario_cref_formato'
  ) then
    alter table public.usuario
      add constraint usuario_cref_formato
        check (cref is null or cref ~ '^[0-9]{1,9}-[GP]/[A-Z]{2}(-S)?$');
  end if;
end $$;

comment on column public.usuario.tipo_conta is
  'aluno | personal. Escolhido no cadastro (PRD §11, emenda 2026-09-11). Default aluno: toda conta anterior à 0024 é aluno.';
comment on column public.usuario.cref is
  'Registro CREF informado pelo profissional, NUNCA verificado pelo lastro (o CONFEF não expõe API pública). Toda tela que o exibe precisa dizer isso.';


-- ============================================================
-- 2. O trigger de perfil aprende os dois campos
-- ============================================================
-- Regra que não muda desde a 0022: este trigger roda DENTRO do insert em
-- `auth.users`. Ele **nunca levanta exceção** — valor malformado é
-- descartado em silêncio, porque `raise` aqui mata o cadastro inteiro, e
-- o cadastro por Google não tem como mandar nada disso.
create or replace function public.usuario_cria_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_telefone text := nullif(new.raw_user_meta_data ->> 'telefone_whatsapp', '');
  v_tipo     text := nullif(new.raw_user_meta_data ->> 'tipo_conta', '');
  v_cref     text := nullif(new.raw_user_meta_data ->> 'cref', '');
begin
  if v_telefone is not null and v_telefone !~ '^[1-9][0-9]{9,14}$' then
    v_telefone := null;
  end if;

  -- Qualquer coisa que não seja exatamente 'personal' vira aluno. Falha
  -- FECHADA: lixo no metadado não promove ninguém a profissional.
  if v_tipo is distinct from 'personal' then
    v_tipo := 'aluno';
  end if;

  if v_cref is not null and v_cref !~ '^[0-9]{1,9}-[GP]/[A-Z]{2}(-S)?$' then
    v_cref := null;
  end if;

  insert into public.usuario (id, nome, telefone_whatsapp, tipo_conta, cref)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'nome',
      split_part(new.email, '@', 1)
    ),
    v_telefone,
    v_tipo,
    v_cref
  )
  on conflict (id) do nothing;
  return new;
end $$;


-- ============================================================
-- 3. Quem pode convidar, e quem pode aceitar
-- ============================================================
-- Até aqui QUALQUER conta autenticada podia gerar um convite, porque
-- "personal" não existia como estado. Agora existe, e o convite é ato de
-- profissional.

create or replace function public.e_conta_personal()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.usuario u
    where u.id = auth.uid() and u.tipo_conta = 'personal'
  );
$$;

-- Fora da API pública, como os helpers da 0023 (lint 0028 do Supabase).
revoke execute on function public.e_conta_personal() from public, anon;
grant execute on function public.e_conta_personal() to authenticated;

drop policy if exists vinculo_convite_proprio on public.vinculo_personal;
create policy vinculo_convite_proprio on public.vinculo_personal
  for insert to authenticated
  with check (
    personal_id = auth.uid()
    and estado = 'pendente'
    and aluno_id is null
    and public.e_conta_personal()
  );

-- O aceite continua sendo do aluno, e agora só de CONTA de aluno: conta
-- de personal que aceitasse um convite viraria aluna de alguém sem nunca
-- ter passado pela casca de aluno. A checagem vive no corpo da função
-- porque `with check` valida a linha final, não quem a está mudando.
create or replace function public.aceitar_convite_personal(
  p_codigo text,
  p_telefone_whatsapp text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_aluno uuid := (select auth.uid());
  v_id    uuid;
  v_tipo  text;
begin
  if v_aluno is null then
    raise exception 'sem sessão';
  end if;

  -- A ÚNICA linha nova em relação à 0022. Todo o resto desta função é
  -- cópia literal de lá, de propósito: reescrever o aceite "de memória"
  -- tirou, na primeira tentativa desta migração, a obrigatoriedade do
  -- telefone e a checagem de vínculo já aceito — duas regras que ninguém
  -- pediu para mudar e cuja falta só apareceria em produção.
  select tipo_conta into v_tipo from public.usuario where id = v_aluno;
  if v_tipo = 'personal' then
    raise exception 'conta de personal não aceita convite';
  end if;

  -- Normalização do telefone é do APP (`whatsapp.ts`, função pura e
  -- testada). Aqui só se recusa o que não serve para o link.
  if p_telefone_whatsapp is null or p_telefone_whatsapp !~ '^[1-9][0-9]{9,14}$' then
    raise exception 'telefone inválido';
  end if;

  if exists (
    select 1 from public.vinculo_personal
    where aluno_id = v_aluno and estado = 'aceito'
  ) then
    raise exception 'já existe vínculo aceito';
  end if;

  update public.vinculo_personal
     set aluno_id = v_aluno,
         estado = 'aceito',
         aceito_em = now()
   where codigo = p_codigo
     and estado = 'pendente'
     and personal_id <> v_aluno
  returning id into v_id;

  if v_id is null then
    raise exception 'código inválido';
  end if;

  update public.usuario
     set telefone_whatsapp = p_telefone_whatsapp
   where id = v_aluno;

  return v_id;
end $$;
