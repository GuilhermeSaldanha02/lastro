-- FAXINA-1 (2026-10-01): nome sem acento desde a 0021. A mídia casa por id
-- (src/lib/dados/exercicios-midia.json), então trocar o nome não a afeta.
update public.exercicio
set nome = 'Elevação lateral com halteres'
where id = 'ff8a4f89-15e6-4c97-85cc-90cd5c15d03f'
  and nome = 'Elevacao lateral com halteres';
