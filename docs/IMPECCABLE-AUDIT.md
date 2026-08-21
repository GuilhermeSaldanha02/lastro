# Impeccable · audit — Apex Pro

> Skill `impeccable` v3.8.0 (comando `audit`, register **product**), 2026-08-21.
> Medido no navegador real (Playwright, Chromium, 360×640) sobre a `main` já com as PRs #101/#102.
> Register `product` porque o design **serve** a tarefa: app autenticado, o usuário está treinando.
>
> Auditoria **técnica**, complementar à de `AUDITORIA-APEX-PRO.md` — aquela olhou honestidade de dado, esta olha ofício.
>
> ⚠️ O passo 1 da skill pede `PRODUCT.md` via `scripts/context.mjs`. A skill não está instalada em disco neste projeto e o `PRODUCT.md` não existe; usei `PRD.md` + `DESIGN.md` como equivalentes — **com a ressalva de que o `DESIGN.md` está desatualizado** (descreve a paleta areia). A fonte de verdade visual usada foi `src/app/tokens.css`.

## Placar

| # | Dimensão | Nota | Achado principal |
|---|---|---|---|
| 1 | Acessibilidade | **2**/4 | `--lastro-txt-3` reprova AA — 104 elementos só no `/catalogo` |
| 2 | Performance | **2**/4 | `backdrop-filter: blur(12px)` em card **opaco**: custo sem efeito |
| 3 | Theming | **2**/4 | 7 hex + 30 `rgba()` crus em `sistema.css`, fora do sistema de tokens |
| 4 | Responsivo | **3**/4 | Zero overflow em todas as telas; perde só nos alvos de toque |
| 5 | Anti-padrões | **2**/4 | Glassmorphism decorativo, ghost-card, over-rounding |
| | **Total** | **11/20** | **Competente, com ofício por apertar** |

O Apex Pro não é "AI slop" — tem identidade, o sistema de tokens é sério (raio, duração, curva, papel tipográfico nomeado) e a estrutura semântica é boa. O que falta é acabamento: decoração que não paga o próprio custo, e valores escapando do sistema.

---

## 1. Acessibilidade · 2/4

