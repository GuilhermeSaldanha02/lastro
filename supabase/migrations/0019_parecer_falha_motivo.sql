-- supabase/migrations/0019_parecer_falha_motivo.sql

-- POR QUE ESTA COLUNA EXISTE.
--
-- Até aqui, `aviso_falha_interpretativa` era um BOOLEANO: o parecer ou tinha
-- prosa da Gemini, ou não tinha. Quatro causas completamente diferentes
-- caíam no mesmo `true`, e o app contava a mesma história para todas:
--
--   · 503 ServiceUnavailable — a API não respondeu (11 ocorrências em
--     3/set, 2 em 1/set, 1 em 4/set; medição em DECISIONS.md 2026-09-04);
--   · 429 TooManyRequests    — teto de cota (5 RPM / 20 RPD, KNOWLEDGE §3.2);
--   · 404 NotFound           — 5 ocorrências entre 27 e 29/ago, sem explicação;
--   · validador rejeitou     — duas tentativas com número intruso.
--
-- Sem distinguir, ninguém consegue responder "por que meu parecer saiu sem
-- prosa?" depois do fato: o runtime log da Vercel no plano Hobby retém
-- 1 HORA. O diagnóstico de 2026-09-04 só foi possível porque o dono gerou e
-- avisou dentro de 3 minutos. Isso não é um processo, é sorte.
--
-- NULA para todo parecer anterior a esta migração, de propósito: não dá pra
-- inventar retroativamente a causa de uma falha que já passou.

alter table public.parecer
  add column falha_motivo text;

-- Domínio fechado. `api_erro` é o balde honesto para status que não
-- reconhecemos — melhor do que forçar uma causa errada.
alter table public.parecer
  add constraint parecer_falha_motivo_valido check (
    falha_motivo is null
    or falha_motivo in (
      'api_indisponivel',
      'cota_excedida',
      'modelo_ausente',
      'api_erro',
      'validador_rejeitou'
    )
  );

-- Coerência: motivo só faz sentido quando houve falha. O inverso NÃO é
-- exigido — pareceres anteriores a esta migração têm falha sem motivo, e
-- exigir motivo os tornaria inválidos retroativamente.
alter table public.parecer
  add constraint parecer_falha_motivo_coerente check (
    aviso_falha_interpretativa = true or falha_motivo is null
  );

-- GRANT de coluna, mesmo padrão da 0018: o route handler completa o
-- rascunho com UPDATE, e sem isto o Postgres nega a coluna nova.
grant update (falha_motivo) on public.parecer to authenticated;
