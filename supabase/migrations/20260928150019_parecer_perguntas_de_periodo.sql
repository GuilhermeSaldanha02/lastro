-- AN-08 M2-2 (DECISIONS.md 2026-09-28 (2)): perguntas 6 ("Como foi meu mês?")
-- e 7 ("Como foi do primeiro treino até hoje?"), por lógica, entram no mesmo
-- histórico de pareceres. Só amplia o domínio: toda linha que já existe
-- (1 a 5) continua válida, e o código anterior nunca grava 6 nem 7.
alter table public.parecer drop constraint parecer_pergunta_valida;
alter table public.parecer
  add constraint parecer_pergunta_valida check (pergunta between 1 and 7);
