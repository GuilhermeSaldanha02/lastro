# PROGRESS.md — `lastro`

> **Estado de trabalho.** Atualizar é a **ação final obrigatória de toda tarefa**. Registra também abordagens que falharam e por quê.
> Passou de ~300 linhas → arquivar concluídos em `PROGRESS-archive.md`.
>
> `[AFK]` = pode rodar sem o dono · `[HITL]` = exige o dono no loop (toca a peça-assinatura, muda contrato de módulo, cruza módulos, ou tem gate visual)

---

## Ordem das fases — e por que esta ordem

A **Fase 1 é a peça-assinatura**, como fatia vertical feia mas completa. Antes de qualquer polimento, antes do offline, antes do catálogo, antes do coach. Se a Análise não convencer o dono com dados reais dele, o projeto muda de rumo — e é infinitamente mais barato descobrir isso agora do que depois de três semanas de UI bonita.

---

## Fase 0 — Bootstrap · ✅ **CONCLUÍDA** (2026-08-04)

| # | Tarefa | Modo | Estado | Check executável | Evidência |
|---|---|---|---|---|---|
| 0.1 | Entrevista + grill de domínio | [HITL] | ✅ Concluído | Glossário em `KNOWLEDGE.md` §1 com série, aquecimento e peso definidos | 3 termos travados; commit `22c8d9b` |
| 0.2 | `PRD.md` + portão de aprovação | [HITL] | ✅ Concluído | Dono aprova explicitamente | Aprovado em 2026-08-04; PRD congelado |
| 0.3 | `ADR.md` + fitness functions + `ARCHITECTURE.md` + `DECISIONS.md` | [AFK] | ✅ Concluído | 8 ADRs, 7 fitness functions, cada camada da stack com alternativa descartada | ADR-001..008; FF1..FF7 |
| 0.4 | `DESIGN.md` semeado | [AFK] | ✅ Concluído | Restrições funcionais decididas; identidade em aberto com gate declarado | D1..D9 |
| 0.5 | `CLAUDE.md` < 200 linhas | [AFK] | ✅ Concluído | `wc -l CLAUDE.md` < 200 e nenhum valor duplicado de outro doc | **89 linhas.** ⚠️ A segunda metade do check **não passou na primeira tentativa** — o Inspetor achou o limiar de RIR repetido em 3 arquivos e a lista de libs do ADR repetida no CLAUDE.md. Limiares removidos do CLAUDE.md (agora só aponta para `KNOWLEDGE.md` §1). A repetição de *princípios* entre CLAUDE.md e as skills é deliberada: skill carrega isolada e precisa se sustentar sozinha |
| 0.6 | Instalar `.claude/agents/` (5 papéis) | [AFK] | ✅ Concluído | 5 arquivos com `description`, `model` e `tools` explícitos | 5/5 validados: `model=true tools=true` em todos |
| 0.7 | Instalar `.claude/skills/padrao-*` (7 skills) | [AFK] | ✅ Concluído | 7 pastas com `SKILL.md` de frontmatter válido | 7/7 com `name` + `description` válidos |
| 0.8 | Instalar hooks em `.claude/settings.json` | [HITL] | ⚠️ Instalado, **não provado em uso** | Pipe-testar antes de gravar; JSON validado | **`jq` NÃO existe neste Windows** — hooks reescritos em Node. Pipe-teste: injeção do índice retorna JSON válido; gate bloqueia com código modificado + PROGRESS intocado; trava anti-loop libera com `stop_hook_active=true`. **Ver pendência abaixo** |
| 0.9 | PR da fase de bootstrap | [AFK] | ✅ Concluído | `gh pr view` mostra o PR aberto | [PR #1](https://github.com/GuilhermeSaldanha02/lastro/pull/1) · base `main` |

**O que o gate de evidência cobre, exatamente.** Dois escopos avaliados **separadamente** — juntar as listas de caminhos fazia um `PROGRESS.md` já commitado na branch mascarar código sujo no working tree, silenciando o gate pelo resto da branch. Erro encontrado e corrigido em teste.

| Escopo | Condição de bloqueio | Testado |
|---|---|---|
| A — working tree | Código não commitado + `PROGRESS.md` não tocado | ✅ bloqueia; libera quando o PROGRESS também está sujo |
| B — branch vs `main` | Branch alterou código e **nenhum commit** tocou o `PROGRESS.md` | ✅ bloqueia em branch limpa a partir de `main` |
| Trava anti-loop | `stop_hook_active = true` → sempre libera | ✅ |

**⚠️ Pendência declarada da tarefa 0.8 — duas coisas não provadas, e a segunda é consequência de uma correção.**

Hooks de `Stop` e `UserPromptSubmit` disparam **fora do turno**: não há como provar que funcionam na mesma sessão em que foram escritos. O que **está** provado é o comportamento dos scripts alimentados pela linha de comando, nos casos da tabela acima, em clone limpo.

O que **não** está provado, e precisa ser testado junto na próxima sessão:

| # | O que testar | Como saber |
|---|---|---|
| 1 | **O hook dispara?** | Abrir sessão em `C:\lastro`. O índice de skills deve aparecer no contexto **sem ninguém pedir**. Não apareceu → o hook não está sendo acionado e a triagem de skill volta a ser conselho ignorável |
| 2 | **O caminho resolve?** | O `settings.json` usa **exec form** com `${CLAUDE_PROJECT_DIR}`, conforme a documentação oficial (a doc diz que o hook roda no *diretório atual*, não necessariamente na raiz do projeto — por isso caminho relativo é frágil). Se a versão instalada não suportar `args`, o hook falha em silêncio. **Os dois sintomas são idênticos**, então teste o item 1 primeiro; se falhar, o próximo suspeito é este |

Rede de segurança já embutida: os dois scripts caem para `process.cwd()` quando `CLAUDE_PROJECT_DIR` não está no ambiente.

---

### Review do Inspetor QA sobre a Fase 0 (2026-08-04)

Contexto limpo, 13 achados. Aplicados após verificação individual (E8 — review é alegação, não verdade):

| Achado | Gravidade | Resolução |
|---|---|---|
| `PRD` dizia série difícil = "1–3 reps da falha"; `KNOWLEDGE` dizia RIR ≤ 3 | **Atinge a peça-assinatura** | "1–3 da falha" **exclui a falha (RIR 0)** — a Análise reportaria estímulo fraco nas semanas mais pesadas. Limiar agora existe só em `KNOWLEDGE` §1, incluindo RIR 0 explicitamente |
| Gate de evidência cego a nome de arquivo com acento | **Real, verificado** | `core.quotepath` escapava `análise.ts` como `"an\303\241lise.ts"`; o regex de extensão falhava. Testado antes e depois. Corrigido com `-c core.quotepath=false` |
| Hooks com caminho relativo viravam no-op fora da raiz | Real | Trocado por `$CLAUDE_PROJECT_DIR` |
| `ADR-001` afirmava que o free tier cobre um usuário "com folga" | **E3** | O próprio `KNOWLEDGE` §3.2 diz que a quota é desconhecida. Virou TODO com ponteiro para 1.0c |
| Check da A5 buscava a chave em `dist/` | Real | Next.js builda em `.next/`. E build **sem** a chave no ambiente passa vazio sem provar nada — o check agora exige a chave presente |
| `diretor-arte` mandava "abrir no navegador e olhar" sem ferramenta para isso | Real | O agente agora **especifica** o roteiro do gate; quem executa é o controller |
| Ponteiro `padroes/documentos.md` inexistente | Menor | Corrigido para o caminho real da skill |
| TODO da liberação semanal sem tarefa | Menor | Virou tarefa 1.0d |
| `.gitignore` incompleto para a stack | Menor | Adicionados `playwright/.cache/`, `blob-report/`, `supabase/.temp/` |
| Trava anti-loop libera após um bloqueio | **Aceito como está** | É deliberado: sem ela o turno trava em loop. O gate é **um empurrão forte, não um portão intransponível** — e a documentação agora diz isso |
| Descriptions de agentes e skills | Sem achado | 5/5 e 7/7 são gatilho ("Acionar quando…"), não descrição de papel |

---

## Fase 1 — PEÇA-ASSINATURA: a Análise, de ponta a ponta · 🔶 Specs escritas, implementação não iniciada

*Feio é permitido. Incompleto não é. O objetivo é o dono ler um parecer sobre os treinos reais dele.*

### Specs da Fase 1 (2026-08-04)

`SDD.md` (arquiteto) e `DESIGN.md` §3–5 (diretor de arte) escritos em paralelo — arquivos independentes, decisão legítima de paralelizar. Duas decisões de produto levantadas pelo arquiteto e fechadas pelo controller, registradas em `DECISIONS.md`: **unilateral** (reps por lado, volume ×2, atributo do exercício) e **peso corporal** (fora do volume no MVP, dado que o dono nunca forneceu).

**Review do Inspetor QA sobre SDD + DESIGN — 9 achados, todos verificados e corrigidos:**

| # | Achado | Gravidade | Correção |
|---|---|---|---|
| 1 | SDD contradizia `DECISIONS.md` sobre unilateral (schema, agregador, UI, testes escritos antes da decisão) | **Bloqueante** | `unilateral` movido para `exercicio`; volume ×2; T-V4 |
| 2 | SDD contradizia `DECISIONS.md` sobre peso corporal (não excluía do volume) | **Bloqueante** | `volume.ts` exclui série com `peso_corporal_incluso`; T-V5; ressalva na UI (§7.1) |
| 3 | Validador reprovaria todo parecer que citasse a data da semana (`DESIGN.md` §3.6.2 obriga isso) | **Bloqueante** | Componentes de data entram no conjunto CONTEXTO antes da extração de tokens |
| 4 | `series_dificeis`: D3 dizia "da janela", teste T-D1 media só a semana atual | **Bloqueante** | Escopo fixado em **semana atual**, igual a `volume_por_grupo_muscular` |
| 5 | `ResumoCompacto` não alimentava as perguntas 1 e 4 do PRD (tendência de 4 semanas) | Importante | Campo `volume_semanal[]` acrescentado; orçamento de bytes recalculado (≈4,6 KB) |
| 6 | `SEMANAS_ESTAGNACAO` placeholder mandava "copiar" uma faixa (3–4), não um valor — inexecutável | Importante | Adotado **4**, justificado, registrado em `KNOWLEDGE.md` §3.7 e `DECISIONS.md` |
| 7 | `ff5-rls.sql` só testava "existe alguma policy", não `auth.uid()` de fato | Importante | Query reescrita em duas partes: dono verificado por `auth.uid()`, catálogo verificado por RLS ligada |
| 8 | Metade positiva do validador aceitava número genérico ("últimas 4 semanas") como prova de especificidade | Importante | Conjunto branco dividido em DADOS (prova especificidade) vs CONTEXTO (só evita falso intruso) |
| 9 | Fixture T-F1 (frequência) não dava sim/não — ambíguo se o treino só-aquecimento estava dentro dos 3 | Menor | Fixture reescrito: 4 treinos, 3 com série valendo, esperado explícito |

Achado 7 do QA original (isenção de `auth.uid()` no catálogo `exercicio`) foi avaliado como **defensável**, não corrigido como erro — RLS continua ligada, só sem `auth.uid()`, e agora isso **é verificado**, não só declarado.

**O agente que corrigia o SDD caiu por limite de sessão antes de aplicar qualquer correção** (working tree confirmado limpo antes de retomar). O controller assumiu a correção diretamente no mesmo arquivo, verificando cada achado contra `SDD.md` e `DECISIONS.md` antes de aplicar (E8).

**Ainda não verificado por execução real** — nada disso rodou ainda, porque não existe código: `npm run build`, `supabase db reset`, `vitest`, e os grep de FF1–FF7 só serão evidência quando a tarefa 1.1 começar.

| # | Tarefa | Modo | Estado | Check executável | Evidência |
|---|---|---|---|---|---|
| 1.1 | Projeto Next.js + Supabase + schema de `exercicio`/`treino`/`serie` com **todos** os campos do glossário | [HITL] | ✅ Aplicado e verificado contra banco hospedado real | `npm run build` limpo; RLS ativa em toda tabela de usuário (FF5) | Ver nota detalhada abaixo — 5 dos 6 checks do §3.8 verificados contra o projeto hospedado `tbkzcqfvafznxallyfqk` (São Paulo). O 6º (isolamento entre 2 usuários reais via JWT) fica pendente até existir auth de verdade (Fase 2) |
| 1.2 | Tela mínima de registro de série (sem offline, sem polimento) | [AFK] | ✅ Concluído e verificado fim a fim | Registrar 5 séries reais e vê-las no Postgres | Ver nota detalhada abaixo — as 5 séries exigidas pelo §5.3 (aquecimento, RIR=0, sem RIR, unilateral) registradas pela UI real e conferidas linha a linha no Postgres. Achado real corrigido no caminho: migração 0002 (GRANT faltante) |
| 1.3 | **Agregador de métricas — TDD estrito** | [HITL] | ✅ Concluído | Testes antes do código. Volume, e1RM, séries difíceis, frequência com valores conferidos à mão. **FF4:** fixture com aquecimento não altera nenhuma métrica. **FF3:** sem import de rede | **Verificado por execução real, não por relato do agente:** `npx vitest run` → 8 arquivos, **49/49 testes passando** (saída colada, não resumida). `grep` FF3 → 0. `grep new Date()` (C4) → 0. `npm run build` → limpo. Interpretação do engenheiro registrada em `DECISIONS.md`: semana fecha na segunda — é a única leitura que bate os 30 valores do SDD §4.5 sem editar fixture, mas ainda depende de você confirmar na 1.0d |
| 1.4 | Route handler da Gemini — recebe **só o resumo**, nunca séries cruas | [HITL] | ✅ Concluído e verificado com a API real | **FF1 e FF2:** SDK ausente do cliente, chave ausente do bundle de produção | Ver nota detalhada abaixo — chamada real à Gemini (`gemini-3.6-flash`), parecer conferido número a número à mão, prompt inspecionado e sem vestígio de série crua. Achado real: modelo do ADR estava obsoleto (aposenta out/2026); achado no FF2 explicado (cache do bundler ≠ vazamento ao cliente) |
| 1.5 | Botão Análise + as 5 perguntas + exibição do parecer | [HITL] | ✅ Concluído — 3 pareceres reais verificados | 3 pareceres gerados sobre dados reais. **Critério A6:** cada um cita ao menos um exercício e um número do dono. Parecer que serviria pra qualquer pessoa = falha | Ver nota detalhada abaixo — 3 pareceres gerados via UI real, números conferidos à mão, todos passam no "teste que realmente importa" do SDD §7.3. **Fase 1 inteira fechada em cadeia contínua (SDD §7.4).** |
| 1.6 | **Portão do dono na peça-assinatura** | [HITL] | ⬜ **Aguardando você** | O dono lê os 3 pareceres e diz se convence. Reprovou → replanejar antes de seguir | Falta você registrar séries reais (via `/treino`) e ver o parecer da sua própria Análise — os 3 pareceres verificados até aqui foram sobre dados de teste sintéticos, não os seus |

**Pesquisa que bloqueia 1.3 e 1.5:**

| # | Tarefa | Modo | Check executável |
|---|---|---|---|
| 1.0a | ✅ Faixa de referência de volume por grupo muscular | [AFK] | **Concluído.** `KNOWLEDGE.md` §3.6: 10–20 séries/semana. Fontes verificadas direto no PubMed pelo controller, não só relatadas pelo subagente. Correção sobre o relato: no Schoenfeld 2017 a quebra por categorias foi **tendência (p=0,074), não significância** |
| 1.0b | ✅ Critério de estagnação | [AFK] | **Concluído.** `KNOWLEDGE.md` §3.7: **não há fonte primária.** 3–4 semanas é convenção de mercado, e a UI tem de dizer isso — emprestar autoridade científica a número que a literatura não sustenta é o E3 que o projeto se proibiu |
| 1.0c | ✅ Quota real da Gemini | [HITL] | **Concluído (2026-08-05), do jeito mais caro possível.** Medida não no console, mas batendo em `RESOURCE_EXHAUSTED` em uso real: **20 req/dia** para `gemini-3.6-flash`. `KNOWLEDGE.md` §3.2. Invalida a premissa do ADR-001 — 3 caminhos registrados em `DECISIONS.md`, decisão do dono pendente |
| 1.0d | ✅ Regra de liberação semanal | [HITL] | **Concluído (2026-08-05).** Botão sempre disponível, sem bloqueio — comportamento já implementado na 1.5, só faltava a confirmação formal. `PRD.md` §3 e `DECISIONS.md` |

### Como a tarefa 1.1 foi fechada — Docker local abandonado, projeto hospedado (2026-08-04)

**O caminho local não vingou.** `npx supabase start` falhou 2x (`LegacyHealthCheckTimeoutError` em analytics/storage/pg_meta, depois o Docker Desktop caiu por completo — máquina com só 3.8 GB alocados). Parei depois do segundo erro no mesmo lugar (E6) e levei a decisão ao dono, que escolheu **(b) projeto hospedado**.

**Passo a passo real do que funcionou:**
1. Projeto criado pelo controller via navegador, usando a sessão já autenticada do dono (GitHub SSO) — `mcp__claude-in-chrome`. Nome `lastro`, região `sa-east-1` (São Paulo), `sb_publishable`/`anon` como chave pública. **A senha do banco foi digitada pelo próprio dono** — o controller nunca a viu, parou exatamente nesse campo e retomou depois. Duas configurações de segurança ajustadas na criação: `Expor automaticamente novas tabelas` **desligado** (contradiz RLS explícita do projeto) e `Ativar RLS automático` **ligado** (camada extra).
2. **Tentativa de aplicar a migração pelo SQL Editor do dashboard falhou** — o editor tem algum recurso (provavelmente assistente de IA, não tradução simples) que reescreve/parafraseia SQL digitado em tempo real ("text primary key" virou "chave primária de texto de identificação"). Três tentativas, todas corrompidas. Nenhuma chegou a ser executada — banco permaneceu limpo. Abandonado por E6 (mesmo erro, terceira vez seguida).
3. **Autenticação da CLI:** `supabase login` não funciona neste ambiente de execução — não é terminal interativo de verdade, e a CLI recusa login automático fora de TTY (`LegacyLoginMissingTokenError`, testado 2x, com e sem `--no-browser`). Também não é possível digitar num terminal real via computer-use (nível de acesso "click", digitação bloqueada por segurança do próprio Windows). **O dono rodou `npx supabase login` no terminal dele mesmo** — único passo que precisou ser humano. Credencial ficou salva em disco no perfil da CLI, nunca passou pelo chat.
4. Com a CLI logada: `supabase link --project-ref tbkzcqfvafznxallyfqk` → `supabase db push` (migração aplicada; um aviso não-fatal sobre cache de catálogo pg-delta apareceu, mas a migração de fato aplicou — confirmado por `migration list` mostrando local=remote=0001, não só pelo exit code).
5. Seed aplicado via `supabase db query --linked -f supabase/seed.sql` (não existe comando de "seed push" para projeto remoto na CLI atual).
6. **Verificação real, item por item do SDD §3.8:**
   - ✅ `scripts/ff5-rls.sql` contra o banco real: `tabelas_sem_protecao_por_dono = 0` **e** `catalogo_sem_rls = 0` (as duas partes rodadas separadamente, porque `db query -f` só devolve o resultado da última statement de um arquivo).
   - ✅ Seed conferido por contagem: `total_grupos = 7`, `total_exercicios = 3` — batem exatamente com `seed.sql`.
   - ✅ `insert` com `rir=0` + `tipo='valendo'` — passou (RIR 0 = falha é válido).
   - ✅ `insert` com `rir=0` + `tipo='aquecimento'` — falhou na constraint certa (`serie_rir_so_valendo`).
   - ✅ `insert` com `tipo='cardio'` — falhou na constraint certa (`serie_tipo_valido`).
   - ⬜ **Isolamento entre 2 usuários via JWT real** (`treino_id` de outro usuário) — não testado. Exige 2 usuários autenticados de verdade; a Fase 1 assume auth manual via painel (SDD §3.6), e criar isso só para o teste seria esforço desproporcional agora. **Fica pendente, não escondido** — retestar quando a Fase 2 (auth) existir, ou antes se o dono preferir.
   - Dados de teste (usuário/treino temporários) **apagados ao final**, confirmado por contagem = 0.
7. `.env.local` criado com `NEXT_PUBLIC_SUPABASE_URL` e a chave `publishable` (pública, protegida por RLS). **A `service_role` nunca foi escrita em arquivo nenhum.** Coberto pelo `.gitignore` (`.env.*`), confirmado com `git check-ignore -v`.
8. `npm run build` limpo com o ambiente real. `npx vitest run` — 49/49 continuam passando (regressão da tarefa 1.3, intacta).

**Duas lições registradas em `KNOWLEDGE.md` §5:** pipe mascarando exit code (`cmd | tail`), e um editor web pode reescrever texto digitado de formas inesperadas — para SQL/código sensível a sintaxe, preferir CLI a editor de navegador quando disponível.

### Como a tarefa 1.2 foi verificada fim a fim (2026-08-05)

**Código revisado antes de testar** (E8): `usuario_id` da série nunca é escrito pelo cliente (confia no trigger); RIR distingue `null` de `0` corretamente em toda a cadeia; `unilateral` vem do catálogo, não é campo do formulário.

**O desafio: a Fase 1 não constrói login, mas a tela só funciona com sessão real (RLS exige).** Resolvido sem violar o escopo — nenhum arquivo do SDD §5.1 ganhou lógica de auth:
1. Usuário de teste criado direto via SQL (`auth.users` + `auth.identities`, com senha hash real via `pgcrypto`) — não é dado do dono, é fixture de verificação.
2. Página **temporária** `/dev-login` (fora do SDD, nunca commitada) chamando `criarClienteBrowser().auth.signInWithPassword()` — o mesmo cliente que o app real usa, só para estabelecer sessão.
3. Servidor de dev rodado pelo controller com `run_in_background` de verdade (não `&` de shell, que não sobrevive entre chamadas — mesma lição já registrada).

**Achado real no meio da verificação — GRANT faltante.** Depois de logar, toda leitura/escrita batia em `permission denied for table treino`, mesmo com RLS e policy corretas. Causa: a migração 0001 nunca deu `GRANT` de privilégio ao role `authenticated` — RLS filtra **linha**, mas sem GRANT o Postgres nega o **objeto** antes de a RLS ser avaliada. Corrigido com uma migração nova, **0002_grants_authenticated.sql** (não editei a 0001 já aplicada e registrada no histórico remoto). Aplicada e confirmada via `migration list` (local=remote=0002).

**As 5 séries exigidas pelo §5.3, registradas pela UI real e conferidas linha a linha no Postgres:**

| tipo | reps | peso | rir | unilateral | usuario_id (do trigger) |
|---|---|---|---|---|---|
| valendo | 8 | 80 | 2 | false | `628e42a0-...` |
| aquecimento | 10 | 40 | **null** | false | `628e42a0-...` |
| valendo | 5 | 60 | **0** | false | `628e42a0-...` |
| valendo | 6 | 55 | **null** | false | `628e42a0-...` |
| valendo | 10 | 14 | 1 | **true** | `628e42a0-...` |

Os 3 pontos do §5.4 confirmados: `usuario_id` correto em todas (preenchido pelo trigger, nunca pelo cliente) · RIR=0 gravado como `0`, não `null` · série sem RIR gravada como `null`, não `0`.

**Limpeza pós-verificação:** `/dev-login` apagado (`git status` confirma que não existe mais). Usuário de teste e os dados vinculados (treino + 5 séries) removidos via `delete from auth.users` — o `on delete cascade` do schema levou tudo junto, confirmado por contagem = 0. Deixar esse usuário ativo seria porta dos fundos: ele podia logar via API pública com a mesma chave publicável, mesmo sem nenhuma tela de login no app. A evidência da tabela acima já estava capturada antes da limpeza.

**Instabilidade de ferramenta registrada, não do produto:** a automação de navegador teve travamentos de renderização recorrentes nesta sessão (aba preta, captura de tela expirando) — problema do ambiente de browser, não do app. Contornado com abas novas e checagem via `fetch`/DOM em vez de só screenshot.

### Como a tarefa 1.4 foi verificada com a API real (2026-08-05)

**Código revisado antes de testar** (E8): `route.ts` autentica → valida `pergunta` → lê séries do usuário → chama `montarResumoCompacto` → valida `versao` → monta prompt → chama Gemini → valida com `validarNumeros` → aplica a política de retry de duas tentativas + fallback determinístico do SDD §6.4. `prompt.ts` monta os 3 blocos na ordem exata, com as travas literais coladas do SDD (não parafraseadas). `validador.ts` implementa o algoritmo DADOS/CONTEXTO exatamente como especificado. `gemini.ts` usa `response.text` como propriedade — confirmado contra doc oficial atual, não memória de treino (E12).

**Achado real 1 — modelo do ADR estava obsoleto.** Antes de escrever qualquer código, a checagem E12 (doc vigente vence memória de treino) revelou que `gemini-2.5-flash` — o valor que o `ADR.md` registrava desde o bootstrap — **aposenta em 16/out/2026**. Corrigido para `gemini-3.6-flash` (GA desde 21/jul/2026) antes de qualquer linha de código depender do valor errado. Registrado em `DECISIONS.md`.

**Achado real 2 — FF2 "reprovava" por motivo errado.** O comando literal do SDD (`grep -r "$CHAVE" .next/`) encontrou 1 ocorrência — mas em `.next/cache/turbopack/`, cache interno do bundler (Next.js 16+ persiste isso em disco), não em `.next/static/` (o que o navegador baixa) nem `.next/server/` (código do servidor). Verificado especificamente nos dois: **0 e 0**. Pesquisado e confirmado como comportamento documentado do Turbopack persistente, não vazamento. O check no SDD §6.6 foi corrigido para restringir a `.next/static/` + `.next/server/`, com a explicação de por que `.next/cache/` é exceção esperada.

**Achado real 3 — bug (não é bug) de "semana atual" no agregador.** Testando com dados reais de hoje (terça-feira), o treino do dia sumiu do resumo inteiro. Investigado a fundo antes de suspeitar do código: é **decisão intencional já documentada** em `semanas.ts` — a semana só entra no resumo depois de **fechada** (a atual, em andamento, não conta), para não analisar dado parcial. Ajustei os dados de teste para caírem dentro da janela reconhecida, em vez de mudar o código.

**Teste real contra a API da Gemini, sessão real, dados reais (2 semanas de progressão):**
- Endpoint chamado via `fetch` no navegador já autenticado (mesmo padrão da 1.2: usuário de teste temporário + `/dev-login` temporária, apagada depois).
- Pergunta 1 ("Estou progredindo?") → **200**, parecer real em português, citando **Supino reto com barra** e **Agachamento livre** por nome.
- **Números conferidos à mão contra a fórmula de Epley**, não só lidos: supino 55kg → e1RM 69,7; 62kg → e1RM 78,5; delta 12,7%. Agachamento 70kg → 88,7; 75kg → 95,0; delta 7,1%. Volume total 1440 → 1592. **Todos batem exatamente** com o que o parecer citou.
- **Prompt inspecionado diretamente** (reconstruído com os mesmos dados, já que o log do servidor não capturou — mesmo problema de buffering do Turbopack já registrado): busca por todo ID de série, campo de série individual e ID de treino usados no teste → **nenhum encontrado**. O prompt carrega só o JSON do `ResumoCompacto`, exatamente como o SDD §6.7 exige.
- Limpeza: `/dev-login`, usuário de teste e dados vinculados removidos (contagem = 0, confirmado).

### Como a tarefa 1.5 foi verificada — a peça-assinatura de ponta a ponta (2026-08-05)

**Código revisado antes de testar** (E8): `page.tsx` reusa `PERGUNTAS` de `perguntas.ts` sem duplicar, trata 401/erro de rede, desabilita botões durante a chamada (evita corrida de estado, não é a regra de liberação semanal — essa continua fora de escopo, o botão fica sempre disponível). `parecer.tsx` traz as 4 ressalvas sempre visíveis, nunca atrás de accordion, e o aviso de fallback quando `avisoFalhaInterpretativa: true`.

**Dados de teste desenhados para cobrir os 3 cenários da peça-assinatura:** 5 treinos reais (usuário de teste temporário, mesma técnica das tarefas anteriores) — supino estagnado (50kg constante por 5 semanas), agachamento progredindo (70→75→80→85kg), rosca direta unilateral nova (testa o multiplicador ×2 até a ponta da cadeia).

**Achado real 1 — clique "fantasma" mascarado por sessão antiga, quase virou caça a bug de servidor.** Após relogar com um usuário novo, o servidor continuou dizendo "sessão ausente" — cheguei a suspeitar de corrupção do processo de dev e reiniciei o servidor duas vezes. A causa real: o clique via `ref` do `find` não estava disparando o handler `onClick` (mesma classe de instabilidade já registrada), e como um cookie de sessão de um teste **anterior** (já com usuário deletado) continuava no navegador, meu check de "cookie presente" dava falso positivo. Só a decodificação do JWT (conferindo o `sub` contra o ID esperado) revelou que a sessão era de outro usuário. **Correção:** depois de um login em automação de navegador, não basta checar que existe cookie — decodificar o token e confirmar que o `sub` é o esperado.

**Achado real 2 — build falhou por cache de tipos órfão, não por código quebrado.** Depois de apagar `/dev-login`, `npm run build` falhou no type-check apontando pra um arquivo que não existia mais. A causa: `.next/dev/types/` (gerado, gitignored) ainda referenciava a página apagada. `rm -rf .next` + rebuild resolveu — não é bug de código.

**Os 3 pareceres exigidos pelo §7.3, gerados via clique real na UI (não só `fetch` direto), aplicando o "teste que realmente importa" (apagar mentalmente o nome do dono):**

| Pergunta | O que citou | Conferido à mão |
|---|---|---|
| "Onde eu empaquei?" | Supino reto com barra, 4 semanas sem progresso, e1RM estável em 63,3, volume estável em 800 | `50×(1+8/30)=63,33` ✓ · `2×8×50=800` ✓ |
| "Meu volume está equilibrado?" | Peito 800, Quadríceps 510, **Bíceps 240** (Rosca direta, unilateral) | `10×12×2=240` ✓ — confirma o multiplicador unilateral (D3.5) chegando íntegro até a Análise |
| "O que mudar na próxima semana?" | Agachamento 84→102 e1RM (+21,4%), PR de volume 510 vs 480 anterior | `85×(1+6/30)=102` ✓ · `85×6=510` vs `80×6=480` ✓ |

**Nenhum dos 3 pareceres serviria para outra pessoa** — cada um cita exercício e número que só fazem sentido para este histórico específico. Critério A6 satisfeito nos 3, e o `validarNumeros` confirmou automaticamente (nenhum passou por número inventado).

**SDD §7.4 fechado:** a cadeia inteira — registrar série (1.2) → RLS (1.1) → agregador (1.3) → route handler (1.4) → parecer na tela (1.5) — rodou como uma passagem contínua, sem atalho.

**O que falta para a 1.6:** os 3 pareceres acima foram sobre dados **sintéticos de teste**, não sobre o treino real do dono. A tarefa 1.6 — o portão que decide se a peça-assinatura convence — só pode ser cumprida por você, registrando séries reais e lendo o parecer sobre a sua própria Análise.

### `qa-treino` — dogfooding com 3 personas simuladas (2026-08-05, INTERROMPIDO — sem quota, não por falha)

Especialista novo registrado (`CLAUDE.md`, `.claude/agents/qa-treino.md`): simula persona real usando o app de ponta a ponta, avalia se o parecer convence, não só se está correto. Script de apoio `scripts/qa-treino-helper.sh` (criar usuário de teste, autenticar, chamar `/api/analise` real) testado nos 4 comandos antes de confiar a subagentes.

**As 3 primeiras instâncias (subagentes em background) caíram por limite de sessão da conta antes de terminar** — nenhuma chegou a gerar parecer. O controller assumiu as 3 personas diretamente.

**Achado crítico real, direto da persona "Consistente Pesado" — bug no validador, não na persona.** Histórico de 16 treinos/41 séries revelou que `validarNumeros` rejeitava sistematicamente pareceres corretos: hífen de data ISO ("2026-07-27") lido como sinal de menos; "1" embutido em "e1RM" lido como número citado. **100% das primeiras chamadas caíam no fallback determinístico** — a peça-assinatura nunca mostraria o parecer real da IA em uso normal. Corrigido em `validador.ts`, 2 testes novos travando a correção (56/56 passando), reproduzido isoladamente e confirmado contra o servidor real antes e depois da correção. Detalhe completo em `DECISIONS.md`.

**Achado de UX real (persona "Consistente Pesado"):** as respostas às perguntas 1, 2, 4 e 5 se repetem muito quando o histórico cobre poucos exercícios/grupos — mesmos números, redação quase idêntica. Com pouca "superfície" de dado, as 5 perguntas convergem para o mesmo conteúdo. Vale considerar, numa fase futura, direcionar mais o prompt de cada pergunta a um ângulo específico (ex.: pergunta 4 puxar para frequência/recuperação, não repetir volume de séries).

**Lição de processo:** delegar "decida seu histórico de treino" para subagente sem faixa numérica de referência produziu volume absurdo (180 a 2832 séries por persona, quando o esperado era dezenas) — registrado em `KNOWLEDGE.md` §5.

**Persona "Irregular" — parcial.** 5 treinos/9 séries desenhados para cobrir semana sem treino, sessão só de aquecimento e cobertura de RIR baixa. Perguntas 1 e 3 retornaram parecer real (`ok`); pergunta 2 caiu no fallback (variação normal, não bug — mesmo padrão já visto). Tecnicamente confirmado: semana sem treino aparece com `volume_total: 0` explícito no `volume_semanal`, exatamente como o agregador prevê. **Pergunta 3 em diante bloqueada por 429 (RESOURCE_EXHAUSTED)** — ver achado abaixo.

**Achado crítico de infraestrutura — quota da Gemini estourada, não bug de código.** Depois de investigar um `HTTP 500` persistente (reproduzido isolado sem erro, reiniciado o servidor duas vezes, testado com usuário novo — tudo descartado), a causa real apareceu chamando a API diretamente: `RESOURCE_EXHAUSTED`, **limite de 20 requisições/dia** para `gemini-3.6-flash` no free tier. Isso resolve (do jeito mais caro possível) a tarefa **1.0c**, pendente desde o bootstrap. **Invalida a premissa do ADR-001** ("free tier cobre com folga") — com até 2 chamadas por pergunta, sobram ~10 perguntas/dia, contando junto qualquer chamada de desenvolvimento. Detalhe e as 3 opções de caminho (aguardar reset / trocar modelo / habilitar billing) em `DECISIONS.md` — **decisão do dono, não tomada aqui**.

**Persona "Amplo" — não iniciada.** Bloqueada pela mesma quota.

**Limpeza confirmada:** os 4 usuários de teste desta rodada (`pesado`, `irregular`, `amplo`, `smoke-test`) removidos, contagem = 0 confirmada em uma única query final. Nenhum resíduo em disco (scripts de debug e SQL temporários apagados).

**Retomar quando:** a quota resetar (diária) ou o dono decidir um dos 3 caminhos do achado acima. Não adianta tentar de novo antes disso — a mesma chamada `curl` direto à API confirmou o bloqueio, não é intermitente.

### `qa-treino` — retomada (2026-08-06, INTERROMPIDO DE NOVO — mesma causa: quota diária)

Quota checada com uma chamada direta à API antes de gastar esforço recriando dado — voltou 200 (liberada). Recriada a persona "Irregular" (mesmo desenho: 5 treinos/18 séries cobrindo semana sem treino, sessão só de aquecimento, RIR inconsistente) só para completar as perguntas 4 e 5 que faltavam.

**Persona "Irregular" — agora completa (5/5 perguntas).** Perguntas 4 e 5 retornaram parecer real, citando números específicos e batendo com o dado (`Agachamento livre` e1RM 98,8 vs. anterior 95; `Supino reto com barra` e1RM 81,1 vs. 76,5; quadríceps e peito "abaixo" da faixa de referência; `costas` listado como grupo sem estímulo na semana). Passa no teste de apagar o nome — não serviria para outra pessoa.

**Achado de UX real (persona "Irregular", pergunta 5):** o parecer disse *"Não há dados de volume para outros grupos musculares **no arquivo enviado**"* — "arquivo enviado" é um conceito que não existe no produto (o dono nunca envia arquivo nenhum, é tudo já registrado no app). É a IA vazando um jargão genérico de assistente de documentos em vez de falar a língua do produto. Pequeno, mas quebra a ilusão de "isto entende o meu treino" — vale ajustar o prompt do sistema numa fase futura para proibir esse tipo de referência.

**Persona "Amplo" — tentada e bloqueada de novo, mesma causa.** Desenhada (8 treinos/53 séries, cobrindo os 5 grupos musculares do catálogo com progressão de carga ao longo de 4 semanas — testa especificamente a pergunta 3, "meu volume está equilibrado?", com histórico amplo em vez de estreito). As 5 perguntas foram chamadas em sequência; a **primeira já bateu 429** — a quota, que tinha acabado de ser confirmada liberada, se esgotou só com as 2 chamadas do Irregular (bem abaixo do limite teórico de 20/dia). Isso é consistente com o achado já registrado: o limite real é mais apertado na prática do que os 20/dia sugerem à primeira vista (contando qualquer chamada de desenvolvimento/teste feita no mesmo dia, inclusive fora deste agente). Usuário e as 53 séries de teste removidos ao final (contagem = 0) — a persona "Amplo" **nunca chegou a gerar um parecer**, mesmo indiretamente.

**Retomar "Amplo" quando:** a quota resetar de novo. O desenho de dado já está documentado aqui (8 treinos/53 séries, 5 grupos musculares, 4 semanas) — não precisa redesenhar do zero, só recriar via SQL e rodar as 5 perguntas assim que houver orçamento de chamadas suficiente (idealmente logo no início do dia, antes de qualquer outro teste consumir quota).

---

## ▶ PONTO DE RETOMADA — ler primeiro (2026-08-12)

**Estado do repo:** `main`, PR #26 mergeado (2026-08-12), branch `feat/ajustes-nav-perfil` apagada. **Confirmado pelo dono no aparelho real** — "tudo está rodando corretamente". `tsc`/`test` (108 passando)/`lint`/`build` verdes, rodados do zero antes do PR.

**O que mudou nesta sessão (item 17 em "Pendências consolidadas" tem o relato completo):** a pílula de navegação trocou "Coach" por "Ajustes" (engrenagem); Coach, edição de perfil e "Sair" agora moram todos dentro de `/ajustes` e `/perfil`, sem repetição. Fecha o item 13 (upload manual de foto), pendente desde 2026-08-07.

**Achado de arquitetura que vale lembrar em qualquer Server Action futura chamada por Client Component:** `"use server"` inline dentro de uma função só isola aquela função se o resto do arquivo também não tiver código server-only (`next/headers`/`next/cache`) usado por OUTRAS funções não-action. Se tiver, o Turbopack deste Next.js 16.3.0 quebra o build inteiro — só `npm run build` pega isso, nem `tsc` nem os primeiros reviews de spec pegaram. Regra prática: Server Action chamada por Client Component sempre em arquivo próprio, nunca dividindo arquivo com função server-only comum.

**Próximo passo:** nenhuma pendência aberta desta sessão. Ver "Pendências consolidadas" para o backlog geral do projeto (catálogo de dicas de execução, sync offline em celular real, etc.).

**Pendências que continuam abertas, sem mudança nesta sessão:** as 6 decisões de `DESIGN.md` §5 abaixo já foram resolvidas faz tempo (Fase 3 avançou muito além disso — ver "Pendências consolidadas" pro estado real, este parágrafo ficou como registro histórico da época).

---

## Fase 2 — Registro que sobrevive à academia · 🔶 Em andamento (2026-08-05)

| # | Tarefa | Modo | Estado | Check executável |
|---|---|---|---|---|
| 2.1 | Auth: Google OAuth + e-mail | [HITL] | ✅ Verificado fim a fim, login real do dono no iPhone (2026-08-06) | Login no celular e no PC, mesmo treino nos dois (A8) |
| 2.2 | IndexedDB (Dexie) + fila outbox | [HITL] | ✅ Verificado fim a fim | Registro grava local e a UI confirma sem esperar rede (D6) |
| 2.3 | Service worker + sincronização | [HITL] | 🔶 Abrir o app instalado em modo avião funciona de verdade (confirmado no iPhone); falta confirmar o ciclo completo — registrar série offline, reconectar, ver sincronizado no PC | **FF6/A1:** celular real em modo avião, 3 séries, reativar rede, conferir no PC |
| 2.4 | PWA instalável | [AFK] | ✅ Instalada e verificada no iPhone real (2026-08-06) — abre em tela cheia, funciona em modo avião | Instalar na tela inicial do celular real e abrir em tela cheia |
| 2.5 | "Repetir última série" em um toque | [AFK] | ✅ Verificado fim a fim | D3: um toque, medido no aparelho real |

### Tarefa 2.1 — auth (2026-08-05)

**O que foi feito:** `src/proxy.ts` (ver nota abaixo sobre o nome do arquivo) refresca a sessão a cada requisição e redireciona `/treino` e `/analise` pra `/login` sem sessão. `src/app/login/page.tsx` — e-mail/senha (entrar e criar conta) e "Entrar com Google". `src/lib/dados/auth.ts` — `entrarComEmail`, `criarContaComEmail` (distingue conta criada mas com confirmação de e-mail pendente — este projeto Supabase exige confirmação, `mailer_autoconfirm: false`), `sair`. `src/app/auth/callback/route.ts` troca o código do OAuth por sessão. `/` agora redireciona pra `/treino` em vez de mostrar o boilerplate do Next (nunca customizado, achado do Inspetor QA na Fase 1) — aproveitei e apaguei o boilerplate morto (`page.module.css`, os 5 SVGs de exemplo).

**Dois bugs reais achados e corrigidos, nenhum aplicado às cegas (E8):**
1. **`middleware.ts` na raiz nunca rodava.** O projeto usa layout `src/` — Next.js só reconhece o arquivo de middleware dentro de `src/`, não na raiz do repo. Sem isso, o middleware inteiro era ignorado silenciosamente: `/treino` sem sessão caía direto no erro "Sessão ausente" (500), nunca no redirecionamento pro `/login`. Descoberto adicionando um log de depuração temporário e vendo que ele nunca aparecia no servidor — removido depois de confirmar a causa.
2. **O redirecionamento pro `/login` não carregava os cookies que o próprio SDK tentou limpar.** Quando `getUser()` encontra um refresh token inválido (conta de teste deletada, por exemplo), o Supabase tenta emitir `Set-Cookie` pra limpar o cookie morto — mas eu construía a resposta de redirecionamento como um objeto novo (`NextResponse.redirect(url)`), que não carrega esses cookies. Resultado: o navegador ficava com o cookie inválido preso, repetindo o mesmo erro de refresh a cada requisição, num loop. Corrigido copiando os cookies da resposta mutada pelo SDK pra resposta de redirecionamento (padrão documentado do `@supabase/ssr`).

**`middleware.ts` → `src/proxy.ts`:** o Next.js 16.3 avisou em runtime que a convenção `middleware.ts` está depreciada em favor de `proxy.ts` (E12 — doc/aviso vigente vence o que eu "lembrava"). Migrado com o codemod oficial (`@next/codemod middleware-to-proxy`), não à mão — `export function middleware` virou `export function proxy`, mesmo comportamento.

**Verificado com clique real na tela de `/login` (não só chamada direta), usuário de teste real:**
- Login com e-mail/senha → `/treino`, com o botão "Sair" visível.
- `/` com sessão ativa → redireciona pra `/treino` (não mostra mais boilerplate).
- "Sair" → volta pro `/login`; tentar `/treino` de novo é barrado — sessão realmente encerrada, não só a UI escondida.
- "Criar uma conta" alterna o formulário corretamente. O `signUp` em si esbarrou na validação de e-mail do próprio Supabase (domínios de teste tipo `.teste`/`example.com` são rejeitados como "invalid") — não é bug do app (o mesmo `entrarComEmail`, testado com sucesso, usa o idêntico padrão de chamada); ficou sem cobertura de clique real o caminho exato "conta criada, confirmação pendente", mas a lógica (`!data.session` → `confirmacaoPendente: true`) é a leitura direta e óbvia da documentação do Supabase.
- "Entrar com Google" → redireciona pro Supabase com os parâmetros certos (PKCE `code_challenge`, `redirect_to=/auth/callback`); Supabase responde "provider is not enabled", exatamente o esperado — confirma que o lado do app está certo, falta só o provedor ser habilitado.
- Usuários de teste (3, todos com domínios `.teste`/`example.com`) removidos ao final, contagem = 0.

### Checklist do Google OAuth — concluído (2026-08-06)

1. ✅ [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → credencial OAuth 2.0 "Aplicativo da Web" criada, no projeto `gen-lang-client-0917024278` (mesmo projeto da chave Gemini), com a tela de consentimento configurada pelo dono. **O Google Cloud Console chegou a mostrar um aviso de "bloqueio por excesso de solicitações automatizadas" enquanto eu tentava ajudar via navegador — parei imediatamente e deixei o dono terminar essa parte específica sozinho**, por ser exatamente o tipo de sinal de bot-detection que não devo ignorar.
2. ✅ Client ID e Client Secret colados pelo dono direto no painel do Supabase (Authentication → Sign In/Providers → Google) — nunca vistos nem digitados por mim.
3. **Achado real, corrigido em conjunto:** o campo "Client IDs" do Supabase estava com o valor `lastro` (nome do projeto) em vez do Client ID de verdade (`NNNN.apps.googleusercontent.com`) — o Supabase acusou "Invalid characters" no `Salvar`. Identifiquei o erro pela mensagem de validação, o dono recolou o valor certo.
4. ✅ Provedor Google confirmado como "Enabled" no Supabase.
5. **Achado real, corrigido por mim:** a lista de Redirect URLs em Authentication → URL Configuration estava **vazia** — sem isso, o Google deixaria logar mas o retorno ao app falharia no passo final. Adicionei `https://lastro-pi.vercel.app/auth/callback` e `http://localhost:3002/auth/callback` (ação de configuração, não de credencial — não envolve chave/segredo).
6. **Verificado:** clique em "Entrar com Google" na tela `/login` real (`npm run dev`) agora redireciona até a tela de login de verdade do Google ("Prosseguir para tbkzcqfvafznxallyfqk.supabase.co") — antes disso, a resposta era "provider is not enabled". Não completei o login com uma conta Google real (isso é do dono).

### Dois bugs reais achados pelo dono no celular de verdade — corrigidos (2026-08-06)

**1. PWA instalada travava ao abrir em modo avião (`FetchEvent.respondWith received` — erro reportado literalmente pelo Chrome).** Causa: `public/sw.js` fazia só `evento.respondWith(fetch(evento.request))`, sem `catch`. Sem rede, essa promise rejeita e não há nada pra responder — o Chrome não crasha silenciosamente, mostra esse erro genérico. Corrigido: instalação agora pré-cacheia `public/offline.html` (página estática nova, tema claro/escuro); toda navegação (`request.mode === "navigate"`) tenta a rede primeiro e cai pra essa página cacheada se falhar; outros pedidos (assets) devolvem um 504 controlado em vez de deixar a promise rejeitar. **Não é** cache de app shell completo — as páginas do lastro são quase todas dinâmicas (sessão, dados reais), não faz sentido cachear o HTML delas. É só a rede de segurança mínima pra não travar. Verificado que o service worker instala e cacheia `offline.html` de verdade (`caches.open` + `cache.match` confirmados via console); **não consegui simular queda de rede genuína** nesta ferramenta (`window.fetch` não intercepta o fetch interno do service worker, que roda em thread separada, e não há toggle de rede do SO aqui) — o padrão de código (network-first com fallback de cache pra navegação) é o documentado/padrão da Web, mas o teste real em modo avião ainda depende do dono confirmar de novo no celular.

**2. Login com Google completava no Google, mas voltava pro `/login` em vez de `/treino`.** `src/app/auth/callback/route.ts` tinha dois problemas reais, achados comparando com o exemplo oficial atual do Supabase (`context7`, não memória — E12):
   - **Sem tratamento de erro visível.** Se `exchangeCodeForSession` falhasse, o código só redirecionava de volta pro login **sem nenhuma pista do motivo** — nem no servidor (sem log), nem pro dono (sem mensagem na tela). Era literalmente impossível saber por que sem acesso aos logs do Vercel (que já tinham expirado a retenção de 1h do plano Hobby quando fui checar). Corrigido: `console.error` no servidor com a mensagem/status reais do Supabase, e a tela de `/login` agora lê `?erro=...` da URL e mostra uma mensagem (`AvisoDeErroNaUrl`, com `Suspense` porque `useSearchParams` exige).
   - **Suspeita da causa raiz, direto da doc oficial:** a Vercel roda o app atrás de um balanceador de carga — `new URL(request.url).origin` traz o **host interno**, não o domínio público (`lastro-pi.vercel.app`). Redirecionar pro host errado depois de trocar o código por sessão descarta os cookies recém-criados (pertencem ao domínio público), e o dono cai de volta no login como se nada tivesse acontecido — bate exatamente com o sintoma relatado. Corrigido lendo `x-forwarded-host` (padrão oficial do Supabase pra Next.js na Vercel), com fallback pro `origin` normal em desenvolvimento (sem balanceador).
   - De passagem, fechada uma brecha de redirecionamento aberto: `?next=` da URL agora só aceita caminho relativo (`/algo`), nunca `//dominio-externo`.
   - **A hipótese do `x-forwarded-host` NÃO era a causa raiz** (registrado como correção defensiva legítima, não como o conserto do bug). O log que passei a emitir é que resolveu: na tentativa seguinte do dono, apareceu o erro real, vindo do próprio Supabase — `error=server_error`, `error_description=Unable to exchange external code`. Ou seja, o Google devolvia o código certo, mas o **Supabase** falhava ao trocá-lo com o Google.

**3. Causa raiz real do login com Google: Client Secret desalinhado no Supabase (não era bug de código).** Com o erro em mãos, comparei os dois lados item a item — Client ID no Google (`172367684853-62nr5tjgu...`) idêntico ao do Supabase ✅, URI de redirecionamento registrada no Google exatamente `https://tbkzcqfvafznxallyfqk.supabase.co/auth/v1/callback` ✅, provedor habilitado ✅. Por eliminação sobrou o **Client Secret** — provavelmente colado antes da correção do campo "Client IDs" (que primeiro recebeu o texto `lastro` por engano), ou com espaço/quebra de linha junto. O dono recolou o segredo; **nunca abri nem li esse campo**. 

**Verificado de ponta a ponta, com o dono no iPhone real (2026-08-06, 01:18):** o `/auth/callback` seguinte não gerou erro nenhum (contador de erros do Vercel permaneceu em 2, das tentativas antigas), e a conta apareceu no banco — `guilhermesaldanha007@gmail.com`, `provider: google`, `created_at` e `last_sign_in_at` com 2 segundos de diferença. Prints do dono confirmam a sequência completa funcionando no aparelho: login → tela "Treinos" → "Iniciar treino de hoje" → formulário de registrar série na tela.

**PWA offline confirmada funcionando no mesmo teste:** os logs mostram vários `GET /offline.html 200` durante a sessão em modo avião do dono — a página de fallback foi servida de verdade, em vez do crash `FetchEvent.respondWith received` de antes. Fecha a lacuna de verificação que ficou aberta no item 1.

**Lição de processo (vale mais que o conserto):** a primeira correção que escrevi (`x-forwarded-host`) foi uma hipótese plausível tirada da doc oficial — e estava **errada** sobre a causa. O que realmente destravou foi a parte "chata" da mesma mudança: **fazer o erro aparecer** (log no servidor + mensagem na tela). Sem observabilidade, o bug era invisível e eu só conseguia adivinhar; com ela, a causa apareceu na primeira tentativa seguinte. Quando um fluxo depende de sistema externo, instrumentar antes de teorizar economiza rodadas.

### Tarefa 2.2 — o que foi feito e o que falta verificar (2026-08-05)

**Fundação (`src/lib/offline/db.ts`, `outbox.ts`):** fila FIFO em IndexedDB (Dexie), testada isoladamente (5 testes, `fake-indexeddb`) — enfileirar sem tocar rede, sincronizar em ordem preservando a dependência treino→série, parar no primeiro erro sem pular à frente, retomar sem duplicar.

**Ligação ao formulário (`treino-detalhe.tsx`, `formulario-serie.tsx` reescrito, `treino.ts`):** a tabela de séries e o formulário passaram a viver juntos num componente cliente (`TreinoDetalhe`) porque precisam compartilhar estado pra atualização otimista funcionar — o Server Component da página só busca os dados iniciais. `criarSerie` (FormData + contagem de `ordem` no servidor) foi substituída por `criarSerieRemoto` (recebe `id`/`ordem` já decididos pelo cliente, sem `redirect`/`revalidatePath` — quem chama já atualizou a UI antes). `id` de série agora é gerado no cliente (`crypto.randomUUID()`), não mais pelo Postgres — pré-requisito pra escrever offline sem esperar o servidor responder com um ID.

**Verificado:** `npx vitest run` (66/66), `npx tsc --noEmit` (limpo), `next build` limpo.

**Achado real — causa raiz do bloqueio de login encontrada e corrigida (não era infra, era o fixture de teste).** A primeira tentativa de verificar no navegador falhou com `AuthRetryableFetchError` / HTTP 500 `"Database error querying schema"` no login. Reproduzido fora do código do app (fetch direto ao `/auth/v1/token`), o que sugeria erro de infraestrutura do Supabase — **conclusão errada**, corrigida ao ler os **Auth Logs do próprio painel do Supabase** (acesso via navegador do dono, sessão já logada): o erro real era `error finding user: sql: Scan error on column index 5, name "created_at": unsupported Scan, storing driver.Value type <nil> into type *time.Time`. O `insert` manual em `auth.users` (usuário de teste, criado só para verificação — nunca dado do dono) não preenchia `created_at`/`updated_at`, colunas sem valor padrão; o driver Go do GoTrue não aceita `NULL` ali. Corrigido preenchendo os dois explicitamente no fixture de teste.

**Verificado de ponta a ponta, com clique real na UI (não só `fetch` direto):** login → `/treino/<id>` → 2 séries registradas pelo formulário real. A tabela atualizou **na hora**, antes de qualquer round-trip — confirmado depois contra o Postgres: `ordem=1`/`ordem=2` corretos, `usuario_id` preenchido pelo trigger (nunca pelo cliente), RIR ausente gravado como `null` (não `0`, segunda série sem RIR). Usuário de teste, treino e as 2 séries removidos ao final (3 contagens = 0, confirmado numa query só), `/dev-login` apagada.

**Fica para a tarefa 2.3, não para agora:** o cenário que este teste NÃO cobre é a rede cair de verdade no meio do registro (aqui a sincronização sempre teve rede disponível, só testei que o caminho "grava local → enfileira → sincroniza" funciona online). Isso exige celular real em modo avião — check executável já registrado na tabela acima.

### Tarefa 2.3 — Background Sync (2026-08-05)

**Por que o listener `online` da 2.2 não bastava:** só funciona com a aba em primeiro plano. A Background Sync API (`public/sw.js`, evento `sync`) deixa o **navegador** acordar o service worker quando a rede volta, mesmo com a aba em segundo plano — mais confiável em celular, que é o cenário real do PRD (J1, "o elevador derruba o sinal"). O SW não tem como chamar a Server Action `criarSerieRemoto` diretamente (não tem acesso ao runtime de Server Actions do Next), então ele avisa as abas abertas via `postMessage`; quem sincroniza de fato continua sendo o cliente. `src/lib/offline/sincronizacao-em-segundo-plano.ts` é a ponte: `pedirSincronizacaoEmSegundoPlano()` registra o interesse quando uma tentativa de sync falha, `ouvirPedidosDeSincronizacao()` reage ao aviso do SW. API experimental (sem suporte em Safari/Firefox) — tudo com `try/catch` silencioso, o listener `online` continua como fallback nesses navegadores.

**Verificado no navegador, com rede genuinamente bloqueada (não só sem round-trip):** `window.fetch` sobrescrito pra rejeitar toda chamada (equivalente a modo avião do ponto de vista do código — a diferença de um teste em celular real é a camada do SO, não o comportamento observável pelo app). Registrei uma série: a UI confirmou na hora mesmo com a rede bloqueada; conferido na IndexedDB que a série ficou na fila (`tentativas: 1`); conferido que `registration.sync.register('sincronizar-outbox')` foi chamado de verdade. Restaurei a rede e simulei o aviso do SW (mensagem `sincronizar-outbox`, o mesmo formato que `avisarClientes()` envia): a fila esvaziou e a série apareceu no Postgres com os valores corretos. Usuário, treino e série de teste removidos (contagem = 0).

**Fica para quando você tiver o celular à mão:** o teste real em modo avião do SO, com a tela de fato bloqueada/em segundo plano — o que este teste NÃO cobre é o navegador de verdade disparando o evento `sync` sozinho (isso é implementação nativa do Chrome, não código meu; testei que meu código reage certo ao que ele entrega, não a entrega em si).

### Tarefa 2.5 — "repetir última série" (2026-08-05)

`repetirUltimaSerie` em `treino-detalhe.tsx` reaproveita exercício/tipo/reps/peso/RIR/peso-corporal da última série do estado local e chama o mesmo `registrarSerie` do fluxo normal — sem formulário, um clique. Verificado com clique real: registrei uma série pelo formulário, cliquei "Repetir última série", e uma segunda linha idêntica apareceu na hora; conferido no Postgres — dois registros com `id`/`ordem` distintos (1 e 2), mesmos valores de reps/peso/rir. Usuário e dados de teste removidos (contagem = 0).

### Tarefa 2.4 — PWA instalável (2026-08-05)

**O que foi feito:** `public/manifest.webmanifest` (nome, ícone, `display: standalone`, `start_url: /treino`, `theme_color`), `public/icon.svg` (monograma simples — **pendência de polimento**: só SVG, sem PNG raster; o `apple-touch-icon` do iOS não usa SVG, então no iPhone o "adicionar à tela de início" cai pra uma miniatura da página em vez do ícone — sem sinal de que o dono usa iPhone, registrado como conhecido, não escondido). `public/sw.js`: service worker mínimo (install/activate/fetch passthrough, sem estratégia de cache ainda — isso é a tarefa 2.3) só pra satisfazer o critério de instalabilidade do Chrome (precisa de um SW ativo controlando o escopo). Registrado via `registrar-service-worker.tsx` montado no layout. Aproveitei pra corrigir o boilerplate do Next ainda não customizado (achado menor do Inspetor QA, tarefa 1): `lang="pt-BR"`, título/descrição reais em `layout.tsx`.

**Verificado no navegador:** `/manifest.webmanifest` serve o JSON correto; `<link rel="manifest">`, `<meta name="theme-color">` e `lang="pt-BR"` presentes no HTML renderizado; `navigator.serviceWorker.getRegistrations()` retorna 1 registro ativo com o escopo certo.

**NÃO verificado — e não dá pra verificar daqui:** o critério real da tarefa (instalar na tela inicial de um celular real e abrir em tela cheia) exige o dispositivo físico do dono. Fica pendente, não escondido.

**Fica pendente, registrado, não escondido:** verificar o clique real (celular ou navegador) quando esse erro de infraestrutura for entendido/resolvido — pode valer a pena olhar os logs de Auth no painel do Supabase, algo que eu não tenho como acessar.

---

## Fase 3 — Identidade visual e telas · 🔶 Reconciliada em 2026-08-06

O que este bloco descrevia originalmente ("histórico de treinos · e1RM e volume por exercício no tempo · volume semanal por grupo muscular") **não é o que foi construído.** O que aconteceu de fato, numa sessão longa sem atualizar este arquivo no caminho:

**Concluído:**
- Padrão visual "Areia & Azul Petróleo" (`DESIGN.md` §3, `src/app/tokens.css`, `src/app/sistema.css`) — aprovado pelo dono depois de 3 iterações de referência (moodboard gerado por IA, depois um segundo padrão de referência escolhido pelo dono).
- Aplicado nas 8 telas que existem hoje: `/`, `/login`, `/treino`, `/treino/[id]`, `/analise`, `/catalogo`, `/coach`, e a aba inferior fixa com 5 seções.
- Contraste AA e alvo de toque **medidos em navegador real**, não estimados — inclusive contra o Supabase real do dono, não só simulação (ver `DECISIONS.md` 2026-08-06).

**NÃO concluído, e é o que a Fase 3 original pedia:**
- **Gráfico de progressão** (e1RM e volume por exercício no tempo, volume semanal por grupo muscular) — `DESIGN.md` §3.7 já especifica o formato ("a pergunta é 'está subindo?', não 'quanto?'"), mas **nenhum componente de gráfico existe**. Não há `src/**/grafico*`. Fica para abrir a próxima sessão.
- Gate visual **G6** (`DESIGN.md` §4.1, gráfico com platô) não pode nem começar sem o gráfico existir.

## Fase 4 — Catálogo curado · 🔶 Infra pronta, conteúdo não escrito

**Concluído:** a tela `/catalogo` existe, funciona, agrupa por grupo muscular, e **diz honestamente** quando a dica de execução não foi escrita em vez de esconder ou inventar (E3).

**NÃO concluído:** o catálogo real de ~100 exercícios em PT-BR com dica de execução **escrita e revisada por humano** (FF7) nunca foi escrito. `supabase/seed.sql` segue com os 3 exercícios placeholder de teste, todos com `dica_execucao` nula. **Critério A9 do PRD não é atendido** ("contagem de campos vazios = 0"). Isto é trabalho de redação, não de código — precisa do dono ou de alguém que escreva e revise as dicas.

## Fase 5 — Coach 24h · ✅ Concluída, verificação parcial

`/coach` + `/api/coach` + o prompt do sistema (que recusa dar técnica de movimento, prescrever treino ou opinar sobre dor/sintoma) estão implementados e eram parte do padrão visual aplicado na Fase 3.

**NÃO verificado:** nenhuma pergunta real foi enviada pelo Coach contra a API da Gemini de verdade — a tela foi validada com marcação injetada (mock), nunca com uma conversa real. Testar isso consome cota (~20 req/dia, `KNOWLEDGE.md` §3.2).

## Fase 6 — Integração final · ⬜ Não iniciada

Review integral do Inspetor · todas as fitness functions · E2E das 3 jornadas · gate visual completo em celular físico. Nada disto começou.

---

## Trabalho fora do plano de 6 fases — adicionado durante a Fase 3, concluído

Surgiu de pedido direto do dono no meio da sessão, não estava em nenhum documento antes de acontecer:

- **CRUD de treino e série** — editar série, excluir série (fila offline), excluir treino (online-only), todos com confirmação inline. PR #10, mergeado. Ver `DECISIONS.md` 2026-08-06. **Verificado contra o Supabase real** (ciclo criar → editar → excluir → confirmar que sumiu, sem deixar rastro no histórico real do dono).
- **Home (`/`) como porta de entrada única do app** — painel com resumo real da semana (`src/lib/dados/resumo-home.ts`, reusa `calcularVolume` do mesmo agregador da Análise — sem número inventado), ação de continuar/iniciar treino, atalho pra Análise, treinos recentes. `manifest.webmanifest` e os dois pontos de login (e-mail e Google) redirecionam pra cá, não mais direto pro `/treino`.
- **Aba inferior fixa de verdade** (`position: fixed`, com `env(safe-area-inset-bottom)` pra barra de gestos do iPhone) — o app é 100% mobile, pedido explícito do dono.

---

## Pendências consolidadas — não esquecer

1. **Gráfico de progressão** (Fase 3 original) — **verificado em 2026-08-07**, código + gate: `src/lib/analise/progressao.ts` (11 testes), `src/lib/dados/progressao.ts`, `/api/progressao`, `src/components/grafico-progressao.tsx`, embutido em `/analise`. Regra de platô: descritiva, 3 semanas com variação ≤ 2%, separada do limiar clínico do item 6 abaixo. `tsc`/`test` (77 passando)/`lint`/`build` verdes.
   Gate G6/C10/C11 rodado contra dado REAL: usuário QA efêmero criado no Supabase hospedado (`qa-treino-helper.sh criar-usuario`, autorizado pelo dono), 6 semanas de série seedadas via SQL (autorizado pelo dono, depois que a UI se mostrou incapaz de registrar treino com data retroativa — `criarTreino()` só usa a data de hoje, `src/lib/dados/treino.ts:216`), verificado em `npm run dev` local (a mesma verificação contra `lastro-pi.vercel.app` deu 404 em `/api/progressao` — o deploy de produção roda `main`, não este branch; achado registrado abaixo) e depois **removido** (`limpar-usuario`, cascade confirmado = 0 linhas).
   Confirmado sobre o dado real: delta 22/06→27/07 = 14.3% (bate a conta manual), platô detectado exatamente nas 3 últimas semanas (92.1/92.5/91.5 kg, variação 1.09% < 2%), rótulos diretos no primeiro/último ponto, linha de referência "melhor marca", alternativa textual completa (lista + resumo em palavras), foco por teclado em cada ponto (K6), sem sobreposição entre barra de topo e conteúdo em 360×640 e 390×844, traço do platô com `stroke-dasharray` real (não só cor).
   **Achado, não corrigido:** `DESIGN.md` §4.2 declara C10 (`--lastro-plato` sobre `--lastro-sup-1`) esperado em 8.59 e C11 (`--lastro-alta` sobre `--lastro-sup-1`) esperado em 9.86. Medido agora contra os tokens reais em `tokens.css`: **C10 = 5.59, C11 = 6.17** — abaixo do que o doc promete, mas ainda folgado acima do limiar de reprovação (3.0). Os dois passam o gate; a tabela do `DESIGN.md` está desatualizada (drift entre quando os tokens de cor foram medidos e o valor atual de `--lastro-plato`/`--lastro-alta`). Não mexi nos tokens nem no doc — é fora do escopo desta tarefa.
2. **Conteúdo do catálogo** (Fase 4) — **lista de exercícios pronta em 2026-08-07**, texto de dica segue pendente. `supabase/migrations/0003_catalogo_amplo.sql` aplicada no banco hospedado: **87 exercícios** (82 novos + 5 de teste antigos), **10 grupos musculares** (glúteo, posterior de coxa e panturrilha novos, separados de "pernas"). Verificado com usuário QA efêmero: `/catalogo` e o seletor de `FormularioSerie` refletem os 87. Detalhes e decisão de escopo em `DECISIONS.md` 2026-08-07.
   **Ainda falta, de propósito não feito por mim:** as ~87 dicas de execução. FF7/ADR-007 proíbe dica de execução gerada por LLM, mesmo pesquisada — é trabalho de redação humana, do dono ou de fonte curada dele. A tela já mostra "Dica de execução ainda não escrita." honestamente pra todas.
   **Sequenciamento decidido pelo dono:** catálogo amplo primeiro (✅ feito); depois, tela de escolher o(s) grupo(s) musculares do dia (ex.: "peito e ombro", "só perna") ANTES de aparecer a lista de exercícios pra registrar série — vira o item 9 abaixo, ainda não iniciado.
3. ~~CSS responsivo pra tablet/desktop~~ — **cancelado em 2026-08-07** (`DECISIONS.md`): confirmado que a direção é 100% mobile, tarefa superada pela barra fixa. Sai da lista.
4. ~~Dados de perfil do usuário (nome, foto)~~ — **construído e verificado em 2026-08-07** (dono adiantou a prioridade, decisão registrada em `DECISIONS.md`). Tabela `public.usuario` (migração `0004_perfil_usuario.sql`, RLS por `auth.uid()`, FF5), trigger `usuario_cria_perfil` cria a linha no INSERT de `auth.users` (nome do cadastro por e-mail ou `full_name` do Google, com fallback pro e-mail); backfill cobriu as 3 contas reais que já existiam antes da migração (`auth_users = public_usuario = 3`, conferido antes e depois). Cadastro por e-mail ganhou campo Nome obrigatório. Avatar do Google é baixado e re-hospedado no bucket público `avatares` do Storage (nunca hotlink direto), no primeiro login pós-callback, sem bloquear a sessão se falhar. Barra de topo de todas as 6 telas (`/`, `/treino`, `/treino/[id]`, `/analise`, `/catalogo`, `/coach`) mostra foto ou iniciais.
   **Verificado ponta a ponta:** cadastro real pela UI (`/login`, modo criar-conta) gravou `nome` exato no trigger, conferido no banco hospedado. Sessão real (usuário QA efêmero) renderizou o avatar de iniciais na barra de `/treino`, 375×812, contraste medido (não só lido): pior caso do gradiente da barra dá **6.72:1** entre texto e fundo do círculo de iniciais — acima do piso AA de 4.5:1 pra texto normal. Cascade de exclusão confirmado incluindo `public.usuario` (contagem = 0 nos dois testes). `tsc`/`test` (79 passando)/`lint`/`build` verdes.
   **Achado do dono (mesmo dia): barra de topo não estava padronizada.** "Sair" vivia na Bancada, sem motivo — corrigido: agora só existe na Início (a porta de entrada única do app), e a Bancada mostra só o avatar. Verificado no preview do PR (usuário QA de e-mail) nas 6 telas antes do merge.
   **Achado de infra ao testar Google no preview do Vercel:** o redirect OAuth do Supabase está fixo em `localhost:3000` + domínio de produção — não aceita o domínio dinâmico de preview (`*.vercel.app` por branch). Login com Google no preview redireciona pra `localhost:3000` e quebra. Não é bug do app; é o allowlist de redirect do projeto Supabase. Login por e-mail não é afetado.
   **Caminho do Google verificado com o dono, na produção real, depois do merge (2026-08-07):** login real com a conta Google do dono em `lastro-pi.vercel.app` — `avatar_url` do Google baixada e servida a partir do bucket próprio (`.../storage/v1/object/public/avatares/{uid}/avatar.jpg`, HTTP 200, confirmado via rede) e exibida na barra de topo. Última pendência da tarefa fechada.
5. **Ciclo de sincronização offline em celular real** (tarefa 2.3, adiada desde 2026-08-06) — falta registrar séries em modo avião de verdade, reconectar, e conferir no PC.
6. **Faixa de referência de volume por grupo muscular e `N` semanas de estagnação** (PRD §10) — conferido nesta reconciliação: seguem TODO, precisam de fonte primária pesquisada, não número de memória (assunto de saúde). Os outros dois TODOs de §10 (quota da Gemini, liberação semanal do botão) já estavam resolvidos e o PRD foi corrigido para refletir isso. **Não confundir com a regra do item 1** — são limiares diferentes, decisão registrada em `DECISIONS.md` 2026-08-07.
7. **Barra superior fixa** (pedido do dono, 2026-08-07) — feita e **verificada em 2026-08-07** (mesma sessão do item 1): `.barra-topo` é `position: fixed` + `env(safe-area-inset-top)`, `--lastro-clearance-topo` calibrado (88.39px + respiro), sem sobreposição com o conteúdo confirmada em página real logada, 360×640 e 390×844. **Falta só a conferência final em celular físico de verdade** (esta verificação foi em navegador, não em aparelho — o dono decide se isso ainda é necessário).
8. **Lentidão de navegação no app hospedado na Vercel** (relatado pelo dono, 2026-08-07) — **causa provável encontrada, correção NÃO aplicada** (decisão de infra, é do dono): medido com `curl -w` contra `https://lastro-pi.vercel.app` — toda rota é `Cache-Control: private, no-cache, no-store` + `X-Vercel-Cache: MISS` (confirma o que já estava documentado: dinâmica por causa de `cookies()` no auth do Supabase, sem ganho de cache/prefetch possível). O achado novo: `X-Vercel-Id: gru1::iad1::...` — o **edge** que recebe a requisição é `gru1` (São Paulo, certo pro dono), mas a **function** roda em `iad1` (Virginia, EUA). Toda rota dinâmica paga esse hop extra — TTFB de ~270–470ms mesmo pra respostas simples (redirect de rota protegida). **Decisão tomada (2026-08-07):** `gru1`. Confirmado via `npx supabase projects list` que o Postgres roda em `sa-east-1` (São Paulo, AWS — geograficamente o mesmo lugar que `gru1` na Vercel) — as três pontas (edge, function, banco) convergem pra São Paulo, só a function estava fora do lugar. Criado `vercel.json` (`{"regions": ["gru1"]}`) — é o jeito em código de pedir isso; **pode precisar também confirmar em Project Settings → Functions no painel da Vercel**, dependendo do plano da conta (não verificado, não tenho acesso ao painel).
9. ~~Seleção de grupo muscular antes de iniciar o treino~~ — **construído, verificado e mergeado em 2026-08-07** (pedido do dono). `SeletorGrupoMuscular` filtra o exercício mostrado no formulário pelo(s) grupo(s) escolhido(s); estado de sessão, não persistido (o app não prescreve programa, PRD §5). Detalhes e verificação em `DECISIONS.md` 2026-08-07.
10. ~~Formulário de série pré-selecionava exercício/tipo ao abrir~~ — **corrigido em 2026-08-07** (achado do dono, ver `DECISIONS.md`): os dois campos começam em branco, `required` nativo bloqueia envio sem escolha explícita; botão só diz "Outra série" com pelo menos 1 série já registrada, senão diz "Adicionar exercício". Verificado ponta a ponta com usuário QA efêmero.
11. ~~Treino vazio contava nas estatísticas e se duplicava~~ — **corrigido em 2026-08-07** (achado do dono, QA manual pelo Chrome, ver `DECISIONS.md`): `criarTreino()` reaproveita o treino de hoje em vez de duplicar; `/treino` (Bancada) ganhou a mesma checagem "Continuar" vs "Iniciar" que a home já tinha; treino sem nenhuma série não conta em `treinosNaSemana`/`recentes`/`semanasFechadasComTreino`. Verificado no banco real (só 1 linha, 0 séries, não aparece em "recentes").
12. ~~PWA instalado retomava a última tela em vez de abrir em Início~~ — **corrigido em 2026-08-07** (mesmo relato do item 11, causa raiz achada depois): `src/components/forcar-inicio-no-lancamento.tsx` força voltar pra `/` quando o app está em modo instalado (`display-mode: standalone`) e a rota não é `/`, `/login` nem `/auth/callback`. Decisão explícita do dono: perder a conveniência de retomar treino direto do ícone, sempre priorizando abrir em Início. **Falta confirmar num aparelho com o PWA de fato instalado** — `matchMedia("standalone")` não é verdadeiro em navegador comum, só testei a lógica isolada.
13. ~~Upload manual de foto de perfil~~ — **construído e verificado em 2026-08-12** (item 17 abaixo tem o detalhe completo: a tela de perfil que faltava aqui nasceu junto da reorganização de nav pedida pelo dono).
14. **Polish visual reativo — pausado, branch `fix/consistencia-visual-telas` (2 commits, não mergeada).** Detalhe completo em `DECISIONS.md` 2026-08-07/08. Resumo: cabeçalho não quebra mais em 2 linhas (corrige vazamento de conteúdo atrás da barra fixa), respiro data→título dobrado, rótulos de "Esta semana" alinhados por altura fixa, chips de grupo muscular viraram grade 2×N. **Ainda quebrado:** card "Séries valendo" segue desalinhado (hipótese: altura do card inteiro diverge porque só "Volume" tem linha de unidade extra — não investigado). **Decisão pendente do dono:** trocar ou não o zero pontuado do IBM Plex Mono (`--lastro-fonte-num`), sinalizado 2x como visualmente ruim mas documentado como escolha deliberada em `DESIGN.md` §3.3. **Mudança de abordagem decidida pelo dono:** parar o ciclo print→fix→print e a skill externa `impeccable`; próxima sessão aciona `diretor-arte` (já instalado em `.claude/agents/`) pra auditoria completa contra `DESIGN.md`, não mais correção reativa 1 print de cada vez. **Achado de ferramenta:** screenshot automático do preview não funcionou nesta sessão (painel do navegador não compositava do lado do dono) — toda verificação foi por medição de DOM (`getBoundingClientRect`/`getComputedStyle`) contra usuário QA efêmero, cruzada com prints reais mandados pelo dono. Isso é uma lacuna, não o padrão desejado (`padrao-verificacao` exige olho real).

   **↳ 2026-08-08, sessão seguinte — auditoria feita, pesquisa feita, PROPOSTA ENTREGUE, nada aplicado.** Ver `DECISIONS.md` 2026-08-08. Estado: `fix/consistencia-visual-telas` continua com os mesmos 3 commits, **nenhum arquivo de `src/` tocado nesta rodada**; só `KNOWLEDGE.md` §2.1/§5 e este arquivo.
   - **Causa raiz do "Séries valendo" ACHADA e é outra:** não é altura de card (as alturas já são idênticas por construção do grid) — é **largura**. Sobram 77,67px por card e `14,2k` em mono 30px pede 87px, então quebra. Só reproduz com **volume ≥ 10.000 kg**; a medição da sessão anterior deu "alinhado" porque o usuário QA tinha volume baixo. **Pré-condição obrigatória do gate (V0):** semana de teste com volume ≥ 10.000 kg, senão o gate não mede nada.
   - **Regressão desta branch, ainda não corrigida:** o fix de "título não quebra em 2 linhas" trocou quebra por corte — em `/treino/[id]` sobram ~185px e "Treino em andamento" pede ~237px, então o título sai com reticências. Única tela afetada. Corrige em qualquer direção.
   - **Entregue ao dono:** deck visual publicado (mockups antes/depois em 375×812, tese, 10 movimentos, 2 decisões renderizadas) — <https://claude.ai/code/artifact/8bf7ef96-981e-4603-8b96-c7b6b6d8ae01>. Fonte em `scratchpad/deck/`.
   - **Bloqueado aguardando o dono:** (a) aprovar ou redirecionar a direção; (b) apontar A/B/C no zero do Plex Mono; (c) apontar A/B no tamanho de texto (§3.4 / D-b).
   - **Screenshot automático falhou de novo** (mesma causa da sessão anterior). Contornado para a pesquisa baixando as imagens de referência e lendo como arquivo; **o app rodando não foi visto**. O gate continua sendo o olho do dono.

   **↳ 2026-08-08 (2) — REDIAGNÓSTICO: o problema não é alinhamento.** Ver `DECISIONS.md` 2026-08-08 (2). O dono respondeu à proposta — "funcional, mas feio, sem detalhes, sem vida". Os 10 movimentos anteriores eram **higiene**, não estética: consertam o quebrado, não produzem beleza. Idem `impeccable` — ele checa valor fora do sistema, e todos os valores do lastro estão *dentro* do sistema, só que **todos no mesmo degrau** (maior número em 30px com `--lastro-t-8` nunca usado; 7 componentes na mesma `elev-1`; todo cabeçalho no mesmo versalete de 14px). Não falta cor: falta diferença.
   - **Restrição a entrar em `DESIGN.md` §3.0:** as referências que "têm vida" (WHOOP, Oura, Ultrahuman) são escuras, e é daí que vem a vitalidade delas. Em fundo areia claro **não se compra vida com brilho nem saturação** — só com contraste de escala, peso e densidade.
   - **Deck v2 publicado**, mesmo endereço: 3 tratamentos de login como apostas distintas (Placa · Caderneta · Massa, com o botão do Google idêntico nos três), parecer no modelo Oura (sobrancelha + veredito em Plex Serif + evidências com palavra·cor·barra), volume `14,2 t` em vez de `14,2k kg`.
   - **Erro meu, corrigido:** o deck v1 mostrava a aba inferior com 4 seções; são **5** (`aba-inferior.tsx`). O briefing do dono pegou.
   - **Achado contra a minha própria proposta (E8):** eu tinha usado `t-8` no parecer, violando `DESIGN.md` §3.5 — em Modo Leitura o número é `t-5`. Só apareceu porque a peça foi construída e medida, não descrita.
   - **Escopo levantado, NÃO aplicado:** coluna "antes 16 × 9" por série (padrão Hevy/Strong). Exige consulta ao histórico do exercício — é feature, decisão do dono.
   - **Bloqueado aguardando o dono:** login A/B/C · zero do Plex Mono A/B/C · tamanho §3.4 A/B · coluna "anterior" entra ou não.

   **↳ 2026-08-08 (3) — o dono trouxe 16 peças visuais. Relatório de absorção entregue, nada aplicado.** Ver `DECISIONS.md` 2026-08-08 (3). Estado: `fix/consistencia-visual-telas`, **nenhum arquivo de `src/` tocado**.
   - **Insumo:** `C:\Users\danin\Downloads\lastro-pecas-modulares-para-claude.zip` (16 mockups `pecas/01..16.png` + 7 telas de terceiros em `referencias/`, só calibração) e o guia `Lastro — peças visuais separadas para o Claude.md`. **Ler por workstream, nunca as 16 de uma vez** (~3 MB cada). Assinatura = 07/08/09/10/11 · Bancada = 03/04/05/16 · sistema = 02/06/12/13/14/15.
   - **Diretrizes v7:** o Passo 5 (agents + skills `padrao-*` + hooks) **já está instalado** neste projeto. Os passos de bootstrap (0/0.5/1/1.5/2) não se aplicam — reabririam o `PRD.md`, que está congelado.
   - **A peça 08 valida a tese do rediagnóstico:** o salto de escala está no **veredito**, não no numeral, e o parecer lê como documento emitido (sobrancelha + risco + linha de emissão + evidência com barra lateral + "O QUE FAZER" numerado + assinatura).
   - **Conflitos peça × contrato, verificados no código:** C1a `RPE` nas peças vs **RIR** no domínio (rejeitado o rótulo) · C1b RIR **não é exibido na linha de série hoje** → exibir é feature, não polimento · C2 peça mostra 4 abas, o app tem 5 (`aba-inferior.tsx:16-44`) · C3 hexes da peça ≠ `tokens.css` (Areia `#F3EDE3` vs `#F0EAE0`) — tokens vencem, cada um traz contraste medido · C4 veredito Sans bold na peça vs Plex Serif na proposta pendente · C5 a peça 08 **não tem moldura de celular** (pôster 1440×2560): tamanho absoluto dela não transfere, medir no navegador · C6 peça mostra `18.450 kg` e o código ainda produz **"14,2k kg"** (`page.tsx:39-40`) — a decisão de virar `14,2 t` existe desde 08/08 e **não foi implementada**.
   - **GATE VISUAL DESTRAVADO — primeira vez em 4 sessões.** Nem o painel interno (mesmo aberto) nem o `screenshot` da extensão do Chrome capturam. **O método que funciona: extensão Claude-in-Chrome navega/redimensiona + `mcp__computer-use__screenshot` captura a tela** (Chrome em tier `read`). Pré-condições: janela do Chrome **não maximizada** (senão o resize é ignorado e sai 1366px) e a **aba da extensão em primeiro plano** (ela navega aba de fundo). `read_page`/`javascript_tool` funcionam sempre. Detalhe em `DECISIONS.md`.
   - **Visto de verdade, 390×844, conta real:** Análise confirma o rediagnóstico **por evidência visual** — as 5 perguntas são 5 cartões idênticos (mesma `elev-1`, mesmo raio, mesmo peso), `PROGRESSÃO` e `ESCOLHA A PERGUNTA` no mesmo versalete de 14px do `ESTA SEMANA`. O único elemento com voz é a barra de topo escura, que é o mesmo par sobrancelha+título do cabeçalho da peça 08.
   - **Limite do gate:** conta do dono está em `Volume 0 kg`, sem semana fechada — o parecer não renderiza e o bug do card "Séries valendo" não reproduz (precisa de ≥ 10.000 kg). **Gate da peça-assinatura exige usuário QA efêmero seedado**, como na tarefa do gráfico.
   - **Bloqueado aguardando o dono:** C1b (RIR na linha de série?) · C4 (Serif ou Sans no veredito?) · C5 (manchete pode passar de `t-5`?) · C6 (implementar `14,2 t` agora?) · as peças entram no repo (45 MB, exigiria LFS) ou ficam fora?

   **↳ 2026-08-08 (4) — dono aprovou C4 (Serif), C5 (t-6) e C6 (toneladas); backlog fatiado, execução iniciada.** Ver `DECISIONS.md` 2026-08-08 (4) e (5).
   - **C6 implementado e commitado** (`0ac5f0c`): `formatarVolume` em `page.tsx` devolve `{valor, unidade}`, kg abaixo de 1000, `t` acima.
   - **`DESIGN.md` amendado** (mesmo commit): §3.0 ganha a restrição do rediagnóstico por escrito; §3.6.2 sobe o veredito de `t-3` pra `t-6`, nomeado em §3.4.
   - **Gate visual funcionando de verdade nesta sessão** (extensão Chrome + computer-use, Chrome não-maximizado): Início mostra `Volume 0 kg` correto; Análise mostra as 5 perguntas como cartões idênticos, confirmando o rediagnóstico por evidência, não só por medição.
   - **Usuário QA efêmero criado e seedado:** `qa-lastro-parecer@example.com`, UUID `343f521f-ac58-4924-a4cf-87038bcb9812`. 5 semanas fechadas (treinos 2026-07-01 a 2026-07-29, Mondays 06-29 a 07-27), Agachamento Livre e Supino Reto em alta, Levantamento Terra e Desenvolvimento em platô, Remada Curvada em queda. Volume da semana mais recente: **10.420 kg**. Verificado ponta a ponta contra `/api/analise` real (as 4 tendências saíram corretas na prosa). **Fica vivo até a tarefa "Gate final"** — que deve rodar `./scripts/qa-treino-helper.sh limpar-usuario qa-lastro-parecer@example.com` ao terminar. Não esquecer.
   - **Achado de arquitetura:** `/api/analise` já calcula `resumo` (tudo que o parecer precisa) antes de chamar o Gemini, mas só devolve `{ parecer }` — os blocos de evidência de `DESIGN.md` §3.6.3 não têm dado estruturado ainda, só CSS. Consultei o revisor antes de tocar o contrato: devolver `ResumoCompacto` inteiro seria o desenho errado (acopla o contrato da tela ao payload do prompt). Fatia própria, tipada.
   - **Achado da seed:** o mesmo exercício pode estar "em alta" pela janela de comparação (`tendencia_e1rm`, 4 semanas) e "em platô" pela regra do gráfico (`PLATO_GRAFICO_SEMANAS`, 3 semanas) ao mesmo tempo — os dois cálculos corretos, discordando. `DESIGN.md` §3.6.3 não tinha regra de qual sinal pinta a barra lateral do card. **Resolvido:** o card é dono da janela de comparação; o platô fica só no gráfico. Escrito em `DESIGN.md`.
   - **Dono decidiu:** estender o agregador (`volume_por_exercicio` em `ResumoCompacto`) em vez de usar só e1RM+sessões — é fase nova, não retoque.
   - **`.claude/launch.json` commitado** (`f92d16c`) — não fica mais untracked.
   - **Backlog concluído nesta sessão:** #9 agregador (`a4168e3`), #10 API/evidência (`a08dc51`), #4 cabeçalho+veredito (`f92d16c`). 94 testes, `tsc`/lint limpos em todos.
   - **Achado de tooling, resolvido:** `mcp__computer-use__screenshot` (escopo desktop) prendeu numa janela desatualizada várias vezes nesta sessão, mesmo após reload/limpar cookies/service worker. `mcp__claude-in-chrome__computer{action:"screenshot"}` (escopo da aba, dentro da extensão) sempre mostrou o estado real. Preferir a extensão para captura daqui pra frente.
   - **Achado para o dono julgar:** o veredito em `t-6` ocupa ~8 linhas em viewport de 375–500px quando a frase é longa — fiel à decisão, mas vale o olho real antes do gate final (tarefa 8). Se parecer exagerado, a correção é pedir concisão no prompt, não reduzir o token.
   - **Próximo passo concreto:** tarefa #5 — cards de evidência com barra lateral (peça 09), consumindo `evidencia.blocos` que a API já devolve.

   **↳ 2026-08-10 (2) — BACKLOG DA PEÇA-ASSINATURA FECHADO.** Tarefas #5 a #8 concluídas na mesma sessão. Commits `c23a13d` (cards de evidência) → `29877f0` (gate final). Ver `DECISIONS.md` das mesmas datas para detalhe de cada uma.
   - **#5 cards de evidência** — `BlocoEvidencia` novo, 3 canais (cor+ícone+palavra) por sinal, nunca só cor.
   - **#6 gráfico** — já estava pronto de sessão anterior (2026-08-07); conferido contra os 7 itens de `DESIGN.md` §3.7, sem gap. Nenhum código novo.
   - **#7 estado "dados insuficientes"** — não existia; construído (`MINIMO_SEMANAS_PARECER = 3`), verificado com usuário QA descartável (criado, testado, deletado na mesma sessão).
   - **#8 gate final** — contraste medido ao vivo no navegador (fórmula do §3.2, método aferido contra os canônicos WCAG antes de medir): todos os elementos novos entre 4.95:1 e 12.39:1, folgados acima do piso AA. `npm run build` de produção limpo. 104 testes, `tsc`/lint limpos.
   - **O que só o dono resolve, aberto:** olhar `/analise` no celular real (viewport de desktop engana); julgar se o veredito em `t-6` fica bom ou exagerado numa frase longa; decidir se mantém ou limpa a conta QA (`qa-lastro-parecer@example.com`, 6 semanas seedadas); decidir sobre merge de `fix/consistencia-visual-telas` — branch segue não mergeada, 20 commits à frente de `main`.

15. **Máquinas faltantes no catálogo — achado do dono, construído e verificado em 2026-08-11.** Ele notou que o catálogo (item 2, migração 0003) só tinha "Supino máquina" genérico, sem variante por ângulo, e faltavam outras máquinas reais de academia. Migração `0005_catalogo_maquinas_faltantes.sql` aplicada no banco hospedado (`supabase db push`, confirmado por `migration list` e contagem 87→95): Supino reto/inclinado/declinado máquina (peito), Cadeira adutora (glúteo), Elevação lateral máquina (ombro), Rosca máquina (bíceps), Tríceps máquina (tríceps), Extensora lombar máquina (costas) — nomes conferidos contra linhas reais de equipamento (Movement, Righetto), não inventados. `dica_execucao` NULL em todas (FF7/ADR-007, mesmo escopo da 0003). `tsc`/`test` (104 passando)/`lint`/`build` verdes. **Verificado ponta a ponta:** usuário QA efêmero (`qa-lastro-catalogo@example.com`) logado via UI real, `/catalogo` mostra "95 de 95 exercícios", as 8 máquinas novas aparecem no grupo certo, acentuação correta, sem quebra de layout — conferido pelo texto renderizado da página real (screenshot automático falhou de novo, mesma limitação já registrada; não é mudança visual/de design, é conteúdo de catálogo já existente, então o gate de olho real não se aplica). Usuário QA removido ao final, cascade confirmado = 0. PR aberto e mergeado na `main` no modo automático combinado com o dono (ele saiu para treinar). **Segue pendente, fora de escopo desta tarefa:** as dicas de execução dessas 8 (e das outras 87) continuam por escrever — item 2 acima.

   **↳ 2026-08-11 (2) — segunda leva, pedido explícito do dono (treina com maquinário Hammer Strength e Life Fitness).** Pesquisado o catálogo real das duas marcas (linha plate-loaded Hammer Strength; séries selectorized Insignia/Signature/Axiom da Life Fitness, via web search + fetch das páginas oficiais) e cruzado contra os 95 exercícios já cadastrados para achar gaps reais, sem repetir o que já existia em versão cabo/halter/barra. Migração `0006_catalogo_maquinas_hammer_lifefitness.sql` aplicada no banco hospedado (95→102): Puxador articulado máquina e Remada máquina peito-apoiado (costas), Encolhimento máquina (ombro), Leg press horizontal e Agachamento com cinto/belt squat (quadríceps), Cadeira de glúteo/hip thrust máquina (glúteo), Rotação de tronco máquina (abdômen). `dica_execucao` NULL em todas, mesmo escopo das anteriores. `tsc`/`test` (104 passando)/`lint`/`build` verdes. **Verificado ponta a ponta:** usuário QA efêmero (`qa-lastro-catalogo2@example.com`, criado e removido na mesma sessão) logado via UI real, `/catalogo` mostra "102 de 102 exercícios", os 7 novos no grupo certo. PR aberto e mergeado na `main`, mesmo modo automático.

17. **Ajustes na pílula: perfil (com upload de foto), Coach e Sair consolidados — construído e verificado em 2026-08-12, fecha o item 13 acima.** Pedido do dono: o item "Coach" da pílula virou "Ajustes" (engrenagem); Coach, edição de perfil e "Sair" — antes espalhados ou inexistentes — passaram a viver todos dentro de `/ajustes`, sem repetição em outro lugar (Sair saiu da Início, onde era o único lugar que existia).
    Processo completo: brainstorm (`AskUserQuestion` pra fechar rótulo "Ajustes"/"Config"/"Perfil" → dono escolheu "Ajustes"; estrutura da tela de Ajustes → "lista de opções", recomendado; escopo do perfil → "já com upload", recomendado) → spec (`docs/superpowers/specs/2026-08-12-ajustes-nav-perfil-design.md`) → plano (`docs/superpowers/plans/2026-08-12-ajustes-nav-perfil.md`, 10 tasks) → execução via `subagent-driven-development` (implementador + spec-reviewer + code-quality-reviewer por task, todas rodando em pt-BR).
    **Achado real que mudou a arquitetura do plano, descoberto só ao rodar `npm run build` de verdade (não pego por `tsc`/testes/os dois primeiros reviews):** a premissa do plano — `"use server"` **inline** dentro do corpo de `atualizarAvatarManual`, deixando o resto de `perfil.ts` (`obterPerfil`, `sincronizarAvatarGoogle`, que usam `next/headers`/`next/cache`) fora do bundle do cliente — está **errada** para o Turbopack deste Next.js 16.3.0. Um Client Component que importa qualquer coisa de um arquivo arrasta os imports de TOPO desse arquivo inteiro pro bundle do cliente, mesmo que só uma função tenha a diretiva. `npm run build` falhou com `Error: You're importing a module that depends on "next/headers"`. Corrigido movendo `atualizarAvatarManual` pra um arquivo próprio, `src/lib/dados/atualizar-avatar.ts`, com `"use server"` no **topo do arquivo inteiro** — o mesmo padrão que `src/lib/dados/treino.ts`/`auth.ts` já usavam, sem eu ter percebido a regra por trás na hora de escrever o plano. Lição pra próxima vez: Server Action chamada por Client Component **sempre** em arquivo dedicado, nunca dividindo arquivo com função server-only comum, independente de a diretiva parecer "isolada" por estar inline.
    **Bug real pego no code-quality-review (2ª rodada), antes de existir usuário real testando:** `caminho = ${user.id}/avatar.${extensao}` é determinístico por formato — com `upsert:true`, trocar de foto duas vezes seguidas no mesmo formato (ex.: dois JPEGs) gerava a mesma `publicUrl`, e nem o banco nem o cache do navegador percebiam a mudança na segunda troca. Corrigido com cache-buster (`?v=${Date.now()}`) persistido na própria `avatar_url`. Também foi nessa rodada que se acrescentou `revalidatePath("/", "layout")` (padrão já usado em `criarTreino`), pra garantir que o avatar novo apareça em toda tela sem depender só do estado local do componente.
    **Verificado ponta a ponta no navegador real** (usuário QA efêmero `qa-lastro-ajustes@example.com`, extensão Chrome — o painel interno de novo não compositou frame nenhum, mesma limitação já registrada; o método que funciona continua sendo extensão + upload de arquivo real via `file_upload`, não clique em seletor nativo): pílula mostra "Ajustes" com engrenagem, rótulo sem quebra de linha; `/ajustes` mostra card do perfil + linha Coach + botão Sair; `/perfil` mostra avatar + botão "Trocar foto"; upload de uma foto JPEG real trocou o avatar na tela **sem reload** e sem apertar F5; conferido no Postgres que `usuario.avatar_url` gravou com o cache-buster; navegação pra Início mostrou o avatar novo (confirma o `revalidatePath`) e confirmou que **não há mais botão Sair na Início**; `/coach` abre normal a partir do link dentro de Ajustes, com "Ajustes" continuando em destaque na pílula; "Sair" encerrou a sessão de verdade e redirecionou pra `/login`. Usuário QA removido ao final, cascade confirmado = 0.
    `tsc`/`test` (108 passando, 4 novos de `validarArquivoAvatar`)/`lint`/`build` verdes, rodados do zero (`rm -rf .next`) antes do PR.
    **Mergeado na `main`** ([PR #26](https://github.com/GuilhermeSaldanha02/lastro/pull/26)), branch `feat/ajustes-nav-perfil` apagada. **Confirmado pelo dono no aparelho real, mesmo dia:** "tudo está rodando corretamente".

---

## Abordagens que falharam

*(vazio — registrar aqui assim que algo não funcionar, com o motivo)*
