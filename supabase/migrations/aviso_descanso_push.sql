-- ============================================================
-- lastro · aviso de fim de descanso fora do app (pedido do dono, 2026-09-23)
--
-- O app agenda "o descanso acaba em N segundos" em `aviso_descanso`; a cada
-- 5 s o pg_cron pega os vencidos, junta a inscrição de push de cada um e
-- chama `/api/push/disparar` na produção. A rota só assina (VAPID) e envia:
-- quem sabe de quem é cada inscrição é o banco, então nenhuma chave de
-- service role sai da Vercel (regra do `cliente-admin.ts`).
--
-- O SEGREDO do disparo NÃO está aqui: vive no Vault como
-- `lastro_push_disparo_segredo`, criado à parte, e na Vercel como
-- `PUSH_DISPARO_SEGREDO`. Sem ele a função não chama nada.
--
-- Só produção: previews ficam atrás do SSO da Vercel e o pg_net não chega
-- lá. A URL é a do domínio de produção.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- ---------- inscrições de push (uma por aparelho) ----------
create table public.push_inscricao (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  endpoint    text not null unique check (endpoint like 'https://%'),
  p256dh      text not null,
  auth        text not null,
  criado_em   timestamptz not null default now()
);
create index push_inscricao_usuario_idx on public.push_inscricao (usuario_id);

comment on table public.push_inscricao is
  'Inscrição Web Push de um aparelho. Só a própria conta lê/escreve (RLS); o personal NÃO tem leitura cruzada aqui.';

alter table public.push_inscricao enable row level security;

create policy push_inscricao_propria on public.push_inscricao
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

grant select, insert, update, delete on public.push_inscricao to authenticated;

-- ---------- aviso pendente (um por conta: o descanso em curso) ----------
create table public.aviso_descanso (
  usuario_id  uuid primary key references auth.users(id) on delete cascade,
  treino_id   uuid not null references public.treino(id) on delete cascade,
  dispara_em  timestamptz not null,
  enviado_em  timestamptz
);
create index aviso_descanso_pendente_idx on public.aviso_descanso (dispara_em)
  where enviado_em is null;
create index aviso_descanso_treino_idx on public.aviso_descanso (treino_id);

comment on table public.aviso_descanso is
  'Aviso de fim de descanso agendado pelo app. Upsert zera enviado_em; pausar/encerrar apaga a linha.';

alter table public.aviso_descanso enable row level security;

-- Só no próprio treino: sem isto daria para agendar aviso apontando para o
-- treino de outra conta (o link da notificação abriria /treino/<id alheio>).
create policy aviso_descanso_proprio on public.aviso_descanso
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (
    usuario_id = (select auth.uid())
    and exists (
      select 1 from public.treino t
      where t.id = treino_id and t.usuario_id = (select auth.uid())
    )
  );

grant select, insert, update, delete on public.aviso_descanso to authenticated;

-- ---------- disparo (pg_cron) ----------
-- Em `private` (regra 13): função chamada só pelo cron não pode virar
-- endpoint de /rest/v1/rpc/.
create or replace function private.disparar_avisos_descanso()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_segredo text;
  v_avisos  jsonb;
begin
  -- Reivindica os vencidos numa operação só: duas execuções sobrepostas do
  -- cron não mandam o mesmo aviso duas vezes.
  with vencidos as (
    update public.aviso_descanso a
       set enviado_em = now()
     where a.enviado_em is null
       and a.dispara_em <= now()
    returning a.usuario_id, a.treino_id
  )
  select jsonb_agg(jsonb_build_object(
           'endpoint', p.endpoint,
           'p256dh', p.p256dh,
           'auth', p.auth,
           'treino_id', v.treino_id))
    into v_avisos
    from vencidos v
    join public.push_inscricao p on p.usuario_id = v.usuario_id;

  if v_avisos is null then
    return;
  end if;

  select ds.decrypted_secret into v_segredo
    from vault.decrypted_secrets ds
   where ds.name = 'lastro_push_disparo_segredo';
  if v_segredo is null then
    return;
  end if;

  perform net.http_post(
    url := 'https://lastro-pi.vercel.app/api/push/disparar',
    body := jsonb_build_object('avisos', v_avisos),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-lastro-disparo', v_segredo),
    timeout_milliseconds := 5000);
end;
$$;

revoke all on function private.disparar_avisos_descanso() from public, anon, authenticated;

select cron.schedule(
  'lastro-avisos-descanso',
  '5 seconds',
  'select private.disparar_avisos_descanso()'
);
