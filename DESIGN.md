# DESIGN.md — `lastro`

> **2026-10-01 — stickers escolhidos pelo dono:** nove composições (Números, Lateral, Minimalista, Placa, Bilhete, Arco, Etiqueta, Editorial e Anatômico), todas com `public/logo-lastro.png` preservado. A paleta exportada é fixa em `--lastro-sticker-*` de `tokens.css`, independente do tema da interface. Medidas do artefato SVG têm fonte única em `src/lib/stickers/tokens.ts`; não são tokens de interface. Prévia, miniatura e exportação compartilham o mesmo PNG de largura 1080 e altura proporcional. O mapa anatômico destaca os grupos principais cadastrados dos exercícios com séries valendo, sem inferir músculos secundários. O seletor mantém a última escolha localmente.

> **Fonte ÚNICA do visual.** Nenhum valor de cor, espaçamento ou tipografia é definido em outro lugar. Verificar autoconsistência deste arquivo a cada edição.
>
> **Estado (reconciliado em 2026-10-01, DOC-03).** O valor de qualquer token vive em `src/app/tokens.css`; as classes, em `src/app/sistema.css`. O app tem **7 temas** (§3.1): o padrão é o **"ouro"**, o redesenho **Apex Pro** (2026-08-20, `8d30cf0`: obsidiana, ouro champagne e esmeralda), escuro; há o claro **"branco-ouro"** e mais cinco (areia, clean, petroleo, moka, oliva). O contraste dos 7 temas é medido pelo teste `e2e/j5-contraste.spec.ts`, no app renderizado; ele, e não uma tabela deste documento, é a fonte dos números.
>
> **Como ler este documento.**
> - **Vale como contrato:** §1 (contexto), §2 (D1 a D10), o método e os limiares de §3.2, §3.3 a §3.8 (tipografia, papéis, densidade, parecer, gráfico, autoconsistência), §4 (roteiro do gate) e §6 (vocabulário do redesenho, com o estado de cada peça).
> - **Reescrito em 2026-10-01, sem os números da paleta Areia:** §3.0, §3.1, a tabela de razões de §3.2 e §4.2.
> - **Histórico, mantido só pela razão da decisão:** §5 (decisões de 2026-08-06; as que tratam da paleta Areia foram superadas) e as notas datadas espalhadas pelo texto. O texto antigo completo está no git (`git log -- DESIGN.md`).
> - **Documentos que este arquivo citava e que já não existem:** os backlogs de agosto, a auditoria Apex Pro e o planejamento do redesenho foram arquivados em 2026-10-01 e estão no git; o que falta fazer vive só em `docs/BACKLOG-CANONICO.md`. O `design/padrao-visual.html` é a página de referência da paleta **Areia**, histórica: não usar como referência do visual atual.
> - **Linha do tempo:** Areia & Azul Petróleo, claro (2026-08-06, D5 revista) → fontes e papéis tipográficos novos (2026-08-15, E1 a E4) → **Apex Pro, escuro (2026-08-20)**, que trocou a paleta sem atualizar este documento até 2026-08-21.

---

## 1. O contexto de uso manda no design

Toda decisão visual deste app responde a uma cena específica: **uma pessoa em pé, suada, segurando o celular com uma mão, entre séries, com pressa, às vezes em iluminação ruim.** Não é alguém sentado, concentrado, com as duas mãos livres.

Isso não é detalhe de acabamento — é a restrição que decide o layout inteiro.

---

## 2. Restrições funcionais (decididas, não negociáveis)

| # | Restrição | Por quê |
|---|---|---|
| D1 | **Alvo de toque mínimo 48×48px**, com folga generosa entre alvos | Dedo suado, pessoa em pé, sem precisão fina |
| D2 | **Ações primárias na metade inferior da tela**, ao alcance do polegar | Uma mão só. Botão no topo obriga a reposicionar o aparelho |
| D3 | **"Repetir última série" é o botão mais proeminente do app** | É a ação mais frequente do fluxo de treino. Se ela custar mais de um toque, o log é abandonado |
| D4 | **Legível a um braço de distância** — corpo nunca abaixo de 16px | O celular fica apoiado no banco, não na mão, entre séries |
| D5 | **Tema escuro como padrão; o claro é uma opção** | Histórico: o padrão era escuro (academia com luz baixa, tela clara cansa à noite); o dono **revisou em 2026-08-06** para claro (areia), aceitando o risco; o redesenho **Apex Pro (2026-08-20)** devolveu o **escuro** ("ouro") como padrão e manteve o claro como o tema `branco-ouro`, escolhido em `/ajustes/temas`. A justificativa original vale de novo como razão do padrão. A partir de M9 (2026-08-15, `DECISIONS.md` D5 do redesenho — numeração diferente desta tabela, mesma letra por coincidência), a barra de topo some tela por tela conforme a propagação avança; a pílula da aba inferior não muda |
| D6 | **Nenhuma ação de registro espera resposta de rede** | ADR/ARCHITECTURE: registrar série é offline-first. A UI confirma na hora |
| D7 | **Estado de sincronização sempre visível, nunca alarmante** | O usuário precisa saber que o dado está salvo local, sem que isso pareça erro |
| D8 | **Contraste AA medido, não estimado** | Gate de acessibilidade é critério do gate visual, não fase posterior |
| D9 | **Foco visível e navegação por teclado funcionais** no PC | O PC é onde os gráficos são lidos com calma |
| D10 | **Proibido o uso de emoticons e emojis** | Decisão do dono (2026-08-26): estética de precisão, sóbria e premium. Toda sinalização visual é feita com ícones SVG vetorizados, tipografia e tokens oficiais, sem emojis informais. |

---

## 3. Tokens

> **O arquivo `src/app/tokens.css` é o único lugar do projeto onde um valor literal de cor, espaço, tamanho ou fonte pode existir.** Qualquer hex, `px`, `rem` ou nome de fonte fora dele — em componente, em Tailwind config, em CSS de módulo, em prop de Recharts — é violação e reprova no review.

### 3.0 Tese visual

**Vigente: Apex Pro (2026-08-20).** Obsidiana (`--lastro-fundo`), superfícies de vidro fumê em três degraus (`--lastro-sup-1..3`), **ouro champagne** como assinatura e ação primária, **esmeralda** como sinal de progressão e ciano para sincronização. Tema escuro por padrão (D5), com seis alternativas (§3.1). O número vem em `--lastro-fonte-num` (tabular), e a cor só aparece onde **significa** alguma coisa (§3.2, nota E).

**A regra de escala, que sobreviveu à troca de paleta (rediagnóstico de 2026-08-08):** o que dá vida a uma tela não é brilho nem saturação, é **contraste de escala, de peso e de densidade** — cada tela tem um elemento que pesa mais que os outros, e o resto flutua em volta dele. Onde um valor parece "no mesmo degrau" dos vizinhos (mesma elevação, mesmo tamanho, mesmo peso), é este princípio sendo ignorado. §3.6.2 o aplica ao veredito do parecer.

**Matéria (decidida pelo dono em 2026-08-06 e vigente):** gradiente, vidro, bevel e sombra fazem parte do padrão, porque sem elevação "parece que fica algo solto". Três regras seguram isso sem virar enfeite: a luz vem de cima (fio claro na borda superior, sombra para baixo); gradiente tem no máximo dois passos; e texto sobre gradiente é medido contra o passo de **pior caso**, nunca contra uma média. A escala de elevação (`--lastro-elev-1` repouso, `--lastro-elev-2` levantado, `--lastro-elev-3` só a ação primária, `--lastro-elev-afundado` para campo, que recebe em vez de saltar) está em `tokens.css`.

> **Histórico.** A tese "instrumento sóbrio, sem gradiente, vidro, brilho ou 3D" (ISA-101) foi reprovada pelo dono em 2026-08-06 e seguiu valendo só como disciplina (base quieta, cor que significa). Entre 2026-08-06 e 2026-08-20 o padrão foi **"Areia & Azul Petróleo"**, claro; a descrição completa dele, a galeria de referência que se consultou e as razões medidas daquela paleta estão no git (`git log -- DESIGN.md`) e **não valem mais**. Onde o PRD e este documento conflitarem, o PRD vence.

### 3.1 Paleta — a fonte única é `src/app/tokens.css`

> **Custódia.** O bloco `:root` mora em `src/app/tokens.css`, o **único arquivo do projeto onde um valor literal de cor, espaço, tamanho, peso, raio, sombra ou duração pode existir**. Qualquer hex, `px` ou `rem` fora dele — em componente, em CSS de módulo, em prop de Recharts — é violação e reprova no review. Este documento explica o *porquê*; o arquivo executa. Cada token carrega a razão medida no comentário ao lado.

**Temas.** O tema ativo vem do `localStorage` (`lastro_tema`), aplicado como `data-tema` no `<html>` (`layout.tsx`); sem escolha, vale o `:root`, que é o "ouro". A escolha é em `/ajustes/temas`.

| `data-tema` | Nome | Regime |
|---|---|---|
| `ouro` (padrão, `:root`) | Apex Pro — obsidiana, ouro champagne e esmeralda | escuro |
| `branco-ouro` | Marfim & Ouro Imperial | **claro**, com tokens próprios (os acentos são recalibrados, não herdam o escuro) |
| `areia` | Duna Areia & Âmbar | escuro |
| `clean` | Clean Monolith (platina e titânio) | escuro |
| `petroleo` | Slate Petróleo & Ouro Antigo | escuro |
| `moka` | Café Moka & Caramelo | escuro |
| `oliva` | Oliva Tático | escuro |

A leitura humana do tema padrão ("ouro") — reprodução para leitura, o valor que executa é o do `tokens.css`:

