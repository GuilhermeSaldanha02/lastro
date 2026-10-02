# Projeto Supabase de teste do e2e (`lastro-teste`)

Criado em 2026-10-02 (E2E-PROD). O e2e cria e apaga contas e dados com a
`service_role`; antes disso rodava na produção. Agora roda aqui.

- **Projeto:** `lastro-teste`, ref `zefhypctyizvgipwyjds`, região São Paulo, custo US$ 0/mês.
- **Produção (nunca o e2e):** ref `tbkzcqfvafznxallyfqk`. `playwright.config.ts` recusa essa URL
  (`E2E_PERMITE_PRODUCAO=1` é a exceção consciente, fora do CI).
- **Secrets do GitHub (sem fallback; sem eles o passo de e2e falha alto):**
  `TESTE_SUPABASE_URL`, `TESTE_SUPABASE_ANON_KEY`, `TESTE_SUPABASE_SERVICE_ROLE_KEY`.
  Os secrets sem `TESTE_` (produção) continuam só no passo de build.

## Regra de ouro: toda migração nova vai para os DOIS projetos

Depois de aplicar uma migração na produção (MCP `apply_migration`), aplique a
mesma no `lastro-teste`, senão o e2e roda contra um schema velho. O MCP carimba
as versões com a data de hoje, então as versões do teste não batem com os arquivos
(só os nomes batem); isso é esperado.

## O que o teste tem de diferente das migrações (e por quê)

As migrações do repositório **não bastam para recriar o banco**: há dados e ids de
produção dentro delas. Para replicar, foram necessários estes preparos (todos só no
teste, nada em produção):

1. `seed_grupos_base_fora_das_migracoes`: os 7 grupos musculares base (peito, costas,
   quadríceps, ombro, bíceps, tríceps, abdômen) eram semeados à mão em produção.
2. `preparo_exercicios_com_ids_de_producao`: a 0012 usa UUIDs de exercício fixos de
   produção; os 102 exercícios do estágio da 0011 foram copiados com os mesmos ids.
3. `stub_rls_auto_enable`: a 0014 revoga execução de `public.rls_auto_enable()`, função que
   só existe em projetos mais antigos.
4. `preparo_nomes_exercicios_no_estagio_0021`: a 0021 casa exercícios por nome; cinco foram
   renomeados depois, então voltaram ao nome do estágio da 0021 antes dela.
5. `preparo_grants_iguais_a_producao` e `preparo_grants_colunas_e_funcoes_iguais_a_producao`:
   o projeto novo vem com todos os grants liberados; produção é restrita. Os grants de tabela,
   coluna e função foram igualados (conferidos por hash).

Conferido igual a produção: 19 tabelas, 218 exercícios, 436 traduções de dica, 26 policies RLS,
18 funções, 45 índices, 3 triggers, trigger de `auth.users`, bucket `avatares` e suas policies,
extensões, `config_ia`. O job de `pg_cron` de push foi desligado no teste (apontava para a URL
de produção).

## O que não é replicado (configuração do painel)

Autenticação (confirmação de e-mail, redirect URLs, provedores) não é replicável por
migração; no teste vale o padrão do projeto novo. Se uma spec depender disso, ajuste no
painel do `lastro-teste`.
