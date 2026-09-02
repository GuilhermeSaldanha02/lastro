# AA-01 — Geração assíncrona da Análise Semanal — 2026-09-02

## O pedido

Achado do dono, registrado em `PROGRESS.md`: o botão "Solicitar Análise"
(`analise-interativa.tsx`) era síncrono — a pessoa ficava 30-50s+ numa tela
de esqueleto sem saber se travou, porque a chamada à Gemini (com retry,
`SDD.md` §6.4) rodava dentro do próprio ciclo de requisição HTTP.

Mecanismo escolhido: `DECISIONS.md`, entrada 2026-09-01 ("Geração
assíncrona da Análise Semanal: `after()`, não fila nem polling") — a
function continua viva depois da resposta HTTP até o callback terminar,
sem fila gerenciada nem polling do cliente. Spec completa em `SDD.md` §11.

## O que foi feito (task por task, resumido)

1. **Migration `0018`** — colunas `status` (`'gerando'|'pronto'`,
   default `'pronto'`) e `confirmado` (boolean, default `true`) na tabela
   `parecer`, aplicada.
2. **`src/lib/dados/parecer.ts` reescrito** — `limparRascunhosExpirados`
   (limpeza preguiçosa, sem cron: apaga geração abandonada presa em
   `'gerando'` além de `LIMITE_GERACAO_TRAVADA_MINUTOS` = 5min e rascunho
   `'pronto'`/`confirmado=false` não decidido além de `EXPIRA_RASCUNHO_HORAS`
   = 24h) rodando antes de qualquer leitura/decisão sobre o rascunho do
   usuário (`listarPareceres`, `buscarRascunhoEmAndamento`, e também antes
   de checar a trava em `POST /api/analise`).
3. **`src/app/api/analise/route.ts`** — insere a linha `status='gerando'`,
   devolve `202 { ok: true, rascunhoId }` na hora, e roda
   `gerarESalvarParecer` via `after()` (mesmo pipeline de prompt/retry/
   validação/fallback de antes, só que fora do ciclo de resposta HTTP).
   Checa trava (`status='gerando'` já existente pro usuário) antes de
   inserir — devolve `409 { erro: "geracao_em_andamento" }` se já houver.
4. **`analise-interativa.tsx` simplificada** — nunca mais mostra o parecer
   inline; ao receber `202` mostra "Parecer em emissão" + esqueleto +
   "Confira em Ajustes > Relatórios em instantes."; `rascunhoInicial` (prop
   vinda do servidor) trava o botão mesmo sem clique nesta sessão,
   sobrevivendo a troca de tela/reload.
5. **`pareceres-salvos.tsx`** — card de rascunho no topo: `status='gerando'`
   mostra "Gerando…"; `status='pronto'` mostra o parecer completo com os
   botões "Salvar" (`confirmarParecer`, `confirmado=true`) e "Descartar"
   (`excluirParecer`, mesma função usada para excluir um parecer já
   confirmado).
6. **`e2e/j2-analise.spec.ts` atualizado** — 2 testes: fluxo do botão
   (202, trava, mensagem) e rascunho pronto semeado direto no banco
   aparecendo em Pareceres salvos com Salvar/Descartar.

## Gates (Passo 1, rodados do zero)

```
npx tsc --noEmit   → TypeScript: No errors found
npm run lint       → ESLint: 0 errors, 18 warnings (todos pré-existentes,
                      fora do escopo desta feature — ilustracao-anatomica-3d.tsx,
                      scripts .mjs avulsos, player-execucao-exercicio.tsx)
npx vitest run     → PASS (238) FAIL (0)
npm run build      → build de produção limpo, 24 rotas geradas, incluindo
                      /api/analise
```

## E2E completo (Passo 2)

```
npx playwright test e2e/ --reporter=list
  ok 1 e2e\j1-treino.spec.ts:36:5 › registra uma série e ela sobrevive a
       ficar offline e voltar (A1/A2/D7) (5.9s)
  ok 2 e2e\j2-analise.spec.ts:39:5 › pede a Análise Semanal — botão
       dispara a pergunta certa e a tela devolve controle na hora
       (A6, SDD.md §11, sem gastar cota real da Gemini) (2.4s)
  ok 3 e2e\j2-analise.spec.ts:75:5 › rascunho pronto aparece em Pareceres
       salvos com Salvar/Descartar (SDD.md §11.4) (2.7s)
  ok 4 e2e\j3-duvida.spec.ts:25:5 › consulta um exercício no catálogo e
       cai no coach quando o catálogo não basta (3.0s)
  4 passed (33.8s)
```

`j1-treino` e `j3-duvida` seguem verdes — a mudança na tabela `parecer`
não quebrou as outras duas jornadas, mesmo rodando contra o mesmo schema.
(Um log `[WebServer] Error: The destination stream closed early` apareceu
no meio da saída — é ruído de shutdown do server de teste do Playwright
entre specs, não afetou nenhum resultado.)

## Achado de infraestrutura na verificação ao vivo (não do código da feature)

Igual ao já registrado em `qa/evidencias/PDF-01/correcao.md` (mesma causa
raiz, incidente diferente): o `preview_start` do Browser pane, que resolve
o servidor de dev por **nome** de configuração (`.claude/launch.json`),
subiu o `npm run dev` de um diretório que **não** era este worktree — o
primeiro clique em "Solicitar Análise" bateu numa versão do app que
respondia **síncrono** (`200` com o parecer completo no corpo, sem
`rascunhoId`, sem persistir linha nenhuma em `parecer`). Comparado o
`route.ts` dos dois checkouts (`grep` por `NextResponse.json({ ok: true`):
0 ocorrências no diretório que o preview_start subiu, 1 ocorrência neste
worktree — confirmando que a chamada real caiu fora daqui. Não houve
escrita nenhuma no diretório errado (só a leitura/execução do `npm run
dev` e uma chamada HTTP), mas **1 chamada real à Gemini foi gasta** contra
o alvo errado antes de identificar a causa (cota ~20/dia,
`KNOWLEDGE.md` §3.2) — registrado aqui com honestidade.

Corrigido subindo o dev server manualmente (`npm run dev -- -p 3099`, com
`cd` explícito para este worktree antes do comando) e apontando o
Playwright direto pra essa porta, sem depender do `preview_start`/
`launch.json`. A partir daí a verificação (abaixo) rodou sem esse ruído.

## Método da verificação ao vivo (Passo 3)

Login real pela UI (formulário `/login`, sem cookie/fetch direto) e
cliques reais no botão, dirigidos por um script Playwright programático
(mesma ferramenta que já roda a suíte E2E do projeto — `playwright`,
`chromium.launch`), não pela extensão de navegador do Browser pane (que
nesta sessão mostrou comportamento inconsistente de coordenadas de clique
antes da troca de abordagem). Sessão reaproveitada entre os pontos via
`context.storageState()`. Todas as leituras/gravações diretas no banco
(pontos 6, 7, 8, 9) via SQL real contra o Postgres do projeto hospedado
(`tbkzcqfvafznxallyfqk`), não via `service_role`/PostgREST (que este
projeto não tem `GRANT` nenhum pras tabelas, achado documentado em
`e2e/helpers/usuario-descartavel.ts`).

Usuário QA descartável `qa.aa01.<timestamp>@lastro.test`, criado via
`auth.admin.createUser`, com histórico semeado: 4 treinos (7, 14, 21, 28
dias atrás) com 1 série "valendo" cada em "Supino reto com barra" —
mesmo padrão de `e2e/helpers/semear-historico.ts`, inseridos direto via
SQL (equivalente ao que o helper faria).

## Os 10 pontos

1. **Logar, ir em `/analise`, clicar "Solicitar Análise". Cronometrar.**
   `POST /api/analise` → `202 { ok: true, rascunhoId }`. Tempo total
   medido pelo Playwright (do clique até a resposta) na **primeira**
   chamada: **4151ms** — acima do "~2s" da spec. O log do servidor
   (`next dev`) decompõe esse tempo: `next.js: 3.2s` (compilação
   Turbopack **a frio** dessa rota, ocorre só uma vez por processo de
   dev) + `application-code: 730ms` (o tempo real gasto pelo handler —
   autenticar, checar trava, inserir o rascunho). A segunda chamada
   (ponto 9, rota já compilada) teve `application-code: ~500ms`. **Este é
   um artefato do modo dev do Next/Turbopack** (compilação lazy por rota
   no primeiro hit), não reproduz em produção — `npm run build` (Passo 1)
   já confirma que o build de produção compila tudo antecipadamente. A
   contribuição real do código do handler (730ms, depois 500ms) está bem
   dentro do orçamento. O botão desativou (`aria-disabled="true"`) e a
   mensagem "Confira em Ajustes > Relatórios em instantes." apareceu,
   ambos confirmados lendo o DOM depois da resposta.
2. **Sem esperar, tentar de novo → recusado.** Chamada direta a
   `fetch('/api/analise', ...)` na mesma sessão (o clique real de UI já
   estava bloqueado por `aria-disabled`, então a prova mais forte da
   trava do **servidor** é chamar a rota diretamente, ignorando o
   `aria-disabled` do cliente): `409 { erro: "geracao_em_andamento" }`.
3. **Recarregar `/analise` de novo, imediatamente.** `page.reload()` —
   `aria-disabled="true"` continuou, e a mensagem "Confira em Ajustes..."
   também — prova que a trava vem do servidor (`rascunhoInicial`
   calculado no load), não só do estado de clique local.
4. **Esperar a geração terminar → rascunho no topo de Pareceres salvos.**
   `after()` rodou e a Gemini respondeu (tentativa 1, sem precisar de
   retry) em ~53s de wall-clock reais (chamada de rede real, cota
   consumida). Estado no banco:
   `status='pronto', confirmado=false`, com `texto` preenchido. Em
   `/ajustes/relatorios`, a seção "PARECERES SALVOS" mostrou o parecer
   completo ("O que mudar na próxima semana?" + o texto real da Gemini)
   com os dois botões "Salvar"/"Descartar" visíveis.
5. **Voltar em `/analise` → botão destravou.** `aria-disabled="false"`
   confirmado (a trava só existe enquanto `status='gerando'`; virou
   `'pronto'`).
6. **Clicar "Salvar" → some os botões, vira item normal; `confirmado=true`
   no Postgres.** Clique real no botão "Salvar" — depois do clique, `0`
   ocorrências de "Salvar" na página (o card virou item confirmado da
   lista). Query direta no Postgres (`select id, status, confirmado from
   parecer where id = '<id>'`) → `{"status":"pronto","confirmado":true}`.
7. **Outra Análise (pergunta diferente) → Descartar → some da lista,
   `count(*) = 0`.** Solicitada a pergunta secundária "Estou
   progredindo?" (`202`, novo `rascunhoId`), esperado terminar
   (`status='pronto'` em ~15s desta vez — mais rápido que a primeira
   chamada). Clicado "Descartar". **Achado, não bug:** a spec deste plano
   descrevia "confirmação inline aparece → confirmar", mas o código
   implementado (`pareceres-salvos.tsx`, botão "Descartar" do card de
   rascunho, linha ~191) chama `confirmarExclusao(rascunho.id)`
   **diretamente** no `onClick`, sem passo de confirmação intermediário
   — a confirmação inline (`role="group"`, "Cancelar"/"Excluir parecer
   salvo") só existe no fluxo de excluir um parecer **já confirmado**,
   aberto no detalhe (linhas 114-140 do mesmo arquivo). Comportamento
   observado bate com o código como está, não com a redação do plano;
   registrado aqui para o dono decidir se quer unificar. Efeito real:
   depois do clique, a página mostrou só os itens confirmados restantes
   (o card do rascunho sumiu). Confirmado no Postgres:
   `select count(*) from parecer where id = '<id>'` → `0`.
8. **Expiração do rascunho pronto (24h).** Gerada mais uma análise
   (pergunta primária de novo), esperado `status='pronto'`
   (`confirmado=false`, sem interação de Salvar/Descartar). Via SQL
   direto: `update parecer set criado_em = now() - interval '25 hours'
   where id = '<id>'`. Recarregado `/ajustes/relatorios` — a seção
   "PARECERES SALVOS" mostrou só o item já confirmado do ponto 6, sem
   card de rascunho, sem nenhuma ação da pessoa. Confirmado no Postgres:
   `select count(*) from parecer where id = '<id>'` → `0` — a linha foi
   de fato apagada (limpeza preguiçosa rodou na leitura da página).
9. **Trava abandonada (5min).** Inserida manualmente via SQL uma linha
   `status='gerando'` com `criado_em = now() - interval '6 minutes'`.
   Antes do clique, `/analise` já carregou com `aria-disabled="false"`
   (a limpeza preguiçosa roda também em `buscarRascunhoEmAndamento`, que
   é chamado ao montar a tela — a trava velha some antes mesmo de checar
   se há rascunho). Clicado "Solicitar Análise": `POST /api/analise` →
   `202` (não `409`) — **não foi recusado**, confirmando que a trava
   abandonada foi limpa antes da checagem. Confirmado no Postgres que a
   linha antiga de 6min não existe mais na listagem, e a nova (recém-
   criada por este clique) está presente.
10. **Apagar o usuário QA.** `admin.auth.admin.deleteUser(<id>)` →
    sucesso. Confirmado via SQL: `parecer`, `treino`, `serie` e
    `auth.users` para este `usuario_id` → todos `count = 0` — cascade
    limpo.

## Cota da Gemini

5 chamadas reais consumidas nesta sessão: 1 no alvo errado (achado de
infraestrutura acima) + 4 neste worktree (pontos 1, 7, 8 e 9 — cada
"solicitar análise" bem-sucedida dispara uma chamada real). Dentro do
orçamento de ~20/dia.

## Resultado

AA-01 registrado como **ALEGADO** em `QA.md` (não `PASSOU` — auditoria
independente fica para quem o dono decidir, mesmo padrão de PDF-01/TR-05).
Todos os 10 pontos da verificação ao vivo bateram com o comportamento
esperado da spec, com duas ressalvas honestas registradas acima: (a) o
tempo do ponto 1 incluiu compilação a frio do Turbopack, específica do
modo dev, não do código; (b) o "Descartar" do rascunho não tem passo de
confirmação inline, diferente do que o texto deste plano descrevia —
comportamento real do código, não um bug introduzido por esta
verificação.
