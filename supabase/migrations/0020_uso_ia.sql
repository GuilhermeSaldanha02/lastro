-- supabase/migrations/0020_uso_ia.sql

-- POR QUE ESTA TABELA EXISTE.
--
-- A cota da Gemini no nível gratuito é de 20 requisições/dia (KNOWLEDGE
-- §3.2) e é COMPARTILHADA entre a Análise Semanal e o Coach 24h — os dois
-- usam `ClienteParecerGemini`, a mesma chave, o mesmo projeto.
--
-- Em 2026-09-05 o parecer ganhou teto de 5 gerações/dia (DECISIONS
-- 2026-09-05) e o Coach ficou SEM TETO NENHUM: ele só limita o tamanho da
-- pergunta, nunca a quantidade de chamadas. Uma conversa longa no chat
-- esvazia a cota e joga a peça-assinatura no fallback — exatamente a falha
-- que aquele dia inteiro foi gasto consertando. A assimetria foi criada
-- por nós.
--
-- E O FURO QUE ELA FECHA DE BRINDE. O teto do parecer contava LINHAS na
-- tabela `parecer` criadas hoje. Descartar um rascunho apaga a linha —
-- então quem descartava recuperava a vaga sem recuperar a cota já gasta na
-- Gemini. Está documentado em DECISIONS 2026-09-05 como limite aceito.
-- Contando aqui, o consumo vira imutável: a chamada foi feita, ponto.
--
-- Registro de TENTATIVA, não de sucesso — de propósito. A cota do Google é
-- consumida pela chamada, mesmo quando ela volta 503.

create table public.uso_ia (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  origem      text not null,
  criado_em   timestamptz not null default now()
);

alter table public.uso_ia
  add constraint uso_ia_origem_valida check (origem in ('parecer', 'coach'));

-- A consulta é sempre "quantos deste usuário, desta origem, desde o início
-- do dia local" — o índice cobre exatamente isso.
create index uso_ia_usuario_dia_idx
  on public.uso_ia (usuario_id, origem, criado_em desc);

alter table public.uso_ia enable row level security;

create policy uso_ia_proprio on public.uso_ia
  for all to authenticated
  using (usuario_id = (select auth.uid()))
  with check (usuario_id = (select auth.uid()));

-- GRANT explícito, não só RLS — sem isto o Postgres nega o OBJETO antes de
-- a RLS ser avaliada (mesma causa-raiz da 0016).
--
-- Sem `update` e sem `delete` de propósito: isto é LOG DE CONSUMO. Poder
-- apagar reabriria exatamente o furo que a tabela existe para fechar.
grant select, insert on public.uso_ia to authenticated;
