-- ============================================================
-- lastro · migração 0002 — GRANTs faltantes descobertos na
-- verificação end-to-end da tarefa 1.2 (2026-08-05).
--
-- A migração 0001 criou tabelas e policies de RLS, mas RLS filtra
-- LINHA — sem GRANT de base o Postgres nega o acesso ao OBJETO antes
-- de a RLS ser avaliada. Sintoma real reproduzido: toda leitura/escrita
-- pelo cliente autenticado retornava "permission denied for table
-- treino", mesmo com policy correta e sessão válida.
-- ============================================================

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.treino to authenticated;
grant select, insert, update, delete on public.serie to authenticated;
grant select on public.exercicio to authenticated;
grant select on public.grupo_muscular to authenticated;
