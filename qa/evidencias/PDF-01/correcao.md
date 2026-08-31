# PDF-01 — Histórico de pareceres + PDF — 2026-08-31

## O pedido

Item 5 do backlog do dono (`docs/BACKLOG-PROXIMA-FASE.md`), motivado por uso
real: a Análise Semanal (`/analise`) é 100% descartável — gera, mostra,
some — e o dono quer poder guardar um subconjunto (opt-in, nunca
automático) e levar pra fora do app como PDF. Sem isso, todo parecer bom se
perde ao trocar de tela.

Spec: `SDD.md` §10. Decisão de biblioteca: `DECISIONS.md`, entrada
2026-08-31 ("PDF da Análise Semanal: `@react-pdf/renderer`, não Puppeteer
nem `window.print()`").

## O que foi feito (task por task, resumido)

1. **Worktree isolado** (`C:\lastro-parecer-pdf`, branch
   `feat/historico-parecer-pdf`) — evita colisão com outra sessão em
   `C:\lastro`, incidente já registrado no `PROGRESS.md`.
2. **Migration `0016_tabela_parecer.sql`** — tabela `parecer` (histórico
   opt-in), RLS por dono (`usuario_id = auth.uid()`) + `GRANT` explícito
   (mesma causa-raiz do achado do E2E-01: sem `GRANT`, Postgres nega o
   objeto antes da RLS ser avaliada). Verificado com dois usuários QA
   reais (não `service_role` — achado da sessão anterior, `service_role`
   deste projeto não tem `GRANT` nenhum via PostgREST).
3. **`src/lib/dados/parecer.ts`** — módulo de dados no padrão de
   `treino.ts`/`exportar.ts`/`conta.ts` (Server Actions, `usuario_id`
   sempre resolvido da sessão, sem teste unitário — convenção já
   estabelecida do projeto pra módulos de I/O, verificação é ao vivo).
   `salvarParecer`, `listarPareceres`, `buscarParecer`, `excluirParecer`.
4. **Template de PDF** (`src/lib/pdf/`) com `@react-pdf/renderer` —
   pergunta, veredito, corpo do texto e tabela de evidência (bloco de
   platô/progressão, quando presente), gerado sob demanda a partir do
   `texto`/`evidencia` já salvos (nada de binário pré-gerado guardado —
   decisão registrada no `DECISIONS.md`).
5. **Route handler `src/app/api/parecer/[id]/pdf`** — autentica →
   `buscarParecer(id)` (RLS garante que só resolve se for do dono) → gera
   o PDF em memória → devolve com `Content-Type: application/pdf` e
   `Content-Disposition: attachment`.
6. **Prop `emitidoEm` em `src/components/parecer.tsx`** — achado ao
   escrever a spec (ver seção própria abaixo): sem isso, reabrir um
   parecer salvo mostraria a data de HOJE, não a data real do save.
7. **Botão "Salvar este parecer"** em `src/components/analise-interativa.tsx`
   — opt-in, nunca automático (três estados: ocioso/salvando/salvo,
   `aria-disabled` durante o salvamento e depois de salvo, nunca
   `disabled` puro).
8. **`src/components/pareceres-salvos.tsx`** — lista de pareceres salvos,
   abrir/fechar detalhe, baixar PDF, excluir com confirmação **inline**
   (nunca `window.confirm` nativo) explicando o que apaga (só o registro,
   não afeta treinos/séries) e que não dá pra desfazer.
9. **Wire em `/ajustes/relatorios`** — seção "Pareceres salvos" abaixo dos
   cards de sticker de treino existentes.

## Achado 1: prop `emitidoEm` ausente quebraria a data ao reabrir um parecer salvo

Commit `b6d1017`. `Parecer.tsx` calculava a data de emissão sempre como
`new Date()` (agora) — correto para o parecer recém-gerado (nunca foi
salvo antes, "agora" é a data real), mas errado para reabrir um parecer
salvo dias/semanas depois: mostraria a data de HOJE, não a data real do
`criado_em` salvo no banco. Corrigido com uma prop opcional `emitidoEm`
(ISO), passada só na tela de detalhe do parecer salvo — quando ausente
(parecer recém-gerado na `/analise`), o comportamento original é
preservado (`Date.now()`).

## Achado 2: SDD.md §10.6 pedia verificação de RLS via `vitest`, contradizendo a convenção já estabelecida do projeto

Commit `162eaab`, achado ao planejar (antes de qualquer código). A spec
original tinha um item dizendo "`npx vitest run` cobre `buscarParecer`
negando acesso a parecer de outro usuário" — mas este projeto **não tem**
esse costume para módulos de I/O (`treino.ts`, `exportar.ts`, `conta.ts`
nunca tiveram teste unitário; a verificação de isolamento RLS sempre foi
ao vivo, com dois usuários QA reais, porque `service_role` não serve pra
isso aqui — ver achado do E2E-01). Corrigido: o item agora pede "RLS
confirmado com dois usuários reais... execução registrada em
`qa/evidencias/`", coerente com a Task 2/Passo 3 deste plano.

## Gates (Passo 1, rodados do zero)

```
npx tsc --noEmit   → TypeScript: No errors found
npm run lint       → ESLint: 0 errors, 18 warnings (todos pré-existentes,
                      em arquivos fora do escopo desta feature —
                      ilustracao-anatomica-3d.tsx, scripts .mjs avulsos,
                      player-execucao-exercicio.tsx)
npx vitest run     → PASS (238) FAIL (0)
npm run build      → build de produção limpo, 24 rotas geradas, incluindo
                      /api/parecer/[id]/pdf
```

Nenhum erro do `LayoutProps` pré-existente apareceu desta vez (não é
regressão — é tipo gerado pelo Next só após build, já registrado em
sessões anteriores como não-bloqueante).

## Achado de infraestrutura na verificação ao vivo (não do código da feature — do ambiente local)

Ao rodar a verificação ao vivo, o `preview_start` do Browser pane (que lê
`.claude/launch.json` por **nome** de configuração) subiu o servidor de
dev do worktree **errado**: `C:\lastro` (branch `main`, sem esta feature),
não `C:\lastro-parecer-pdf`. Os dois worktrees têm a mesma entrada
`"name": "lastro-dev"` no `launch.json`, e a resolução por nome ignorou o
diretório de trabalho da sessão. Isso produziu um falso negativo real: o
botão "Salvar este parecer" simplesmente não existia no bundle servido
(confirmado inspecionando os chunks JS carregados via
`fetch(script.src)` — a string "Salvar este parecer" não aparecia em
nenhum). Diagnosticado comparando o processo Windows real por PID
(`Get-CimInstance Win32_Process`) contra a porta escutada, o que revelou o
`CommandLine` apontando pra `C:\lastro\node_modules\next\...`, não pro
worktree da feature. Corrigido subindo o dev server manualmente
(`npm run dev -- -p 4500`, cwd confirmado `C:\lastro-parecer-pdf` via o
mesmo método de verificação por PID) e navegando o browser direto pra essa
porta. A partir daí a verificação real (abaixo) rodou sem esse ruído.
Consequência colateral: 2 chamadas à Gemini foram gastas contra o
worktree errado antes de identificar a causa (cota 20/dia,
`KNOWLEDGE.md` §3.2) — registrado aqui com honestidade, não é uma
chamada "extra" gratuita, foi o custo de isolar um falso negativo de
infraestrutura antes de reportar um bug que não existia no código.

## Verificação ao vivo, ponta a ponta (Passo 2) — 9 pontos

Usuário QA descartável `qa.pdf.verificacao.<timestamp>@lastro.test`,
criado via `auth.admin.createUser`, com histórico semeado: 4 treinos (7,
14, 21, 28 dias atrás) com 1 série "valendo" cada em "Supino reto com
barra", inseridos autenticado como o próprio usuário (não `service_role`
— mesmo achado de sempre, `service_role` deste projeto não tem `GRANT`
nas tabelas via PostgREST). Login feito de verdade pela UI
(`http://localhost:4500/login`), com as ferramentas de navegador —
nenhuma etapa de autenticação pulada com cookie/fetch direto.

