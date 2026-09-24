-- lastro · fim do treino passa a morar no banco (antes: só localStorage,
-- lastro_fim_treino_<id>). Vazio = em andamento.
alter table public.treino
  add column finalizado_em timestamptz,
  add column duracao_segundos integer;

alter table public.treino
  add constraint treino_duracao_nao_negativa check (duracao_segundos is null or duracao_segundos >= 0),
  add constraint treino_duracao_so_com_fim check (duracao_segundos is null or finalizado_em is not null);

-- Treino de dia anterior a hoje (calendário de Brasília) já acabou: fecha na
-- última série, ou na criação se não tem série. O de hoje fica em aberto; a
-- marca local de cada aparelho é migrada pelo cliente.
update public.treino t
   set finalizado_em = coalesce(
         (select max(s.criado_em) from public.serie s where s.treino_id = t.id),
         t.iniciado_em)
 where t.finalizado_em is null
   and t.data < (now() at time zone 'America/Sao_Paulo')::date;

-- "Continuar treino de hoje" e criarTreino procuram o treino EM ABERTO do dia.
create index treino_em_aberto_idx on public.treino (usuario_id, data)
  where finalizado_em is null;
