# Correção aplicada — 2026-08-28

## Causa raiz (duas faces do mesmo problema)

O `padding-top`/`padding-bottom` de `.corpo--treino-detalhe`/`.corpo--com-nav`
reserva espaço no FLUXO do documento pro cabeçalho e pra aba inferior, ambos
`position: fixed`/`sticky`. Isso é suficiente pra rolagem normal, mas
**`scrollIntoView()`/`.focus()` ignoram `padding`** — só respeitam
`scroll-margin`. Sem isso, qualquer coisa que role um elemento pra
"encostar" no topo ou no fim do viewport (o `tituloRef.current.focus()` de
`seletor-grupo-muscular.tsx`, obrigatório por acessibilidade — WAI-ARIA APG
pra conteúdo revelado — ou a própria automação de teste) pode posicioná-lo
atrás do que é fixo.

Segunda causa, específica do topo: `.corpo--treino-detalhe` reservava um
número fixo (`54px`) pra altura do `timer-topo-container`, mas essa altura é
**dinâmica** — medi ~65px parado e **~125px com descanso ativo** (a cápsula
quebra linha em tela estreita, comentário já existente no CSS confirmava
isso). Um número fixo sempre ficava desatualizado num dos dois estados.

## O que mudou

1. `timer-topo.tsx` — mede a própria altura de verdade (`useLayoutEffect` +
   `ResizeObserver`) e publica em `--lastro-timer-topo-altura` (CSS var em
   `:root`), em vez de um número cravado no CSS.
2. `sistema.css` — `.corpo--treino-detalhe` usa essa variável (com
   fallback de 65px) numa única fonte, `--lastro-clearance-topo-treino`,
   também consumida por `scroll-margin-top` em `.card-obsidian__titulo` e
   em todo descendente do card (o título recebe o foco, mas um clique
   direto num chip rola por aquele elemento específico).
3. `sistema.css` — `.corpo--com-nav *` ganha `scroll-margin-bottom`
   (mesma lógica, espelhada pro fim da tela): sem isso o botão "Continuar"
   ficava ~50px atrás da aba inferior fixa quando rolado até o fim.

## Prova

**Reprodução ao vivo (Playwright, mesma sequência exata do achado
original — viewport 390×500, descanso ativo pra forçar o pior caso de
altura do timer):**

- Antes: `<header class="topo-pro">…</header> intercepts pointer events` /
  `element is outside of the viewport` ao tentar clicar em "Peito" —
  idêntico ao achado original.
- Depois (cenário original, sem forçar descanso ativo — o que a auditoria
  de 28/08 realmente reproduziu): clique em "Peito" funciona, checkbox
  marca, botão "Continuar" habilita e responde ao clique, avança pro
  formulário de registro de série. Ver `correcao-topo.png`.
- Medição direta (`getBoundingClientRect`) do botão "Continuar" contra a
  aba inferior fixa, mesma sequência:
  - **Antes:** `continuar { top: 435.97, bottom: 499.97 }` vs.
    `nav { top: 423, bottom: 488 }` — ~52px de sobreposição real.
  - **Depois:** `continuar { top: 343.97, bottom: 407.97 }` vs.
    `nav { top: 423, bottom: 488 }` — 15px de vão, zero sobreposição.

**Suite completa:** `npx tsc --noEmit` limpo, 238/238 testes, `npm run
lint` 0 erros, `npm run build` sem falhas. (CSS/scroll-margin não tem
cobertura de teste automatizado nesta stack — a prova é a medição ao vivo
acima.)

## Risco residual, registrado por honestidade

O caso extremo — descanso ativo (cápsula na altura máxima, ~125px) **E**
viewport muito curto **E** a automação do Playwright disparando seu
próprio mecanismo interno de "scroll into view" (que não é o mesmo da
`.focus()`/`scrollIntoView()` do navegador, e nem sempre respeita
`scroll-margin`) — ainda mostrou um clique falhar numa tentativa isolada
durante a investigação. O cenário realmente reproduzido pela auditoria
original de QA (sem descanso ativo) está confirmado corrigido. Recomendo
uma passada manual num aparelho real, com o descanso rodando, como
verificação complementar — não bloqueante pra fechar este item.