| Papel | Token | Valor |
|---|---|---|
| Fundo | `--lastro-fundo` | `#07090D` |
| Cartão, bloco de evidência | `--lastro-sup-1` | `#0E1218` |
| Superfície elevada, cabeçalho de tabela | `--lastro-sup-2` | `#141A22` |
| Destaque flutuante, chip | `--lastro-sup-3` | `#1B222C` |
| Divisória — **só decorativa** (nota A de §3.2) | `--lastro-linha` | `rgba(255,255,255,.08)` |
| Limite de alvo de toque | `--lastro-controle` | `rgba(255,255,255,.16)` |
| Corpo, número, título | `--lastro-txt` | `#F8FAFC` |
| Secundário | `--lastro-txt-2` | `#94A3B8` |
| Procedência, metadado, unidade | `--lastro-txt-3` | `#7C8DA6` |
| Barra de topo (gradiente) | `--lastro-barra-a` → `--lastro-barra-b` | `#0B0F15` → `#07090D` |
| Assinatura | `--lastro-ouro` (claro / escuro) | `#D4AF37` (`#E6C86E` / `#A67C1E`) |
| **Ação — preenchimento** | `--lastro-acao-a` → `--lastro-acao-b` | `#E6C86E` → `#D4AF37` |
| **Ação — tinta sobre ela** | `--lastro-acao-txt` | `#07090D` |
| **Ação — borda** | `--lastro-acao-borda` | `#E6C86E` |
| **Ação — como texto ou link** | `--lastro-acao-tinta` | `#D4AF37` |
| Alta · progressão | `--lastro-alta` | `#10B981` |
| Platô · estagnação | `--lastro-plato` | `#F59E0B` — âmbar, nunca vermelho |
| Queda · regressão | `--lastro-queda` | `#EF4444` |
| Sincronização (D7) | `--lastro-sync` | `#06B6D4` — jamais vermelho |
| Erro — **reservado a falha real** | `--lastro-erro` | `#EF4444` |
| Foco (D9) | `--lastro-foco` | `#D4AF37` |

**Regras de papel que valem em todos os temas:**

- **Preenchimento e tinta são dois papéis, não a mesma cor.** O preenchimento da ação (`--lastro-acao-a/b`) carrega a tinta escura `--lastro-acao-txt`; o dourado usado **como texto** (aba ativa, link, item selecionado) é `--lastro-acao-tinta`, nunca o preenchimento.
- **Cada sinal tem um só significado.** Alta, platô, queda e sincronização não se reaproveitam como cor decorativa, e o erro só aparece em falha real.
- **No tema claro os acentos são recalibrados** (`branco-ouro`): o dourado e o esmeralda do escuro não passam contraste sobre fundo claro. Quem muda um acento muda nos 7 temas e confere pela `e2e/j5-contraste.spec.ts`.

**Espaçamento, alvos, escala de tamanho, peso, raio, duração e matéria** seguem em `tokens.css` com os mesmos nomes usados neste documento. Base 4px; `--lastro-alvo-min` 48px (D1) e `--lastro-alvo-acao` 64px (D3; este documento dizia 72px, valor da fase Areia); os papéis tipográficos estão em §3.4.

### 3.2 Contraste — medido em navegador, não estimado (D8)

> **Reescrita parcial em 2026-10-01 (DOC-03):** a tabela de razões e as notas C e D eram da paleta Areia e foram removidas; o método, os limiares e as regras de uso continuam. **Os números vêm de `e2e/j5-contraste.spec.ts`**, que mede o pixel renderizado nos 7 temas, trocando o tema pela interface — a única medição que o projeto aceita (D8). Não citar razão de contraste daqui sem medir de novo.

Fórmula WCAG 2.x (linearização sRGB, `L = 0.2126R + 0.7152G + 0.0722B`, `(Lmax+0.05)/(Lmin+0.05)`). **Aferição do método, rodada antes de cada medição:** `#FFFFFF/#000000 = 21.00`, `#777777/#FFFFFF = 4.48`, `#767676/#FFFFFF = 4.54` — batem com os canônicos do WCAG.

**Mudança de método (2026-08-06):** as razões deixaram de ser aritmética sobre hex escritos à mão e passam a ser **medidas sobre as cores computadas de uma página renderizada**. Hoje isso é feito por `e2e/j5-contraste.spec.ts`, nos 7 temas. (O `design/padrao-visual.html`, que fazia isso para a paleta Areia, é histórico.)

Limiares: **4.5:1** texto normal · **3:1** texto grande (≥24px em `--lastro-peso-forte` — Seção ou Título de tela em negrito —, ou ≥30px — Título de tela) e limite de componente de interface.

**Regra nova, que o gradiente obriga:** onde há gradiente, o texto é medido contra o **passo de pior caso**, nunca contra uma média nem contra o passo mais favorável.

**Pares que o gate exige** (os números saem da medição, não deste documento): texto e texto secundário sobre fundo e superfícies (4,5:1); metadado `--lastro-txt-3` sobre a pior superfície, `sup-3`, o par mais apertado (4,5:1); os sinais `alta`, `plato`, `queda`, `sync` e `erro` sobre as superfícies em que são desenhados (4,5:1 se for texto, 3:1 se for traço ou barra); texto da ação sobre o pior passo do gradiente (4,5:1); limite de componente `--lastro-controle` e anel de foco (3:1). `--lastro-linha` fica de fora de propósito (nota A).

**Nota A — `--lastro-linha` é decorativa por decisão.** Ela só separa blocos que já se distinguem por superfície ou elevação, e **não cumpre** o limite de 3:1 de componente. **Todo alvo de toque usa `--lastro-controle`**, ou uma borda própria quando o preenchimento não cumpre o limite. Regra de reprovação: qualquer controle cujo único limite visual seja `--lastro-linha` reprova o gate.

**Nota B — o anel de foco nunca encosta no elemento.** É sempre desenhado **fora**, com afastamento: `outline: var(--lastro-foco-espessura) solid var(--lastro-foco); outline-offset: var(--lastro-foco-afast);`. O vão do `offset` mostra a superfície do pai, onde o anel tem contraste. **Proibido `outline-offset: 0` ou anel interno (`inset`)** — contra um preenchimento saturado o anel some.


**Nota E — os sinais não podem depender da cor.** Quem tem deficiência de visão de cor não distingue âmbar de terracota, e blocos de alta, platô e queda aparecem lado a lado no mesmo parecer. Isso vale nos 7 temas.

Consequência obrigatória, não recomendação — **em toda ocorrência, no gráfico e no parecer, cada sinal se distingue por dois canais além da cor:**

| Sinal | Traço no gráfico | Palavra obrigatória no rótulo |
|---|---|---|
| `--lastro-alta` | contínuo | o delta com sinal `+` e o intervalo |
| `--lastro-plato` | tracejado | "sem mudança" + a contagem de semanas |
| `--lastro-queda` | pontilhado | o delta com sinal `−` e o intervalo |

**Cor nunca é o portador da informação — é reforço.** Bloco de evidência ou trecho de gráfico que dependa só da cor para dizer o que é **reprova o gate**. Ver §3.7 e §3.6.6.



### 3.3 Tipografia

> **Trocada em 2026-08-15 (E1, DESIGN.md §6.1).** A família deixou de ser IBM Plex Sans/Mono/Serif e passou a ser Bricolage Grotesque/Archivo/Fraunces. Os três papéis não mudaram — só o token de fonte que cada um resolve.

| Papel | Família | Por quê |
|---|---|---|
| Texto — prosa, rótulo, botão, tudo que se lê no dia a dia | `--lastro-fonte-txt` (Bricolage Grotesque, variável) | C1 (DECISIONS.md 2026-08-15): personalidade contemporânea sem virar genérica, `opsz`/`wdth` variáveis cobrem título e corpo com um arquivo só |
| Números — carga, reps, volume, e1RM, percentual | `--lastro-fonte-num` (Archivo, variável, eixo `wdth`) | C2: condensada proporcional destaca o dado pela família, não só pela cor. **Deixou de ser monoespaçada** — o avanço tabular passou a depender de `font-variant-numeric: tabular-nums`, agora **obrigatório** em todo seletor de número (antes era reforço oportunista, §3.3 anterior a 2026-08-15) |
| Veredito do parecer, e a marca do `/login` — **só os dois** | `--lastro-fonte-serif` (Fraunces, variável) | C4 (aprovado 2026-08-08, família trocada em 2026-08-15): documento emitido ganha voz de documento só na frase que carrega o julgamento — a peça-assinatura, não o resto do app. A marca do `/login` entrou em 2026-08-15 (M1, peça 9, D10 — a primeira impressão do app). **Proibido** usar em qualquer outro lugar — isso reabriria a discussão de "quarta família espalhada" que a tabela original evitava |

Carregadas via `next/font/google` em `src/app/layout.tsx`, cada uma com o eixo variável declarado explicitamente (`axes`) — não a fonte inteira, só os eixos que o app usa. Licenças SIL Open Font License.

**Por que `font-variant-numeric: tabular-nums` é obrigatório agora, e não opcional.** Com a Mono, a largura igual entre dígitos vinha de a fonte ser monoespaçada — `tabular-nums` era só reforço, o navegador podia ignorar sem quebrar nada. A Archivo é **condensada proporcional**: sem `tabular-nums` explícito, a coluna de série "dança" quando 9 vira 10. Todo seletor com `font-family: var(--lastro-fonte-num)` em `sistema.css` declara `font-variant-numeric: tabular-nums` — verificado por contagem (24 seletores de número, 24 declarações da propriedade, 2026-08-15).

**Carregamento sem depender de rede no meio do treino** (J1: o elevador derruba o sinal) — reescrito em 2026-08-15, E1 trocou o mecanismo de carregamento, não só a família:

