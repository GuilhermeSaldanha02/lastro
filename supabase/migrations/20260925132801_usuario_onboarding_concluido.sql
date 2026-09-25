-- ============================================================
-- lastro · PU-08 — onboarding do primeiro login (abertura ao público)
-- ============================================================
-- `onboarding_concluido_em` vazio = a conta ainda não passou (nem pulou) o
-- passo a passo de boas-vindas. A Home e a fila do personal mandam para
-- `/onboarding` enquanto estiver vazio.
--
-- As contas que já existiam na abertura ao público foram marcadas como
-- concluídas na própria migração: elas não são "conta nova".
--
-- Concessão POR COLUNA, como nas outras colunas de `usuario` (0025): a
-- própria conta lê e grava só este campo; RLS `usuario_proprio` já limita a
-- linha. Gravar uma data qualquer não dá poder a ninguém.
-- ============================================================

alter table public.usuario add column onboarding_concluido_em timestamptz;

-- Quem já tem conta não vê o passo a passo de quem chega agora.
update public.usuario set onboarding_concluido_em = now() where onboarding_concluido_em is null;

grant select (onboarding_concluido_em), update (onboarding_concluido_em) on public.usuario to authenticated;
