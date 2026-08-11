-- ============================================================
-- lastro · migração 0006 — segunda passada de máquinas faltantes
-- (pedido do dono, 2026-08-11): ele treina em academia com
-- maquinário Hammer Strength e Life Fitness. Pesquisado o catálogo
-- real das duas marcas (linha plate-loaded Hammer Strength; séries
-- selectorized Insignia/Signature/Axiom da Life Fitness) e cruzado
-- contra os 95 exercícios já cadastrados (migrações 0003 e 0005)
-- para achar gaps reais, não repetir o que já existe em versão
-- cabo/halter/barra.
--
-- ESCOPO: mesmo das migrações anteriores — nome + grupo muscular +
-- unilateral, dado factual. `dica_execucao` fica NULL (FF7/ADR-007).
-- ============================================================

insert into public.exercicio (nome, grupo_muscular_primario, unilateral) values
  -- Costas: puxada/remada em trajeto fixo de máquina (Hammer
  -- Iso-Lateral Pulldown/Row), distinto das variantes de pulley/cabo
  -- já cadastradas.
  ('Puxador articulado máquina',        'costas', false),
  ('Remada máquina peito-apoiado',      'costas', false),

  -- Ombro: encolhimento em máquina (Hammer Seated/Standing Shrug),
  -- só havia a versão com halteres.
  ('Encolhimento máquina',              'ombro', false),

  -- Quadríceps: leg press na orientação horizontal (distinta do 45
  -- graus já cadastrado) e agachamento guiado com cinto (Hammer Belt
  -- Squat / Pendulum), comum em academia com esse maquinário.
  ('Leg press horizontal',              'quadriceps', false),
  ('Agachamento com cinto (belt squat)', 'quadriceps', false),

  -- Glúteo: máquina dedicada de hip thrust (Hammer Glute Drive),
  -- distinta da elevação pélvica com barra já cadastrada.
  ('Cadeira de glúteo (hip thrust máquina)', 'gluteo', false),

  -- Abdômen: rotação de tronco em máquina de trajeto fixo (Life
  -- Fitness Rotary Torso), distinta da versão no cabo já cadastrada.
  ('Rotação de tronco máquina',         'abdomen', false)
on conflict do nothing;
