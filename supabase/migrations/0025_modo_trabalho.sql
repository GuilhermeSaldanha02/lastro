-- ============================================================
-- lastro · 0025 — UMA conta, dois modos (PRD §11, emenda 2026-09-12 (2))
-- ============================================================
-- A 0024 fez "conta de personal" e "conta de aluno" serem contas
-- diferentes. O dono decidiu o contrário: toda conta treina, e a área de
-- trabalho é uma capacidade que a conta GANHA ao informar o CREF.
--
-- Esta migração também fecha dois achados da `j9` (2026-09-12), que sob
-- este modelo deixam de ser detalhe e viram a porta inteira:
--   · o aluno se promovia a personal com um update na própria linha;
--   · o CREF `1-G/ZZ` era gravado direto pela API.
-- Os dois existiam porque o GRANT da 0004 é de TABELA inteira.
--
-- COMPATIBILIDADE COM A `main`: o código vivo lá não lê `modo_ativo` e
-- não escreve `tipo_conta` nem `cref`. As colunas que ele escreve
-- (nome, avatar_url, meta_treinos_semana, idioma, peso_barra,
-- anilhas_disponiveis, telefone_whatsapp) continuam com GRANT abaixo.
-- ============================================================


-- ============================================================
-- 1. O modo ativo
-- ============================================================
alter table public.usuario
  add column if not exists modo_ativo text not null default 'treino';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'usuario_modo_ativo_valido') then
    alter table public.usuario
      add constraint usuario_modo_ativo_valido
        check (modo_ativo in ('treino', 'trabalho'));
  end if;

  -- `trabalho` só em conta com área de trabalho. Sem esta check, liberar o
  -- update de `modo_ativo` para a própria conta reabriria a promoção.
  if not exists (select 1 from pg_constraint where conname = 'usuario_modo_trabalho_exige_personal') then
    alter table public.usuario
      add constraint usuario_modo_trabalho_exige_personal
        check (modo_ativo = 'treino' or tipo_conta = 'personal');
  end if;
end $$;

-- Quem já é personal continua abrindo na fila, como hoje.
update public.usuario set modo_ativo = 'trabalho' where tipo_conta = 'personal';

comment on column public.usuario.modo_ativo is
  'treino | trabalho — a casca que o app renderiza (PRD §11, emenda 2026-09-12 (2)). trabalho exige tipo_conta = personal.';
comment on column public.usuario.tipo_conta is
  'aluno | personal. Desde a 0025: personal = a conta TEM área de trabalho (não deixa de treinar). Só muda por ativar_area_de_trabalho().';


-- ============================================================
-- 2. O GRANT deixa de ser de tabela inteira
-- ============================================================
-- `revoke all` e não só `update`: com insert e delete, a conta apagaria a
-- própria linha e a recriaria com `tipo_conta = 'personal'`. O app nunca
-- insere nem apaga `usuario` — quem insere é o trigger (definer) e quem
-- apaga é o cascade de `auth.users`.
revoke all on public.usuario from anon, authenticated;
grant select on public.usuario to authenticated;
grant update (
  nome,
  avatar_url,
  meta_treinos_semana,
  idioma,
  peso_barra,
  anilhas_disponiveis,
  telefone_whatsapp,
  modo_ativo
) on public.usuario to authenticated;


-- ============================================================
-- 3. A régua do CREF, UMA vez no banco
-- ============================================================
-- A mesma de `src/lib/texto/cref.ts`: seis dígitos, G ou P, uma das 27
-- UFs, `-S` opcional. A check de tabela da 0024 continua frouxa, e isso
-- agora é inofensivo: ninguém fora das funções abaixo escreve `cref`.
create or replace function public.cref_valido(p_cref text)
returns boolean language sql immutable set search_path = public as $$
  select coalesce(p_cref, '') ~
    '^[0-9]{6}-[GP]/(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)(-S)?$';
$$;

revoke execute on function public.cref_valido(text) from public, anon;
grant execute on function public.cref_valido(text) to authenticated;


-- ============================================================
-- 4. A porta única da área de trabalho
-- ============================================================
-- Serve aos dois caminhos: quem treina e decide virar personal (Ajustes),
-- e a conta que nasceu personal sem CREF (Google). Não reescreve CREF já
-- informado — trocar registro é outro assunto, e esta função não pode
-- virar o jeito de fazer isso sem ninguém ter decidido.
create or replace function public.ativar_area_de_trabalho(
  p_cref text,
  p_telefone_whatsapp text
)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_id   uuid := (select auth.uid());
  v_cref text;
begin
  if v_id is null then
    raise exception 'sem sessão';
  end if;

  if not public.cref_valido(p_cref) then
    raise exception 'cref inválido';
  end if;

  if p_telefone_whatsapp is null or p_telefone_whatsapp !~ '^[1-9][0-9]{9,14}$' then
    raise exception 'telefone inválido';
  end if;

  select cref into v_cref from public.usuario where id = v_id;
  if v_cref is not null then
    raise exception 'cref já informado';
  end if;

  update public.usuario
     set tipo_conta = 'personal',
         cref = p_cref,
         telefone_whatsapp = p_telefone_whatsapp,
         modo_ativo = 'trabalho'
   where id = v_id;
end $$;

revoke all on function public.ativar_area_de_trabalho(text, text) from public, anon;
grant execute on function public.ativar_area_de_trabalho(text, text) to authenticated;


-- ============================================================
-- 5. O trigger de cadastro usa a régua estrita
-- ============================================================
-- O cadastro por e-mail valida no app, mas `supabase.auth.signUp` é
-- chamável direto com qualquer metadado. CREF fora da régua vira nulo — e
-- a conta cai na tela de completar, como a do Google. O trigger continua
-- sem levantar exceção (roda dentro do insert em `auth.users`).
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

  if v_tipo is distinct from 'personal' then
    v_tipo := 'aluno';
  end if;

  if v_cref is not null and not public.cref_valido(v_cref) then
    v_cref := null;
  end if;

  insert into public.usuario (id, nome, telefone_whatsapp, tipo_conta, cref, modo_ativo)
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
    case when v_tipo = 'personal' then 'trabalho' else 'treino' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- A 0014 tirou a execução pública dos triggers; `create or replace`
-- preserva os privilégios, mas repetir custa uma linha e não depende disso.
revoke execute on function public.usuario_cria_perfil() from public, anon, authenticated;


-- ============================================================
-- 6. Personal pode ter personal
-- ============================================================
-- Corpo LITERAL da 0024, menos a recusa "conta de personal não aceita
-- convite". Ela existia porque conta de personal não tinha tela de treino;
-- agora tem. O próprio convite continua barrado (`personal_id <> v_aluno`).
create or replace function public.aceitar_convite_personal(
  p_codigo text,
  p_telefone_whatsapp text
)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_aluno uuid := (select auth.uid());
  v_id    uuid;
begin
  if v_aluno is null then
    raise exception 'sem sessão';
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
