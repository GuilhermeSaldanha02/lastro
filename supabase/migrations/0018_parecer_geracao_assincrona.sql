-- supabase/migrations/0018_parecer_geracao_assincrona.sql

-- Geração assíncrona da Análise Semanal (SDD.md §11, achado do dono
-- 2026-09-01): a tabela `parecer` (0016) guardava só pareceres já
-- confirmados. Agora também guarda o rascunho enquanto gera e enquanto
-- aguarda "Salvar"/"Descartar" — daí `status` e `confirmado` novos, e
-- `texto`/`evidencia` viram nullable (não existem ainda quando
-- status = 'gerando').
alter table public.parecer
  add column status text not null default 'pronto',
  add column confirmado boolean not null default true,
  alter column texto drop not null,
  alter column evidencia drop not null;

alter table public.parecer
  add constraint parecer_status_valido check (status in ('gerando', 'pronto'));

-- Invariante de conteúdo: 'gerando' é sempre rascunho vazio e não
-- confirmado; 'pronto' sempre tem o texto e a evidência que a Gemini (ou
-- o fallback determinístico) produziu.
alter table public.parecer
  add constraint parecer_conteudo_consistente check (
    (status = 'gerando' and texto is null and evidencia is null and confirmado = false)
    or (status = 'pronto' and texto is not null and evidencia is not null)
  );

-- GRANT de update, ausente desde 0016 ("editar um parecer salvo" continua
-- fora de escopo). Column-level: só as colunas que o ciclo de vida do
-- rascunho precisa tocar (route handler completando a geração; "Salvar"
-- confirmando). `pergunta`, `pergunta_texto`, `idioma`, `usuario_id`,
-- `criado_em` continuam imutáveis pela aplicação — mesmo padrão de
-- `modelo_treino_exercicio` (reps/peso, ADR-010).
grant update (status, texto, evidencia, aviso_falha_interpretativa, confirmado)
  on public.parecer to authenticated;