1. **Zero requisição a terceiro em runtime.** `next/font/google` baixa e auto-hospeda os três arquivos variáveis **em build time**; o navegador nunca busca em `fonts.googleapis.com`. `layout.tsx` declara só os eixos variáveis usados (`axes: [...]` por fonte) — não a família inteira.
2. Subconjunto `latin` (`subsets: ["latin"]`) — cobre `ã õ ç á é í ó ú â ê ô` do PT-BR.
3. Preload e `@font-face` são gerados e injetados pelo próprio `next/font` — não há `<link rel="preload">` nem `@font-face` manual em nenhum arquivo do projeto.
4. `display: "swap"` declarado em cada fonte — se algo atrasar, o texto aparece na pilha de sistema e troca depois. Nunca tela em branco esperando fonte.
5. **Serwist (já na stack, CLAUDE.md) faz precache dos arquivos de fonte que o build gera.** Depois da primeira visita, a fonte vem do service worker — é isso que torna verdadeira a frase "não depende de rede", e não a auto-hospedagem do `next/font` sozinha.
6. A pilha de fallback está declarada dentro de `--lastro-fonte-txt`/`--lastro-fonte-num`/`--lastro-fonte-serif` (`tokens.css`) e **não se repete em lugar nenhum**. O fallback de `--lastro-fonte-num` deixou de ser monoespaçado (§3.3) — Archivo é condensada proporcional, um fallback monoespaçado ficaria mais largo que ela e quebraria layout antes da fonte carregar.

### 3.4 Papéis tipográficos — regra de uso

> **Reescrita em 2026-08-15 (E2, DESIGN.md §6.2).** A escala numerada de 8 degraus (`--lastro-t-meta`/`--lastro-t-corpo`/`--lastro-t-1..8`) foi substituída por seis papéis nomeados. **Regra do gate: quem implementa escolhe o papel, nunca o pixel — tamanho usado sem papel atribuído reprova.**

- **`--lastro-papel-corpo` (16px) é o piso do corpo (D4)** — fixado exatamente no valor que D4 exige. Nenhuma prosa, nenhum rótulo de campo, nenhum texto de botão abaixo dele. **`--lastro-papel-corpo-leitura` (18px)** é a variante do Modo Leitura, único uso: `.doc__prosa` (§3.5) — mantém a distinção de regime que §5 item 3 registra como decisão do dono, não a revoga.
- **`--lastro-papel-rotulo` (14px) é o único degrau abaixo do corpo, e existe para um único papel:** metadado não-corpo — a linha de procedência do parecer (§3.6.3) e rótulos em caixa alta com entreletra aberta. **Proibido na tela de registro**, que é lida em pé, a um braço.
- **`--lastro-papel-secao` (20px)** — seção, conclusão de gráfico, ação primária, itens secundários de um bloco de evidência.
- **`--lastro-papel-titulo-tela` (30px)** — título de tela (barra de topo, cabeçalho do parecer), e o número do bloco de evidência (`.evidencia__numero`).
- **`--lastro-papel-numero-heroi` (48px)** — marca do app (`.entrada__marca h1`, e desde M1 também em `--lastro-fonte-serif`, peça 9 do redesenho). **Exceção nomeada:** o veredito do parecer (§3.6.2, item 2) também usa este papel — maior que o título de seção porque é o elemento que a restrição de §3.0 elege para pesar mais na tela.
- **`--lastro-papel-bancada` (76px)** — número em modo bancada, lido a um braço. **Definido, ainda sem consumidor.** Dois candidatos óbvios foram medidos e descartados por overflow real, não por escolha a priori: `.serie__v` mede 335px de linha em conteúdo a 375px — a esse tamanho o próprio `--lastro-papel-numero-heroi` (48px) já quebra a linha; e `.metrica__valor`, numa grade de 3 colunas (83px de coluna útil a 390px), não cabe um valor de 4 dígitos como "30,2" nem em Número herói (92,5px medidos contra 83px disponíveis — achado pelo dono no gate visual do M1, 2026-08-15). Os dois usam Título de tela (30px, o mesmo valor de antes de E2) em vez de um papel maior.

### 3.5 Dois modos de densidade, um só conjunto de tokens

O app tem duas cenas opostas: **registro** (em pé, com pressa, suado, uma mão, luz ruim) e **leitura do parecer** (domingo, sentado, com calma, às vezes no PC). Tratar as duas igual prejudica as duas.

**Decisão: sim, tratamentos visuais diferentes — mas é uma só paleta e uma só escala.** São dois *regimes de densidade*, não dois temas. Paleta, famílias e escala são idênticas; o que muda é qual papel se usa.

| | **Modo Bancada** (registro) | **Modo Leitura** (parecer, gráfico, histórico) |
|---|---|---|
| Unidade de layout | um alvo por linha, largura total | coluna de leitura, medida confortável |
| Número | Título de tela (30px), `--lastro-el-apertada` | Título de tela (30px), dentro de prosa |
| Texto | Corpo (16px) para cima, sem Rótulo | Corpo-leitura (18px), Rótulo liberado para procedência |
| Espaço entre blocos | `--lastro-e-6` a `--lastro-e-8` | `--lastro-e-8` a `--lastro-e-16` |
| Ação primária | `--lastro-alvo-acao`, largura total, metade inferior (D2, D3) | botões normais, `--lastro-alvo-min` |
| Elementos por tela | poucos, grandes, redundância zero | densidade maior é aceitável: há tempo de leitura |
| Movimento | quase nenhum — `--lastro-dur-1`, só confirmação de toque | transição de entrada em `--lastro-dur-2` |

**Justificativa:** um parecer de três parágrafos em Bancada (76px) vira rolagem infinita e some com a hierarquia; um botão de registrar série em Corpo (16px) numa lista densa erra o toque com dedo suado. A cena manda (§1).

### 3.6 A peça-assinatura: a tela do parecer da Análise Semanal

O risco declarado no PRD §3 é único e específico: **se o parecer parecer um balão de chat, o produto vira "chatbot com gráfico colado" e a tese morre.** Tudo abaixo é construído contra esse risco.

#### 3.6.1 O que o parecer NÃO é — regras de reprovação

Cada item abaixo, se aparecer na tela, **reprova o gate**:

- Balão arredondado alinhado à esquerda, com ou sem rabicho.
- Avatar, iniciais, ícone de robô, nome de assistente.
- Reticências pulsantes, cursor piscando, texto aparecendo letra a letra.
- Voz de interlocutor: "Claro!", "Vamos lá", "Espero ter ajudado", "Posso detalhar?".
- Caixa de digitação abaixo do parecer, ou qualquer convite a responder. **Perguntar é outra tela** (o coach 24h, PRD §4.4). Aqui não se conversa: aqui se lê.
- Selo de "gerado por IA" como enfeite. Procedência se mostra com número, não com adesivo (§3.6.3).

#### 3.6.2 O que ele é: um documento datado

O parecer se apresenta como **peça emitida**, não como mensagem recebida. Estrutura fixa, de cima para baixo:

1. **Cabeçalho de emissão.** A pergunta escolhida como título, em Título de tela (30px). Abaixo, em `--lastro-txt-3` e Rótulo (14px): o intervalo da semana fechada e a data de emissão. Alinhado à esquerda, sobre `--lastro-fundo`, largura total da coluna de leitura. Isso é o que primeiro diz "documento" em vez de "mensagem".
2. **Veredito.** Uma frase, Número herói (48px), `--lastro-peso-forte`, `--lastro-txt`, `--lastro-fonte-serif`. É a resposta à pergunta, sem rodeio. **Maior que o título do cabeçalho** (item 1, Título de tela) — é o salto de escala que carrega a restrição de §3.0: o julgamento pesa mais que a pergunta, não o inverso. Antes de 2026-08-08 o veredito usava o mesmo tamanho do título; a correção existe porque título e veredito no mesmo degrau é exatamente o sintoma que §3.0 nomeia.
3. **Blocos de evidência** — o coração da tela (§3.6.3).
4. **Prosa de leitura.** Um a três parágrafos em Corpo-leitura (18px) / `--lastro-el-corpo`, largura de coluna limitada. A prosa *conecta* as evidências; ela não é onde os números moram.
5. **O que fazer** (só na pergunta 5 do PRD §3). Lista curta, cada item ancorado num bloco de evidência acima.

Nada disso é centralizado, nada é cartão flutuante com sombra. É documento: margem esquerda estável, hierarquia por tamanho e peso, ar entre seções em `--lastro-e-8`+.

#### 3.6.3 Como os números do dono aparecem — a decisão central

**Os números saem da prosa e viram dado tipografado.** Esta é a decisão que separa o parecer de um balão de chat: num chat, o número está enterrado no meio da frase, na mesma fonte, do mesmo tamanho. Aqui não.

**Bloco de evidência** — superfície `--lastro-sup-2`, `--lastro-raio-2`, padding `--lastro-e-5`, e uma **barra vertical de `--lastro-barra-evidencia`** na borda esquerda, na cor do sinal (`--lastro-alta`, `--lastro-plato` ou `--lastro-queda`). Três linhas, sempre nesta ordem:

- **Linha 1 — o exercício, pelo nome que o dono usou.** Corpo (16px), `--lastro-peso-forte`, `--lastro-txt`. Nome de academia em PT-BR, o mesmo do catálogo (PRD §4.5).
- **Linha 2 — o número, em `--lastro-fonte-num`, Título de tela (30px), `--lastro-txt`.** Grande, tabular, com unidade. Quando há comparação, dois números lado a lado com o delta entre eles no sinal correspondente. É a linha que se lê de relance.
- **Linha 3 — a procedência.** Rótulo (14px), `--lastro-txt-3`, `--lastro-fonte-num` para as partes numéricas. Formato: **janela · quantas séries valendo sustentam o número · origem do cálculo.** Exemplo de forma (valores ilustrativos): `4 semanas · 14 séries valendo · calculado no dispositivo`.

