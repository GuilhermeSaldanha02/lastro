# Matriz de linguagem

Esta matriz inventaria os caminhos normal e triste nas três línguas do app e registra se a informação explicativa aparece por `DicaInfo`.

## Estados permitidos

- `PENDENTE`: ainda não auditado.
- `PLANEJADO`: a cobertura foi desenhada, mas ainda não entrou num spec.
- `AUTOMATIZADO`: o cenário está no spec e foi listado localmente; aguarda a execução real do CI.
- `ALEGADO`: o implementador executou e anexou evidência; ainda aguarda auditoria independente.
- `PASSOU`: outro agente auditou em contexto limpo e confirmou a evidência.
- `REPROVOU`: a auditoria encontrou divergência; o caminho volta para correção e nova verificação.

O implementador só pode marcar um caminho como `ALEGADO` quando houver evidência. Apenas outro agente pode promover `ALEGADO` para `PASSOU`.

| ID | Modo | Superfície | Normal pt | Normal es | Normal en | Triste pt | Triste es | Triste en | DicaInfo | Check |
|---|---|---|---|---|---|---|---|---|---|---|
| LG-01 | aluno | `/` | AUTOMATIZADO | AUTOMATIZADO | AUTOMATIZADO | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j4 |
| LG-02 | aluno | `/treino` | PENDENTE | PENDENTE | PENDENTE | AUTOMATIZADO | AUTOMATIZADO | AUTOMATIZADO | AUDITAR | j4/j10 |
| LG-03 | aluno | `/treino/[id]` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j4/j10 |
| LG-04 | ambos | `/catalogo` e `/catalogo/[id]` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j4/j11/j12 |
| LG-05 | personal | `/personal` | AUTOMATIZADO | AUTOMATIZADO | AUTOMATIZADO | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j7/j8 |
| LG-06 | personal | `/personal/alunos` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j8 |
| LG-07 | personal | `/personal/completar` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j8/j11 |
| LG-08 | ambos | `/ajustes/personal` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j8/j11 |
| LG-09 | aluno | `/analise` e `/coach` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j6/j12 |
| LG-10 | ambos | ajustes, perfil, relatórios e temas | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j4/j11 |
| LG-11 | público | login, boas-vindas e 404 | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j9/j13 |

## Cobertura automatizada pendente de CI

Os cenários abaixo foram apenas listados localmente com `npx playwright test --list`.
Eles não receberam execução local porque o E2E usa o banco de produção; o estado
`AUTOMATIZADO` só afirma que o CI deve executá-los, não que já passaram.

| Spec | Cenário determinístico | Estado |
|---|---|---|
| `j4` | Home vazia, ação inicial e catálogo em pt-BR, inglês e espanhol | AUTOMATIZADO |
| `j5` | Troca de idioma pela UI preserva contraste AA renderizado | AUTOMATIZADO |
| `j8` | Título e navegação da fila do personal nos três idiomas | AUTOMATIZADO |
| `j10` | Offline ao iniciar treino exibe o erro localizado nos três idiomas | AUTOMATIZADO |
| `j11` | Meta inválida mantém ação e erro localizado nos três idiomas | AUTOMATIZADO |
| `j12` | ID inválido exibe a página 404 localizada nos três idiomas | AUTOMATIZADO |
| `j13` | Sessão expirada ao salvar meta exibe o erro localizado nos três idiomas | AUTOMATIZADO |
