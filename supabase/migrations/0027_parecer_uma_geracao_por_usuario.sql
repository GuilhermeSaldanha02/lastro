-- ============================================================
-- lastro · 0027 — no máximo UMA geração de parecer em andamento por conta
-- (achado M5 do QA do caminho triste; DECISIONS 2026-09-13 (10))
-- ============================================================
-- Dois POST simultâneos a /api/analise passavam pela checagem "já existe
-- geração em andamento?" antes de qualquer um gravar, criavam dois
-- rascunhos em `gerando` e gastavam duas vagas da cota diária da Gemini.
--
-- A primeira correção (DECISIONS 2026-09-13 (4)) foi um desempate por
-- leitura no route handler: reduzia o caso, mas deixava uma janela de
-- milissegundos, porque leitura e escrita não são atômicas. Este índice é
-- a garantia no banco: o segundo insert em `gerando` da mesma conta falha
-- com `23505` (unique_violation), e a rota responde 409 sem gastar cota.
--
-- Parcial de propósito: pareceres `pronto` (salvos ou rascunho aguardando
-- "Salvar"/"Descartar") continuam ilimitados. Geração abandonada presa em
-- `gerando` não trava a conta: `limparRascunhosExpirados` a apaga antes da
-- checagem, depois de LIMITE_GERACAO_TRAVADA_MINUTOS.
--
-- Conferido em produção antes de aplicar (2026-09-13): 0 contas com mais
-- de um parecer em `gerando`, 0 pareceres em `gerando` no total — o índice
-- não encontra linha que o impeça.
--
-- COMPATIBILIDADE COM A `main`: o código vivo checa "em andamento", registra
-- o uso e só então insere. Com o índice, o pedido simultâneo perdedor recebe
-- 500 em vez de 202 e não cria o segundo rascunho; a vaga de cota que ele já
-- registrou continua gasta até a correção da rota (PR da pilha do QA) chegar
-- à `main`.
-- ============================================================

create unique index parecer_uma_geracao_por_usuario
  on public.parecer (usuario_id)
  where status = 'gerando';