**Qual sinal é dono da cor do bloco, quando dois sinais discordam do mesmo exercício.** `tendência_e1rm` (janela de comparação, 4 semanas) e a leitura de platô do gráfico (§3.7, 3 semanas) são medidas diferentes e podem discordar — um exercício pode subir na janela de 4 semanas e estar achatado nas últimas 3. **O bloco de evidência é dono da janela de comparação** (`tendencia_e1rm`/`estagnacoes`, a mesma que a prosa do parecer interpreta): é a cor e o delta dela que vão na barra lateral e na Linha 2. A leitura de platô do gráfico (§3.7) vive só no gráfico — os dois nunca competem pela mesma barra lateral. Se um dia a UI precisar mostrar as duas leituras no mesmo card, a segunda vem como texto qualificado ("subiu na janela de 4 semanas; achatado nas últimas 3"), nunca como uma segunda cor. Decisão registrada em `DECISIONS.md` 2026-08-08, motivada por §3.6.6: duas cores para o mesmo exercício sem regra de precedência é o erro que aquele parágrafo já proíbe entre exercícios diferentes.

**Por que isso responde "é sobre ELE":** um bloco desses é impossível de escrever sem os dados dele. Ele carrega nome de exercício do log dele, número dele, e a contagem de séries dele. É a materialização visual do critério A6 do PRD — *se o bloco pudesse ter sido escrito sem olhar os dados, ele falhou*. E como o bloco é visualmente separado, dá para auditá-lo sem ler a prosa.

**Dentro da prosa**, quando um número precisa aparecer no meio da frase, ele vem em `--lastro-fonte-num` e `--lastro-peso-medio`, na mesma cor do texto. A troca de família já o destaca; **proibido colorir número dentro de prosa** — cor ali confunde com sinal semântico.

#### 3.6.4 Como se mostra que há cálculo determinístico atrás

A regra inegociável do PRD §3 e da CLAUDE.md — o agregador calcula, o LLM só interpreta — precisa ser **visível**, não prometida. Três mecanismos, nesta ordem de importância:

1. **Toda evidência é citável.** Número + unidade + janela + `n` de séries valendo (§3.6.3, linha 3). Chute de modelo não vem com denominador. Isso comunica determinismo melhor que qualquer selo.
2. **A ordem de aparição na tela conta a arquitetura.** O agregador roda local e termina antes de o LLM começar a escrever. Portanto, no estado `gerando`, **os blocos de evidência já aparecem preenchidos**, com números e procedência definitivos, enquanto só a prosa está pendente (§3.6.5). O dono vê que a conta já estava pronta antes do texto existir.
3. **Rodapé de método.** Uma linha em Rótulo (14px) / `--lastro-txt-3`: quais métricas alimentaram este parecer e que séries de aquecimento foram excluídas (regra 3 da CLAUDE.md). Texto fixo, não gerado.

#### 3.6.5 Os quatro estados

| Estado | Como se apresenta | Critério de reprovação |
|---|---|---|
| **Gerando** | Cabeçalho e **blocos de evidência completos e legíveis**. Só a área de prosa está pendente: retângulos em `--lastro-sup-1`, na altura das linhas que virão, com pulso suave em `--lastro-dur-2` (suprimido em `prefers-reduced-motion`). Rótulo `--lastro-txt-3`: "escrevendo a leitura" | Reticências pulsantes, spinner centralizado, texto letra a letra, ou tela vazia enquanto espera → reprova |
| **Sem dados suficientes** | **Diz o que falta e quanto falta**, em número: quantas semanas fechadas existem, quantas o cálculo exige, o que registrar para chegar lá. Estado neutro (`--lastro-txt-2`), sem cor de sinal. Ação primária vira "registrar treino" | Frase genérica tipo "dados insuficientes" sem quantidade → reprova. Uso de `--lastro-erro` → reprova: não é erro, é começo |
| **Erro da API** | **Os blocos de evidência permanecem na tela, íntegros.** Só a prosa falta. Aviso em `--lastro-erro`, uma linha: a leitura não pôde ser escrita; os números abaixo são seus e estão corretos. Botão "tentar de novo" | Perder os números junto com a prosa → reprova. É consequência direta da arquitetura: a conta é local e não dependia da rede |
| **Parecer pronto** | Documento completo, §3.6.2 | — |

**Sincronização (D7)** é outra coisa e vive fora do parecer: indicador discreto em `--lastro-sync`, texto sempre em estado, nunca em susto ("salvo no aparelho", "sincronizado"). **Nunca `--lastro-erro`.**

#### 3.6.6 Alerta de estagnação sem repreensão

O tom é de **observação de instrumento**, não de cobrança. Regras:

- **Cor:** `--lastro-plato` (âmbar). **`--lastro-erro` é proibido em estagnação** — vermelho diz "você errou"; um platô não é erro, é informação.
- **Sem ícone de alerta.** Nada de triângulo, exclamação ou cadeado. A barra lateral do bloco em `--lastro-plato` já marca.
- **Nunca sozinho.** O bloco de platô aparece **ao lado de um bloco em `--lastro-alta`** sempre que houver um. O contraste entre o que anda e o que parou é o formato do parecer — é literalmente a frase-modelo do PRD §3: *"seu supino está em X há N semanas enquanto o agachamento subiu Y% no mesmo período"*.
- **Formulação:** constatação com número, sem verbo de julgamento. Sem "você deveria", "está falhando", "atenção". A leitura é: *o instrumento marcou isto*.
- **Redundância obrigatória, e vale igual para regressão:** o platô se identifica por barra em `--lastro-plato` **e** pela palavra "sem mudança" com a contagem; a queda, por barra em `--lastro-queda` **e** pelo delta com sinal negativo e o intervalo. Pela nota E de §3.2 os sinais não podem depender da cor — **um bloco de queda ao lado de um bloco de platô, distinguidos só por cor, reprova o gate.** A regra de tom (observação, nunca cobrança; nunca `--lastro-erro`) se aplica igualmente aos dois.

> **`N` semanas de estagnação e as faixas de referência por grupo muscular são TODOs abertos do PRD §10, com fonte primária pendente.** Qualquer número desses que apareça em texto de exemplo neste documento é **ilustrativo**. A UI lê o valor real do agregador; nenhum limiar é literal em componente.

### 3.7 O gráfico de progressão — vários exercícios, sem seletor

> **Aprovada pelo dono em 2026-08-14**, depois de ver uma prévia visual da composição (pequenos múltiplos). Esta seção foi **reescrita por inteiro** nesta data, a partir de um redesenho estrutural pedido pelo dono depois de ver a tela `/analise` renderizada de verdade. Confirmação final ainda depende do gate no aparelho dele (§3.9) — a aprovação aqui é sobre a composição, não substitui esse passo.
>
> **Cogitado e descartado na mesma conversa:** um segundo gráfico, de volume por grupo muscular ("estou treinando esse grupo o suficiente?"). A conta (`volumePorGrupoMuscular`, `src/lib/analise/volume.ts`) já existe e já alimenta a pergunta "Meu volume está equilibrado?" da Análise Semanal, em texto, sob demanda — um gráfico fixo repetiria essa informação sem necessidade. Fica fora, registrado aqui pra não ser reproposto sem essa razão.

**O que motivou a reescrita.** O gráfico anterior mostrava um exercício por vez, escolhido por um `<select>` no cabeçalho. Renderizado, esse seletor ficou visualmente indistinguível dos cards de pergunta da Análise Semanal logo abaixo — mesmo raio, mesma altura — e obrigava a escolher um exercício para "revelar" o gráfico. Reação do dono, literal:

> "não, precisa ser revisto esse gráfico, pois minha ideia não era para mostrar ali por cada tipo de exercício, aí fica ruim dessa maneira, eu imaginei sim o gráfico e já deve sim aparecer"

Perguntado se a base deveria deixar de ser "por exercício" (PRD §4.2 pede explicitamente "por exercício: evolução de e1RM... no tempo", então abandonar isso pede revisão de PRD, não só de UI) ou manter por exercício sem seletor, a resposta:

> "sem precisar do seletor, qual a melhor maneira? um gráfico como deveria, mas na lateral cada nome e todos partindo do zero? será que assim pegaria?"

A pergunta é genuína, não uma decisão fechada — a recomendação abaixo responde a ela, aceitando uma parte da ideia e recusando duas partes, com o motivo técnico de cada recusa.

**A pergunta continua a mesma:** não "quanto?", **"está subindo?"** — agora respondida para vários exercícios ao mesmo tempo, sem seletor e sem exigir escolha para o gráfico aparecer.

#### 3.7.1 A composição: pequenos múltiplos, não um canvas só com várias linhas sobrepostas

A ideia do dono (uma linha por exercício, todas no mesmo desenho, com legenda lateral de nomes) foi considerada e **recusada nesta forma**, por dois motivos técnicos, não de gosto:

1. **Sobrepor várias linhas quebra a área de toque e o teclado (item 5 desta seção e gate K6, §4.3).** Cada ponto já exige um alvo de `--lastro-alvo-min` (48px) navegável por foco. Com 4 exercícios × até 12 semanas de histórico, um canvas único teria de acomodar dezenas de alvos de 48px empilhados numa tela de 200px de altura — inviável em qualquer viewport, incluindo o desktop (K6 exige alcançar **cada ponto de cada série** só com teclado).
2. **Distinguir mais de duas linhas só por matiz não sobrevive à paleta do sistema.** O `lastro` não tem uma paleta categórica reservada para "N séries quaisquer" — só tokens semânticos, cada um com papel fixo (`--lastro-alta` é sempre progressão, `--lastro-plato` é sempre estagnação, nunca identidade de exercício; §3.1 (regras de papel) proíbe emprestar cor de um papel para outro). Mesmo usando a rampa de tinta neutra (`--lastro-txt`/`txt-2`/`txt-3`/`--lastro-controle`), a razão de contraste **entre elas** — não contra o fundo — é baixa o bastante (`txt-2` contra `txt-3` gira perto de 1,3:1 no tema padrão, calculado dos tokens) para duas linhas próximas ficarem indistinguíveis a um braço de distância (D4), em luz ruim, exatamente a cena de uso (§1).

