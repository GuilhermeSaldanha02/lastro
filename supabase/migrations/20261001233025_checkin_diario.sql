-- lastro · AN-08 A1 — check-in diário de recuperação.
-- Fonte: docs/MISSAO-MOTOR-DETERMINISTICO.md §13; decisões do dono de
-- 2026-09-29 (também em dia sem treino; visível ao aluno e ao personal com
-- vínculo) e de 2026-10-01 (o aluno pode desligar o compartilhamento; na
-- primeira versão o dado só é registrado e mostrado).
--
-- O que guarda: quatro notas de 1 a 5 (sono, energia, dor muscular, estresse),
-- uma linha por conta e por dia. NÃO guarda texto livre: a Política manda não
-- digitar dado de saúde em campo livre, e nota de 1 a 5 não é dado médico.
--
-- REGRA QUE O CÓDIGO NÃO PODE QUEBRAR: este dado NUNCA vai para a Gemini. A
-- Política diz que, no plano gratuito, o Google pode usar o conteúdo enviado e
-- que revisores humanos podem lê-lo. Um teste de vitest barra qualquer
-- referência a `checkin` nos arquivos que montam o resumo da IA.

-- ============================================================
-- 1. O botão do aluno: compartilhar o check-in com o personal vinculado
-- ============================================================
-- Mora na linha do próprio aluno (e não no vínculo) porque o consentimento é
-- DELE, vale para qualquer personal e é revogável a qualquer momento (PRD
-- §11.4.3). Ligado por padrão: foi a decisão do dono de 2026-09-29. A
-- coluna entra na lista de GRANT por coluna da 0025, onde a conta só atualiza
-- o que a 0025 enumerou.
alter table public.usuario
  add column compartilha_checkin boolean not null default true;

comment on column public.usuario.compartilha_checkin is
  'O aluno deixa o personal com vínculo aceito ler o check-in dele. Padrão ligado; o aluno desliga quando quiser e o acesso cai na hora (a policy checkin_visivel_ao_personal lê esta coluna).';

grant update (compartilha_checkin) on public.usuario to authenticated;

-- ============================================================
-- 2. A tabela
-- ============================================================
create table public.checkin (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null references auth.users(id) on delete cascade,
  -- O dia é o dia LOCAL da pessoa (America/Sao_Paulo), calculado no app
  -- (`dataLocalBrasil`), nunca `now()` do servidor: o check-in feito às 23h
  -- offline e sincronizado na manhã seguinte continua sendo do dia certo.
  dia           date not null,
  sono          smallint,
  energia       smallint,
  dor_muscular  smallint,
  estresse      smallint,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  -- Uma resposta por dia: reenviar (fila offline, toque repetido) corrige a
  -- mesma linha por upsert em vez de duplicar.
  constraint checkin_um_por_dia unique (usuario_id, dia),
  constraint checkin_sono_1a5 check (sono is null or sono between 1 and 5),
  constraint checkin_energia_1a5 check (energia is null or energia between 1 and 5),
  constraint checkin_dor_1a5 check (dor_muscular is null or dor_muscular between 1 and 5),
  constraint checkin_estresse_1a5 check (estresse is null or estresse between 1 and 5),
  -- As quatro são opcionais, mas uma linha vazia não diz nada.
  constraint checkin_algum_campo
    check (num_nonnulls(sono, energia, dor_muscular, estresse) >= 1)
);

comment on table public.checkin is
  'AN-08 A1: check-in diário (notas de 1 a 5). Dado sensível: nunca vai para a IA; o personal só lê com vínculo aceito E compartilha_checkin ligado.';

-- `atualizado_em` acompanha o upsert. A função mora em `private` (fora da API
-- pública) e usa search_path vazio.
create function private.checkin_toca_atualizado_em()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.atualizado_em := now();
  return new;
end $$;

create trigger checkin_atualizado_em_bu
  before update on public.checkin
  for each row execute function private.checkin_toca_atualizado_em();

-- ============================================================
-- 3. RLS
-- ============================================================
alter table public.checkin enable row level security;

-- A conta lê, grava e apaga os PRÓPRIOS check-ins.
create policy checkin_proprio on public.checkin
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- Leitura cruzada: o personal com vínculo ACEITO, e só se o aluno não desligou
-- o compartilhamento. Só SELECT: o personal nunca escreve no check-in do aluno.
-- A função é `security definer` pelo mesmo motivo da 0022 (consulta
-- `vinculo_personal` e `usuario` de dentro da policy sem disparar a RLS delas)
-- e mora em `private`, fora da API (mesma decisão da 20260914034625).
create function private.pode_ver_checkin(p_aluno uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select private.tem_vinculo_aceito(p_aluno)
     and coalesce(
       (select u.compartilha_checkin from public.usuario u where u.id = p_aluno),
       false
     )
$$;

comment on function private.pode_ver_checkin(uuid) is
  'true quando quem chama é o personal com vínculo ACEITO do aluno e o aluno não desligou o compartilhamento do check-in.';

revoke all on function private.pode_ver_checkin(uuid) from public, anon;
grant execute on function private.pode_ver_checkin(uuid) to authenticated;

create policy checkin_visivel_ao_personal on public.checkin
  for select to authenticated
  using (private.pode_ver_checkin(usuario_id));

-- RLS sozinha não basta: sem GRANT explícito o Postgres nega antes da policy.
grant select, insert, update, delete on public.checkin to authenticated;
