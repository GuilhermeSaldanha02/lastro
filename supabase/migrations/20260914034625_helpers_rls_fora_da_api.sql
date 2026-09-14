-- ============================================================
-- lastro · 20260914034625 (era 0029 antes do alinhamento com o banco) — os
-- helpers das policies saem do schema exposto pela API
-- (aviso de segurança do Supabase, lint 0029; DECISIONS 2026-09-14 (1))
-- ============================================================
-- O linter de segurança aponta função `security definer` executável por
-- `authenticated` no schema `public`, porque o PostgREST publica todo o
-- `public` em `/rest/v1/rpc/`. Eram 7. Elas não são iguais:
--
--   · 4 são a API do módulo personal e o app chama por `.rpc()`:
--     `aceitar_convite_personal`, `revogar_vinculo_personal`,
--     `ativar_area_de_trabalho`, `escolher_tipo_conta`. Precisam ser
--     definer (gravam colunas fora do GRANT da própria conta) e precisam
--     ser chamáveis. O aviso delas é o comportamento pedido — a 0023 já
--     registrou isso. NÃO mudam aqui.
--
--   · 3 existem só para serem chamadas DE DENTRO de uma policy:
--     `tem_vinculo_aceito`, `e_meu_personal`, `e_conta_personal`. Nada no
--     app, nos testes ou nos scripts as chama pelo nome, e nenhuma outra
--     função as usa (conferido em pg_depend e no corpo das funções em
--     2026-09-14). Estar em `public` só as deixava penduradas na API.
--     A 0023 fechou `anon`; esta migração fecha a superfície inteira.
--
-- O QUE MUDA: as 3 vão para o schema `private`, que o PostgREST não
-- expõe. A policy continua chamando a função com os privilégios de quem
-- consulta, então `authenticated` segue precisando de `usage` no schema e
-- `execute` nas funções — só que agora sem endpoint.
--
-- Corpos IDÊNTICOS aos de produção (lidos com pg_get_functiondef antes de
-- escrever esta migração). As 5 policies mudam só a expressão, por
-- ALTER POLICY: comando, papéis e permissividade ficam como estavam.
-- Na `vinculo_convite_proprio`, `auth.uid()` vira `(select auth.uid())`:
-- mesmo resultado, avaliado uma vez por statement (lint 0003 de
-- desempenho, que apontava exatamente essa policy).
--
-- Tudo numa transação: se qualquer passo falhar, nada muda.
-- COMPATIBILIDADE COM A `main`: nenhum código chama as 3 funções.
-- ============================================================

create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

-- ------------------------------------------------------------
-- 1. As funções, no schema novo
-- ------------------------------------------------------------
-- `security definer` pelo mesmo motivo da 0022: consultam
-- `vinculo_personal`/`usuario`, e sem definer isso dispararia a RLS dessas
-- tabelas dentro da RLS de outra — recursão. `stable` para o planner
-- avaliar uma vez por statement.
create function private.tem_vinculo_aceito(p_aluno uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.vinculo_personal v
    where v.aluno_id = p_aluno
      and v.personal_id = (select auth.uid())
      and v.estado = 'aceito'
  )
$$;

comment on function private.tem_vinculo_aceito(uuid) is
  'true quando quem chama é o personal com vínculo ACEITO do aluno informado. É a única porta da leitura cruzada — revogar fecha todas de uma vez.';

create function private.e_meu_personal(p_personal uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.vinculo_personal v
    where v.personal_id = p_personal
      and v.aluno_id = (select auth.uid())
      and v.estado = 'aceito'
  )
$$;

create function private.e_conta_personal()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.usuario u
    where u.id = auth.uid() and u.tipo_conta = 'personal'
  );
$$;

revoke all on function private.tem_vinculo_aceito(uuid) from public, anon;
revoke all on function private.e_meu_personal(uuid) from public, anon;
revoke all on function private.e_conta_personal() from public, anon;
grant execute on function private.tem_vinculo_aceito(uuid) to authenticated;
grant execute on function private.e_meu_personal(uuid) to authenticated;
grant execute on function private.e_conta_personal() to authenticated;

-- ------------------------------------------------------------
-- 2. As policies passam a chamar o schema novo
-- ------------------------------------------------------------
alter policy treino_visivel_ao_personal on public.treino
  using (private.tem_vinculo_aceito(usuario_id));

alter policy serie_visivel_ao_personal on public.serie
  using (private.tem_vinculo_aceito(usuario_id));

alter policy usuario_visivel_ao_personal on public.usuario
  using (private.tem_vinculo_aceito(id));

alter policy usuario_personal_visivel_ao_aluno on public.usuario
  using (private.e_meu_personal(id));

alter policy vinculo_convite_proprio on public.vinculo_personal
  with check (
    personal_id = (select auth.uid())
    and estado = 'pendente'
    and aluno_id is null
    and private.e_conta_personal()
  );

-- ------------------------------------------------------------
-- 3. As versões antigas saem da API
-- ------------------------------------------------------------
-- Sem `cascade` de propósito: se alguma policy ainda dependesse delas, o
-- drop falharia e a transação inteira voltaria.
drop function public.tem_vinculo_aceito(uuid);
drop function public.e_meu_personal(uuid);
drop function public.e_conta_personal();