**A composição que resolve isso: pequenos múltiplos empilhados — um mini-gráfico por exercício, cada um com sua própria linha e sua própria escala.** Não é um select nem uma legenda: é a mesma estrutura de hoje (nome do exercício + conclusão em palavras + desenho), repetida uma vez por exercício, em pilha vertical, sem exigir nenhuma escolha para aparecer.

- Cada linha usa **os mesmos tokens semânticos de sempre** — `--lastro-alta` contínuo para o trecho de progressão, `--lastro-plato` tracejado para o trecho de platô — porque cada mini-gráfico só tem UMA série. O canal de cor nunca precisa carregar "de quem é essa linha", só "o que esse trecho significa", que é o papel que ele já tinha. Nenhuma cor nova, nenhum token novo.
- O **nome do exercício vira o cabeçalho do próprio painel** (Corpo, `--lastro-peso-forte`, `--lastro-txt`), imediatamente acima do desenho a que pertence. Isso **é** rotulagem direta — o nome está colado na linha, não numa legenda separada que obriga cruzar cor com texto. O item 1 original ("sem legenda lateral, sem obrigar a cruzar cor com nome") **não muda**; é cumprido por uma composição diferente.
- A área de toque de cada ponto (48px) some sobre um canvas menor, mas de uma série só por vez — sem sobreposição, o problema do item 1 desta subseção desaparece.

#### 3.7.2 Escala: em kg absoluto por painel, não normalizado a partir de zero

A segunda parte do pedido do dono — "todos partindo do zero" — foi entendida como normalizar cada série (delta % ou delta kg desde a primeira marca) para caber Supino (~80kg) e Rosca (~15kg) na mesma escala visual. **Recomendação: não normalizar.** Com pequenos múltiplos cada painel já tem escala própria — o problema que a normalização resolveria (escalas incompatíveis num canvas compartilhado) não existe mais nesta composição. E normalizar introduz uma distorção que o dono não pediu: numa escala de "% desde o início", um Rosca que sobe de 15kg para 21kg (+40%) desenha uma subida mais dramática que um Supino que sobe de 80kg para 86kg (+8%), quando ambos ganharam 6kg — a mesma distorção que o código atual já evita internamente (`baseValida`, quando a base é 0) fica maior, não menor, se virar a base de comparação entre exercícios diferentes. Kg absoluto por painel, com a própria escala do exercício, é o que se confere direto contra o que o dono registrou — e é exatamente essa conferência que §3.0/D8 pedem.

A conclusão em palavras (item 2 abaixo) continua a carregar o delta em **%** quando a base é válida (mesma regra de hoje) — isso já resolve "está subindo, e quanto, proporcionalmente" sem exigir que o desenho normalize.

#### 3.7.3 Quantos exercícios, e quais

**Teto: até 4 painéis simultâneos**, ordenados pelo mesmo critério que já decide o exercício padrão hoje (`sessoesNoPeriodoPorExercicio`, `src/lib/dados/progressao.ts`) — mais sessões dentro da janela de `SEMANAS_HISTORICO` primeiro. Só entram exercícios com **pelo menos 2 semanas com sessão elegível para e1RM** (a mesma barra de "suficiente" que já existe por exercício, §3.7 item 6 de hoje) — um exercício com 1 sessão não vira painel, do mesmo jeito que hoje não vira gráfico.

Por que 4, e não um número maior: é orçamento de altura de tela, não de paleta. Em 360×640 (piso do gate, §4.1), a barra de topo e a folga da aba inferior já consomem uma fatia fixa; cada painel — cabeçalho do nome, conclusão em uma ou duas linhas, mini-desenho — pede em torno de 150–180px. Quatro painéis cabem com rolagem curta antes da seção da Análise Semanal; um quinto empurraria o botão "Solicitar Análise" para muito longe da dobra, e a essa altura o exercício adicional já é o menos treinado do período — o menos provável de interessar a leitura da semana.

Menos de 4 exercícios elegíveis: mostra só os que existem (1, 2 ou 3 painéis). Zero exercícios elegíveis: mesma tela vazia global de hoje ("ainda não há sessões suficientes de nenhum exercício").

Não há afordância para "ver mais" além do teto nesta proposta — é escopo deliberado, não esquecimento: a tela responde "os exercícios que mais apareceram esta janela estão subindo?", não "todo o catálogo". Se o dono quiser auditar um exercício fora do top 4, isso é outra necessidade (histórico completo por exercício), fora do que este gráfico se propõe a responder.

#### 3.7.4 Regras por painel (preservadas do desenho anterior, agora aplicadas por exercício)

1. **Rotulagem direta.** Nome do exercício como cabeçalho do painel (não legenda); primeiro e último ponto da série rotulados no próprio desenho, em `--lastro-fonte-num`.
2. **A conclusão em palavras, acima do desenho de cada painel.** Uma linha em Seção (20px): o delta em número (% quando a base é válida, kg quando não) e o intervalo, em português. Quem só lê essa linha já sabe o resultado daquele exercício; o desenho é a prova.
3. **Platô é desenhado, não deduzido — por painel.** O trecho sem mudança vira segmento **tracejado** em `--lastro-plato`, com anotação ancorada dizendo há quantas semanas. Trecho de progressão é **contínuo** em `--lastro-alta`. Como cada painel tem uma série só, o canal de traço fica livre para significar platô/progressão — não precisa significar "de qual exercício é esta linha", que já é resolvido pelo cabeçalho.
4. **Sem grade de fundo densa, por painel.** No máximo uma linha de referência horizontal com propósito declarado (ex.: melhor marca daquele exercício), rotulada nela mesma.
5. **Área de toque.** Ponto do gráfico tem alvo de no mínimo `--lastro-alvo-min`, mesmo que o marcador desenhado seja pequeno. Sem sobreposição de séries, o teto de 4 exercícios não aproxima o total de alvos por painel do problema do item 1 de §3.7.1.
6. **Alternativa textual, por painel.** Cada painel tem um resumo em texto acessível a leitor de tela, com os mesmos números dos rótulos diretos, precedido pelo nome do exercício (a lista de leitura de tela deixa de ser uma só para o gráfico; vira uma por painel, cada uma anunciando de qual exercício fala antes dos números).
7. **Viável na stack (Recharts, CLAUDE.md):** cada painel é a mesma `LineChart` de hoje, repetida; nada aqui exige componente ou biblioteca fora do que já está em uso.

#### 3.7.5 Para quem for implementar — mudança de contrato de dados

`src/lib/dados/progressao.ts` já busca **todos** os exercícios numa única consulta (`treino`/`serie` sem filtro, linhas 69–74) e hoje reduz isso a um exercício em memória (linha 144). A proposta não pede consulta nova nem mais pesada — pede trocar essa redução de "um exercício, escolhido por `exercicioId` opcional" para "até 4, ranqueados, sem parâmetro nenhum":

- `DadosProgressao` deixa de ser `{ exercicio, opcoes, pontos, plato }` (um exercício) e passa a ser uma lista de painéis, cada um com o formato que `{ exercicio, pontos, plato }` já tem hoje — a função `calcularSeriesSemanais`/`detectarPlato` roda uma vez por exercício selecionado, igual já roda hoje para o exercício único.
- `opcoes` (a lista para popular o `<select>`) perde a função — não há mais seletor. O ranking que hoje monta `opcoes` (`sessoesNoPeriodoPorExercicio`) passa a decidir DIRETAMENTE quais até 4 exercícios entram na lista, em vez de só decidir o padrão de um `<select>`.
- `?exercicioId=` na rota `/api/progressao` e o callback `carregar(exercicioId)` do componente ficam sem uso — não há mais escolha do usuário a comunicar ao servidor.
- `<select className="grafico-progressao__seletor">` sai do componente; no lugar, um `.map` sobre os painéis, cada um renderizando o que `GraficoConteudo` já faz hoje.

#### 3.7.6 O gate não muda

O roteiro de §4 — G6 (celular real e desktop, "só a cor distingue platô de progressão" continua reprovando; "falta a conclusão em palavras acima do desenho" continua reprovando, agora por painel) e K6 (alcançar cada ponto e a anotação de platô só com teclado) — **continua válido exatamente como está escrito**, sem precisar de revisão. Isso por si só é um sinal de que a composição em pequenos múltiplos cabe no sistema existente: nenhuma regra de acessibilidade ou de contraste precisou ceder para acomodar "vários exercícios ao mesmo tempo". A única leitura adicional para o controller do gate: G6 e K6 agora se aplicam **a cada painel visível**, não a um gráfico só.

### 3.8 Autoconsistência — onde os literais moram agora

Desde 2026-08-06 o bloco `:root` vive em **`src/app/tokens.css`**, não neste arquivo. A regra de fonte única não mudou de força; mudou de endereço.

**O que pode conter valor literal:**

- `src/app/tokens.css` — o `:root`, e só ele.

**O que aparece fora dele neste documento, e é legítimo:**

- **razões de contraste** que eventualmente aparecerem aqui — resultado de medição, não valor de design (a fonte delas é a `e2e/j5-contraste.spec.ts`);
- **limiares do WCAG** (4.5 e 3.0) — norma externa, não decisão nossa;
- os literais `48px` e `16px` em **D1 e D4 (§2)** — restrições congeladas, anteriores ao gate. Os tokens `--lastro-alvo-min` e `--lastro-papel-corpo` valem exatamente isso, e é o token que o código usa;
- os **hex da tabela de §3.1** — reprodução para leitura humana; o valor que executa é o do `tokens.css`;
- o **nome das famílias** em §3.3 e §5, citado para justificar e para o dono aprovar.

**As exceções no código, todas por limitação de formato, e nenhuma outra é aceita:**

