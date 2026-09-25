-- lastro · PU-07 (correção) — a service_role deste projeto não tem GRANT
-- nenhum nas tabelas do PostgREST (achado registrado em
-- e2e/helpers/usuario-descartavel.ts). Sem este grant, mesmo com
-- SUPABASE_SERVICE_ROLE_KEY configurada na Vercel, `registrarErro` falha com
-- "permission denied for table erro_app". Só insert e select: o resto é do
-- pg_cron (postgres).
grant insert, select on public.erro_app to service_role;
