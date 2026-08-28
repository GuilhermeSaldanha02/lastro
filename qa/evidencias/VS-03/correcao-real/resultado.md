# Correção real aplicada — 2026-08-28, após auditoria independente

A correção anterior (`qa/evidencias/VS-03/correcao.md`) resolveu o sintoma
mas não a causa raiz — a auditoria independente (`qa/evidencias/VS-03/auditoria-independente/resultado.md`)
achou o bug de verdade e REPROVOU o item.

## Causa raiz (achada pelo Inspetor QA independente)

`src/components/timer-topo.tsx` linha ~147: o `ResizeObserver` publicava
`entrada.contentRect.height` — **content-box**, sem o padding vertical
(~16-17px) do `.timer-topo-container`. A medição INICIAL
(`getBoundingClientRect`, border-box) estava certa; só a atualização via
observer é que divergia. Resultado: `--lastro-timer-topo-altura` ficava
sistematicamente ~17px curta depois da primeira medição, em AMBOS os
estados do timer (parado: media 48px, real 65px; ativo: media 108px,
real 124.7px).

## O que mudou

Trocado `entrada.contentRect.height` por
`entrada.target.getBoundingClientRect().height` — mesma fonte (border-box)
usada na medição inicial, os dois nunca mais divergem.

## Prova

**Reprodução ao vivo, exatamente o cenário que a auditoria reprovou**
(viewport 390×500, descanso ativo forçado antes de abrir o seletor de
grupo):

- Medi `--lastro-timer-topo-altura` contra `getBoundingClientRect().height`
  real do container nos dois estados:
  - Parado: `65px` (var) = `65px` (real) — exato.
  - Descanso ativo: `125px` (var) = `125px` (real) — exato (antes: 108
    vs 124.7, ~17px de erro).
- Cliquei no checkbox "Peito" do seletor de grupo muscular com o
  descanso ativo no auge da altura — **sem erro de timeout, sem
  interceptação** (antes, essa exata sequência falhava com
  `<header>`/`<div class="timer-topo-container">` intercepting pointer
  events).

**Suite completa:** `npx tsc --noEmit` limpo, 238/238 testes, `npm run
lint` 0 erros, `npm run build` sem falhas.

## Status

Marcado `ALEGADO` de novo em `QA.md` — quem corrigiu desta vez (eu) não
pode se autoauditar (`AGENTS.md` §5). Precisa de mais uma passada
independente antes de virar `PASSOU`.