- `viewport.themeColor` em `src/app/layout.tsx` — o metadata do Next não aceita `var()`. Acompanha `--lastro-barra-a`.
- **fio de 1px** — `border: 1px`, `translateY(1px)` do estado pressionado, e o `width/height: 1px` do utilitário de leitor de tela. 1px é fio de cabelo, não degrau de escala; a escala começa em 4.
- o `2px` da divisória de `.grupo__cab` e `.doc__emissao`, pelo mesmo motivo.

**Verificação executável — deve voltar vazia:**

```bash
grep -nE '#[0-9A-Fa-f]{3,6}|[0-9]+rem|[0-9]{2,}px|rgba([0-9]' src/app/sistema.css
```

Rodada em 2026-08-06: vazia. **Cinco violações foram encontradas e corrigidas nesta passagem** — o `26rem` da coluna do login, o traço do botão de barra, o desfoque do vidro, a sombra da aba inferior e a segunda linha do botão primário, todos promovidos a token.

### 3.9 O que este documento NÃO é
Não é a medição: o contraste sai de `e2e/j5-contraste.spec.ts` (7 temas, pixel renderizado); o texto sobreposto ou cortado, de `e2e/j41-sobreposicao-idiomas.spec.ts` e `e2e/j26-cobertura-ux03.spec.ts`. **O que nenhuma medição substitui é o olho do dono no celular real** (§5, advertência): o gate de §4 para as telas logadas (`/treino`, `/treino/[id]`, `/analise`) segue sendo executado por ele, no aparelho.

---

## 4. Gate visual — roteiro de execução (o Diretor de Arte NÃO executa)

Entregável desta seção: o roteiro que o **controller** executa. Cada item traz tela, viewport, o que medir e **o critério de reprovação**. Item reprovado bloqueia o merge; não vira "ajuste depois".

### 4.1 Telas e viewports obrigatórios

| # | Tela | Onde | Reprova se |
|---|---|---|---|
| G1 | Registro de série, treino em andamento | **Celular real**, navegador real (A10 do PRD) | Ação primária fora da metade inferior (D2), ou "repetir última série" não é o maior alvo da tela (D3) |
| G2 | Parecer pronto | Celular real e desktop | Qualquer item da lista de reprovação de §3.6.1 presente |
| G3 | Parecer — estado *gerando* | Celular real | Blocos de evidência não estão preenchidos antes da prosa (§3.6.4, mecanismo 2) |
| G4 | Parecer — *sem dados suficientes* | Celular real | Falta a quantidade explícita do que falta, ou uso de `--lastro-erro` |
| G5 | Parecer — *erro da API* | Celular real | Os blocos de evidência sumiram junto com a prosa |
| G6 | Gráfico de progressão com platô | Celular real e desktop | Só a cor distingue platô de progressão; ou não há conclusão em palavras acima do desenho |
| G7 | Indicador de sincronização, offline e após reconectar | Celular real, modo avião | Estado de sync em `--lastro-erro` ou com linguagem de alarme (D7) |

Viewports mínimos: **360×640** (piso realista de celular), **390×844**, **1280×800** (D9: o PC é onde se lê o gráfico com calma).

### 4.2 Contraste — medir, não confiar na tabela

> **Reescrita em 2026-10-01 (DOC-03):** a tabela C1–C14 era da paleta Areia e foi removida (só a linha C3 tinha sido remedida contra o Apex Pro). A medição agora é executável e roda nos **7 temas**: `e2e/j5-contraste.spec.ts` mede o pixel renderizado, com as camadas translúcidas compostas, troca o tema pela interface (`/ajustes/temas`), usa conta descartável e passa por 8 rotas. Ela reprova abaixo dos limiares de §3.2 (4,5:1 para texto normal; 3:1 para texto grande e limite de componente). O par mais apertado do sistema é `--lastro-txt-3` sobre `--lastro-sup-3`.

Medir com conta-gotas sobre a tela **renderizada** continua valendo para qualquer peça nova que a `j5` ainda não alcance. Pares a conferir, sem número fixo (o número é o que sair da medição): texto e secundário sobre cada superfície; metadado sobre `sup-3`; texto da ação sobre o pior passo do gradiente; limite do botão e `--lastro-controle` (3:1); foco contra a superfície do vão do `outline-offset` (3:1); sinais (`alta`, `plato`, `queda`, `sync`) sobre as superfícies em que são desenhados; `--lastro-erro` sobre `sup-3`, o pior caso do erro.

**Reprova geral:** qualquer texto sobre imagem, vídeo, gradiente ou sobreposição translúcida cujo contraste não seja mensurável em ponto fixo. O sistema não usa texto sobre imagem ou vídeo, e sobre gradiente mede-se o passo de pior caso (§3.0, §3.2) — se apareceu fora disso, é regressão.

### 4.3 Foco e teclado (D9)

| # | Percurso | Reprova se |
|---|---|---|
| K1 | G1 inteira só com `Tab`/`Shift+Tab`: chegar a "repetir última série" e acioná-la com `Enter` e `Espaço` | Algum controle não recebe foco; ordem de tabulação diferente da ordem visual; foco entra em elemento invisível |
| K2 | G2 inteira com teclado, incluindo "tentar de novo" do estado de erro | Anel de foco ausente, com `outline-offset: 0`, ou invisível sobre a ação primária |
| K3 | Seleção da pergunta da Análise, só com teclado | Não dá para escolher sem ponteiro |
| K4 | `Esc` em qualquer sobreposição; foco volta ao gatilho | Foco perdido para o `<body>` |
| K5 | Nenhuma armadilha de foco fora de diálogo modal | Tabulação presa em qualquer outro lugar |
| K6 | **G6 no desktop, só com teclado (D9 diz que o PC é onde o gráfico é lido):** alcançar cada ponto da série e a anotação de platô, e obter o valor de cada um sem ponteiro | **Valor do gráfico acessível apenas por `hover` reprova.** O tooltip padrão do Recharts responde a mouse — se não houver equivalente por foco, ou o resumo textual de §3.7 item 6 não estiver no fluxo de leitura de tela, reprova |

Anel de foco: `--lastro-foco-espessura` sólido em `--lastro-foco`, com `--lastro-foco-afast` de afastamento, **em todos os controles, sem exceção** — `outline: none` sem substituto equivalente reprova em qualquer lugar do app.

### 4.4 Alvos e ergonomia (D1, D2, D3)

| # | Medição | Reprova se |
|---|---|---|
| T1 | Medir a **caixa renderizada** de todo alvo de G1 no inspetor — não presumir pelo CSS | Qualquer alvo abaixo de `--lastro-alvo-min` em **ambas** as dimensões |
| T2 | Distância entre alvos vizinhos | Menor que `--lastro-alvo-folga` |
| T3 | Altura da ação primária | Menor que `--lastro-alvo-acao`, ou não ocupando a largura total |
| T4 | Posição da ação primária em 360×640 | Fora da metade inferior da viewport (D2) |
| T5 | Toque real com uma mão só, polegar, aparelho físico | Precisar reposicionar o aparelho para registrar uma série |

### 4.5 Tipografia e rede

| # | Verificação | Reprova se |
|---|---|---|
| F1 | Aba de rede: recarregar G1 e G2 | Qualquer requisição de fonte para host de terceiro |
| F2 | Segunda visita **em modo offline** (aba avião / SW ativo) | Fonte não vem do cache do service worker; texto some ou cai em fallback permanente |
| F3 | Coluna de números com dígitos variando (9→10→100) em G1 e G2 | Largura da coluna muda entre quadros |
| F4 | Menor texto renderizado em G1 | Qualquer texto abaixo de Corpo (`--lastro-papel-corpo`) na tela de registro |
| F5 | Menor texto renderizado em G2 | Qualquer texto abaixo de Rótulo (`--lastro-papel-rotulo`), ou prosa abaixo de Corpo-leitura (`--lastro-papel-corpo-leitura`) |

### 4.6 Fonte única

| # | Verificação | Reprova se |
|---|---|---|
| S1 | Busca por hex (`#[0-9a-fA-F]{3,8}`) em todo o código do app | Qualquer ocorrência fora do arquivo que materializa o `:root` de §3.1 |
| S2 | Busca por literais `px`/`rem` em componentes e por nome de fonte | Qualquer ocorrência fora do `:root` |
| S3 | Cor passada como literal para Recharts | Qualquer prop de cor que não leia um token |

---

## 5. Decisões do dono — RESOLVIDAS em 2026-08-06 (histórico)

> **Estado em 2026-10-01:** estas decisões ficam como razão histórica. **Superadas pelo Apex Pro (2026-08-20):** o item 1 (a personalidade "Areia & Azul Petróleo") e a revisão de D5 (tema claro como padrão). **Trocado em 2026-08-15:** o item 2 (o par tipográfico). **Seguem valendo:** os itens 3, 4 e 5, e o 6 (procedência em Rótulo).

| # | O que estava em aberto | Decisão |
|---|---|---|
| 1 | **A personalidade** (§3.0) | **Reprovada** a proposta de instrumento sóbrio sem gradiente nem 3D. Aprovado o padrão *"Areia & Azul Petróleo"* **com matéria** — gradiente, vidro, bevel e sombra. Razão do dono, registrada: sem elevação, "parece que fica algo solto" |
| 2 | **O par tipográfico** | **IBM Plex Sans + IBM Plex Mono**, confirmado em 2026-08-06. Trocado em 2026-08-15 por Bricolage Grotesque + Archivo (E1, §3.3) — mesma decisão de arquitetura (carregado por `next/font/google`, `display: swap`, subset latin), família diferente |
| 3 | **Os dois regimes de densidade** (§3.5) | **Mantidos.** Modo Bancada e Modo Leitura seguem com tratamentos diferentes |
| 4 | **O parecer como documento datado** (§3.6) | **Mantido**, e reforçado: a proibição de conversa deixou de ser geral e passou a ter escopo (ver abaixo) |
| 5 | **Âmbar para platô** em vez de vermelho | **Mantido.** `--lastro-plato` é âmbar; vermelho segue proibido em estagnação |
| 6 | **O tamanho da linha de procedência** | **Mantida em Rótulo (`--lastro-papel-rotulo`, 14px desde sempre — só o nome do token mudou em 2026-08-15, E2).** O par mais apertado do sistema é `--lastro-txt-3` sobre `--lastro-sup-3`, e quem o mede é o teste `e2e/j5-contraste.spec.ts` |

