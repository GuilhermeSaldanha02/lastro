# ESTUDO DE REDESENHO — do app que parece demo ao app com personalidade

> **Status: estudo. Nada foi implementado, nada foi decidido.** As decisões estão todas na §8, para o dono bater de uma vez. Só depois disso se monta o backlog.
>
> Feito em 2026-08-14, em 7 partes sequenciais, a pedido do dono — *"separar tudo em pequenas partes, só fazer uma após a pesquisa da outra… só vamos decidir algo mesmo no final, mas fazer assim para não puxar tudo e esquecer de algo"*.

---

## 0. As travas

Ditadas pelo dono e respeitadas em todo este documento:

| | |
|---|---|
| 🔒 **Cores** | a paleta inteira fica. Nenhuma proposta aqui altera pigmento |
| 🔒 **Pílula de navegação** | `.nav`, `aba-inferior.tsx` e todos os tokens `--lastro-nav-*` / `--lastro-vidro-nav*` ficam intactos |
| 🔓 **Todo o resto** | páginas, layout, tipografia, forma, movimento, fluxo |
| ⚠️ **Régua** | *"não quero ajustes no que existe, quero algo novo novo"*. Reaproveitar é permitido; remendar não |

**Mudança em relação ao estudo anterior** (`ESTUDO-PADRAO-APLICATIVO.md`): lá a tipografia estava cercada como aprovada. **Essa cerca caiu** — o dono liberou tudo menos cor e pílula.

---

## PARTE 1 — Inventário: o que existe

### O tamanho do que está em jogo
13 rotas · 20 componentes (2 628 linhas) · `sistema.css` com 1 524 linhas e ~110 classes · `tokens.css` com 225 linhas.

### O vocabulário atual
| Grupo | Hoje |
|---|---|
| Famílias | 3 — IBM Plex Sans, Mono e Serif |
| Escala de tamanho | **9 degraus**: 14 · 16 · 18 · 20 · 24 · 30 · 38 · 48 · 60 · 76 |
| Pesos | 4 · Entrelinhas | 3 · Espaçamento | 11 degraus (base 4px) |
| Raio | 3 + balão · Elevação | 3 + afundado + 2 bevels · Gradientes | 4 |

### 🔎 Achado 1.1 — o defeito não é falta de sistema, é escolha neutra
Nove degraus de tamanho e quatro pesos é **mais** vocabulário do que a maioria dos design systems maduros. E ainda assim "parece demo". Logo o problema não é ausência de sistema — é que cada peça escolhida foi a opção segura:

- **IBM Plex Sans** é tipografia corporativa de propósito geral. Competente, legível, **zero personalidade**. É literalmente a fonte que a IBM fez para não chamar atenção.
- **Gradiente + fio branco interno + sombra** em toda superfície é a receita do cartão web de 2012.
- Elevação aplicada uniformemente: se tudo está levantado, nada está.

### 🔎 Achado 1.2 — o que dá para reaproveitar (é bastante)
**Reaproveitável integralmente, sem uma linha de decisão visual dentro:** `src/lib/**` inteiro — agregador de métricas, análise, camada de dados, offline/outbox, cálculo de anilhas, regra de recorde. Mais a lógica de estado dos componentes: registro otimista de série, confirmação em duas etapas, cálculo ao vivo da calculadora, conversa do coach.

**A descartar:** a camada de apresentação de `sistema.css` (exceto `.nav*`) e a marcação das 13 telas.

Traduzindo: **o motor está bom e fica; a carroceria é que se refaz.** Isso é o que torna "algo novo novo" viável sem jogar o projeto fora.

### 🔎 Achado 1.3 — já existe um gesto com personalidade, escondido
`--lastro-fonte-serif` existe e é usada em **um único lugar** — o veredito do parecer. É o único momento do sistema inteiro com voz própria, e está enterrado numa tela.

---

## PARTE 2 — Referências: o que apps de verdade fazem

Três apps olhados em telas reais, em tamanho real — não em artigo sobre eles.

