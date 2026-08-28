# Auditoria independente #2 — VS-03 (2ª correção)

Auditor: sessão isolada, não escreveu a correção (`AGENTS.md` §5 —
"quem implementa não se audita"). Não editei nenhum arquivo em `src/**`.

## Correção auditada

`src/components/timer-topo.tsx` (~linhas 134-164): o `ResizeObserver`
que atualiza `--lastro-timer-topo-altura` passou a usar
`entrada.target.getBoundingClientRect().height` em vez de
`entrada.contentRect.height`, igualando à medição inicial
(`getBoundingClientRect`, border-box) já feita no `useLayoutEffect`.
Referência: `qa/evidencias/VS-03/correcao-real/resultado.md`.

## Cenário reproduzido

Chrome real via Playwright MCP, login como `qa.persona@lastro.test`,
treino de teste novo criado em `/treino/<id>`, viewport 390×500.

1. Estado PARADO (antes de clicar em "Descanso"):
   `--lastro-timer-topo-altura` = **65px**, `getBoundingClientRect().height`
   real = **65px** — bate.
2. Cliquei em "Descanso" para disparar a contagem (cápsula expande para
   +30s / Pausar / X). Estado ATIVO:
   `--lastro-timer-topo-altura` = **125px**, real =
   **124.6875px** (Math.ceil aplica arredondamento pra cima corretamente)
   — bate.
3. Com o descanso ainda contando (confirmado por leitura do relógio
   antes/depois: de ~01:30 a 00:09 ao longo do teste), abri o seletor de
   grupo muscular via "Adicionar exercício" e cliquei no chip "Peito".
   - Clique direto no `<input type="checkbox">` via referência de
     acessibilidade deu timeout com `<label class="chip">… intercepts
     pointer events` — isso é comportamento normal de Playwright quando
     o checkbox real está visualmente escondido atrás do label
     estilizado (padrão comum de chip-checkbox), **não** é o bug VS-03
     (que era `<header>`/`.timer-topo-container` sobrepondo o
     conteúdo). Cliquei no chip visível (o que um usuário real faria) e
     funcionou sem erro.
   - Resultado: checkbox "Peito" ficou `checked`, botão "Continuar"
     saiu de `disabled` para habilitado.
4. Cliquei em "Continuar" com o descanso ainda ativo — sem erro, sem
   interceptação, navegação seguiu normalmente para a etapa de
   exercício.
5. Console do navegador: 0 erros, 0 warnings durante toda a sequência.

## Medições (resumo)

| Estado | `--lastro-timer-topo-altura` | `getBoundingClientRect().height` real | Bate? |
|---|---|---|---|
| Parado | 65px | 65px | Sim |
| Descanso ativo | 125px | 124.6875px | Sim (ceil correto) |

## Veredito

**PASSOU.** A troca para `getBoundingClientRect().height` no
`ResizeObserver` eliminou a divergência de ~17px encontrada na
auditoria anterior, nos dois estados do timer. O clique no seletor de
grupo muscular ("Peito") e no botão "Continuar" funcionou normalmente
com o descanso ativo na altura máxima, no viewport mais extremo
documentado (390×500). Não regrediu o estado parado.

Evidência crua: `estado-descanso-ativo-seletor-aberto.png`,
`pos-clique-continuar.png`.
