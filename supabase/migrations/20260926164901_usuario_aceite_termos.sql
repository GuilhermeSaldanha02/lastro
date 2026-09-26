-- ============================================================
-- lastro · PU-06 — aceite dos Termos de Uso e da Política de Privacidade
-- ============================================================
-- `termos_versao_aceita` guarda QUAL versão do texto a conta aceitou
-- (`VERSAO_DOCUMENTOS` em `src/lib/legal/documentos.ts`) e `termos_aceitos_em`
-- QUANDO. Qualquer conta cuja versão aceita seja diferente da vigente cai em
-- `/aceite` antes de usar o app; mudar o texto e a versão pede novo aceite.
--
-- Nenhuma conta foi marcada na migração: as que já existiam aceitam uma vez,
-- como qualquer conta nova. Concessão por coluna, como as demais de `usuario`.
-- ============================================================

alter table public.usuario
  add column termos_versao_aceita text,
  add column termos_aceitos_em timestamptz;

grant select (termos_versao_aceita, termos_aceitos_em),
      update (termos_versao_aceita, termos_aceitos_em)
  on public.usuario to authenticated;
