# Backlog canônico — auditoria em curso

> Fonte única para o trabalho posterior à auditoria de 2026-09-16. Itens só
> entram com fonte ou evidência nomeada; `REPROVOU` não significa que ainda
> ocorre na `main`, e sim que exige reteste antes de encerrar.

## Estado da auditoria

- Base: `main` em `0229718`.
- Cobertura conhecida: 20 rotas, 14 specs Playwright e 61 itens de QA
  obsoletos desde as mudanças recentes.
- Regra de execução: E2E somente manual em marco de integração; testes
  rápidos continuam em toda PR.

## P0 — corrigir antes de nova entrega visual

| ID | Categoria | Achado / fonte | Próximo passo |
|---|---|---|---|
| UX-01 | Melhoria estrutural | `/treino/[id]`: ações de repetir, adicionar e finalizar participam da rolagem geral; o pedido do dono é casca fixa e somente miolo rolável. | Redesenhar o contêiner de treino e validar em viewport móvel. |
| QA-01 | QA | `QA.md`: 61 itens obsoletos, inclusive treino, offline, visual, idiomas e personal. | Reexecutar por área com conta descartável e evidência crua. |

## P1 — bugs a revalidar

| IDs | Categoria | Fonte | Próximo passo |
|---|---|---|---|
| TR-06, TR-07, TR-08, TR-09, TR-10 | Treino | `QA.md` registra rejeição/edição de série, toque duplo, peso vazio e UUID inválido como `REPROVOU`. | Cobrir no Playwright J10 com a grade atual e classificar causa real. |
| OF-04, OF-05, OF-06, OF-08 | Offline | `QA.md` registra fila entre contas, início sem rede, novo login e item rejeitado. | Executar jornada offline isolada no E2E manual. |
| AJ-03, AJ-04 | Ajustes | Modelo inválido e precisão de peso registrados como `REPROVOU`. | Validar formulário e persistência. |
| AN-02, AN-03, AN-04, AN-05, AN-06 | Análise | Concorrência, PDF, cota e UUID inválido registrados como `REPROVOU`. | Retestar sem chamar Gemini real. |
| CT-02, VS-06, VS-07 | Catálogo / visual | UUID inválido, estouro horizontal e 404 em inglês registrados como `REPROVOU`. | Varredura de rota e viewport móvel. |

## P1 — melhorias aprovadas pelo dono

| ID | Categoria | Decisão | Próximo passo |
|---|---|---|---|
| UX-02 | Tela existente | Histórico de `/treino`: separar treino de hoje e transformar cartões repetidos em linha cronológica mensal com data, grupos, volume e séries — sem inventar métricas. | Implementar após UX-01, com estados vazio e filtro. |
| QA-02 | Cobertura | Aluno testa treino livre e treino iniciado por modelo configurado em Ajustes; personal testa modo trabalho e alternância de modo. | Criar matriz Playwright normal/triste. |
| UX-03 | Auditoria visual | Revisar todas as rotas quanto a rolagem, hierarquia, alvos de toque, conteúdo escondido pela navegação e fluidez. | Registrar achados por rota e viewport. |

## P2 — documentação e processo

| ID | Categoria | Achado | Próximo passo |
|---|---|---|---|
| DOC-01 | Documentação | Backlogs e relatórios antigos divergem de `main` e do QA. | Arquivar fontes antigas e manter este arquivo como entrada única. |
| DOC-02 | Processo | `AGENTS.md` tem conflito entre bateria completa por commit e uso proporcional de testes. | Decidir e documentar política após esta auditoria. |
| DOC-03 | Design | `DESIGN.md` traz decisões concluídas, pendências e medições antigas no mesmo fluxo. | Reconciliar somente depois da auditoria visual atual. |
