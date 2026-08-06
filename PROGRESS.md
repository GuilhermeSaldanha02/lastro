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

## Fase 2 — Registro que sobrevive à academia · 🔶 Em andamento (2026-08-05)

| # | Tarefa | Modo | Estado | Check executável |
|---|---|---|---|---|
| 2.1 | Auth: Google OAuth + e-mail | [HITL] | ✅ Provedor Google configurado e conectado (Cloud Console + Supabase); falta só o teste de login real do dono no celular/PC | Login no celular e no PC, mesmo treino nos dois (A8) |
| 2.2 | IndexedDB (Dexie) + fila outbox | [HITL] | ✅ Verificado fim a fim | Registro grava local e a UI confirma sem esperar rede (D6) |
| 2.3 | Service worker + sincronização | [HITL] | 🔶 Background Sync implementado e verificado com rede bloqueada no navegador; falta o teste em celular real (modo avião de verdade) | **FF6/A1:** celular real em modo avião, 3 séries, reativar rede, conferir no PC |
| 2.4 | PWA instalável | [AFK] | 🔶 Manifest + SW mínimo verificados no navegador; falta instalar num celular real | Instalar na tela inicial do celular real e abrir em tela cheia |
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
   - **Não verificado com login real** (exige o dono, mesma restrição de sempre) — mas agora, se falhar de novo, os logs do servidor e a tela vão dizer o motivo exato, em vez de eu ter que adivinhar.

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

## Fase 3 — Registro e gráficos · ⬜ Não iniciada
Histórico de treinos · e1RM e volume por exercício no tempo · volume semanal por grupo muscular. Gate visual em celular real com contraste AA **medido** (D8, A10).

## Fase 4 — Catálogo curado · ⬜ Não iniciada
~100 exercícios em PT-BR real, com dicas de execução **escritas e revisadas** (FF7, A9) e aviso de que não substituem profissional. Trabalho de redação, não import de API.

## Fase 5 — Coach 24h · ⬜ Não iniciada
Chat de dúvidas pelo mesmo proxy server-side. **Não improvisa técnica de movimento** (ADR-007).

## Fase 6 — Integração final · ⬜ Não iniciada
Review integral do Inspetor · todas as fitness functions · E2E das 3 jornadas · gate visual completo.

---

## Abordagens que falharam

*(vazio — registrar aqui assim que algo não funcionar, com o motivo)*