**A revisão que veio junto e não estava na lista: D5.** O tema padrão passou de escuro para **claro**. É restrição funcional revista pelo dono, com o risco original — academia com luz baixa, leitura noturna — aceito conscientemente. **Superada em 2026-08-20:** o redesenho Apex Pro devolveu o escuro como padrão (§2, D5).

**A proibição de balão ganhou escopo.** Antes valia como regra geral de estética; agora vale só onde tem razão de produto:

- **Na tela do parecer, reprova:** rabicho, blocos alternando lado, avatar, ícone de robô, reticências pulsantes, texto letra a letra, caixa de digitação, selo de "gerado por IA".
- **Canto arredondado, elevação e sombra NÃO reprovam em lugar nenhum** — são do padrão. O que faz uma peça ler como conversa é o rabicho, a alternância e o campo embaixo, não o raio da borda.
- **No coach 24h o balão é correto e completo**, com rabicho, alternância e campo de digitação. É a única tela do app onde se conversa (PRD §4.4).

**Advertência que continua de pé:** a validação final de qualquer peça visual é **olho do dono em navegador real, no celular**. Medição de DOM não substitui — `getComputedStyle` não detecta toda renderização errada.

---

## 6. Vocabulário do redesenho — Trilha B (em grande parte implementado; o estado de cada peça está nas tabelas abaixo)

> **Este bloco existe porque um documento cuja fonte era artifact não é fonte durável de projeto.** As 10 decisões do dono que fundamentam esta seção, com a evidência e a alternativa descartada de cada uma, estão em `DECISIONS.md` 2026-08-15; aqui fica só o vocabulário resultante. O plano de execução da época (o backlog do redesenho) foi arquivado em 2026-10-01 e continua no git; o que falta fazer vive só em `docs/BACKLOG-CANONICO.md`.
>
> **Travas que continuam valendo em toda a Trilha B:** a pílula de navegação (`.nav`, `aba-inferior.tsx`, tokens `--lastro-nav-*`/`--lastro-vidro-nav*`) fica intacta, e nenhuma cor nova entra fora de `tokens.css`. A trava original, "nenhum pigmento da paleta muda", era da paleta Areia e perdeu o sentido com o Apex Pro.
>
> **Estado (reconciliado em 2026-10-01, DOC-03):** o Nível 1 (E1 a E4) está em produção, e §6.1, §6.2 e §6.7 (duração e curva) descrevem o que o código executa. Dos Níveis 2 e 3 (M1 a M9, H1 a H4), o estado de cada peça está em §6.5 e §6.6, com a data de cada entrega; o que está marcado "pendente" ali **não foi reconferido contra o código** em 2026-10-01. Conferido: a serifa (`--lastro-fonte-serif`) só é usada na marca do `/login` (`.entrada__marca h1`) e no veredito do parecer (`.doc__veredito`), então a propagação da peça 9 para a prosa do parecer e do Coach segue pendente.
>
> **Sobre os literais que ainda aparecem abaixo em §6.3–§6.6 (tamanho em px, duração em ms):** continuam sendo o **alvo decidido**, não valor executável, e fora da lista de exceções de §3.8 até a peça correspondente ser implementada — mesma regra de antes, agora só para o que falta.

### 6.1 As três famílias (D1) — implementadas em §3.3 (E1, 2026-08-15)

| Papel | Família | Eixos variáveis |
|---|---|---|
| Voz — prosa do parecer, título de conteúdo | **Fraunces** | `opsz, wght, SOFT, WONK` |
| Dado — carga, reps, volume, e1RM | **Archivo** (condensada) | `wdth, wght` |
| Corpo — tudo que se lê no dia a dia | **Bricolage Grotesque** | `opsz, wdth, wght` |

Não é meio-termo entre as opções descartadas (tudo Archivo, ou tudo Fraunces+Bricolage) — é divisão de trabalho: a serifa carrega a prosa do parecer (o produto), a condensada carrega o dado (carga/e1RM/volume). Espelha a tese "o log é infraestrutura, o produto é a leitura" (`CLAUDE.md`).

**Archivo substitui a monoespaçada de hoje** — precisa de `font-variant-numeric: tabular-nums` explícito, porque a garantia de avanço tabular que a Mono dava por ser monoespaçada (§3.3) não existe numa condensada proporcional.

**Reprova:** uma quarta família aparecendo fora deste papel; Archivo sem `tabular-nums` em coluna de série.

### 6.2 Os 6 papéis tipográficos (D2) — implementados em §3.4 (E2, 2026-08-15)

Substituíram `--lastro-t-meta`/`--lastro-t-corpo`/`--lastro-t-1..8` por papéis **nomeados**, não números crus. O mapa de cada seletor de `sistema.css` para o papel escolhido, com a justificativa de cada caso não-óbvio, está em §3.4.

| Papel | Tamanho |
|---|---|
| Rótulo | 14 |
| Corpo | 16 |
| Seção | 20 |
| Título de tela | 30 |
| Número herói | 48 |
| Bancada | 76 |

**Regra que vale como gate: quem implementa escolhe o papel, nunca o pixel.**

**Reprova:** tamanho usado sem papel atribuído.

### 6.3 Os 2 padrões de superfície (D3)

Decididos pelo que a linha **É**, não por preferência de tela em tela:

| Padrão | Quando usar | Tratamento |
|---|---|---|
| **Navega** | a linha leva pra outro lugar | recipiente macio + chevron |
| **Dado** | a linha só mostra um número ou estado | sem recipiente, em grade |

**Medido a 360px** (motivação da decisão): 6 anilhas em grade = 88px, contra 372px nas 6 linhas de hoje — é a diferença entre "dado" tratado como "navega" e tratado pelo que ele é.

**Reprova:** dado (número que só se lê, nunca se toca pra navegar) dentro de um recipiente com borda; item que navega sem recipiente nem chevron.

> **Implementado (M3/M4, 2026-08-15).** "Dado" — `/ajustes/anilhas` (`.grade-anilhas`/`.anilha`). "Navega" — toda linha com `.item__link` ganhou seta (`SetaNavegacao`, `sistema.css` `.item__seta`): `/ajustes` (Coach, Modelos de treino, Anilhas), `/` e `/treino` (histórico de treino), `/catalogo/[id]` (histórico de série). `.item`/`.lista` continuam reservados a linhas que navegam de verdade — `/ajustes/modelos` usa `.item` pra uma lista de DADO (nome do modelo, sem link), fora do escopo de M3/M4 e ainda não corrigido.

### 6.4 A regra verbo × substantivo (D4)

Ação usa o **mesmo recipiente da navegação, sem chevron** — a seta ausente é pista fraca sozinha, então um segundo canal por classe gramatical compensa: **rótulo de navegação é substantivo; rótulo de ação é verbo.**

**Reprova:** rótulo de navegação em verbo; rótulo de ação em substantivo; ação com chevron.

> **Implementado em parte (M4, 2026-08-15).** O lado "navega" está em produção (nota acima). O lado "ação dentro de lista" **não tem consumidor ainda** — auditado e nenhuma linha de ação existe hoje dentro de uma `.lista` (o candidato mais próximo, "Sair" em `/ajustes`, já é um `.botao-secundario` avulso, fora do sistema de linhas, e nada nele reprova a regra). Fica definida, sem CSS órfã: quando um caso real aparecer (ex.: M6), reusa `.item`/`.item__link` sem `.item__seta`. Mesmo padrão de "papel definido, sem consumidor" já usado em `--lastro-papel-bancada` (E2). De passagem, um achado real: `/treino` tinha "ver" como rótulo secundário numa linha de navegação — um verbo, a reprova exata desta regra — corrigido para a metadata real (`{n} séries`).

### 6.5 As dez peças

Cada peça vem de um app premiado (Apple Design Award ou finalista), recriada na paleta do `lastro` — nenhuma cor nova.