**Reprova.** `--lastro-txt-3` (#64748B) mede **3,36** sobre `sup-3`, **3,95** sobre `sup-1`, **4,19** sobre o fundo — piso AA é 4,5. Ao vivo: **104** elementos no `/catalogo`, 18 na Home. Detalhado no T3.

**Alvos de toque abaixo dos 48px que o próprio `--lastro-alvo-min` declara:** "Ver Todos" **20px**, chips do catálogo 34px, "Voltar" e avatar 36×36, abas 38px. A skill pede 44×44 no mínimo; o projeto pede 48. Reprova nas duas réguas.

**Passa bem:** foco visível com outline dourado 2px em todos os alvos, ordem de tabulação correta, `alt` presente, `role="alert"` nos erros, e o uso de `aria-disabled` em vez de `disabled` para não tirar o elemento da tabulação — decisão boa e documentada (B1).

## 2. Performance · 2/4

**O achado desta passada:** dois cards declaram desfoque de fundo sendo **totalmente opacos**.

| Elemento | `background` | alpha | `backdrop-filter` |
|---|---|---|---|
| `.disciplina-card` | `rgb(14, 18, 24)` | **1** | `blur(12px)` |
| `.metrica-switcher-card` | `rgb(14, 18, 24)` | **1** | `blur(12px)` |

Fundo opaco, sem gradiente: **não há nada atrás para desfocar.** O filtro não produz efeito visual nenhum e ainda obriga o compositor a promover a camada e processar o backdrop a cada repaint — em celular, é onde dói. Custo puro, benefício zero.

É o caso do **E13** ao contrário: declaração que não faz nada não dá erro, só não funciona.

Os outros dois usos são legítimos: `.nav` (alpha 0.88, `fixed`, conteúdo passa por baixo) e `.topo-pro__data-pill` (alpha 0.05).

**Passa:** `prefers-reduced-motion` declarado; nenhuma transição animando propriedade de layout (a única encontrada é `stroke-width` em SVG, que não causa reflow de layout).

**Aperta:** duas sombras com blur ≥24px (`--lastro-elev-2` 24px, `--lastro-elev-3` 36px).

## 3. Theming · 2/4

O sistema de tokens é **bom** — cobre cor, espaçamento, papel tipográfico, raio, duração, curva, alvo de toque. Melhor que a média larga.

O problema é vazamento. `sistema.css` tem **7 hex crus** e **30 `rgba()` crus**, valores que deveriam vir de token:

```
2085:  background: #07090D;            → --lastro-fundo
1933:  color: #FFF;
2503:  color: #E2E8F0;
2461:  background: linear-gradient(145deg, rgba(20,26,34,.95), rgba(14,18,24,.98));
```

O próprio `DESIGN.md` define esse `grep` como gate — e ele reprova hoje. Viola **P7** (fonte única por dado).

**Agravante documental:** o `DESIGN.md` descreve a paleta areia, substituída em `8d30cf0`. A fonte de verdade escrita está errada, e certifica contraste com número de outra paleta. Ver T3.

**Zero hex cru nos componentes `.tsx`** — depois da PR #102, que removeu os SVGs que carregavam `#10B981` e `#D4AF37` no código.

## 4. Responsivo · 3/4

**Zero overflow horizontal em todas as telas medidas** (`/`, `/login`, `/treino`, `/analise`, `/catalogo`, `/coach`, `/perfil`, `/ajustes`, `/ajustes/anilhas`, `/ajustes/modelos`), a 360px. Nenhum elemento estourando a viewport. Para um app mobile-only, é o resultado certo.

Perde ponto pelos alvos de toque (§1) e pela sobreposição de 9px do campo do coach sob a aba fixa (T5).

## 5. Anti-padrões · 2/4

Contra os *absolute bans* e os *product bans* da skill:

| Padrão | Situação |
|---|---|
| **Glassmorphism decorativo** | ❌ 2 cards com blur inútil (§2) + 1 pílula. A skill pede "raro e proposital, ou nada" |
| **Ghost-card** (borda + sombra ≥16px) | ❌ 3 na Home: `botao-primario--heroi` (25px), `ai-coach-card` (24px), `nav` (20px) |
| **Over-rounding** | ❌ `--lastro-raio-3: 22px` nos cards. A skill fecha cards em 12–16px |
| **Gradient text** | ⚠️ `.entrada__titulo` usa `background-clip: text` — mas **é CSS morto**, sem consumidor. É E11 (deletar), não slop na tela |
| **Eyebrow uppercase + tracking** | ⚠️ Presente, não saturado: 1 na Home, 2 na `/analise`, 3 em `/ajustes/anilhas`. Longe do "em toda seção" |
| **Cards aninhados** | ⚠️ Em `/treino`, o estado vazio põe uma borda tracejada dentro do card obsidian. A skill diz que aninhado é *sempre* errado |
| Fonte de display em rótulo/botão | ✅ não ocorre |
| Elevação uniforme | ✅ três níveis usados com distinção (11/11/4) |
| Motion decorativo | ✅ transições de estado, 120–400ms, dentro da faixa |
| Vocabulário inconsistente | ✅ mesmo botão, mesmo chip, mesmo campo entre telas |

**Falso positivo descartado:** meu primeiro detector acusou 7 "cards aninhados", mas pegava pílulas, círculos de dia e abas — controles dentro de card, que são legítimos. O aninhamento real é um só, o de `/treino`.

---

## Fila sugerida

Ordenada por relação dor/esforço. Nada aqui é bloqueante para o backlog existente — é acabamento.

| # | Item | Esforço |
|---|---|---|
| I1 | Remover `backdrop-filter` dos 2 cards opacos | 2 linhas |
| I2 | Deletar `.entrada__titulo` (CSS morto com gradient text) | 1 bloco |
| I3 | Baixar `--lastro-raio-3` de 22px para 16px nos cards | 1 token |
| I4 | Desfazer o ghost-card: escolher borda **ou** sombra nos 3 elementos | pequeno |
| I5 | Levar os 37 valores crus de `sistema.css` para token | médio |
| I6 | Tirar a borda tracejada aninhada do estado vazio de `/treino` | pequeno |

**I1 a I4 cabem numa PR só** e são de baixo risco — mas mexem na aparência, então pedem o olho do dono no aparelho antes do merge, pela regra do gate visual.

**I3 e I5 devem esperar o T3**, que já vai reescrever a camada de cor e reconciliar o `DESIGN.md`. Mexer nos mesmos arquivos duas vezes é retrabalho.
