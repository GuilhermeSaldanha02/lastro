-- ============================================================
-- lastro · seed mínimo (SDD.md §3.5 — TODO bloqueado, entrada do dono)
--
-- grupo_muscular: lista óbvia, dado público de baixo risco. Seguro semear.
--
-- exercicio: SDD §3.5 é explícito — a lista REAL dos ~10-15 exercícios que
-- o dono faz é TODO, não pode ser inventada (E3). Sem ela, a tarefa 1.2 não
-- roda e a 1.3 não tem fixture realista, então este seed inclui só o
-- suficiente para exercitar a verificação end-to-end (§3.8) e casar com os
-- nomes já usados nos testes do agregador (src/lib/analise/*.test.ts).
--
-- >>> ISTO É CATÁLOGO DE TESTE, NÃO O CATÁLOGO REAL. <<<
-- Substituir assim que o dono responder o TODO de §3.5.
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
  ('Rosca direta',          'biceps',     true),
  ('Agachamento livre',     'quadriceps', false);
