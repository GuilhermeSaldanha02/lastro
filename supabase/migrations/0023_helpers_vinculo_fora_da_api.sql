-- ============================================================
-- lastro · migração 0023 — tira os helpers do vínculo da API pública
-- Achado do linter de segurança do Supabase, rodado logo depois da 0022
-- (lint 0028/0029). Correção da 0022, não funcionalidade nova.
-- ============================================================

-- O PostgreSQL concede `execute` a PUBLIC em toda função nova, e o
-- PostgREST expõe o schema `public` inteiro em `/rest/v1/rpc/`. Resultado:
-- `tem_vinculo_aceito` e `e_meu_personal` — que existem SÓ para serem
-- chamadas de dentro de uma policy — viraram endpoint chamável por
-- qualquer um, inclusive sem sessão.
--
-- O ESTRAGO REAL ERA PEQUENO, e vale dizer por quê em vez de deixar
-- parecer grave: as duas dependem de `auth.uid()`, então para o `anon` elas
-- só sabem responder `false`, e para o `authenticated` respondem algo que
-- ele já sabe (se ele mesmo é o personal de alguém). Não vazam linha
-- nenhuma. O que se fecha aqui é SUPERFÍCIE: função `security definer`
-- pendurada na API sem precisar é exatamente o tipo de coisa que vira furo
-- quando alguém edita o corpo dela mais tarde sem lembrar que ela é pública.
--
-- `authenticated` PRECISA continuar com `execute`: a expressão de uma
-- policy roda com os privilégios de quem consulta, então revogar dele
-- quebraria `treino_visivel_ao_personal` e as irmãs — a fila do personal
-- voltaria vazia. Revoga-se de PUBLIC e de `anon`; concede-se de volta,
-- explicitamente, só a quem a policy precisa.
revoke all on function public.tem_vinculo_aceito(uuid) from public;
revoke all on function public.tem_vinculo_aceito(uuid) from anon;
grant execute on function public.tem_vinculo_aceito(uuid) to authenticated;

revoke all on function public.e_meu_personal(uuid) from public;
revoke all on function public.e_meu_personal(uuid) from anon;
grant execute on function public.e_meu_personal(uuid) to authenticated;

-- `aceitar_convite_personal` e `revogar_vinculo_personal` continuam
-- chamáveis por `authenticated` DE PROPÓSITO: elas são a API do módulo, e
-- a 0022 já revogou PUBLIC nas duas. O linter vai seguir apontando as duas
-- (lint 0029) — é esperado, não é pendência.
