-- ============================================================
-- lastro · seed mínimo (SDD.md §3.5)
--
-- grupo_muscular/exercicio aqui são só fixture mínima pra exercitar
-- verificação end-to-end local (§3.8) e casar com nomes usados nos
-- testes do agregador (src/lib/analise/*.test.ts) — não roda contra
-- Postgres real (projeto abandonou local Supabase/Docker, ver
-- DECISIONS.md 2026-08-04 "Docker local abandonado").
--
-- O CATÁLOGO REAL vive só no banco hospedado, aplicado por migração
-- (`supabase/migrations/0003_catalogo_amplo.sql`, 2026-08-07: ~87
-- exercícios, 10 grupos musculares). Este arquivo não reflete o
-- catálogo real e não precisa — são propósitos diferentes.
-- ============================================================

insert into public.grupo_muscular (id, nome) values
  ('peito',      'Peito'),
  ('costas',     'Costas'),
  ('quadriceps', 'Pernas'),
  ('ombro',      'Ombro'),
  ('biceps',     'Bíceps'),
  ('triceps',    'Tríceps'),
  ('abdomen',    'Abdômen');

-- PLACEHOLDER DE TESTE — nomes usados por src/lib/analise/agregar.test.ts,
-- volume.test.ts, prs.test.ts etc. Não é o catálogo real do dono (§3.5 TODO).
insert into public.exercicio (nome, grupo_muscular_primario, unilateral) values
  ('Supino reto com barra', 'peito',      false),
  ('Rosca alternada',       'biceps',     true),
  ('Agachamento livre',     'quadriceps', false);
