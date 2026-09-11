-- ============================================================
-- lastro · A MEDIDA DA §11.7 — "o grupo muscular alertado recebeu
-- estímulo na semana seguinte?"
--
-- Fonte: PRD.md §11.7. É a métrica que o próprio PRD nomeia como a que
-- decide se o módulo Personal funciona. NÃO é "conversaram?" — essa
-- pergunta saiu do produto junto com o chat, e é bom que tenha saído:
-- conversa é meio, estímulo é resultado, e o estímulo está no lastro de
-- qualquer jeito porque é o aluno que registra o treino.
--
-- COMO RODAR (mesma via do `ff5-rls.sql`, SDD.md §10):
--
--     psql "$DATABASE_URL" -f scripts/medida-alerta-estimulo.sql
--
-- As duas partes são independentes; se usar `supabase db query -f`, rode
-- uma de cada vez — ele só devolve o resultado da última statement do
-- arquivo (achado registrado no PROGRESS, item 7 da auditoria).
--
-- ------------------------------------------------------------
-- O QUE ESTA CONSULTA NÃO PROVA. Leia antes de usar o número.
-- ------------------------------------------------------------
--
-- 1. É CORRELAÇÃO, e de amostra auto-selecionada. O personal escolhe
--    quais alertas aciona, e provavelmente aciona os dos alunos que ele
--    cobraria de qualquer forma. Aluno treinado é aluno que treina; a
--    coluna "acionado" não é um braço de experimento, é uma escolha de
--    quem está sendo medido. Sem randomização e com n≈1 personal, isto
--    descreve o que aconteceu — não estabelece que o alerta causou nada.
-- 2. NÃO cobre `estagnacao_exercicio` nem `queda_volume`. A §11.7 define
--    sucesso só para o abandono de grupo. Inventar uma definição de
--    sucesso para os outros dois seria inventar dado de negócio
--    (`AGENTS.md` §5), e eles ficam de fora de propósito.
-- 3. HOJE ELA DEVOLVE ZERO LINHAS. Nenhum personal real está usando o
--    módulo. Este arquivo é instrumento para daqui a três ou quatro
--    semanas — a primeira leitura que vale alguma coisa é a da terceira
--    segunda-feira que o P2 nomeou ("se for só mais uma notificação
--    semanal, depois de algumas semanas eu vou ignorar"). Consulta
--    construída e devolvendo vazio NÃO é medida feita.
-- ============================================================


-- ------------------------------------------------------------
-- PARTE 1 — uma linha por alerta de abandono, com o desfecho.
--
-- `semana_inicio` é a segunda-feira ISO gravada por `semanaAnaliseAtual()`
-- (`semanas.ts`). A janela da "semana seguinte" é aritmética sobre ESSA
-- data — +7 a +13 dias —, nunca um `date_trunc('week')` recalculado aqui:
-- recalcular arrisca discordar da fronteira de semana do próprio app, e
-- medida que discorda do que ela mede é pior que medida nenhuma.
--
-- `tipo = 'valendo'` não é detalhe: é a FF4, e é a mesma régua que o
-- detector usou para disparar o alerta. Contar aquecimento aqui faria
-- alerta e medida usarem definições diferentes de "treinou", e o número
-- subiria sozinho, em silêncio.
-- ------------------------------------------------------------
select
  a.semana_inicio,
  a.alvo                                as grupo_alertado,
  (a.acionado_em is not null)           as acionado,
  exists (
    select 1
    from public.treino t
    join public.serie s   on s.treino_id = t.id
    join public.exercicio e on e.id = s.exercicio_id
    where t.usuario_id = v.aluno_id
      and s.tipo = 'valendo'
      and e.grupo_muscular_primario = a.alvo
      and t.data >= a.semana_inicio + interval '7 days'
      and t.data <  a.semana_inicio + interval '14 days'
  )                                     as recebeu_estimulo,
  a.criado_em,
  a.acionado_em
from public.alerta_personal a
join public.vinculo_personal v on v.id = a.vinculo_id
where a.tipo = 'grupo_sem_estimulo'
order by a.semana_inicio desc, a.alvo;


-- ------------------------------------------------------------
-- PARTE 2 — o agregado, partido por acionamento.
--
-- O total sozinho não responde nada: o aluno treinaria de qualquer jeito
-- em alguma proporção. A única estrutura que existe no dado e que fala
-- sobre o módulo é a diferença entre alerta acionado e não acionado — com
-- a ressalva do item 1 lá em cima, que vale inteira mesmo que a diferença
-- seja grande.
--
-- Uma linha por grupo de acionamento; `alertas` pequeno demais para
-- comparar proporção é resultado esperado nos primeiros meses, e é para
-- isso que a coluna está aqui.
-- ------------------------------------------------------------
with desfecho as (
  select
    (a.acionado_em is not null) as acionado,
    exists (
      select 1
      from public.treino t
      join public.serie s   on s.treino_id = t.id
      join public.exercicio e on e.id = s.exercicio_id
      where t.usuario_id = v.aluno_id
        and s.tipo = 'valendo'
        and e.grupo_muscular_primario = a.alvo
        and t.data >= a.semana_inicio + interval '7 days'
        and t.data <  a.semana_inicio + interval '14 days'
    ) as recebeu_estimulo
  from public.alerta_personal a
  join public.vinculo_personal v on v.id = a.vinculo_id
  where a.tipo = 'grupo_sem_estimulo'
    -- Só alerta cuja semana seguinte JÁ TERMINOU. Sem este corte, o
    -- alerta da semana corrente entra como "não recebeu estímulo" apenas
    -- porque a semana ainda não acabou, e a medida piora sozinha toda
    -- segunda-feira.
    and a.semana_inicio + interval '14 days' <= current_date
)
select
  acionado,
  count(*)                                              as alertas,
  count(*) filter (where recebeu_estimulo)              as com_estimulo,
  round(
    100.0 * count(*) filter (where recebeu_estimulo) / nullif(count(*), 0),
    1
  )                                                     as pct
from desfecho
group by acionado
order by acionado desc;
