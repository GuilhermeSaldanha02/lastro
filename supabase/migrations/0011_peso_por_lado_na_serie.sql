-- lastro · 0011 — peso_por_lado vira campo da SÉRIE, não só do catálogo
--
-- Contexto (achado do dono, testando 0010 ao vivo): marcar peso_por_lado
-- só no catálogo (9 exercícios fixos de halter) é rígido demais — não
-- cobre halter usado num exercício que não está nessa lista, nem dá ao
-- dono controle no momento do registro. O dono pediu um interruptor real
-- no formulário, no mesmo lugar onde "peso corporal incluso" existia
-- antes — mesma forma de PERSISTÊNCIA (por série), conceito diferente.
--
-- exercicio.peso_por_lado NÃO sai do schema: continua existindo como
-- DEFAULT que pré-marca o interruptor quando o exercício escolhido é um
-- dos halteres conhecidos — evita o dono re-declarar toda vez. Mas quem
-- decide o volume agora é serie.peso_por_lado, não exercicio.peso_por_lado.

alter table public.serie
  add column peso_por_lado boolean not null default false;

comment on column public.serie.peso_por_lado is
  'true quando o peso desta série é de UM lado/implemento (ex.: um halter em cada mão) — dobra o volume, igual unilateral, mas nunca composto com ele. Fonte de verdade do volume (substitui exercicio.peso_por_lado nesse papel); exercicio.peso_por_lado continua existindo só como valor-padrão do formulário.';

-- Backfill: as séries já gravadas dos 9 exercícios de halter marcados na
-- migração 0010 ganham peso_por_lado=true aqui, senão o deploy desta
-- migração reverteria silenciosamente a correção de volume de ontem
-- (toda série existente nasceria com peso_por_lado=false).
update public.serie s
set peso_por_lado = true
from public.exercicio e
where s.exercicio_id = e.id
  and e.peso_por_lado = true;