1. **Logar, ir em `/analise`, gerar um parecer.** Clique real (mouse, via
   ferramenta de navegador) em "Solicitar Análise" (pergunta primária,
   "O que mudar na próxima semana?"). Chamada real à Gemini (~30-50s,
   confirmado no log do servidor: `POST /api/analise 200 in ~50s`).
   Parecer renderizou com veredito, corpo do texto e bloco de evidência
   "Platô — Supino reto com barra".
2. **Clicar "Salvar este parecer" → vira "Salvo ✓".** Clique real no
   botão (`.botao-secundario`, dentro do bloco do resultado). Texto do
   botão mudou de "Salvar este parecer" para "Salvo ✓" — confirmado lendo
   `textContent` do elemento após o clique.
3. **`/ajustes/relatorios` → seção "Pareceres salvos" com 1 cartão.**
   Navegação real da página. `get_page_text` mostrou a seção "PARECERES
   SALVOS" com um cartão datado "31 AGO" e o texto "O que mudar na
   próxima semana?", com botão "Ver parecer".
4. **Clicar "Ver parecer" → abre o parecer completo, pergunta e texto
   certos.** O parecer abriu com a pergunta exata ("O que mudar na
   próxima semana?") e o corpo do texto **idêntico**, palavra por
   palavra, ao que a Gemini devolveu no passo 1 (mesmo bloco de evidência
   "Platô — Supino reto com barra — 320 kg — sem mudança há 4 semanas").
5. **Data mostrada (`doc__meta`) plausível.** "Semana de 24 ago — 30 ago
   · Emitido em 31 de ago. de 2026" — dia de hoje (a sessão inteira
   correu em 2026-08-31), consistente com a prop `emitidoEm` (achado
   descrito acima) recebendo o `criadoEm` real do parecer salvo. **Limite
   honesto:** como o save e a reabertura aconteceram no mesmo dia, este
   teste não distingue visualmente "usou `emitidoEm`" de "usou
   `Date.now()` por acidente" — a prova de que a prop realmente é
   passada e usada está na leitura de código (`src/components/pareceres-salvos.tsx:78`,
   `emitidoEm={aberto.criadoEm}` passado pro componente `Parecer` ao
   abrir o detalhe de um parecer salvo), não só na observação visual
   desta rodada.
