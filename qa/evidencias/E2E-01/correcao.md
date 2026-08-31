# Fase 6 (escopo reduzido) — E2E das 3 jornadas do PRD §6 — 2026-08-31

## O pedido

Depois do debate de backlog desta sessão, o dono reduziu a Fase 6 (review
integral, fitness functions automatizadas, E2E das 3 jornadas, gate visual
em celular físico) só à parte de E2E automatizado: J1-Treino, J2-Análise,
J3-Dúvida, rodando em todo PR.

Antes de escrever teste, duas decisões de arquitetura foram levadas ao dono
(ver transcrição desta sessão):

1. **Gemini real ou mockada em J2/J3?** Resolvido sem precisar perguntar —
   o próprio PRD já decide: a chave da Gemini só existe atrás de
   `src/app/api/` (FF1/FF2, A5), e o critério A6 ("parecer cita número
   real") já está definido como **leitura humana** de pareceres reais (o
   agente `qa-treino`), não automação de CI. E2E só testa até a borda da
   rota mesmo. Decisão: `/api/analise` e `/api/coach` interceptados no
   NAVEGADOR (`page.route`), Gemini real nunca chamada por este workflow.
2. **J1 no CI contra o Supabase hospedado?** Perguntado, dono aprovou: cada
   spec cria e apaga seu próprio usuário QA descartável no projeto
   hospedado (não há stack local — ver KNOWLEDGE.md).
3. **J2/J3 bloqueiam todo PR ou só manual?** Perguntado, dono escolheu
   bloquear todo PR — cumpre o objetivo original da Fase 6.

## O que foi feito

- `playwright.config.ts` — `next build && next start -p 3100`, 1 worker,
  trace/screenshot em falha, **`serviceWorkers: "block"`** (ver achado 2
  abaixo).
- `e2e/helpers/usuario-descartavel.ts` — cria/apaga usuário QA via
  `auth.admin.createUser`/`deleteUser` (GoTrue, não PostgREST — ver
  achado 1), login real pela UI, e `clienteAutenticado()` (signInWithPassword
  com a chave publishable) pra semear dado como o próprio usuário.
- `e2e/helpers/semear-historico.ts` — insere 4 treinos (7/14/21/28 dias
  atrás) com 1 série valendo cada, pra destravar `MINIMO_SEMANAS_PARECER`
  (3) sem precisar de 4 semanas reais de uso.
- `e2e/j1-treino.spec.ts`, `e2e/j2-analise.spec.ts`, `e2e/j3-duvida.spec.ts`
  — as 3 jornadas.
- `package.json` — `"e2e": "playwright test"` + `@playwright/test` como
  devDependency (só `playwright`, sem o test runner, já existia).
- `.github/workflows/ci.yml` — passo `E2E (jornadas J1/J2/J3 do PRD §6)`
  depois do type-check, com os 3 secrets reais (sem placeholder — se
  faltar secret, o passo falha alto, não roda contra projeto inexistente).

## Achados reais de infraestrutura (não hipotéticos — travaram a suíte até serem corrigidos)

### 1. `service_role` deste projeto Supabase não tem GRANT nenhum nas tabelas via PostgREST

Tentar `criarClienteAdmin().from("exercicio").select(...)` (ou qualquer
tabela) falha com `permission denied for table X` (código `42501`), com o
Postgres sugerindo `GRANT SELECT ON public.X TO service_role;`. Não é RLS
(que `service_role` ignoraria de qualquer forma) — é ausência da GRANT de
base. `src/lib/supabase/cliente-admin.ts` nunca expôs isso porque seu único
uso real (`auth.admin.deleteUser`, C5) é chamada do GoTrue, não do
PostgREST — não precisa de GRANT de tabela.

**Contorno usado aqui:** os helpers de seed autenticam como o PRÓPRIO
usuário QA (`signInWithPassword` com a chave publishable) e inserem só o
que a RLS já deixaria a pessoa inserir para si mesma — sem precisar de
privilégio elevado nenhum.

**Não corrigido** — rodar `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL
TABLES IN SCHEMA public TO service_role;` (ou por tabela) é mudança de
permissão no banco de PRODUÇÃO, fora do escopo desta tarefa. Fica
registrado pro dono decidir: hoje não quebra nada (nenhum código do app
usa `service_role` pra tocar tabela), mas é uma pegadinha real esperando
qualquer futuro script/edge function que tente.

### 2. O service worker escapa de `page.route()` — `/api/analise` e `/api/coach` chamavam a Gemini de VERDADE

`public/sw.js` responde a todo fetch não-navegação com
`respondWith(fetch(evento.request)...)` — ele REFAZ a chamada de dentro do
próprio Service Worker. Rodando a suíte pela primeira vez sem bloquear o
SW, os 2 mocks (`page.route("**/api/analise")` e `"**/api/coach"`) nunca
eram chamados: a requisição saía do contexto de rede da PÁGINA (que
Playwright intercepta) e entrava no contexto do SW (que não intercepta por
padrão) antes de sair pra rede de verdade. Resultado real numa rodada: o
coach respondeu com um parecer genuíno da Gemini ("Não tenho acesso aos
seus dados de treino...") — 1 chamada real gasta da cota de 20/dia
(KNOWLEDGE.md §3.2) sem eu ter pedido.

**Corrigido:** `serviceWorkers: "block"` no `playwright.config.ts` — sem
SW registrado, todo fetch da página passa pela rota normal, interceptável.
Não tira cobertura de J1: a resiliência offline dele é o outbox no Dexie
(client-side, `sincronizar-pendentes.ts`), não depende do SW.

## Prova

- `npm run e2e`: 2 rodadas seguidas, 3/3 specs verdes, contra o Supabase
  hospedado de verdade (sem stack local).
- `npx tsc --noEmit`: só o erro pré-existente (`LayoutProps`,
  `src/app/layout.tsx`, tipo gerado pelo Next só existe após build) —
  nenhum erro nos arquivos novos de `e2e/`.
- Confirmado manualmente com o Browser pane (usuário QA descartável à
  parte, apagado ao final) o fluxo real de UI que os specs automatizam:
  Iniciar treino → Adicionar exercício → escolher grupo muscular →
  Continuar → formulário de série; "Outra série" reabre o formulário sem
  repetir a escolha de grupo.
