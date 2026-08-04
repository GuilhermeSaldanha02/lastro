# PROGRESS.md — `lastro`

> **Estado de trabalho.** Atualizar é a **ação final obrigatória de toda tarefa**. Registra também abordagens que falharam e por quê.
> Passou de ~300 linhas → arquivar concluídos em `PROGRESS-archive.md`.
>
> `[AFK]` = pode rodar sem o dono · `[HITL]` = exige o dono no loop (toca a peça-assinatura, muda contrato de módulo, cruza módulos, ou tem gate visual)

---

## Ordem das fases — e por que esta ordem

A **Fase 1 é a peça-assinatura**, como fatia vertical feia mas completa. Antes de qualquer polimento, antes do offline, antes do catálogo, antes do coach. Se a Análise não convencer o dono com dados reais dele, o projeto muda de rumo — e é infinitamente mais barato descobrir isso agora do que depois de três semanas de UI bonita.

---

## Fase 0 — Bootstrap · **EM ANDAMENTO**

| # | Tarefa | Modo | Estado | Check executável | Evidência |
|---|---|---|---|---|---|
| 0.1 | Entrevista + grill de domínio | [HITL] | ✅ Concluído | Glossário em `KNOWLEDGE.md` §1 com série, aquecimento e peso definidos | 3 termos travados; commit `22c8d9b` |
| 0.2 | `PRD.md` + portão de aprovação | [HITL] | ✅ Concluído | Dono aprova explicitamente | Aprovado em 2026-08-04; PRD congelado |
| 0.3 | `ADR.md` + fitness functions + `ARCHITECTURE.md` + `DECISIONS.md` | [AFK] | ✅ Concluído | 8 ADRs, 7 fitness functions, cada camada da stack com alternativa descartada | ADR-001..008; FF1..FF7 |
| 0.4 | `DESIGN.md` semeado | [AFK] | ✅ Concluído | Restrições funcionais decididas; identidade em aberto com gate declarado | D1..D9 |
| 0.5 | `CLAUDE.md` < 200 linhas | [AFK] | ⬜ Pendente | `wc -l CLAUDE.md` < 200 e nenhum valor duplicado de outro doc | |
| 0.6 | Instalar `.claude/agents/` (5 papéis) | [AFK] | ⬜ Pendente | 5 arquivos com `description`, `model` e `tools` explícitos | |
| 0.7 | Instalar `.claude/skills/padrao-*` (7 skills) | [AFK] | ⬜ Pendente | 7 pastas com `SKILL.md` de frontmatter válido | |
| 0.8 | Instalar hooks em `.claude/settings.json` | [HITL] | ⬜ Pendente | **Pipe-testar antes de gravar**; JSON validado. `jq` não existe por padrão no Windows | |
| 0.9 | PR da fase de bootstrap | [AFK] | ⬜ Pendente | `gh pr view` mostra o PR aberto | |

---

## Fase 1 — PEÇA-ASSINATURA: a Análise, de ponta a ponta · ⬜ Não iniciada

*Feio é permitido. Incompleto não é. O objetivo é o dono ler um parecer sobre os treinos reais dele.*

| # | Tarefa | Modo | Check executável |
|---|---|---|---|
| 1.1 | Projeto Next.js + Supabase + schema de `exercicio`/`treino`/`serie` com **todos** os campos do glossário | [HITL] | `npm run build` limpo; RLS ativa em toda tabela de usuário (FF5) |
| 1.2 | Tela mínima de registro de série (sem offline, sem polimento) | [AFK] | Registrar 5 séries reais e vê-las no Postgres |
| 1.3 | **Agregador de métricas — TDD estrito** | [HITL] | Testes antes do código. Volume, e1RM, séries difíceis, frequência com valores conferidos à mão. **FF4:** fixture com aquecimento não altera nenhuma métrica. **FF3:** sem import de rede |
| 1.4 | Route handler da Gemini — recebe **só o resumo**, nunca séries cruas | [HITL] | **FF1 e FF2:** SDK ausente do cliente, chave ausente do bundle de produção |
| 1.5 | Botão Análise + as 5 perguntas + exibição do parecer | [HITL] | 3 pareceres gerados sobre dados reais. **Critério A6:** cada um cita ao menos um exercício e um número do dono. Parecer que serviria pra qualquer pessoa = falha |
| 1.6 | **Portão do dono na peça-assinatura** | [HITL] | O dono lê os 3 pareceres e diz se convence. Reprovou → replanejar antes de seguir |

**Pesquisa que bloqueia 1.3 e 1.5:**

| # | Tarefa | Modo | Check executável |
|---|---|---|---|
| 1.0a | Faixa de referência de séries semanais por grupo muscular, com **fonte primária** | [AFK] | Registro em `KNOWLEDGE.md` com link e citação. **Proibido número de memória** — assunto de saúde |
| 1.0b | Definir `N` semanas que caracterizam estagnação, com fundamento | [AFK] | Registro em `KNOWLEDGE.md` com justificativa |
| 1.0c | Ler a quota real da Gemini no console do AI Studio | [HITL] | Valor **medido**, com data, em `KNOWLEDGE.md` §3.2 |

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