6. **Baixar PDF, confirmar conteúdo.** Em vez do mecanismo de download do
   navegador (não confiável em automação), reconstruí a sessão
   autenticada (mesmo `access_token`/`refresh_token` do login real) e
   chamei `GET /api/parecer/<id>/pdf` com `fetch` a partir de um script
   Node local. Resultado:
   - `Content-Type: application/pdf` — confirmado.
   - `Content-Disposition: attachment; filename="lastro-analise-2026-08-31.pdf"`.
   - Primeiros bytes do corpo: `%PDF-1.3` — assinatura válida.
   - Tamanho: 3386 bytes — plausível para um PDF de 1 página com texto e
     uma tabela pequena (não é um JSON de erro disfarçado).
   - `pdftotext` (disponível no ambiente) extraiu o texto real do PDF:
     pergunta ("O que mudar na próxima semana?"), corpo do texto
     (idêntico ao mostrado na tela) e a tabela de evidência ("Platô —
     Supino reto com barra — 320 kg — sem mudança há 4 semanas") — texto
     de verdade, selecionável, não é imagem rasterizada.
7. **Excluir parecer salvo — confirmação inline, nunca alerta nativo.**
   De volta em `/ajustes/relatorios` → abrir o parecer → clique real em
   "Excluir parecer salvo". Apareceu uma confirmação **inline** no
   próprio componente (`role="group"`, texto: "Excluir este parecer
   apaga o registro salvo — não afeta seus treinos nem séries. Não dá
   para desfazer.", botões "Cancelar"/"Excluir parecer salvo") — em
   nenhum momento um diálogo nativo do navegador/SO interceptou o fluxo
   (o clique subsequente no botão destrutivo funcionou normalmente via
   DOM, o que não aconteceria se um `window.confirm()` estivesse
   bloqueando a thread). Clique real no botão destrutivo da confirmação
   → o cartão sumiu da lista (a seção "Pareceres salvos" inteira sumiu
   da página, já que ficou vazia).
8. **Banco confirma exclusão.** `select count(*) from parecer where
   usuario_id = '<id do QA>'` (via cliente autenticado como o próprio
   usuário) → `count: 0`, sem erro.
9. **Usuário QA apagado.** `auth.admin.deleteUser(<id>)` → sucesso.
   `auth.admin.listUsers()` filtrado pelo prefixo do e-mail de teste →
   `0` usuários órfãos restantes.

Servidor de dev local parado ao final; nenhum processo Node remanescente
associado a `C:\lastro-parecer-pdf` (confirmado via
`Get-CimInstance Win32_Process`).

## Resultado

PDF-01 registrado como **ALEGADO** em `QA.md` (não `PASSOU` — isso é a
Task 12, auditoria independente com contexto limpo). Todo o fluxo
ponta a ponta funcionou como especificado: opt-in de verdade (nada
automático), histórico isolado por RLS, PDF vetorial de verdade (texto
selecionável, não imagem), exclusão com confirmação inline e cascade
limpo. O único obstáculo real foi de infraestrutura local (servidor de
preview do worktree errado), não do código da feature — documentado
acima com o diagnóstico completo para não repetir em sessões futuras.
