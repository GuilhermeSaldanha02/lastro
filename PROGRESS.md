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
| 1.2 | Tela mínima de registro de série (sem offline, sem polimento) | [AFK] | ⬜ Pendente | Registrar 5 séries reais e vê-las no Postgres | Depende de 1.1 (schema) — **já pronta para começar** |
| 1.3 | **Agregador de métricas — TDD estrito** | [HITL] | ✅ Concluído | Testes antes do código. Volume, e1RM, séries difíceis, frequência com valores conferidos à mão. **FF4:** fixture com aquecimento não altera nenhuma métrica. **FF3:** sem import de rede | **Verificado por execução real, não por relato do agente:** `npx vitest run` → 8 arquivos, **49/49 testes passando** (saída colada, não resumida). `grep` FF3 → 0. `grep new Date()` (C4) → 0. `npm run build` → limpo. Interpretação do engenheiro registrada em `DECISIONS.md`: semana fecha na segunda — é a única leitura que bate os 30 valores do SDD §4.5 sem editar fixture, mas ainda depende de você confirmar na 1.0d |
| 1.4 | Route handler da Gemini — recebe **só o resumo**, nunca séries cruas | [HITL] | ⬜ Pendente | **FF1 e FF2:** SDK ausente do cliente, chave ausente do bundle de produção | Depende de 1.1 (ler séries do Supabase) |
| 1.5 | Botão Análise + as 5 perguntas + exibição do parecer | [HITL] | ⬜ Pendente | 3 pareceres gerados sobre dados reais. **Critério A6:** cada um cita ao menos um exercício e um número do dono. Parecer que serviria pra qualquer pessoa = falha | |
| 1.6 | **Portão do dono na peça-assinatura** | [HITL] | ⬜ Pendente | O dono lê os 3 pareceres e diz se convence. Reprovou → replanejar antes de seguir | |

**Pesquisa que bloqueia 1.3 e 1.5:**

| # | Tarefa | Modo | Check executável |
|---|---|---|---|
| 1.0a | ✅ Faixa de referência de volume por grupo muscular | [AFK] | **Concluído.** `KNOWLEDGE.md` §3.6: 10–20 séries/semana. Fontes verificadas direto no PubMed pelo controller, não só relatadas pelo subagente. Correção sobre o relato: no Schoenfeld 2017 a quebra por categorias foi **tendência (p=0,074), não significância** |
| 1.0b | ✅ Critério de estagnação | [AFK] | **Concluído.** `KNOWLEDGE.md` §3.7: **não há fonte primária.** 3–4 semanas é convenção de mercado, e a UI tem de dizer isso — emprestar autoridade científica a número que a literatura não sustenta é o E3 que o projeto se proibiu |
| 1.0c | Ler a quota real da Gemini no console do AI Studio | [HITL] | Valor **medido**, com data, em `KNOWLEDGE.md` §3.2. **Bloqueia a premissa do ADR-001** |
| 1.0d | Definir a regra de liberação semanal do botão Análise | [HITL] | Decisão do dono registrada no PRD §3. A tarefa 1.5 não fecha sem isto — sem a regra, vira improviso na hora |

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

---

## Fase 2 — Registro que sobrevive à academia · ⬜ Não iniciada

| # | Tarefa | Modo | Check executável |
|---|---|---|---|
| 2.1 | Auth: Google OAuth + e-mail | [HITL] | Login no celular e no PC, mesmo treino nos dois (A8). **Depende do dono configurar a tela de consentimento OAuth** |
| 2.2 | IndexedDB (Dexie) + fila outbox | [HITL] | Registro grava local e a UI confirma sem esperar rede (D6) |
| 2.3 | Service worker + sincronização | [HITL] | **FF6/A1:** celular real em modo avião, 3 séries, reativar rede, conferir no PC |
| 2.4 | PWA instalável | [AFK] | Instalar na tela inicial do celular real e abrir em tela cheia |
| 2.5 | "Repetir última série" em um toque | [AFK] | D3: um toque, medido no aparelho real |

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
