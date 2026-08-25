-- lastro · 0014 — revoga execução pública de funções SECURITY DEFINER internas
--
-- Contexto: advisor de segurança (get_advisors) apontou que
-- `rls_auto_enable()` (event trigger de infra, liga RLS automático em
-- tabela nova) e `usuario_cria_perfil()` (trigger em auth.users, cria a
-- linha de perfil) estavam expostas como RPC pública
-- (`/rest/v1/rpc/...`) para os papéis `anon` e `authenticated`, por causa
-- do grant padrão de EXECUTE a PUBLIC que toda função ganha ao ser
-- criada. Nenhuma das duas é feita para ser chamada assim — ambas rodam
-- só via gatilho (evento de DDL / insert em auth.users), que não passa
-- pelo grant de role e continua funcionando normalmente depois do revoke.

revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
revoke execute on function public.usuario_cria_perfil() from public, anon, authenticated;
