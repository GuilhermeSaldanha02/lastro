---
name: padrao-agentes
description: Carregar antes de despachar qualquer subagente, decidir quanto rigor uma tarefa merece, paralelizar trabalho, ou escolher qual modelo usar. Define a cerimônia por nível de risco e as regras de orquestração.
---

# Agentes

## Cerimônia por risco — nunca cerimônia máxima em tarefa trivial

| Nível | Exemplos | Executa | Review | Modelo |
|---|---|---|---|---|
| Trivial / mecânico | config, scaffold, dado estático | Orquestrador inline ou 1 agente | Nenhuma — controller confere o diff | Haiku 4.5 / Sonnet 5 |
| Padrão | CRUD, página, componente comum | Engenheiro | Controller lê diff + olha no navegador | Sonnet 5 |
| Sutil / arriscado | agregador de métricas, sincronização offline, integração com a Gemini, auth, migração | Engenheiro | Inspetor QA + controller | Sonnet 5 + Opus 5 |
| Visual / assinatura | tela do parecer da Análise, identidade, motion | Engenheiro + Diretor de Arte | Gate visual + **olho do dono no navegador real** (final, insubstituível) | Sonnet 5 + Opus 5 |
| Integração final | projeto inteiro montado | — | Review integral do Inspetor | Opus 5 |

- **Gatilho de segurança, independente do nível:** auth, upload, pagamento, dado pessoal, endpoint público ou **segredo em jogo** → passe de segurança obrigatório antes do merge, mesmo em tarefa que parece trivial. A tabela mede complexidade; isto mede **exposição**. Neste projeto, a chave da Gemini é segredo em jogo em qualquer tarefa que toque `src/app/api/`.
- **`model` explícito em todo spawn** — nunca herdar o default.
- **Loop de correção: reutilizar o mesmo agente** (contexto intacto), não spawnar novo.
- Tarefas de subagente **curtas e fechadas**.
- **Não verificar em triplo.**
- **Diff de uma frase → pule o planejamento.**
- Inspetor em contexto limpo, só diff + critérios; reporta **apenas** gaps de corretude ou requisito declarado — **estilo não devolve tarefa**.
- **Todo spawn termina com "responda em pt-BR"** — a preferência não é herdada.

## Orquestração paralela

1. Só paralelizar unidades **independentes**. Particionar **ANTES** de despachar.
2. 3–5 agentes concorrentes é o ponto ótimo.
3. **Escopo de ferramenta por agente:** pesquisador = leitura + web, sem escrita; engenheiro = edição + terminal, sem rede. `tools:` ausente anula a separação.
4. Retorno em **formato fixo e limitado** ("arquivos alterados, decisões, pendências — máx. 15 linhas"). Nunca transcript.
5. **O orquestrador não implementa em paralelo com subagentes.**
6. Subagente protege o contexto do orquestrador. Investigação sem escopo = contexto estourado.
7. **Contexto fechado no despacho:** repo/caminho, branch, objetivo, restrições, **o que NÃO fazer**, formato de resposta com evidências.
8. Matriz por tarefa delegada: Tarefa / Especialidade / Contexto mínimo / Arquivos prováveis / Pode editar? / Critério de aceite / Verificação esperada / Dependências.
9. **Evidência contradiz o plano → parar e replanejar.** Nunca adicionar mais agentes a uma premissa errada.
10. Paralelo bom: pesquisa de alternativas, review segurança vs UX, testes durante implementação. Paralelo ruim: mesmo arquivo grande, migrations sem coordenação, refactor amplo sem owner.

## Expansão da equipe

Especialista novo (DevOps, Segurança, DBA — Opus 5) exige **justificativa de 1 linha** de por que a equipe base não basta + registro imediato no `CLAUDE.md`. Pesquisador não é base: é spawn read-only sob demanda.
