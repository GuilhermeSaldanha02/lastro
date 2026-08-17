# CLAUDE.md — `lastro`

App pessoal de treino. Registra cada série executada e, semanalmente, entrega um **parecer em português sobre o que aqueles números significam**, via Gemini sobre métricas já calculadas.

**A tese:** o log e o gráfico são infraestrutura. O produto é a leitura. Detalhe em `PRD.md`.

Responda sempre em **pt-BR** e instrua todo subagente a responder em pt-BR — a preferência não é herdada.

---

## Onde está cada coisa

| Preciso de… | Leia |
|---|---|
| O que o produto é, escopo, escopo negativo, critérios de aceitação | `PRD.md` (congelado — mudança = Scope Change) |
| Por que a stack é essa, fitness functions, metodologia | `ADR.md` |
| Como o sistema está montado agora | `ARCHITECTURE.md` |
| O que fazer agora, em que ordem | `PROGRESS.md` |
| Glossário do domínio, pesquisa, achados técnicos | `KNOWLEDGE.md` (carregue **por seção**) |
| Histórico de decisões | `DECISIONS.md` |
| Cores, espaçamento, tipografia, restrições de UI | `DESIGN.md` (fonte única) |
| Spec técnica da Fase 1 (a fatia vertical da peça-assinatura) | `SDD.md` |

---

## As quatro regras que este projeto não perdoa

1. **A chave da Gemini nunca toca o cliente.** Toda chamada passa por route handler. (ADR-002, FF1, FF2)
2. **O agregador calcula; o LLM interpreta.** O modelo nunca recebe linhas cruas de série — só um resumo já calculado. Se ele fizer conta, ele erra a conta. (ADR-003, FF3)
3. **Aquecimento nunca entra em métrica.** Volume, e1RM e frequência contam apenas séries valendo. (FF4)
4. **Dica de execução de exercício é curada, nunca gerada.** É assunto de saúde. (ADR-007, FF7)

---

## Vocabulário (linguagem ubíqua — sem sinônimo)

`série` · `série valendo` vs `aquecimento` · `peso` · `volume` · `e1RM` · `RIR` · `série difícil`.

**Definições e limiares vivem só em `KNOWLEDGE.md` §1** — não reproduza nenhum valor aqui (P7: fonte única por dado). Nomes de tabela, campo e função usam **exatamente** estes termos.

---

## Stack

Next.js (App Router) na Vercel · Supabase (Auth + Postgres + RLS) · Dexie/IndexedDB + service worker hand-rolled para offline · Recharts (ainda não usado — gráfico não construído) · `@google/genai` server-side · Vitest.

Alternativas descartadas e o motivo de cada uma: `ADR-004`. **Não rediscutir sem passar por lá.** Onde a stack real diverge do que o ADR decidiu (Serwist, Playwright — nenhum dos dois foi adotado): `DECISIONS.md` 2026-08-06, "Stack real diverge do ADR-004".

---

## Comandos

```bash
npm run dev     # dev server (porta padrão do Next)
npm run build   # build de produção
npm run start   # roda o build
npm run lint    # eslint
npm run test    # vitest run — 66 testes
```

Verificação completa antes de commit: `npx tsc --noEmit && npm run test && npm run lint && npm run build`.

---

## Padrões

Conduta permanente vive em `.claude/skills/padrao-*` e é acionada automaticamente.
Skills externas: ver `skills/INDEX.md`.

---

## Equipe de agentes

Definida em `.claude/agents/` — 1 arquivo por papel, com `model` e `tools` explícitos. `model` explícito em **todo** spawn; nunca herdar o default.

| Papel | Aciona quando |
|---|---|
| `analista-produto` | escopo, PRD, glossário, particionar e fundir trabalho |
| `arquiteto` | SDD, ADR, decisão estrutural, definir o check executável |
| `engenheiro` | implementar item do SDD, componente, correção localizada |
| `diretor-arte` | decisão visual, peça-assinatura, tokens, motion, gate visual |
| `inspetor-qa` | review de risco sutil, integração final, antes de merge |
| `qa-treino` | dogfooding de UX antes de release — simula persona real de treino, ponta a ponta |

**Especialista novo, registrado (2026-08-05):** `qa-treino` — a equipe base revisa código e schema, mas nenhum papel simula um usuário real interagindo com a peça-assinatura para avaliar se o parecer *convence*, não só se está tecnicamente correto. Rodar 3-5 instâncias em paralelo, cada uma com persona distinta.

---

## Git

Nunca commitar na `main`. Branch `feat/`, `fix/`, `chore/`. Conventional Commits em pt-BR: `<type>: <Descrição imperativa com inicial maiúscula>`, sem ponto final, ≤ 72 chars.
Windows, restaurar binário: `git checkout SHA -- caminho` — nunca `git show > arquivo` (CRLF corrompe).

---

## Verificação

Relatório de agente **não é prova**. Antes de mover para Concluído: rodar o comando e ler a saída; mudança visual → **abrir no navegador real e olhar**, em viewport mobile, com contraste AA **medido**; anotar a evidência em `PROGRESS.md`.

Verificação visual das minhas próprias mudanças de código é do controller — medição de DOM não substitui olho. **Exceção, decidida em `DECISIONS.md` 2026-08-17:** numa auditoria QA independente de quem implementou (protocolo de 5 fases — test-plan → implementação → subagente isolado com Playwright/navegador real, sem editar código → correção → PR), o subagente dirige o navegador e prova cada item com print + console cru + rede crua anexados. Não é relatório sem prova — é prova crua colada, só que coletada por outro agente, de propósito.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
