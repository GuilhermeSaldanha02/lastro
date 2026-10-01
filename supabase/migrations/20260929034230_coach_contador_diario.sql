-- lastro · AN-08 F0-CUSTO — contador diário de onde o Coach resolveu cada pergunta.
--
-- Por que existe: a única forma de provar a economia do motor determinístico
-- (estudo do AN-08, Entrega 5 §5.4) é contar quantas perguntas o lastro
-- respondeu sozinho e quantas foram para a Gemini.
--
-- Por que NÃO tem usuario_id nem texto: gravar a pergunta seria dado pessoal
-- novo (pergunta de treino pode conter saúde), o que mudaria a Política e
-- obrigaria todas as contas a reaceitar. Contagem agregada por dia basta
-- para a taxa de resolução local.
--
-- Destinos (o que a rota /api/coach fez):
--   local      — resposta calculada pelo lastro (intent de dados)
--   relatorio  — relatório de período gerado e salvo nos pareceres
--   recusa     — recusa conhecida (saúde, execução, prescrição), sem Gemini
--   erro_local — a resposta local falhou ao ler o banco (a rota devolve 503)
--   gemini     — reserva de cota aceita e chamada à Gemini feita; bate com
--                as linhas de uso_ia com origem 'coach' no mesmo dia
--   limite     — reserva de cota negada (teto do dia ou do minuto)
-- Não existe "fallback_gemini" no Coach: falha local não cai na Gemini.

create table public.coach_contador_diario (
  dia date not null,
  intent text not null check (intent ~ '^[A-Z_]{1,40}$'),
  destino text not null check (destino in ('local', 'relatorio', 'recusa', 'erro_local', 'gemini', 'limite')),
  total integer not null default 0 check (total >= 0),
  primary key (dia, intent, destino)
);

comment on table public.coach_contador_diario is
  'AN-08 F0-CUSTO: contagem diária agregada de onde o Coach resolveu a pergunta. Sem usuario_id e sem texto, de propósito.';

-- RLS ligada e SEM policy: ninguém lê nem escreve pela API. A escrita é só
-- pela função abaixo; a leitura, pelo dono no SQL do painel.
alter table public.coach_contador_diario enable row level security;

-- O dia é calculado AQUI, no fuso do Brasil: `current_date` em UTC viraria o
-- dia às 21h, e um dia vindo do cliente poderia ser forjado.
create function public.registrar_resolucao_coach(p_intent text, p_destino text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.coach_contador_diario as c (dia, intent, destino, total)
  values ((now() at time zone 'America/Sao_Paulo')::date, p_intent, p_destino, 1)
  on conflict (dia, intent, destino) do update set total = c.total + 1;
$$;

comment on function public.registrar_resolucao_coach(text, text) is
  'AN-08 F0-CUSTO: soma 1 ao contador do dia. Intent e destino são validados pelos checks da tabela.';

revoke all on function public.registrar_resolucao_coach(text, text) from public, anon;
grant execute on function public.registrar_resolucao_coach(text, text) to authenticated;
