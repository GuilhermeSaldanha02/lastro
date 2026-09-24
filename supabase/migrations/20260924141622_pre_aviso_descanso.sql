-- ============================================================
-- lastro · pré-aviso "faltam 15 s" (pedido do dono, 2026-09-24).
--
-- Duas colunas em `aviso_descanso` e a função de disparo mandando também o
-- pré-aviso, com `tipo` no corpo ("pre" | "fim"). Colunas novas e nulas:
-- o código antigo segue funcionando (nunca preenche o pré-aviso), por isso
-- esta migração entra ANTES do deploy do código.
-- ============================================================

alter table public.aviso_descanso
  add column pre_dispara_em timestamptz,
  add column pre_enviado_em timestamptz;

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
  -- Pré-aviso só enquanto o fim ainda não venceu; fim quando venceu. As
  -- duas condições se excluem, então a mesma linha nunca é atualizada duas
  -- vezes no mesmo comando. Cada reivindicação é atômica: execuções
  -- sobrepostas do cron não repetem envio.
  with pre as (
    update public.aviso_descanso a
       set pre_enviado_em = now()
     where a.pre_enviado_em is null
       and a.pre_dispara_em is not null
       and a.pre_dispara_em <= now()
       and a.enviado_em is null
       and a.dispara_em > now()
    returning a.usuario_id, a.treino_id, 'pre'::text as tipo
  ),
  fim as (
    update public.aviso_descanso a
       set enviado_em = now()
     where a.enviado_em is null
       and a.dispara_em <= now()
    returning a.usuario_id, a.treino_id, 'fim'::text as tipo
  ),
  vencidos as (
    select * from pre
    union all
    select * from fim
  )
  select jsonb_agg(jsonb_build_object(
           'endpoint', p.endpoint,
           'p256dh', p.p256dh,
           'auth', p.auth,
           'treino_id', v.treino_id,
           'tipo', v.tipo))
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
