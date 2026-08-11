-- ============================================================
-- lastro · migração 0005 — máquinas faltantes no catálogo (achado
-- do dono, 2026-08-11): o catálogo amplo (0003) só tinha "Supino
-- máquina" genérico, sem variante por ângulo, e outros buracos de
-- máquina real de academia (adutora, rosca, tríceps, lateral,
-- lombar). Nomes conferidos contra linhas de equipamento de
-- academia (Movement, Righetto) — "Supino Reto"/"Supino
-- Inclinado"/"Supino Declinado" e "Adductor/Abductor" existem como
-- estações de máquina reais, não são invenção.
--
-- ESCOPO: mesmo da 0003 — nome + grupo muscular + unilateral, dado
-- factual. `dica_execucao` fica NULL (FF7/ADR-007).
-- ============================================================

insert into public.exercicio (nome, grupo_muscular_primario, unilateral) values
  ('Supino reto máquina',      'peito', false),
  ('Supino inclinado máquina', 'peito', false),
  ('Supino declinado máquina', 'peito', false),
  ('Cadeira adutora',          'gluteo', false),
  ('Elevação lateral máquina', 'ombro', false),
  ('Rosca máquina',            'biceps', false),
  ('Tríceps máquina',          'triceps', false),
  ('Extensora lombar máquina', 'costas', false)
on conflict do nothing;
