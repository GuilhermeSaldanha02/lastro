# Backlog canônico — auditoria em curso

> Fonte única para o trabalho posterior à auditoria de 2026-09-16. Itens só
> entram com fonte ou evidência nomeada; `REPROVOU` não significa que ainda
> ocorre na `main`, e sim que exige reteste antes de encerrar.

## Estado da auditoria

- Base: `main` em `bd10edd` (atualizado 2026-09-25).
- QA-01 (reexecução do QA.md) rodou treino, leitura pura, e2e no CI e
  offline: 68 → 56 obsoletos. Detalhe completo em `QA.md`.
- Regra de execução: E2E somente manual em marco de integração; testes
  rápidos continuam em toda PR.

## Ranqueamento de esforço (2026-09-25)

`Esforço` estima gasto de token/tempo do agente, não dificuldade técnica.
`BAIXO` = uma sessão curta ou uma PR pequena. `MÉDIO` = uma sessão longa ou
subagente dedicado. `ALTO` = múltiplas sessões, dado novo em volume, ou
depende de infraestrutura que não existe ainda (2ª conta, cota de IA).

| ID | Esforço | Importância | Por quê |
|---|---|---|---|
| A1 (dica de exercício sem tradução) | MÉDIO | Média | ~436 traduções (218 exercícios × 2 idiomas) + migração nova + wiring; sem chamar IA em produção (tradução feita pelo próprio agente, uma vez). |
| CT-02, VS-06, VS-07 | — | — | **Resolvidos** no QA-01 de 24–25/set: já corrigidos antes desta sessão, ou graduados pelo e2e real (run 36078171673). |
| AJ-03, AJ-04 | — | — | **Resolvidos**: graduados pelo e2e real (`j11-formularios.spec.ts`), run 36078171673. |
| AN-02, AN-05, AN-06 | — | — | **Resolvidos**: graduados pelo e2e real (`j12-isolamento-e-apis.spec.ts`), run 36078171673. |
| AN-03, AN-04 | MÉDIO | Baixa | Só reproduz gastando cota real de IA (Gemini) da conta do dono — aguarda autorização explícita por execução, não é "sim" permanente. |
| CT-01 (preview 3D do catálogo) | ALTO, se um dia entrar | Baixa | **Decidido 2026-09-25: não é regressão, é feature nunca implementada** — documentado no `QA.md`. `ilustracao-anatomica-3d.tsx` (25 KB) segue órfão, nunca conectado a nenhuma tela. Ligar esse componente algum dia continua ALTO esforço (código não testado, precisa de QA visual completo) — entra no backlog só se o dono pedir; até lá, sem ação. |
| PF-01 | — | — | **Resolvido**: não era bug, era descrição errada do item (idioma sempre foi em `/ajustes`, nunca em `/perfil`). |
| PE-01…PE-09 (personal) | MÉDIO | Média | O dono vai criar uma 2ª conta por fora e testar; quando estiver pronta, o agente audita as telas de personal com ela — sem custo de token até lá. |
| OF-04, OF-06 | MÉDIO | Baixa | Exigem alternar 2 contas (login/logout) na mesma sessão de navegador — mesma trava do PE-*, resolve junto quando a 2ª conta existir. |
| LG-06, LG-07, LG-08, LG-05 (triste) | MÉDIO | Baixa | Mesma trava de 2ª conta (modo personal). |
| UX-01 | — | — | **Já resolvido** pelo TR-12 (PR #269, casca fixa em `/treino/[id]`) — este backlog não tinha sido atualizado. |
| UX-02 (histórico cronológico) | ALTO | Média | Redesenho de tela existente (`/treino`), precisa de estados vazio/filtro e não pode inventar métrica — não iniciado. |
| UX-03 (auditoria visual completa) | ALTO | Média | Todas as rotas × rolagem/hierarquia/toque — não iniciado, é o tipo de trabalho que mais consome token (muitas telas, muitos viewports). |
| QA-02 (matriz aluno/personal) | MÉDIO | Baixa | Depende de UX-02 estar pronto e da 2ª conta para a parte personal. |
| DOC-01 (arquivar backlogs antigos) | BAIXO | Baixa | Mover 6 arquivos de agosto (`BACKLOG-PROXIMA-FASE.md`, `BACKLOG-REDESENHO.md`, `BACKLOG-TESTE-APARELHO.md`, `ESTUDO-*.md`, `IMPECCABLE-AUDIT.md`, `AUDITORIA-APEX-PRO.md`) para uma pasta de histórico. |
| DOC-02 (política de testes) | BAIXO | Baixa | É decisão a registrar, não código. |
| DOC-03 (reconciliar DESIGN.md) | MÉDIO | Baixa | Só depois da UX-03. |
| "descanso_real_segundos" (migration) | BAIXO | Baixa | Fio solto do PROGRESS.md — não aparece em nenhum spec nem no QA.md; provavelmente obsoleto, precisa só de 10 min pra confirmar e fechar ou reabrir como item de verdade. |

## P1 — bugs a revalidar (restantes)

Tudo que estava aqui em 16/set já foi resolvido pelo QA-01 (ver `QA.md` e
`PROGRESS.md`), exceto os listados no ranqueamento acima (A1, CT-01,
AN-03/AN-04, os itens que exigem 2ª conta).

## P1 — melhorias aprovadas pelo dono

| ID | Categoria | Decisão | Próximo passo |
|---|---|---|---|
| UX-02 | Tela existente | Histórico de `/treino`: separar treino de hoje e transformar cartões repetidos em linha cronológica mensal com data, grupos, volume e séries — sem inventar métricas. | Implementar após UX-01 (já resolvido), com estados vazio e filtro. |
| QA-02 | Cobertura | Aluno testa treino livre e treino iniciado por modelo configurado em Ajustes; personal testa modo trabalho e alternância de modo. | Criar matriz Playwright normal/triste, parte personal depende da 2ª conta. |
| UX-03 | Auditoria visual | Revisar todas as rotas quanto a rolagem, hierarquia, alvos de toque, conteúdo escondido pela navegação e fluidez. | Registrar achados por rota e viewport. |

## P2 — documentação e processo

| ID | Categoria | Achado | Próximo passo |
|---|---|---|---|
| DOC-01 | Documentação | Backlogs e relatórios antigos (agosto, pré-redesenho "uma conta dois modos" de 12/set) divergem de `main` e do QA. | Arquivar fontes antigas e manter este arquivo como entrada única. |
| DOC-02 | Processo | `AGENTS.md` tem conflito entre bateria completa por commit e uso proporcional de testes. | Decidir e documentar política. |
| DOC-03 | Design | `DESIGN.md` traz decisões concluídas, pendências e medições antigas no mesmo fluxo. | Reconciliar somente depois da UX-03. |
