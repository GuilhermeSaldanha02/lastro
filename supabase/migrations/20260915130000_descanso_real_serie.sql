alter table public.serie
  add column descanso_real_segundos integer;

alter table public.serie
  add constraint serie_descanso_real_nao_negativo
  check (descanso_real_segundos is null or descanso_real_segundos >= 0);

comment on column public.serie.descanso_real_segundos is
  'Tempo ativo realmente medido, em segundos, depois desta série; null significa não medido.';
