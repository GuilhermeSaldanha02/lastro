-- lastro · 0010 — peso por lado (halteres) substitui peso_corporal_incluso
--
-- Contexto (achado do dono, 2026-08-24): o volume só sabia dobrar por
-- `unilateral` (reps contadas por lado). Halter bilateral tem
-- unilateral=false CORRETAMENTE (as reps não dobram), mas o peso
-- registrado é de UM halter — o volume real é o dobro do calculado.
-- Mesma correção de unilateral (dobra o volume), motivo distinto (peso
-- por implemento, não reps por lado). Os dois nunca compõem no mesmo
-- cálculo — ver src/lib/analise/volume.ts.
--
-- peso_corporal_incluso nunca foi usado (0 de 461 séries no banco em
-- 2026-08-24) — removido de vez, decisão do dono.

alter table public.exercicio
  add column peso_por_lado boolean not null default false;

comment on column public.exercicio.peso_por_lado is
  'true quando o peso registrado é de UM lado/implemento (ex.: um halter em cada mão) — dobra o volume igual a unilateral, por razão distinta (peso por implemento, não reps por lado). Nunca compõe com unilateral=true no mesmo cálculo.';

-- Exercícios bilaterais (unilateral=false) com "halteres" no plural — um
-- halter em cada mão, peso digitado é de um só. Não inclui "halter" no
-- singular (pull-over, agachamento sumô goblet): aí é UM halter segurado
-- com as duas mãos, o peso digitado já é o total.
update public.exercicio set peso_por_lado = true
where unilateral = false
  and nome in (
    'Supino reto com halteres',
    'Supino inclinado com halteres',
    'Supino declinado com halteres',
    'Crucifixo reto com halteres',
    'Crucifixo inclinado com halteres',
    'Levantamento terra romeno com halteres',
    'Desenvolvimento com halteres',
    'Elevação frontal com halteres',
    'Encolhimento com halteres'
  );

alter table public.serie drop column peso_corporal_incluso;
