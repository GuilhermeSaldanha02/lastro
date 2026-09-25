-- ============================================================
-- lastro · PU-04 — teto de IA para uma cota compartilhada por todas as contas
-- ============================================================
-- A chave da Gemini está no plano GRATUITO (dono, 2026-09-25): 20 requisições
-- por dia e 5 por minuto para o PROJETO inteiro (KNOWLEDGE.md §3.2). O teto
-- que existia era por conta (parecer 5 + coach 10): com N contas somava 15×N
-- contra uma cota só. Esta migração acrescenta o que faltava: um teto GLOBAL
-- por dia, um por minuto, e o teto por conta lido de uma tabela que o dono
-- ajusta por SQL, sem deploy, quando mudar de plano.
--
-- Unidade de medida = requisição à Gemini, não "uso". Um parecer pode gastar
-- 2 (tentativa + retry de validação); o coach gasta 1. Daí os pesos.
--
-- `security definer` porque somar o consumo de TODAS as contas passa por cima
-- da RLS de `uso_ia` (cada conta só enxerga as próprias linhas). A função só
-- devolve um status e o limite da conta; nunca dado de outra conta. Um lock
-- de transação serializa as reservas: duas contas simultâneas não passam
-- juntas pelo último lugar do dia.
-- ============================================================

create table public.config_ia (
  id                  boolean primary key default true check (id),
  teto_global_dia     integer not null default 16 check (teto_global_dia >= 0),
  teto_global_minuto  integer not null default 4 check (teto_global_minuto >= 0),
  peso_parecer        integer not null default 2 check (peso_parecer >= 1),
  peso_coach          integer not null default 1 check (peso_coach >= 1),
  teto_conta_parecer  integer not null default 2 check (teto_conta_parecer >= 0),
  teto_conta_coach    integer not null default 3 check (teto_conta_coach >= 0)
);

comment on table public.config_ia is
  'Uma linha só. teto_global_* em unidades de requisição à Gemini (free tier: 20/dia, 5/min; folga deliberada). Editar por SQL.';

insert into public.config_ia default values;

alter table public.config_ia enable row level security;
revoke all on public.config_ia from anon, authenticated;

create index if not exists uso_ia_criado_em_idx on public.uso_ia (criado_em desc);

create or replace function public.reservar_uso_ia(p_origem text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario   uuid := auth.uid();
  v_inicio    timestamptz :=
    date_trunc('day', now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo';
  v_cfg       public.config_ia%rowtype;
  v_peso      integer;
  v_teto      integer;
  v_da_conta  integer;
  v_dia       integer;
  v_minuto    integer;
begin
  if v_usuario is null then
    raise exception 'sem sessão';
  end if;
  if p_origem not in ('parecer', 'coach') then
    raise exception 'origem inválida';
  end if;

  -- Uma reserva por vez em todo o projeto: a cota é uma só.
  perform pg_advisory_xact_lock(hashtextextended('uso_ia:global', 0));

  select * into v_cfg from public.config_ia limit 1;
  v_peso := case p_origem when 'parecer' then v_cfg.peso_parecer else v_cfg.peso_coach end;
  v_teto := case p_origem when 'parecer' then v_cfg.teto_conta_parecer else v_cfg.teto_conta_coach end;

  select count(*) into v_da_conta
  from public.uso_ia
  where usuario_id = v_usuario and origem = p_origem and criado_em >= v_inicio;

  if v_da_conta >= v_teto then
    return jsonb_build_object('status', 'conta', 'limite', v_teto);
  end if;

  select coalesce(sum(case origem when 'parecer' then v_cfg.peso_parecer else v_cfg.peso_coach end), 0)
    into v_dia
  from public.uso_ia
  where criado_em >= v_inicio;

  if v_dia + v_peso > v_cfg.teto_global_dia then
    return jsonb_build_object('status', 'global', 'limite', v_teto);
  end if;

  select coalesce(sum(case origem when 'parecer' then v_cfg.peso_parecer else v_cfg.peso_coach end), 0)
    into v_minuto
  from public.uso_ia
  where criado_em >= now() - interval '1 minute';

  if v_minuto + v_peso > v_cfg.teto_global_minuto then
    return jsonb_build_object('status', 'minuto', 'limite', v_teto);
  end if;

  insert into public.uso_ia (usuario_id, origem) values (v_usuario, p_origem);
  return jsonb_build_object('status', 'ok', 'limite', v_teto);
end;
$$;

revoke execute on function public.reservar_uso_ia(text) from public, anon;
grant execute on function public.reservar_uso_ia(text) to authenticated;
