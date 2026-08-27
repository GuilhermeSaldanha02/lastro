-- supabase/migrations/0015_modelo_treino_reps_peso.sql
--
-- Scope Change aprovado pelo dono em 2026-08-27 (ver ADR-010,
-- DECISIONS.md e PRD.md §9/A14). Reverte UMA frase da ADR-009 — a que
-- dizia "não existe coluna de série, peso, reps (…) e não pode passar a
-- existir sem uma entrada nova de ADR". Esta é a entrada nova.
--
-- ⚠️ O QUE **NÃO** MUDA, e é o que de fato importava na ADR-008/009:
-- nenhum módulo de `src/lib/analise/` lê `modelo_treino` ou
-- `modelo_treino_exercicio`, em nenhuma forma. A razão original era
-- impedir a Análise de comparar EXECUTADO contra PLANEJADO — comparação
-- que tende a lisonjear, num produto que existe para medir o que foi
-- feito. Guardar reps/peso aqui não toca nisso, desde que a barreira
-- continue de pé. Ela continua, e agora tem teste automatizado
-- (`src/lib/analise/sem-modelo-treino.test.ts`).

-- ---------------------------------------------------------------------
-- Colunas NULLABLE de propósito: NULL é o estado honesto de "ainda não
-- cadastrado", e é o que faz os modelos que já existem continuarem
-- funcionando sem backfill. Mesmo raciocínio de `meta_treinos_semana`
-- na 0009 — não inventar número que ninguém escolheu.
-- Quando NULL, a UI cai no histórico real do exercício.
-- ---------------------------------------------------------------------
alter table public.modelo_treino_exercicio
  add column reps smallint null,
  add column peso numeric(6, 2) null;

-- Mesmos limites de sanidade da tabela `serie`: reps positivas e um teto
-- que barra digitação errada sem barrar uso real.
alter table public.modelo_treino_exercicio
  add constraint modelo_treino_exercicio_reps_valida
    check (reps is null or (reps > 0 and reps <= 100)),
  add constraint modelo_treino_exercicio_peso_valido
    check (peso is null or (peso >= 0 and peso <= 1000));

-- ---------------------------------------------------------------------
-- `update` era omitido de propósito na 0007 ("editar um modelo depois de
-- criado é FORA de escopo — omitir o grant torna esse limite verdadeiro
-- por construção"). O Scope Change abre exatamente uma exceção: ajustar
-- carga/reps durante o treino grava de volta no modelo.
--
-- O grant é POR COLUNA. Reordenar e trocar o exercício de uma linha
-- continuam impossíveis pelo banco, não por convenção de código — o
-- limite da 0007 sobrevive onde ele ainda vale.
-- ---------------------------------------------------------------------
grant update (reps, peso) on public.modelo_treino_exercicio to authenticated;

comment on column public.modelo_treino_exercicio.reps is
  'Reps planejadas. NULL = não cadastrado; a UI cai no histórico real do exercício. NUNCA lido por src/lib/analise/ (ADR-009).';
comment on column public.modelo_treino_exercicio.peso is
  'Carga planejada em kg. NULL = não cadastrado. NUNCA lida por src/lib/analise/ (ADR-009).';
