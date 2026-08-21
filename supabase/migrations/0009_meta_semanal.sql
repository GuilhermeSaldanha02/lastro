-- supabase/migrations/0009_meta_semanal.sql
-- T4 — meta semanal de treinos configurável (achado A13, docs/
-- AUDITORIA-APEX-PRO.md): a Home mostrava "2/4 Treinos" com o
-- denominador cravado em código (`const metaTreinos = 4`), um número
-- que o dono nunca escolheu. Vira preferência real.
--
-- NULL, não um default numérico (decisão do dono, 2026-08-21): a Home
-- só mostra a fração/barra depois que a meta é definida em /ajustes.
-- Cravar um default de 4 aqui repetiria o mesmo problema um nível
-- abaixo — trocaria "número inventado no código" por "número inventado
-- no banco". NULL é o estado honesto de "ainda não escolhido".
--
-- Coluna em public.usuario, mesmo raciocínio da 0008 (peso_barra):
-- config pessoal de baixo volume, RLS e grant da 0004 já cobrem.

alter table public.usuario
  add column meta_treinos_semana smallint
    constraint meta_treinos_semana_faixa check (
      meta_treinos_semana is null
      or meta_treinos_semana between 1 and 7
    );
