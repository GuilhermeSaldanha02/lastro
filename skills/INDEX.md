# Skills externas — índice

> Estas skills **não** vivem neste repo: ficam em repositórios externos e são lidas sob demanda via `gh`. **Skill fora do disco não dispara sozinha** — por isso este índice é injetado a cada prompt pelo hook `UserPromptSubmit`.

> **Triagem obrigatória, antes de tarefa não-trivial:** confronte a tarefa com este índice. Havendo skill que sirva, diga **qual e por quê**, e **pergunte antes de carregar**. Proibido improvisar existindo skill; proibido carregar sem perguntar.

```bash
# repo pessoal (privado — gh CLI autenticado; WebFetch retorna 404)
gh api repos/OGabrielcm/gabriel-skills/contents/skills --jq '.[].name'
gh api -H "Accept: application/vnd.github.raw" \
  repos/OGabrielcm/gabriel-skills/contents/skills/<nome>/SKILL.md

# ECC (público, ~300 skills)
gh api -H "Accept: application/vnd.github.raw" \
  repos/affaan-m/ecc/contents/skills/<nome>/SKILL.md

# Anthropic (público — atenção: o caminho aninha em skills/)
gh api -H "Accept: application/vnd.github.raw" \
  repos/anthropics/skills/contents/skills/<nome>/SKILL.md
```

| Skill | Carregue quando |
|---|---|
| `karpathy-guidelines` | Qualquer pedido de implementar, corrigir, refatorar ou revisar código |
| `git-commit` | Fechar qualquer tarefa (commit, branch, pré-commit) |
| `agentic-implementation-orchestration` | Delegar a subagentes, paralelizar, montar matriz de execução |
| `pr-review-product-engineering` | Antes de merge: gate de produto, engenharia, segurança, UX e testes |
| `playwright-e2e-workflow` | **Fase 2 e 6** — E2E das jornadas, especialmente a de rede desligada |
| `supabase-auth-rls-mvp` | **Fase 1.1 e 2.1** — Auth, `owner_id`, RLS por `auth.uid()` |
| `supabase-postgres-best-practices` | **Fase 1.1** — modelagem do schema de série/treino/exercício |
| `vercel-react-best-practices` | Performance React/Next |
| `web-design-guidelines` · `frontend-a11y` **(ECC)** | **Gate visual de toda fase** — a11y é critério do gate, não fase posterior |
| `impeccable` | **Gate do Diretor de Arte** — identidade visual, crítica, auditoria, anti-patterns |
| `impeccable-ui-operational-pass` | Polish de UI em app real |
| `solo-product-ux-review` | Revisar UX de app solo, listas, formulários |
| `adversarial-ux-dogfooding` | **Antes da Fase 6** — caçar fricção e estados quebrados |
| `eval-harness` **(ECC)** | **Fase 1.5** — o parecer da Análise é saída não-determinística; teste verde não existe |
| `product-threat-modeling` · `security-review` **(ECC)** | Gatilho de segurança: auth, chave de API, dado pessoal |
| `github-actions-secure-ci` | CI/CD com least privilege |
| `deployment-patterns` **(ECC)** | Deploy, rollback — a camada que o Stack Grill esquece |
| `rest-api-design-delivery` | Contratos HTTP dos route handlers |
| `technical-documentation-delivery` | README, runbook, changelog |
| `project-bootstrap` | Iniciar projeto novo (já usado nesta fase) |
| `agent-reach-internet-research` | **Tarefas 1.0a/1.0b** — pesquisa read-only de fonte primária |
| `canvas-design` **(Anthropic)** | Peça estática em .png/.pdf |
| `mcp-builder` **(Anthropic)** | Só se o projeto precisar expor ferramenta própria ao agente |

**Regra:** existindo skill para a tarefa, carregue antes de improvisar. Se a skill referencia outra inexistente no ambiente, aplique o princípio inline. Skill escrita para outra pessoa serve como conteúdo, mas o gatilho precisa ser reescrito antes de virar skill local.
