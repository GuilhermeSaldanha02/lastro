# Matriz de linguagem

Esta matriz inventaria os caminhos normal e triste nas três línguas do app e registra se a informação explicativa aparece por `DicaInfo`.

## Estados permitidos

- `PENDENTE`: ainda não auditado.
- `ALEGADO`: o implementador executou e anexou evidência; ainda aguarda auditoria independente.
- `PASSOU`: outro agente auditou em contexto limpo e confirmou a evidência.
- `REPROVOU`: a auditoria encontrou divergência; o caminho volta para correção e nova verificação.

O implementador só pode marcar um caminho como `ALEGADO` quando houver evidência. Apenas outro agente pode promover `ALEGADO` para `PASSOU`.

| ID | Modo | Superfície | Normal pt | Normal es | Normal en | Triste pt | Triste es | Triste en | DicaInfo | Check |
|---|---|---|---|---|---|---|---|---|---|---|
| LG-01 | aluno | `/` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j4 |
| LG-02 | aluno | `/treino` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j4/j10 |
| LG-03 | aluno | `/treino/[id]` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j4/j10 |
| LG-04 | ambos | `/catalogo` e `/catalogo/[id]` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j4/j11/j12 |
| LG-05 | personal | `/personal` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j7/j8 |
| LG-06 | personal | `/personal/alunos` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j8 |
| LG-07 | personal | `/personal/completar` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j8/j11 |
| LG-08 | ambos | `/ajustes/personal` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j8/j11 |
| LG-09 | aluno | `/analise` e `/coach` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j6/j12 |
| LG-10 | ambos | ajustes, perfil, relatórios e temas | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j4/j11 |
| LG-11 | público | login, boas-vindas e 404 | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j9/j13 |
