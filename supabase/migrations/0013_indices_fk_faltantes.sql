-- lastro · 0013 — índices em chaves estrangeiras sem cobertura
--
-- Contexto: advisor de performance do Supabase (get_advisors) apontou 3
-- foreign keys sem índice de cobertura. `serie.exercicio_id` é a que
-- importa de verdade — sustenta consulta de histórico por exercício
-- (junta com `serie_usuario_criado_idx` já existente), e cresce junto
-- com o volume de séries registradas. As outras duas (`exercicio` e
-- `modelo_treino_exercicio`) são higiene barata: tabelas pequenas hoje,
-- mas sem custo real em criar o índice agora em vez de depois.

create index if not exists serie_exercicio_idx
  on public.serie (exercicio_id);

create index if not exists exercicio_grupo_muscular_primario_idx
  on public.exercicio (grupo_muscular_primario);

create index if not exists modelo_treino_exercicio_exercicio_idx
  on public.modelo_treino_exercicio (exercicio_id);
