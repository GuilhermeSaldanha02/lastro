-- ============================================================
-- lastro · nomes de exercício em português (pedido do dono, 2026-09-23):
-- o app está em pt-BR e o catálogo mostrava 12 nomes em inglês.
--
-- REGRA (escolha do dono): nome em português com o termo conhecido
-- entre parênteses, como já era "Agachamento com cinto (belt squat)".
-- Continua em inglês o jargão que academia brasileira usa assim: leg
-- press, stiff, pulley, smith, crossover, scott, goblet, sissy, spider,
-- Zottman, pull-over.
--
-- Só o nome muda. Série, modelo e tradução apontam para o id, então o
-- histórico segue no mesmo exercício. As traduções en/es não mudam.
-- ============================================================

update public.exercicio e
   set nome = v.novo
  from (values
    ('Arnold press',                    'Desenvolvimento Arnold'),
    ('Face pull no cabo',               'Puxada para o rosto no cabo (face pull)'),
    ('Landmine press',                  'Desenvolvimento na barra ancorada (landmine)'),
    ('Pallof press',                    'Antirrotação no cabo (Pallof press)'),
    ('Dead bug',                        'Inseto morto (dead bug)'),
    ('Superman',                        'Extensão lombar no solo (superman)'),
    ('Hack squat',                      'Agachamento hack'),
    ('Peck deck',                       'Voador (peck deck)'),
    ('Peck deck invertido',             'Voador invertido (peck deck invertido)'),
    ('Pulldown braços estendidos',      'Puxada com braços estendidos (pulldown)'),
    ('Caminhada lateral com mini band', 'Caminhada lateral com elástico (mini band)'),
    ('Levantamento terra com trap bar', 'Levantamento terra com barra hexagonal (trap bar)')
  ) as v(antigo, novo)
 where e.nome = v.antigo;
