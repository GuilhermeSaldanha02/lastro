-- ============================================================
-- lastro · 0028 — reservar uma vaga da cota diária de IA de forma atômica
-- (achado novo do QA do caminho triste; DECISIONS 2026-09-13 (11))
-- ============================================================
-- O coach contava os usos de hoje, lia o vínculo, registrava o uso e só
-- então chamava a Gemini. Contar e gravar eram duas idas ao banco sem
-- nada entre elas: três pedidos simultâneos numa conta com 9 usos contavam
-- os três "9 < 10", passavam os três e terminavam com 12 usos (CI do
-- #251, run 34797779114, nas duas tentativas). O teto de 10 existe para
-- sobrar cota da Análise Semanal na chave compartilhada (0020).
--
-- Um índice único não resolve aqui (são até 10 linhas por dia, não uma).
-- Esta função faz contar-e-gravar numa transação só, serializada por conta
-- e origem com um advisory lock de transação: o segundo pedido espera o
-- primeiro terminar, e então já conta o uso dele.
--
-- `security invoker` de propósito: roda como quem chama, então a RLS de
-- `uso_ia` (0020) continua valendo — conta só as linhas da própria conta e
-- só consegue gravar em nome dela. Nada aqui dá permissão nova: não há
-- update nem delete, e o log de consumo segue imutável.
--
-- O dia é o de Brasília, igual a `inicioDoDiaLocal` em
-- `src/lib/dados/uso-ia.ts` (meia-noite local; o Brasil não tem horário de
-- verão desde 2019).
--
-- COMPATIBILIDADE COM A `main`: o código vivo não chama esta função. Só a
-- rota do coach da pilha do QA usa, a partir do PR que traz esta migração.
-- ============================================================

create or replace function public.consumir_uso_ia(p_origem text, p_teto integer)
returns boolean
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_usuario uuid := auth.uid();
  v_inicio  timestamptz :=
    date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
  v_usadas  integer;
begin
  if v_usuario is null then
    raise exception 'sem sessão';
  end if;

  -- Serializa pedidos da MESMA conta e origem até o fim desta transação.
  perform pg_advisory_xact_lock(hashtextextended('uso_ia:' || v_usuario::text || ':' || p_origem, 0));

  select count(*) into v_usadas
  from public.uso_ia
  where usuario_id = v_usuario
    and origem = p_origem
    and criado_em >= v_inicio;

  if v_usadas >= p_teto then
    return false;
  end if;

  insert into public.uso_ia (usuario_id, origem) values (v_usuario, p_origem);
  return true;
end;
$$;

revoke execute on function public.consumir_uso_ia(text, integer) from public, anon;
grant execute on function public.consumir_uso_ia(text, integer) to authenticated;
