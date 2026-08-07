-- ============================================================
-- lastro · migração 0003 — catálogo amplo (Fase 4, decisão do dono
-- 2026-08-07): catálogo genérico ~80-100 exercícios, não a rotina
-- pessoal do dono, cobrindo todos os grupos musculares.
--
-- ESCOPO DESTA MIGRAÇÃO: nome + grupo muscular + unilateral. É dado
-- factual (nome de exercício conhecido), não dica de saúde.
-- `dica_execucao` fica NULL em toda linha nova — FF7/ADR-007 proíbe
-- dica de execução gerada por LLM, mesmo pesquisada. A tela do
-- catálogo já trata "sem dica ainda" como estado honesto, não erro.
--
-- Grupos musculares novos: glúteo, posterior de coxa e panturrilha
-- saem de dentro de "pernas" (que antes cobria tudo com o id
-- `quadriceps`) e viram grupos próprios — o volume por grupo muscular
-- que a Análise já calcula fica mais preciso.
-- ============================================================

update public.grupo_muscular set nome = 'Quadríceps' where id = 'quadriceps';

insert into public.grupo_muscular (id, nome) values
  ('gluteo',         'Glúteos'),
  ('posterior_coxa', 'Posterior de coxa'),
  ('panturrilha',    'Panturrilha')
on conflict (id) do nothing;

-- unilateral = true quando as reps se contam POR LADO (halter/cabo de
-- um braço/perna por vez, ou postura de sustentação assimétrica como
-- prancha lateral). Barra e máquina de pegada dupla ficam false.
insert into public.exercicio (nome, grupo_muscular_primario, unilateral) values
  -- Peito
  ('Supino inclinado com barra',    'peito', false),
  ('Supino declinado com barra',    'peito', false),
  ('Supino reto com halteres',      'peito', false),
  ('Supino inclinado com halteres', 'peito', false),
  ('Supino declinado com halteres', 'peito', false),
  ('Crucifixo reto com halteres',   'peito', false),
  ('Crucifixo inclinado com halteres', 'peito', false),
  ('Crossover no cabo',             'peito', false),
  ('Peck deck',                     'peito', false),
  ('Flexão de braço',               'peito', false),
  ('Supino máquina',                'peito', false),

  -- Costas
  ('Puxada frente no pulley',       'costas', false),
  ('Puxada pegada aberta',          'costas', false),
  ('Puxada pegada supinada',        'costas', false),
  ('Remada curvada com barra',      'costas', false),
  ('Remada cavalinho',              'costas', false),
  ('Remada unilateral com halter',  'costas', true),
  ('Remada baixa no cabo',          'costas', false),
  ('Remada máquina',                'costas', false),
  ('Levantamento terra',            'costas', false),
  ('Pull-over com halter',          'costas', false),

  -- Quadríceps
  ('Agachamento no smith',          'quadriceps', false),
  ('Leg press 45 graus',            'quadriceps', false),
  ('Leg press unilateral',          'quadriceps', true),
  ('Cadeira extensora',             'quadriceps', false),
  ('Agachamento búlgaro',           'quadriceps', true),
  ('Afundo com halteres',           'quadriceps', true),
  ('Hack squat',                    'quadriceps', false),
  ('Agachamento frontal',           'quadriceps', false),
  ('Passada (step-up)',             'quadriceps', true),

  -- Glúteos
  ('Elevação pélvica com barra',    'gluteo', false),
  ('Elevação pélvica unilateral',   'gluteo', true),
  ('Cadeira abdutora',              'gluteo', false),
  ('Coice no cabo',                 'gluteo', true),
  ('Agachamento sumô com halter',   'gluteo', false),
  ('Ponte de glúteo',               'gluteo', false),
  ('Extensão de quadril no cabo',   'gluteo', true),

  -- Posterior de coxa
  ('Mesa flexora',                       'posterior_coxa', false),
  ('Cadeira flexora',                    'posterior_coxa', false),
  ('Cadeira flexora unilateral',         'posterior_coxa', true),
  ('Stiff com barra',                    'posterior_coxa', false),
  ('Levantamento terra romeno com halteres', 'posterior_coxa', false),
  ('Flexora unilateral no cabo',         'posterior_coxa', true),
  ('Bom dia (good morning) com barra',   'posterior_coxa', false),

  -- Panturrilha
  ('Panturrilha em pé',             'panturrilha', false),
  ('Panturrilha sentado',           'panturrilha', false),
  ('Panturrilha no leg press',      'panturrilha', false),
  ('Panturrilha unilateral com halter', 'panturrilha', true),
  ('Panturrilha burrinho',          'panturrilha', false),

  -- Ombro
  ('Desenvolvimento com halteres',  'ombro', false),
  ('Desenvolvimento militar com barra', 'ombro', false),
  ('Desenvolvimento máquina',       'ombro', false),
  ('Elevação frontal com halteres', 'ombro', false),
  ('Crucifixo inverso',             'ombro', false),
  ('Remada alta com barra',         'ombro', false),
  ('Encolhimento com halteres',     'ombro', false),
  ('Arnold press',                  'ombro', false),
  ('Face pull no cabo',             'ombro', false),

  -- Bíceps
  ('Rosca alternada com halteres',  'biceps', true),
  ('Rosca martelo',                 'biceps', false),
  ('Rosca scott',                   'biceps', false),
  ('Rosca concentrada',             'biceps', true),
  ('Rosca no cabo',                 'biceps', false),
  ('Rosca spider',                  'biceps', false),
  ('Rosca inversa com barra',       'biceps', false),

  -- Tríceps
  ('Tríceps pulley (corda)',        'triceps', false),
  ('Tríceps testa com barra',       'triceps', false),
  ('Tríceps francês com halter',    'triceps', true),
  ('Mergulho no banco',             'triceps', false),
  ('Paralelas',                     'triceps', false),
  ('Tríceps coice com halter',      'triceps', true),
  ('Supino fechado',                'triceps', false),
  ('Extensão de tríceps na polia alta unilateral', 'triceps', true),

  -- Abdômen
  ('Abdominal supra',               'abdomen', false),
  ('Prancha',                       'abdomen', false),
  ('Prancha lateral',               'abdomen', true),
  ('Elevação de pernas',            'abdomen', false),
  ('Abdominal infra',               'abdomen', false),
  ('Abdominal oblíquo na bicicleta', 'abdomen', false),
  ('Abdominal na polia',            'abdomen', false),
  ('Abdominal máquina',             'abdomen', false),
  ('Rotação de tronco no cabo',     'abdomen', true)
on conflict do nothing;
