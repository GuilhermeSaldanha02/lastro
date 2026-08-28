# Auditoria independente — VS-03

**Data:** 2026-08-28 · **Auditor:** Claude (sessão isolada, "Inspetor QA") · **SHA sob auditoria:** 4335059

## Veredito

**REPROVOU.** A correção tem um defeito real de medição na própria
defesa dinâmica que ela introduziu (`timer-topo.tsx:134-154`). Ele produz
overlap real e mensurável mesmo com scroll nativo do navegador (não é só
um artefato do Playwright) — pequeno no estado parado (~5px), e o
suficiente pra derrubar o clique no checkbox "Peito" no estado com
descanso ativo, exatamente o cenário que o `correcao.md` já havia
sinalizado como risco residual não resolvido.

## 1. O defeito de medição (a causa raiz)

`src/components/timer-topo.tsx`, linhas 134–154:

```ts
const containerRef = useRef<HTMLDivElement>(null);
useLayoutEffect(() => {
  const elemento = containerRef.current;
  ...
  publicarAltura(elemento.getBoundingClientRect().height); // ① border-box, correto

  const observador = new ResizeObserver(([entrada]) => {
    if (entrada) publicarAltura(entrada.contentRect.height); // ② content-box, exclui padding
  });
  observador.observe(elemento);
  ...
}, []);
```

`.timer-topo-container` tem `padding: 8px var(--lastro-e-4)`
(`sistema.css` linha 4269) — 8px topo + 8px base = 16px de padding
vertical. A medição inicial ① (`getBoundingClientRect`, border-box) está
certa. Mas o `ResizeObserver` sempre entrega uma primeira medição
síncrona assim que `.observe()` é chamado, e sua callback ② usa
`contentRect.height` — **content-box, que exclui esse padding** —
sobrescrevendo o valor certo por um valor sistematicamente menor, nos
dois estados do timer:

| Estado | Altura real (`getBoundingClientRect`) | `--lastro-timer-topo-altura` publicada | Déficit |
|---|---|---|---|
| Parado | 65px (medido: 64.7) | **48px** | ~17px |
| Descanso ativo | 124.7px | **108px** | ~17px |

O déficit bate, nos dois estados, com os ~16-17px de padding vertical do
container — não é ruído, é o padding sendo perdido na segunda medição.
Esse valor sub-dimensionado alimenta `--lastro-clearance-topo-treino`
(`sistema.css` linhas 4287–4288), que por sua vez é a fonte única tanto
do `padding-top` quanto do `scroll-margin-top` — os dois mecanismos que a
correção criou para resolver o achado original.

## 2. Overlap real com scroll nativo do navegador (não é artefato de automação)

Pra isolar o efeito do próprio auto-scroll do Playwright (que a sessão
anterior já havia sinalizado como não confiável), medi com
`Element.scrollIntoView({block:'start'})` — API nativa do navegador, que
honra `scroll-margin-top` de verdade:

- **Parado:** checkbox "Peito" ficou em `top=119.8` contra
  `.timer-topo-container` `bottom=125` → **5.2px de overlap real**.
- **Descanso ativo (caso extremo do risco residual):** checkbox "Peito"
  ficou em `top=179.8` contra `bottom=184.7` → **4.9px de overlap real**.

Ou seja: mesmo com o navegador rolando exatamente como a CSS manda, o
`scroll-margin-top` calculado é ~5px curto da faixa fixa real — em
ambos os estados. Pequeno, mas real e mensurável, e a origem é a mesma
conta: os ~17px perdidos na medição menos a folga de 12px
(`--lastro-e-3`) que a fórmula soma por cima ainda deixam o resultado
abaixo do necessário.

## 3. Sintoma corroborante: falha de clique via Playwright

