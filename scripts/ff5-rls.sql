-- ============================================================
-- lastro · FF5 — o check executável, não prosa.
-- Fonte: SDD.md §3.7. Copiado literalmente. Saída esperada: 0 nas duas linhas.
-- ============================================================

-- PARTE 1 — tabelas de USUÁRIO (fora da allowlist de catálogo) precisam
-- ter RLS ligada E ao menos uma policy que referencia auth.uid() DE FATO
-- em USING ou WITH CHECK — não só "existe alguma policy", que uma
-- `using (true)` satisfaria sem proteger nada. Falha FECHADA: varre TODA
-- tabela de public e subtrai a allowlist, em vez de listar as protegidas
-- (listar as protegidas deixaria passar em silêncio uma tabela nova da
-- Fase 2). Saída esperada: 0.
select count(*) as tabelas_sem_protecao_por_dono
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  -- ALLOWLIST: catálogo compartilhado, sem dono. Acrescentar aqui exige
  -- justificar por escrito por que a tabela não tem dado de usuário.
  and c.relname not in ('exercicio', 'grupo_muscular')
  and ( c.relrowsecurity = false
        or not exists (
             select 1 from pg_policies p
             where p.schemaname = 'public' and p.tablename = c.relname
               and (p.qual ilike '%auth.uid()%' or p.with_check ilike '%auth.uid()%')
           ) );

-- PARTE 2 — tabelas de CATÁLOGO (a allowlist acima) precisam ter RLS
-- LIGADA mesmo sem auth.uid() — senão o PostgREST expõe escrita (§3.3).
-- A Parte 1 as isenta da checagem de dono; esta parte fecha a outra
-- metade da exigência de §3.3, que antes não tinha verificação nenhuma.
-- Saída esperada: 0.
select count(*) as catalogo_sem_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relname in ('exercicio', 'grupo_muscular')
  and c.relrowsecurity = false;