| App | Credencial | O que se tirou |
|---|---|---|
| **[Hevy](https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350)** | concorrente direto, 86 mil avaliações | cabeçalho de coluna; destrutivo atrás de `⋮`; ação secundária fantasma |
| **[Ladder](https://apps.apple.com/us/app/ladder-strength-training-plans/id1502936453)** | **finalista de App of the Year 2025** | personalidade 100% tipográfica: grotesca pesada, caixa alta, entrelinha apertada |
| **[Strava](https://apps.apple.com/us/app/strava-run-bike-walk/id426826309)** | referência de categoria | folha inferior; seções por cabeçalho + ritmo; fileira de chips |

### 🔎 Achado 2.1 — o denominador comum é a AUSÊNCIA de moldura
Em nenhuma tela real das três existe borda + sombra por item. A separação é sempre **cabeçalho de seção + respiro + alinhamento**. O lastro faz o oposto em quase toda classe de conteúdo. **É isso, e não a paleta, que produz cara de demo.**

### 🔎 Achado 2.2 — a personalidade vem de tipo, não de cor
O Ladder é o caso mais útil aqui justamente porque **a cor do lastro está travada**. A personalidade dele não depende de cor nenhuma: é peso, caixa, tracking e entrelinha. É a alavanca que sobra — e ela é grande.

### 🔎 Achado 2.3 — a direção editorial não é moda importada
A pesquisa de tendência converge em editorial, tipografia de grande personalidade, composição tipo pôster. E o `DESIGN.md` §3.6.2 **já** define a peça-assinatura como *"um documento datado… margem esquerda estável, hierarquia por tamanho e peso"*.

Ou seja: a direção editorial é **o projeto finalmente cumprindo a própria tese** — que hoje vale em uma tela e está afogada em cartões em todas as outras.

### ⚠️ O que NÃO copiar
Ladder é escuro com verde-limão saturado (colide com a paleta travada) — copiar o comportamento tipográfico, não a cor. Hevy põe a ação primária na barra de topo — colide com D2 (alcance do polegar). Strava usa folha sobre mapa — o lastro não tem mapa.

---

## PARTE 3 — Tipografia: onde a personalidade nasce

Com a cor travada, esta é a alavanca principal.

### Situação técnica (verificada)
As 3 famílias vêm de `next/font/google`. Trocar é barato: o Next hospeda localmente — sem requisição externa, sem salto de layout, sem problema de CSP.

**Disponibilidade conferida por requisição real à API** (não de memória): Archivo, Anton, Instrument Serif, Fraunces, Bricolage Grotesque, Space Grotesk, Geist, Newsreader, Sora, Manrope, Barlow Condensed, DM Mono, JetBrains Mono — todas 200.

**Eixos variáveis confirmados:**
- **Archivo** — largura 62–125 **e** peso 100–900. Uma família cobre de condensada a expandida.
- **Fraunces** — `opsz`, `wght`, e os eixos `SOFT` e `WONK` (o "torto" proposital).
- **Bricolage Grotesque** — `opsz`, `wdth`, `wght`.
- **Anton** — peso único (o pedido de 700 falha).

### As três direções, renderizadas com a paleta travada e olhadas de verdade

| | Composição | Leitura |
|---|---|---|
| **A · Força editorial** | Archivo 800 condensada no título e no número | industrial, atlética, próxima do Ladder. Número enorme funciona muito bem. **Risco:** dura demais para a areia quente |
| **B · Documento** | Instrument Serif no título + Archivo no número | serifa de alto contraste; casa com a tese do §3.6.2. Elegante, mas o título fica delicado ao lado de número pesado |
| **C · Caráter** | Fraunces (`SOFT 30`, `WONK 1`) + Bricolage | **a que melhor casou com areia + petróleo.** Quente, editorial, personalidade evidente, e a que mais se afastou de "demo" |

### 🔎 Achado 3.1 — a escala de 9 degraus enfraquece a hierarquia
18 e 20; 30 e 38. Passos curtos demais: nada parece decisivamente maior que o vizinho — que é exatamente o sintoma que o §3.0 manda reprovar. App com personalidade usa **menos degraus e saltos maiores**.

### 🔎 Achado 3.2 — falta o rótulo micro em caixa alta
Nas três referências existe um nível que o lastro não tem: rótulo minúsculo, caixa alta, tracking largo (`PREVIOUS · KG · REPS`). Ele cria textura **e** dispensa moldura para marcar seção. Barato, e muda muito a cara.

### 🔎 Achado 3.3 — a fonte monoespaçada não é necessária para alinhar
Hoje o alinhamento tabular depende de Plex **Mono**. Mas `font-variant-numeric: tabular-nums` alinha em qualquer família com algarismos tabulares — Archivo e Bricolage têm. **Dá para ter número perfeitamente alinhado sem a cara de terminal.** Hoje há uma alavanca de personalidade travada por um mal-entendido técnico.

---

## PARTE 4 — Forma, superfície e profundidade

### Medido em `sistema.css`
`box-shadow` 39× · `border: 1px solid` 23× · `border-radius` 30× · gradiente de superfície 12× · bevel 20×.

**17 classes vestem moldura completa** (borda + sombra + raio ao mesmo tempo):

- Controles, legítimo (9): `.botao-primario` `.botao-secundario` `.botao-destrutivo` `.botao-confirmar` `.campo` `.campo-conversa` `.enviar` `.confirma` `.aviso-erro`
- **Conteúdo, ilegítimo (7):** `.item` `.evidencia` `.ficha` `.metrica` `.atalho` `.pergunta` `.grafico-progressao`

### 🔎 Achado 4.1 — o princípio que falta: moldura é afordância
Sete classes de **conteúdo** estão vestidas de **controle**. Quando conteúdo e controle usam a mesma roupa, some a pista de onde tocar e a tela vira campo uniforme de caixas — o "blocos soltos" do dono, em uma frase.

**Regra a adotar: só recebe moldura o que responde ao toque.** Conteúdo se separa por ritmo, tipo e alinhamento.

### 🔎 Achado 4.2 — o bevel é o que mais data o visual
O fio branco interno aparece 20×, sempre com gradiente + sombra. Essa tripla é a assinatura do cartão web de 2012. É o item isolado que mais contribui para "demo" — **e sair dele não toca em nenhuma cor.** É superfície, não pigmento: cabe inteiro dentro da trava.

---

## PARTE 5 — Navegação e fluxo

### 🔎 Achado 5.1 — um quarto da tela é moldura, antes de qualquer conteúdo (medido)
`--lastro-clearance-topo` = **88,5px** · `--lastro-clearance-nav` = **76px**.

| viewport | chrome fixo | % da tela |
|---|---|---|
| **360×640** | 164,5px | **25,7%** |
| 390×812 | 164,5px | 20,3% |
| 390×844 | 164,5px | 19,5% |

E a barra de topo carrega **duas linhas** em toda tela — repetindo "AJUSTES" acima de "Anilhas", informação que a navegação já deu.

A pílula é travada e fica. **A barra de topo não é travada, e é o maior ganho de espaço disponível no app inteiro.**

### 🔎 Achado 5.2 — toda tarefa é uma rota, e isso é comportamento de site
Criar modelo, editar perfil, configurar anilhas: todas navegam para fora e voltam. HIG define folha exatamente para "tarefa curta e delimitada sem perder o contexto". **App empurra e apresenta; site troca de página.**

### 🔎 Achado 5.3 — falta afordância de voltar
Sub-telas não têm retorno explícito (`←`); o usuário depende da pílula ou do botão do sistema. Nas três referências, sub-tela sempre tem retorno no topo.

---

## PARTE 6 — Movimento e interação

### Medido
2 durações · 13 `transition` · **1 única animação** (`lastro-pulso`, do esqueleto de carregamento).

### 🔎 Achado 6.1 — não existe transição entre telas
Trocar de tela é troca seca. **É a diferença mais perceptível entre site e aplicativo:** app move, site recarrega. Não existe uma linha de código de transição de rota hoje.

### 🔎 Achado 6.2 — a linha de lista não responde ao toque
`:active` existe nos botões e em `.item__link`, mas não nas linhas das telas novas. Material 3 exige os 6 estados; falta pressionado onde mais importa.

### 🔎 Achado 6.3 — nenhum gesto
Sem deslize, sem arrastar, sem puxar-para-atualizar. Todas as referências usam ao menos deslize para ação destrutiva — que é o caminho natural para tirar a lixeira de todas as linhas.

### 🔎 Achado 6.4 — háptico nunca usado
Registrar série, bater recorde e concluir treino são os três momentos em que uma vibração curta muda a percepção de "app de verdade". **PWA no iOS tem limitação real aqui — precisa ser testado no aparelho, não assumido.**

---

## PARTE 7 — Aplicação tela a tela

Consequências das partes 1–6. **Ainda não é proposta implementável** — depende das decisões da §8.

| Tela | O que muda |
|---|---|
| **Barra de topo (todas)** | de 2 linhas fixas (88px) para 1 linha compacta com retorno explícito. Maior ganho de espaço do app |
| **`/` e `/treino`** | a ação de iniciar/continuar vira o elemento de maior peso da tela, não mais um bloco entre blocos |
| **`/treino/[id]`** | séries em colunas com cabeçalho micro (padrão Hevy); número da carga vira herói tipográfico; sem moldura por linha |
| **`/analise`** (assinatura) | é onde a direção editorial se prova. O parecer já é "documento datado" no papel — passa a ser de fato, com o veredito no maior degrau da escala |
| **`/catalogo` e `/catalogo/[id]`** | fichas perdem moldura; viram lista contida com cabeçalho de grupo. Detalhe ganha abas ou chips no lugar do empilhamento |
| **`/ajustes` e sub-telas** | as telas que originaram a reclamação: seção contida, valor e unidade separados, alinhamento por coluna, destrutivo fora de toda linha |
| **`/perfil`** | tarefa curta → candidata a folha. Nome do usuário ganha papel tipográfico (hoje é `<p>` sem classe nenhuma) |
| **`/coach`** | conversa é o único lugar onde balão se justifica; hoje ele empresta raio próprio ao sistema todo |
| **`/login`** | primeira impressão do app, e hoje é a tela mais genérica. É onde a personalidade nova deve aparecer primeiro |

### Restrição de execução
Refazer 13 telas de uma vez é o caminho mais rápido para quebrar tudo. A ordem que protege o produto: **prova a direção em uma tela → mede → só então propaga.** A tela de prova natural é `/analise` (é a peça-assinatura e onde a tese editorial já existe) ou `/ajustes/anilhas` (é a que gerou a queixa e é pequena).

---

## PARTE 8 — Decisões para o dono

Nada abaixo foi decidido. **É aqui que você decide, e só depois montamos o backlog.**

### D1 · Direção tipográfica — a decisão que manda em todas as outras
- **A · Força editorial** (Archivo condensada pesada) — atlético, industrial, "academia"
- **B · Documento** (Instrument Serif + Archivo) — sóbrio, editorial, fiel à tese do parecer
- **C · Caráter** (Fraunces + Bricolage) — quente e com personalidade; **a que melhor casou com a paleta travada** ao ver renderizado
- ou nenhuma das três, e eu monto outras

### D2 · A escala encolhe?
Trocar 9 degraus por ~6 com saltos maiores. Ganha hierarquia, custa retrabalho em toda tela.

### D3 · Cai o bevel + gradiente de superfície?
É o que mais data o visual. **Não toca em cor nenhuma.** Sim ou não.

### D4 · Moldura só em quem responde ao toque?
As 7 classes de conteúdo perdem borda/sombra/raio e passam a se separar por ritmo e tipo.

### D5 · A barra de topo encolhe?
De 2 linhas (88px) para 1 linha com retorno. Devolve ~6% da tela em todo aparelho.

### D6 · Tarefa curta vira folha?
Criar modelo, editar perfil, adicionar anilha deixam de ser rota e viram folha sobre a tela atual. **Muda rota e histórico — não é mudança de CSS.**

### D7 · Entra transição entre telas?
É o que mais separa "site" de "aplicativo" na percepção. Custa complexidade e exige respeitar `prefers-reduced-motion`.

### D8 · Destrutivo sai de toda linha?
Se sai, vai para deslize, excesso (`⋮`) ou modo de edição — sua escolha. A confirmação em duas etapas continua nos três casos.

### D9 · Háptico nos 3 momentos?
Registrar série, bater recorde, concluir treino. **Precisa teste no seu iPhone** — PWA no iOS é limitada aqui e eu não vou afirmar que funciona sem ver.

### D10 · Qual tela prova a direção primeiro?
`/analise` (peça-assinatura, tese já existe) ou `/ajustes/anilhas` (originou a queixa, é pequena e rápida de provar).

---

## O que este documento não fez, de propósito

Não escreveu CSS, não abriu branch de implementação, não escolheu direção e não montou backlog. O dono pediu para decidir tudo no fim, de uma vez — e a última proposta foi reprovada justamente por eu ter avançado para os pixels antes de a direção estar acordada.