Reproduzi a sequência exata do achado original (`/treino/[id]` →
"Adicionar exercício" → grupo muscular → clique em "Peito"), viewport
390×500, num treino limpo criado só para este teste (sem série, sem
histórico de sessão anterior — `insert into treino ...` com
`data='2026-08-26'`, depois removido ao final):

- **Parado:** `TimeoutError` — `<div class="timer-topo-container">…</div>
  intercepts pointer events`.
- **Descanso ativo** (disparei o timer de verdade — cápsula `+30s /
  Pausar / ✕` confirmada visível): mesmo `TimeoutError`, mesma
  assinatura. Nessa tentativa o auto-scroll do Playwright posicionou o
  checkbox com `top=156.8` contra `container.bottom=184.7` — 28px de
  overlap, cobrindo o centro do elemento (onde o clique mira). Esse
  número (28px) é maior que o overlap "real" de scroll nativo (4.9px)
  porque é o próprio mecanismo de auto-scroll do Playwright que não
  respeita `scroll-margin` com precisão, um efeito **somado** ao defeito
  real de medição, não a causa dele — a causa é a seção 1.

Screenshots: `vs-03-REPROVADO-idle-scroll-overlap.png` (parado),
`vs-03-REPROVADO-descanso-ativo-overlap.png` (ativo, dá pra ver duas
pílulas de checkbox cortadas pela metade logo abaixo da cápsula).

## 4. Teste causal A/B — prova decisiva

Com a MESMA ferramenta, MESMO viewport, SEM tocar em `src/**`, injetei o
valor correto da variável (a altura real medida no estado ativo, 125px)
e repeti a tentativa:

```js
document.documentElement.style.setProperty('--lastro-timer-topo-altura', '125px')
```

Resultado: o clique em "Peito" (via label, já que o padrão
checkbox-oculto-atrás-do-label é o único motivo do `label.chip
intercepts pointer events` que sobrou depois — não é mais o header fixo
bloqueando) marcou o checkbox com sucesso, o botão "Continuar" ficou
habilitado e posicionado bem abaixo da faixa fixa (`top=361.8`, sem
nenhuma sobreposição). Um único fator mudado (a variável), mesmo
resultado de ferramenta e viewport → a variável sub-medida é
causalmente responsável pela falha, não o Playwright.
Screenshot: `vs-03-AB-com-var-corrigida-funciona.png`.

## Recomendação (não implementada — fora do meu mandato de auditor)

Trocar `entrada.contentRect.height` (linha 147 de `timer-topo.tsx`) por
uma leitura border-box no callback do `ResizeObserver` — por exemplo
`entrada.target.getBoundingClientRect().height` (consistente com a
medição inicial) ou `entrada.borderBoxSize?.[0]?.blockSize` com
fallback pra `getBoundingClientRect()`.

## Achado à parte (fora do escopo dos 5 itens, não corrigido por mim)

Durante o teste, o treino real de hoje (`9c060043-de06-421b-ad9e-3886706fd6df`)
apresentou um erro de hidratação do React ao recarregar
(`Hydration failed because the server rendered text didn't match the
client`): o servidor renderiza o botão como "Ver Relatório do Treino"
enquanto o cliente hidrata esperando "Finalizar Treino", forçando o
React a descartar e re-renderizar a árvore no cliente. Nesse mesmo
treino, o avatar do cabeçalho mostrou "AT" (placeholder cravado) numa
dessas renderizações com erro de hidratação — mas ao recarregar limpo
logo em seguida, mesma URL, voltou a mostrar "Q" normalmente. Não deixa
o veredito de VS-04 em dúvida (verificado à parte, nas 5 páginas do
escopo, sempre limpo — ver `qa/evidencias/VS-04/auditoria-independente/`),
mas registro aqui como sintoma do mesmo problema de hidratação: pode ser
a raiz de o timer de descanso também ter parado de responder a cliques
nesse treino específico em determinado momento. Não investiguei a causa
raiz — é um achado novo, não um dos 5 itens desta auditoria.