| # | Peça | Origem | Onde entra | Reprova |
|---|---|---|---|---|
| 1 | Rótulo micro + valor grande | Gentler Streak · Oura · Hevy | Todo número do app: volume, e1RM, carga, frequência | Número solto sem rótulo acima, ou rótulo no mesmo papel tipográfico do número |
| 2 | Grade de métricas, sem recipiente | Gentler Streak | Resumo da Análise, cabeçalho do treino, ficha do exercício | Métrica dentro do próprio cartão com borda — volta ao padrão "navega" que §6.3 proíbe para dado |
| 3 | Linha de navegação e linha de ação | Oura | Toda lista do app — a base de §6.3 e §6.4 | Linha de ação com chevron; linha de navegação com rótulo em verbo |
| 4 | Controle segmentado — **auditado (M7, 2026-08-15), nenhum alvo existe hoje** | Structured | Trocar o que o gráfico da Análise mostra; filtrar histórico do exercício | `<select>` usado pra essa troca — o próprio seletor que o dono mandou tirar em 2026-08-14. **Já não existe**: §3.7 (2026-08-14) eliminou a escolha em vez de trocar o `<select>`; `/catalogo/[id]` nunca teve filtro de métrica pra trocar. Construir um segmentado aqui inventaria funcionalidade nova, fora de escopo de redesenho visual |
| 5 | Chips de seleção — **implementada (M7, 2026-08-15)** | Strava · Structured | Grupo muscular no catálogo e na criação de modelo | Lista vertical de caixas de seleção pra grupo muscular |
| 6 | Etiqueta de estado — **implementada (M5, 2026-08-15)** | Gentler Streak · Oura | Progressão, platô, recorde | Estado marcado só por cor — precisa de ícone + palavra + cor, os três canais (§3.2 nota E, a mesma regra já vale para o parecer) |
| 7 | Tabela com cabeçalho de coluna — **implementada (M8, 2026-08-15)** | Hevy | As séries do treino | Séries sem cabeçalho de coluna alinhado — é a peça que fecha o desalinhamento que abriu a sessão do diagnóstico de design |
| 8 | Ação fantasma dentro da seção — **implementada em parte (M6, 2026-08-15)** | Hevy | "Adicionar série" ⚠️ **pendente até H1** (hoje é o gatilho fixo de `.acao-area`, D2/D3 — converter agora esvaziaria a única forma de registrar série na tela), "adicionar anilha" ✅, "criar modelo" ✅ | Ação secundária com o mesmo peso visual da ação primária da tela |
| 9 | Prosa com título em serifa | Oura | O parecer da Análise Semanal, o Coach e a marca do `/login` (§6.6, D10) — a voz do produto | Fraunces usada fora do parecer, do Coach e da marca (mesma proibição que já vale pra Plex Serif em §3.3) — **mas o alcance dela dentro do parecer cresce, ver nota abaixo** |
| 10 | Folha com alça — **implementada em parte (H1, 2026-08-15)** | Strava · Structured | Editar série, criar modelo, **editar perfil ✅**, **adicionar anilha ✅** | Tarefa curta abrindo em rota cheia em vez de folha; folha sem fechar arrastando pra baixo |

**Nota sobre a peça 9 — ela alarga o alcance da terceira família, não só troca a fonte.** §3.3/C4 (aprovado 2026-08-08) restringe a Fraunces ao **veredito, e só ele**, dentro do parecer — o resto do documento (cabeçalho, prosa, procedência) é Bricolage. A peça 9 usa a serifa no **título de conteúdo** da prosa inteira do parecer e do Coach, não só no veredito — isso ainda não foi implementado (é trabalho de propagação do Nível 2/3, não de M1). Quando for, ela **substitui** o escopo de C4 nesses dois lugares — a serifa passa a valer para título + veredito, ainda proibida em qualquer outro lugar do app **exceto a marca do `/login`**, que já usa Fraunces desde M1 (2026-08-15) por decisão própria de D10/§6.6, não por essa revisão de C4. Até a propagação chegar no parecer, §3.3 continua sendo a regra que vale ali.

### 6.6 O mapa: qual peça em qual tela

| Tela | Peças | O que ganha |
|---|---|---|
| `/` (início) | 1 · 2 · 3 · 6 | o estado do dia vira grade de métricas; a ação de treinar deixa de ser bloco entre blocos. **M9 propagado ✅ (H4, 2026-08-16)** — aba de topo, sem `VoltarFlutuante` |
| `/treino` | 3 · 6 · 10 | iniciar/continuar como ação clara; escolher modelo vira folha. **M9 propagado ✅ (H4, 2026-08-16)** — aba de topo, sem `VoltarFlutuante` |
| `/treino/[id]` | 1 · 7 · 8 · 10 | séries em colunas com cabeçalho; registrar e editar viram folha; "adicionar" fantasma. **M9 propagado ✅ (M9, 2026-08-15)** — feita na própria PR que construiu o mecanismo |
| `/analise` | 1 · 2 · 4 · 6 · 9 | a peça-assinatura: serifa na leitura, grade no dado, segmentado no gráfico. **M9 propagado ✅ (H4, 2026-08-16)** — `TituloTela` sem `VoltarFlutuante` (aba de nível de topo não tem "voltar") |
| `/catalogo` | 5 · 3 | grupos viram chips; fichas perdem moldura e viram linhas de navegação. **M9 propagado ✅ (H4, 2026-08-16)** — aba de topo, sem `VoltarFlutuante` |
| `/catalogo/[id]` | 1 · 2 · 4 · 7 | histórico com cabeçalho de coluna; segmentado troca a métrica. **M9 propagado ✅ (M9, 2026-08-15)** — feita na própria PR que construiu o mecanismo |
| `/coach` | 9 | a única tela onde balão se justifica; título e prosa na voz do produto. **M9 propagado ✅ (H4, 2026-08-16)** — `VoltarFlutuante` pra `/ajustes` |
| `/ajustes` | 3 | já é a mais correta hoje; só herda a linha de navegação nova. **M9 propagado ✅ (H4, 2026-08-16)** — aba de topo, sem `VoltarFlutuante` |
| `/ajustes/anilhas` | 1 · 2 · 8 · 10 | anilhas viram grade (88px no lugar de 372px); **navegar até aqui vira folha ✅ (H1, 2026-08-15)** — a rota cheia de fallback (URL direta/refresh) **✅ M9 propagada (H4, 2026-08-16)**, `TituloTela`+`VoltarFlutuante` no lugar de `.barra-topo`. Peça 1 (rótulo micro + valor grande) auditada: os valores de anilha já vivem sob o cabeçalho de seção "Anilhas disponíveis", que cumpre o papel de contexto — nenhum trabalho novo considerado necessário |
| `/ajustes/modelos` | 3 · 5 · 8 · 10 | modelos como linhas de navegação; criar vira folha com chips. **M9 propagado ✅ (H4, 2026-08-16)** — `VoltarFlutuante` pra `/ajustes` |
| `/perfil` | 1 · 10 | vira folha ✅ (H1, 2026-08-15); o nome ganha papel tipográfico (hoje é texto sem classe nenhuma) — **pendência aberta, fora de H4**. **M9 propagado ✅ (H4, 2026-08-16)** na rota cheia de fallback (URL direta/refresh) — `VoltarFlutuante` pra `/ajustes` |
| `/login` | 9 | primeira impressão do app (D10) — hoje é a tela mais genérica de todas |

**Este mapa cobre 12 das 13 telas do artifact original.** `/ajustes/modelos/novo` existe no app (ver rota em `src/app/ajustes/modelos/novo/`) e não recebeu peça mapeada na sessão que gerou o vocabulário — ficou de fora por omissão do artifact, não por decisão. **Parcialmente resolvido em M7 (2026-08-15):** o 1º passo da tela (escolher grupo muscular, via `SeletorGrupoMuscular`) ganhou peça 5 (chips). O 2º passo (escolher exercícios, lista de caixas de seleção em `modelo-treino-form.tsx`) continua sem peça mapeada — fica pendência aberta. **M9 propagado ✅ (H4, 2026-08-16)** — `VoltarFlutuante` pra `/ajustes/modelos` (o pai real, não `/ajustes`).

**Ordem sugerida de propagação** (item H4 do backlog do redesenho, arquivado em 2026-10-01 e disponível no git): `/ajustes/anilhas` (pequena, exercita quase tudo) → `/analise` (peça-assinatura) → `/treino/[id]` (a mais complexa) → o resto. Uma tela por PR, olhada no celular antes da seguinte. **`/ajustes/anilhas` — ✅ fechada (H4, 2026-08-16).** A rota cheia de fallback (`src/app/ajustes/anilhas/page.tsx`) trocou `.barra-topo` por `TituloTela`+`VoltarFlutuante` — mesmo mecanismo do M9, terceiro consumidor real. Próxima da fila: `/analise`.

### 6.7 Padrões de transição (D7) — tokens em `tokens.css` desde E4 (2026-08-15), aplicação parcial (H3, 2026-08-16)

E4 só criou os tokens de duração e curva abaixo em `tokens.css` (`--lastro-dur-3..6`, `--lastro-curva-padrao`, `--lastro-curva-enfatizada`). Aplicar duração/curva à pílula, sub-tela, folha e segmentado é trabalho do Nível 3 (H3).

Conjunto contido do Material 3 — **sem container transform**, que o próprio M3 chama de "o mais expressivo" e o dono recusou por excesso.

| Elemento | Transição | Duração | Estado |
|---|---|---|---|
| Pílula (nível de topo) | só esmaece | 200ms (token mais próximo: `--lastro-dur-2`, 220ms) | **implementada em parte (H3, 2026-08-16)** — só a entrada da tela nova, ver nota abaixo |
| Sub-tela | desliza + esmaece | 300ms | pendente |
| Folha | sobe | 400ms, curva enfatizada | **implementada (H1, 2026-08-15)** — `Folha`, primeiro consumidor real de `--lastro-dur-6`/`--lastro-curva-enfatizada` |
| Segmentado | lateral | — | **auditado (M7, 2026-08-15), nenhum alvo existe hoje** |

Curvas: padrão `cubic-bezier(0.2,0,0,1)` · enfatizada decelerando `cubic-bezier(0.05,0.7,0.1,1)`.

**Obrigatório respeitar `prefers-reduced-motion`** em todas.

**Reprova:** container transform em qualquer lugar do app; transição fora deste conjunto contido; movimento que ignora `prefers-reduced-motion`.

**Correção registrada em `DECISIONS.md` 2026-08-16.** A nota original de D7 ("custo caiu: Next 16 traz `ViewTransition` do React nativo") estava errada — a API exige `react@canary`/`react@experimental`; este projeto usa `19.2.8` estável. O dono decidiu não trocar o canal do React por uma peça de transição. A pílula foi implementada à mão (CSS puro, `.transicao-pilula` em `sistema.css`) — só a **entrada** da tela nova esmaece (220ms), não um crossfade simétrico: sem a API nativa não há como coordenar a saída do conteúdo antigo sem um mecanismo próprio de "segurar" esse conteúdo, escopo maior que o item pedia. `AbaInferior`/`.barra-topo` ficam de fora de propósito (cada tela os remonta do zero, incluir causaria a pílula ativa piscando a cada toque). Sub-tela (desliza+esmaece) herda o mesmo bloqueio de API — fica pendente até essa decisão ser revisitada.
