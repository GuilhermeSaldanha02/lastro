---
name: padrao-contexto
description: Carregar quando a sessão estiver longa, quando o mesmo erro se repetir, quando uma investigação começar a crescer sem limite, ou ao decidir se vale abrir sessão nova. Diagnostica anti-padrões de contexto e diz a correção de cada um.
---

# Contexto

| Anti-padrão | Sintoma | Correção |
|---|---|---|
| **Pia de cozinha** | Tarefa A + pergunta solta + volta pra A | Limpar contexto entre tarefas não relacionadas |
| **Corrigir em loop** | Errou → corrigiu → errou de novo | Após 2 falhas: lição no `KNOWLEDGE.md` §5 + sessão nova (E6) |
| **CLAUDE.md obeso** | Agente ignora metade das regras | Poda impiedosa; regra crítica vira hook |
| **Confiar sem verificar** | Implementação plausível sem casos de borda | Sem check executável não há Concluído |
| **Exploração infinita** | "Investigue X" sem escopo | Escopar ou delegar a subagente |
| **Covardia macro** | Redesign pedido, retoques entregues | P1 |
| **Premissa errada escalada** | Evidência contradiz o plano e mais agentes são adicionados | Parar, replanejar |
| **Doc que ninguém obedece** | Regra escrita ontem, violada hoje | Regra crítica vira hook ou gate do agente dono |

## Economia de tokens

Fases discretas e nomeadas · roteamento de modelo por risco · **docs magros lidos por inteiro > docs gordos ignorados** · subagente devolve resumo em formato fixo, nunca transcript · conhecimento ocasional vira skill, não `CLAUDE.md` · **RTK ativo para terminal** · reutilizar agente vivo em vez de spawn frio · não verificar em triplo · não planejar diff de uma frase.

## Carregamento seletivo neste projeto

`KNOWLEDGE.md` tem índice no topo e **carrega por seção**. Precisa do glossário? Leia §1. Precisa dos achados de Gemini? §3. Ler o arquivo inteiro para consultar um termo é desperdício que se paga em toda tarefa seguinte.

## Handoff

Sessão longa → o fechamento vira handoff: **`PROGRESS.md` e `KNOWLEDGE.md` atualizados PRIMEIRO, recomendação de sessão nova DEPOIS.** Ordem invertida perde exatamente o estado que o handoff existe para preservar.

Quem abre a sessão nova é o dono. Não continuar por inércia.
