-- supabase/migrations/0017_parecer_checks_dominio.sql

-- Achado da revisão de qualidade da Task 2 (histórico de pareceres):
-- `idioma` e `pergunta` são domínio fechado no TypeScript (Idioma,
-- NumeroPergunta) mas ficaram sem CHECK no banco, quebrando o precedente
-- já estabelecido pelo projeto pra este tipo exato de invariante
-- (0012_idiomas.sql pro idioma; serie_reps_positiva/serie_rir_valido
-- pra faixas numéricas em 0001).
alter table public.parecer
  add constraint parecer_idioma_valido check (idioma in ('pt-BR', 'en', 'es'));

alter table public.parecer
  add constraint parecer_pergunta_valida check (pergunta between 1 and 5);
