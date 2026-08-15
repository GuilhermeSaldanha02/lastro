# DESIGN.md — `lastro`

> **Fonte ÚNICA do visual.** Nenhum valor de cor, espaçamento ou tipografia é definido em outro lugar. Verificar autoconsistência deste arquivo a cada edição.
>
> **Estado em 2026-08-06:** a identidade estética foi **APROVADA pelo dono** — padrão *"Areia & Azul Petróleo"*, com matéria (gradiente, vidro, bevel, sombra). Os valores vivem em `src/app/tokens.css`, que é o espelho executável de §3.1; as classes, em `src/app/sistema.css`. A referência navegável é `design/padrao-visual.html`, que traz a aferição de contraste rodando na própria página.
>
> **Uma restrição funcional foi revista pelo dono nesta data: D5.** O tema padrão passou a ser **claro** (areia), não escuro. A justificativa original de D5 (academia com luz baixa, tela clara cansa à noite) continua válida como risco conhecido; o dono a aceitou conscientemente em favor do padrão escolhido.
>
> **2026-08-11 — revisto de novo.** A pílula da aba inferior deixou de ser vidro areia e passou a ser petróleo (mais claro que a barra de topo), a pedido do dono. **Duas superfícies petróleo agora, não uma** — a barra de topo continua a mais escura das duas; a pílula é uma versão mais clara da mesma tinta, amarrando as duas pontas da tela. Onde este documento disser "a única superfície escura", leia "a barra de topo é a mais escura das duas superfícies petróleo".
>
> **2026-08-15 — §6 acrescentado (item E5 do redesenho).** O vocabulário das 10 peças do redesenho, decidido pelo dono e antes só em artifact, virou seção durável deste documento. **Nada em §6 está implementado ainda** — §3 continua sendo a tipografia e os tokens que o código de fato usa até a Trilha B (`docs/BACKLOG-REDESENHO.md`) chegar em cada peça.
>
> **2026-08-15 — Nível 1 da Trilha B implementado (E1, E2, E3, E4).** §3.3, §3.4 e §3.5 foram reescritos para bater com o código: a família passou de IBM Plex Sans/Mono/Serif para Bricolage Grotesque/Archivo/Fraunces (E1); a escala numerada `--lastro-t-meta`/`--lastro-t-corpo`/`--lastro-t-1..8` foi substituída pelos seis papéis nomeados de §6.2 (E2); bevel e gradiente saíram das superfícies areia, com `.nav` como única exceção mantida (E3); tokens de duração/curva M3 entraram em `tokens.css` (E4). Onde §3 e §6 hoje dizem a mesma coisa, §6 fica com o texto histórico da decisão e §3 com o que o código executa.

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
| D5 | ~~Tema escuro como padrão~~ → **Tema claro (areia) como padrão** | **REVISTA pelo dono em 2026-08-06.** A justificativa original — academia com luz baixa, tela clara cansa à noite — segue válida e vira risco aceito. Duas superfícies petróleo (barra de topo e a pílula da aba inferior, 2026-08-11); o resto do padrão segue areia |
| D6 | **Nenhuma ação de registro espera resposta de rede** | ADR/ARCHITECTURE: registrar série é offline-first. A UI confirma na hora |
| D7 | **Estado de sincronização sempre visível, nunca alarmante** | O usuário precisa saber que o dado está salvo local, sem que isso pareça erro |
| D8 | **Contraste AA medido, não estimado** | Gate de acessibilidade é critério do gate visual, não fase posterior |
| D9 | **Foco visível e navegação por teclado funcionais** no PC | O PC é onde os gráficos são lidos com calma |

---

## 3. Tokens

> **Este bloco `:root` é o único lugar do projeto onde um valor literal de cor, espaço, tamanho ou fonte pode existir.** Qualquer hex, `px`, `rem` ou nome de fonte fora daqui — em componente, em Tailwind config, em CSS de módulo, em prop de Recharts — é violação e reprova no review.

### 3.0 Tese visual — APROVADA em 2026-08-06

**"Areia & Azul Petróleo".** Areia é a superfície, azul petróleo é a tinta, verde é a ação — e só a ação. Número em mono tabular; cor cromática usada só onde ela *significa* alguma coisa.

**A matéria é do padrão, e é deliberada.** Gradiente, vidro, bevel e sombra entram por decisão do dono, contra a proposta anterior: sem elevação, cartão claro sobre fundo claro fica solto — a peça não gruda na tela. Três regras seguram isso sem virar enfeite:

1. **A luz vem de cima.** Todo elemento levantado leva um fio claro na borda superior (bevel) e a sombra cai para baixo.
2. **A sombra é quente**, nunca cinza — cinza sobre areia acinzenta o fundo e suja a paleta.
3. **Gradiente tem no máximo dois passos**, sempre do claro para o escuro. Texto sobre gradiente é medido contra o passo de **pior caso**, nunca contra uma média.

**Escala de elevação:** `elev-1` repouso (painel, item de lista) · `elev-2` levantado (bloco de evidência, barra de topo) · `elev-3` só a ação primária · `afundado` para campo, que é o inverso do botão: recebe em vez de saltar.

**Restrição derivada da paleta (rediagnóstico, 2026-08-08).** Areia clara e quente não sustenta vitalidade por brilho nem saturação — as referências que "têm vida" (WHOOP, Oura, Ultrahuman) são escuras, e é de lá que vem a vitalidade delas. Tentar comprar vida com brilho ou saturação num fundo areia produz **wellness pastel**, anti-referência já declarada. A moeda que sobra é **contraste de escala, de peso e de densidade**: cada tela tem um elemento que pesa mais que os outros, e o resto flutua em volta dele. Onde um valor parecer "no mesmo degrau" dos vizinhos — mesma elevação, mesmo tamanho, mesmo peso — é sintoma desta restrição sendo ignorada, não da paleta estar errada. §3.6.2 aplica isto diretamente no veredito do parecer.

> **Histórico.** A tese anterior — *"instrumento sóbrio, nada de gradiente, vidro, brilho ou 3D"*, derivada da leitura de uma galeria de referência e de ISA-101 (High-Performance HMI) — foi **reprovada pelo dono**. ISA-101 segue útil como disciplina (base quieta, cor que significa, sem bevel decorativo), mas é norma de controle de processo, para operador caçando falha; o `lastro` é instrumento de leitura para uma pessoa. Onde conflitarem, **o PRD vence**.

**Referência consultada:** `https://3dgallery-eqrvxb8t.manus.space` — catálogo curado de 179 sites (Lusion, Active Theory, Obys, Awwwards, Godly, Linear, Stripe, luxo/e-commerce 3D). Lida por download do HTML, do CSS (`/assets/index-BAPlKeQi.css`) e do bundle JS. **Nada foi renderizado nem olhado** — ver §3.9.

Dois achados que orientaram a decisão:

1. O CSS da própria galeria é **tema padrão do Tailwind v4** (`--font-sans: ui-sans-serif`, escala slate/blue/cyan em `oklch`). A galeria é uma **régua de artesanato**, não uma especificação de estilo. Não se copia dela nenhum valor.
2. A massa da galeria é imersiva/WebGL/luxo — gradiente, vidro, sobreposição de baixo contraste, texto sobre vídeo. **Esse ramo é incompatível com D4 e D8** (celular suado, luz ruim, contraste AA medido). A adjacência que se adota é o outro ramo do mesmo catálogo — **Linear e Stripe**: hierarquia tipográfica, densidade de dado, contenção. Isso é rejeição por restrição funcional, não por gosto.

### 3.1 Paleta — a fonte única agora é `src/app/tokens.css`

> **Mudança de custódia (2026-08-06).** O bloco `:root` deixou de morar neste documento e passou a morar em **`src/app/tokens.css`**, que é o **único arquivo do projeto onde um valor literal de cor, espaço, tamanho, peso, raio, sombra ou duração pode existir**. Qualquer hex, `px` ou `rem` fora dele — em componente, em CSS de módulo, em prop de Recharts — é violação e reprova no review.
>
> **Por que inverteu:** manter os mesmos ~90 valores em dois lugares garante divergência. O documento passa a explicar *por que* cada cor é o que é; o arquivo passa a ser o que executa. Cada token em `tokens.css` carrega a razão medida no comentário ao lado.

Tema **claro** por padrão (D5 revista). A leitura humana da paleta:

| Papel | Token | Valor | Razão medida |
|---|---|---|---|
| Fundo | `--lastro-fundo` | `#F0EAE0` | — |
| Cartão, bloco de evidência | `--lastro-sup-1` | `#FBF8F3` | — |
| Faixa, cabeçalho de tabela | `--lastro-sup-2` | `#E4DACB` | — |
| Divisória — **só decorativa** | `--lastro-linha` | `#CFC3B1` | 1.45:1 · reprova de propósito, ver nota A |
| Limite de alvo de toque | `--lastro-controle` | `#8A7C68` | 3.40:1 no fundo |
| Corpo, número, título | `--lastro-txt` | `#12303F` | 11.54:1 |
| Secundário | `--lastro-txt-2` | `#3A5361` | 6.78:1 |
| Procedência, metadado | `--lastro-txt-3` | `#476069` | 4.83:1 no `sup-2`, o pior caso |
| Barra de topo (gradiente) | `--lastro-barra-a/b` | `#17414F` → `#0E2833` | texto a 9.21:1 contra o topo |
| **Ação — preenchimento** | `--lastro-acao-a/b` | `#46C27B` → `#35A866` | tinta a 5.12:1 na base, o pior caso |
| **Ação — tinta sobre ela** | `--lastro-acao-txt` | `#0A2A18` | — |
| **Ação — borda e texto** | `--lastro-acao-borda` / `--lastro-acao-tinta` | `#0E5E35` | 6.57:1 no fundo |
| Alta · progressão | `--lastro-alta` | `#1B6B3A` | 6.17:1 no `sup-1` |
| Platô · estagnação | `--lastro-plato` | `#8A5A0B` | 5.59:1 — âmbar, nunca vermelho |
| Queda · regressão | `--lastro-queda` | `#A33220` | 6.53:1 |
| Sincronização (D7) | `--lastro-sync` | `#2E6076` | 5.75:1 · jamais vermelho |
| Erro — **reservado a falha real** | `--lastro-erro` | `#A32014` | 6.33:1 |
| Foco (D9) | `--lastro-foco` | `#0B5CAB` | 5.60:1 |

**A decisão que mais custou: por que a ação é preenchimento vivo com tinta escura.**

Duas medições obrigaram a inversão, e nenhuma das duas era visível a olho:

1. Verde vivo **não sustenta texto branco** — `#2ECC71` com branco dá **2.10:1**, contra 4.5 exigidos. Era o que a referência do dono trazia.
2. Um verde escuro o bastante para carregar branco fica a **1.06:1 de `--lastro-alta`** — ou seja, vira *o mesmo verde* do sinal de progressão. E como a ação primária aparece em toda tela o tempo todo, o verde deixaria de significar "progresso" e viraria só "botão", exatamente o que §3.2 nota C existe para impedir.

Preenchimento vivo + tinta escura resolve os dois de uma vez. Consequências obrigatórias:

- **O verde vivo não cumpre o limite de 3:1 contra a areia** (1.89:1). Quem cumpre é a **borda** `--lastro-acao-borda`. Botão de ação sem essa borda reprova.
- **O verde vivo NUNCA é texto.** Aba ativa, link e item selecionado usam `--lastro-acao-tinta`. Preenchimento e tinta são dois papéis, não a mesma cor.
- **Pressionar não escurece o preenchimento** — escurecer derruba a tinta para 3.76:1. O afundamento é pela sombra (`--lastro-elev-afundado`) e por 1px de deslocamento.

**Avatar de iniciais — base é corpo claro, não a barra (correção A1, 2026-08-13).** O componente `<Avatar>` foi desenhado assumindo que sempre vive dentro de `.barra-topo`, sobre o gradiente petróleo — ali o preenchimento translúcido `--lastro-avatar-iniciais-fundo` sobre `--lastro-barra-txt` funciona (9.21:1). `/perfil` foi a primeira tela a usar `<Avatar>` fora da barra, direto no corpo claro (`--lastro-fundo`), e as três propriedades (preenchimento, letra, borda) colapsaram na mesma cor — invisível, não só baixo contraste. Correção: a base do `.avatar`/`.avatar--iniciais` em `sistema.css` passa a assumir corpo claro (`--lastro-sup-2` de preenchimento, `--lastro-txt` de letra — **9.99:1**, confirmado 2026-08-13 sobre as cores computadas de verdade num Chrome real e recalculado pela fórmula WCAG de §3.2, não estimado — bate com o piso G2.1 do gate —, borda `--lastro-controle` — 3.40:1, o limite de componente já documentado acima, também recalculado e confirmado); `.barra-topo .avatar`/`.avatar--iniciais` sobrescreve de volta pro petróleo original, preservando os 9.21:1 medidos ali (`getComputedStyle` confirmou que os valores da barra ficaram bit a bit idênticos aos de antes da correção — gate G2.3). Não envolver o avatar num chip petróleo fora da barra — §3.0 fixa duas superfícies petróleo (barra de topo e pílula tingida) e só duas.

**Espaçamento, alvos, escala de tamanho, peso, raio, duração e matéria** seguem em `tokens.css` com os mesmos nomes usados neste documento. Base 4px; `--lastro-alvo-min` 48px (D1), `--lastro-alvo-acao` 72px (D3); escala de tamanho com piso 14px e corpo em 16px (D4).

### 3.2 Contraste — medido em navegador, não estimado (D8)

Fórmula WCAG 2.x (linearização sRGB, `L = 0.2126R + 0.7152G + 0.0722B`, `(Lmax+0.05)/(Lmin+0.05)`). **Aferição do método, rodada antes de cada medição:** `#FFFFFF/#000000 = 21.00`, `#777777/#FFFFFF = 4.48`, `#767676/#FFFFFF = 4.54` — batem com os canônicos do WCAG.

**Mudança de método (2026-08-06):** as razões deixaram de ser aritmética sobre hex escritos à mão e passam a ser **medidas sobre as cores computadas de uma página renderizada**. `design/padrao-visual.html` roda a matriz inteira na própria página, no navegador. Reproduzir a medição é abrir o arquivo e rolar até §06.

Limiares: **4.5:1** texto normal · **3:1** texto grande (≥24px em `--lastro-peso-forte` — Seção ou Título de tela em negrito —, ou ≥30px — Título de tela) e limite de componente de interface.

**Regra nova, que o gradiente obriga:** onde há gradiente, o texto é medido contra o **passo de pior caso**, nunca contra uma média nem contra o passo mais favorável.

| Par | Razão | Limiar | Veredito |
|---|---|---|---|
| `--lastro-txt` / fundo · sup-1 · sup-2 | 11.54 · 13.04 · 9.99 | 4.5 | passa |
| `--lastro-txt-2` / fundo · sup-1 | 6.78 · 7.65 | 4.5 | passa |
| `--lastro-txt-3` / fundo · sup-1 · sup-2 | 5.58 · 6.30 · **4.83** | 4.5 | passa (margem menor em sup-2) |
| `--lastro-alta` / sup-1 | 6.17 | 4.5 | passa |
| `--lastro-plato` / sup-1 | 5.59 | 4.5 | passa |
| `--lastro-queda` / sup-1 | 6.53 | 4.5 | passa |
| `--lastro-sync` / fundo | 5.75 | 4.5 | passa |
| `--lastro-erro` / fundo | 6.33 | 4.5 | passa |
| `--lastro-acao-tinta` / fundo (aba ativa, link) | 6.57 | 4.5 | passa |
| `--lastro-acao-txt` / topo do gradiente da ação | 6.82 | 4.5 | passa |
| `--lastro-acao-txt` / **base** do gradiente — pior caso | **5.12** | 4.5 | passa |
| `--lastro-barra-txt` / topo do gradiente da barra — pior caso | 9.21 | 4.5 | passa |
| `--lastro-acao-borda` / fundo (limite do botão) | 6.57 | 3.0 | passa |
| `--lastro-controle` / fundo · sup-1 | 3.40 · 3.84 | 3.0 | passa |
| `--lastro-foco` / fundo | 5.60 | 3.0 | passa |
| `--lastro-linha` / fundo | 1.45 | — | **reprova de propósito** — ver nota A |
| `--lastro-acao-a` (vivo) / fundo | **1.89** | 3.0 | **reprova** — ver nota D |
| `--lastro-acao-a` vs `--lastro-alta` | 2.89 | — | ver nota C |

**Nota A — `--lastro-linha` é decorativa por decisão.** 1.45:1 não serve como limite de componente. Ela só separa blocos que já se distinguem por superfície ou elevação. **Todo alvo de toque usa `--lastro-controle`** (pior caso 3.40:1), ou uma borda própria quando o preenchimento não cumpre o limite (nota D). Regra de reprovação: qualquer controle cujo único limite visual seja `--lastro-linha` reprova o gate.

**Nota B — o anel de foco nunca encosta no elemento.** É sempre desenhado **fora**, com afastamento: `outline: var(--lastro-foco-espessura) solid var(--lastro-foco); outline-offset: var(--lastro-foco-afast);`. O vão do `offset` mostra a superfície do pai, onde o anel entrega 5.60:1. **Proibido `outline-offset: 0` ou anel interno (`inset`)** — contra um preenchimento saturado o anel some.

**Nota C — a separação entre o verde de ação e o verde de sinal é de 2.89:1, e não pode ser maior.** Os dois têm de ser verdes: um porque o dono escolheu, o outro porque verde é progressão. O que os separa não é só a razão — é o **papel e o tamanho**: a ação é um preenchimento de 72px de largura total; `--lastro-alta` é uma barra de 4px e um texto de 14px. Eles nunca ocorrem no mesmo papel. **Um verde escuro o bastante para carregar texto branco ficaria a 1.06:1 do `--lastro-alta`** — literalmente o mesmo verde —, e foi por isso que a ação virou preenchimento vivo com tinta escura (§3.1).

**Nota D — o preenchimento vivo da ação reprova o limite de 3:1 de propósito, e quem cumpre é a borda.** `#46C27B` contra a areia dá 1.89:1: verde claro e areia são os dois claros. `--lastro-acao-borda` (6.57:1) é o limite real do componente. **Botão de ação sem essa borda reprova o gate.** Pela mesma razão, **o verde vivo nunca é usado como texto sobre a areia** — aba ativa, link e item selecionado usam `--lastro-acao-tinta`.

**Nota E — os sinais continuam sem poder depender da cor.** No tema claro as luminâncias se afastaram um pouco (5.59 a 6.53 contra o `sup-1`), mas a regra não afrouxa: quem tem deficiência de visão de cor não distingue âmbar de terracota, e blocos de alta, platô e queda aparecem lado a lado no mesmo parecer.

Consequência obrigatória, não recomendação — **em toda ocorrência, no gráfico e no parecer, cada sinal se distingue por dois canais além da cor:**

| Sinal | Traço no gráfico | Palavra obrigatória no rótulo |
|---|---|---|
| `--lastro-alta` | contínuo | o delta com sinal `+` e o intervalo |
| `--lastro-plato` | tracejado | "sem mudança" + a contagem de semanas |
| `--lastro-queda` | pontilhado | o delta com sinal `−` e o intervalo |

**Cor nunca é o portador da informação — é reforço.** Bloco de evidência ou trecho de gráfico que dependa só da cor para dizer o que é **reprova o gate**. Ver §3.7 e §3.6.6.

**O que não foi medido:** nada. Todo par acima tem razão computada em navegador real, com o método aferido antes. Se um token novo entrar, ele entra com a razão medida ao lado ou não entra.

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
- **Redundância obrigatória, e vale igual para regressão:** o platô se identifica por barra em `--lastro-plato` **e** pela palavra "sem mudança" com a contagem; a queda, por barra em `--lastro-queda` **e** pelo delta com sinal negativo e o intervalo. Pela nota C de §3.2 os quatro sinais têm luminância equivalente — **um bloco de queda ao lado de um bloco de platô, distinguidos só por cor, reprova o gate.** A regra de tom (observação, nunca cobrança; nunca `--lastro-erro`) se aplica igualmente aos dois.

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
2. **Distinguir mais de duas linhas só por matiz não sobrevive à paleta do sistema.** O `lastro` não tem uma paleta categórica reservada para "N séries quaisquer" — só tokens semânticos, cada um com papel fixo (`--lastro-alta` é sempre progressão, `--lastro-plato` é sempre estagnação, nunca identidade de exercício; §3.2 nota C proíbe emprestar cor de um papel para outro). Mesmo usando a rampa de tinta neutra (`--lastro-txt`/`txt-2`/`txt-3`/`--lastro-controle`), a razão de contraste **entre elas** — não contra o fundo — é baixa o bastante (`txt-2` contra `txt-3` gira perto de 1.2:1) para duas linhas próximas ficarem indistinguíveis a um braço de distância (D4), em luz ruim, exatamente a cena de uso (§1).

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

- **razões de contraste** em §3.2 e §4.2 — resultado de medição, não valor de design;
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
**A paleta e a matéria foram medidas em navegador real** — não são mais aritmética sobre hex escritos à mão (§3.2). O que **ainda não foi olhado em celular real** são as telas logadas: `/treino`, `/treino/[id]` e `/analise` ficam atrás de autenticação. **O gate de §4 continua pendente para elas** e é executado pelo dono, no aparelho dele.

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

Medir com conta-gotas sobre a tela **renderizada** (a tabela de §3.2 é a expectativa; o gate confirma que o CSS entregue bate com ela). Pares obrigatórios, com a razão esperada:

| # | Par medido, na tela | Esperado | Limiar | Reprova se |
|---|---|---|---|---|
| C1 | `--lastro-txt` sobre `--lastro-fundo` (corpo, G1) | 17.27 | 4.5 | < 4.5 ou divergir da expectativa em mais de 0.2 |
| C2 | `--lastro-txt-2` sobre `--lastro-sup-1` (rótulo, G1) | 9.26 | 4.5 | idem |
| C3 | `--lastro-txt-3` sobre `--lastro-sup-3` — **o par mais apertado do sistema** | 4.85 | 4.5 | idem |
| C4 | Número em `--lastro-txt` sobre `--lastro-sup-2` (bloco de evidência, G2) | 14.05 | 4.5 | idem |
| C5 | Procedência `--lastro-txt-3` sobre `--lastro-sup-2` (G2) | 5.68 | 4.5 | idem |
| C6 | `--lastro-acao-txt` sobre `--lastro-acao-fundo` (botão D3, G1) | 17.27 | 4.5 | idem |
| C7 | Limite do botão: `--lastro-acao-fundo` contra `--lastro-fundo` | 17.27 | 3.0 | < 3.0 |
| C8 | `--lastro-borda-controle` contra `--lastro-sup-3` — **pior caso de componente** | 3.39 | 3.0 | < 3.0 |
| C9 | `--lastro-foco` contra a superfície do vão de `outline-offset`, em G1 e G2 | 9.63 a 13.87 | 3.0 | < 3.0, **ou** o anel encostando em `--lastro-acao-fundo` (nota B de §3.2) |
| C10 | `--lastro-plato` sobre `--lastro-sup-1` (traço e anotação do gráfico, G6) | 8.59 | 3.0 | < 3.0 |
| C11 | `--lastro-alta` sobre `--lastro-sup-1` (traço do gráfico, G6) | 9.86 | 3.0 | < 3.0 |
| C12 | `--lastro-plato` sobre `--lastro-sup-2` (barra do bloco de platô, G2) | 7.61 | 3.0 | < 3.0 |
| C13 | `--lastro-sync` sobre a superfície onde o indicador vive (G7) | 8.23 a 8.96 | 4.5 | < 4.5 |
| C14 | `--lastro-erro` sobre `--lastro-sup-3` — pior caso do erro | 4.88 | 4.5 | < 4.5 |

**Reprova geral:** qualquer texto sobre imagem, vídeo, gradiente ou sobreposição translúcida cujo contraste não seja mensurável em ponto fixo. O sistema não tem esse recurso (§3.0) — se apareceu, é regressão.

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

## 5. Decisões do dono — RESOLVIDAS em 2026-08-06

| # | O que estava em aberto | Decisão |
|---|---|---|
| 1 | **A personalidade** (§3.0) | **Reprovada** a proposta de instrumento sóbrio sem gradiente nem 3D. Aprovado o padrão *"Areia & Azul Petróleo"* **com matéria** — gradiente, vidro, bevel e sombra. Razão do dono, registrada: sem elevação, "parece que fica algo solto" |
| 2 | **O par tipográfico** | **IBM Plex Sans + IBM Plex Mono**, confirmado em 2026-08-06. Trocado em 2026-08-15 por Bricolage Grotesque + Archivo (E1, §3.3) — mesma decisão de arquitetura (carregado por `next/font/google`, `display: swap`, subset latin), família diferente |
| 3 | **Os dois regimes de densidade** (§3.5) | **Mantidos.** Modo Bancada e Modo Leitura seguem com tratamentos diferentes |
| 4 | **O parecer como documento datado** (§3.6) | **Mantido**, e reforçado: a proibição de conversa deixou de ser geral e passou a ter escopo (ver abaixo) |
| 5 | **Âmbar para platô** em vez de vermelho | **Mantido.** `--lastro-plato` é âmbar; vermelho segue proibido em estagnação |
| 6 | **O tamanho da linha de procedência** | **Mantida em Rótulo (`--lastro-papel-rotulo`, 14px desde sempre — só o nome do token mudou em 2026-08-15, E2).** No tema claro ela deixou de ser a razão mais apertada do sistema: `--lastro-txt-3` entrega 4.83:1 no pior caso, com margem sobre o limiar |

**A revisão que veio junto e não estava na lista: D5.** O tema padrão passou de escuro para **claro**. É restrição funcional revista pelo dono, com o risco original — academia com luz baixa, leitura noturna — aceito conscientemente.

**A proibição de balão ganhou escopo.** Antes valia como regra geral de estética; agora vale só onde tem razão de produto:

- **Na tela do parecer, reprova:** rabicho, blocos alternando lado, avatar, ícone de robô, reticências pulsantes, texto letra a letra, caixa de digitação, selo de "gerado por IA".
- **Canto arredondado, elevação e sombra NÃO reprovam em lugar nenhum** — são do padrão. O que faz uma peça ler como conversa é o rabicho, a alternância e o campo embaixo, não o raio da borda.
- **No coach 24h o balão é correto e completo**, com rabicho, alternância e campo de digitação. É a única tela do app onde se conversa (PRD §4.4).

**Advertência que continua de pé:** a validação final de qualquer peça visual é **olho do dono em navegador real, no celular**. Medição de DOM não substitui — `getComputedStyle` não detecta toda renderização errada. As telas logadas (`/treino`, `/treino/[id]`, `/analise`) **ainda não passaram por isso**: ficam atrás de autenticação e o gate de §4 segue pendente para elas.

---

## 6. Vocabulário do redesenho — Trilha B (decidido, ainda não implementado)

> **Este parágrafo existe porque um documento cuja fonte era artifact não é fonte durável de projeto** (item E5 do backlog, pré-requisito de tudo abaixo dele). As 10 decisões do dono que fundamentam esta seção, com a evidência e a alternativa descartada de cada uma, estão em `DECISIONS.md` 2026-08-15 — este parágrafo não repete essa evidência, só o vocabulário resultante. O que construir com ele, e em que ordem, está em `docs/BACKLOG-REDESENHO.md`.
>
> **Travas que continuam valendo em toda a Trilha B:** nenhum pigmento da paleta muda (§3.1) e a pílula de navegação (`.nav`, `aba-inferior.tsx`, tokens `--lastro-nav-*`/`--lastro-vidro-nav*`) fica intacta. Nada em §6 autoriza mexer nas duas.
>
> **Estado (atualizado 2026-08-15):** Nível 1 (E1, E2, E3, E4 — "só token, sem mudar marcação") está **em produção**; §3.3/§3.4/§3.5 já refletem isso. §6.1 (famílias), §6.2 (papéis), §6.7 (M3) descrevem o que o código executa agora, não mais um alvo futuro. O que **continua** só decidido, não implementado, é o restante da Trilha B: §6.3 (superfícies), §6.4 (regra verbo×substantivo), §6.5 (as 10 peças) e §6.6 (mapa de telas) — Nível 2 (M1-M9) e Nível 3 (H1-H4) do backlog.
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
| 4 | Controle segmentado | Structured | Trocar o que o gráfico da Análise mostra; filtrar histórico do exercício | `<select>` usado pra essa troca — o próprio seletor que o dono mandou tirar em 2026-08-14 |
| 5 | Chips de seleção | Strava · Structured | Grupo muscular no catálogo e na criação de modelo | Lista vertical de caixas de seleção pra grupo muscular |
| 6 | Etiqueta de estado | Gentler Streak · Oura | Progressão, platô, recorde | Estado marcado só por cor — precisa de ícone + palavra + cor, os três canais (§3.2 nota E, a mesma regra já vale para o parecer) |
| 7 | Tabela com cabeçalho de coluna | Hevy | As séries do treino | Séries sem cabeçalho de coluna alinhado — é a peça que fecha o desalinhamento que abriu a sessão do diagnóstico de design |
| 8 | Ação fantasma dentro da seção | Hevy | "Adicionar série", "adicionar anilha", "criar modelo" | Ação secundária com o mesmo peso visual da ação primária da tela |
| 9 | Prosa com título em serifa | Oura | O parecer da Análise Semanal, o Coach e a marca do `/login` (§6.6, D10) — a voz do produto | Fraunces usada fora do parecer, do Coach e da marca (mesma proibição que já vale pra Plex Serif em §3.3) — **mas o alcance dela dentro do parecer cresce, ver nota abaixo** |
| 10 | Folha com alça | Strava · Structured | Adicionar anilha, editar série, criar modelo, editar perfil | Tarefa curta abrindo em rota cheia em vez de folha; folha sem fechar arrastando pra baixo |

**Nota sobre a peça 9 — ela alarga o alcance da terceira família, não só troca a fonte.** §3.3/C4 (aprovado 2026-08-08) restringe a Fraunces ao **veredito, e só ele**, dentro do parecer — o resto do documento (cabeçalho, prosa, procedência) é Bricolage. A peça 9 usa a serifa no **título de conteúdo** da prosa inteira do parecer e do Coach, não só no veredito — isso ainda não foi implementado (é trabalho de propagação do Nível 2/3, não de M1). Quando for, ela **substitui** o escopo de C4 nesses dois lugares — a serifa passa a valer para título + veredito, ainda proibida em qualquer outro lugar do app **exceto a marca do `/login`**, que já usa Fraunces desde M1 (2026-08-15) por decisão própria de D10/§6.6, não por essa revisão de C4. Até a propagação chegar no parecer, §3.3 continua sendo a regra que vale ali.

### 6.6 O mapa: qual peça em qual tela

| Tela | Peças | O que ganha |
|---|---|---|
| `/` (início) | 1 · 2 · 3 · 6 | o estado do dia vira grade de métricas; a ação de treinar deixa de ser bloco entre blocos |
| `/treino` | 3 · 6 · 10 | iniciar/continuar como ação clara; escolher modelo vira folha |
| `/treino/[id]` | 1 · 7 · 8 · 10 | séries em colunas com cabeçalho; registrar e editar viram folha; "adicionar" fantasma |
| `/analise` | 1 · 2 · 4 · 6 · 9 | a peça-assinatura: serifa na leitura, grade no dado, segmentado no gráfico |
| `/catalogo` | 5 · 3 | grupos viram chips; fichas perdem moldura e viram linhas de navegação |
| `/catalogo/[id]` | 1 · 2 · 4 · 7 | histórico com cabeçalho de coluna; segmentado troca a métrica |
| `/coach` | 9 | a única tela onde balão se justifica; título e prosa na voz do produto |
| `/ajustes` | 3 | já é a mais correta hoje; só herda a linha de navegação nova |
| `/ajustes/anilhas` | 1 · 2 · 8 · 10 | anilhas viram grade (88px no lugar de 372px); adicionar vira folha |
| `/ajustes/modelos` | 3 · 5 · 8 · 10 | modelos como linhas de navegação; criar vira folha com chips |
| `/perfil` | 1 · 10 | vira folha; o nome ganha papel tipográfico (hoje é texto sem classe nenhuma) |
| `/login` | 9 | primeira impressão do app (D10) — hoje é a tela mais genérica de todas |

**Este mapa cobre 12 das 13 telas do artifact original.** `/ajustes/modelos/novo` existe no app (ver rota em `src/app/ajustes/modelos/novo/`) e não recebeu peça mapeada na sessão que gerou o vocabulário — ficou de fora por omissão do artifact, não por decisão. Fica registrado aqui pra não ser esquecido: mapear essa tela é trabalho pendente antes de propagar a Trilha B até `/ajustes/modelos`.

**Ordem sugerida de propagação** (`docs/BACKLOG-REDESENHO.md`, item H4): `/ajustes/anilhas` (pequena, exercita quase tudo) → `/analise` (peça-assinatura) → `/treino/[id]` (a mais complexa) → o resto. Uma tela por PR, olhada no celular antes da seguinte.

### 6.7 Padrões de transição (D7) — tokens em `tokens.css` desde E4 (2026-08-15), aplicação pendente

E4 só criou os tokens de duração e curva abaixo em `tokens.css` (`--lastro-dur-3..6`, `--lastro-curva-padrao`, `--lastro-curva-enfatizada`). **Nenhum componente foi cabeado a eles ainda** — aplicar duração/curva à pílula, sub-tela, folha e segmentado é trabalho do Nível 2 (backlog), não deste item.

Conjunto contido do Material 3 — **sem container transform**, que o próprio M3 chama de "o mais expressivo" e o dono recusou por excesso.

| Elemento | Transição | Duração |
|---|---|---|
| Pílula (nível de topo) | só esmaece | 200ms |
| Sub-tela | desliza + esmaece | 300ms |
| Folha | sobe | 400ms, curva enfatizada |
| Segmentado | lateral | — |

Curvas: padrão `cubic-bezier(0.2,0,0,1)` · enfatizada decelerando `cubic-bezier(0.05,0.7,0.1,1)`.

**Obrigatório respeitar `prefers-reduced-motion`** em todas.

**Reprova:** container transform em qualquer lugar do app; transição fora deste conjunto contido; movimento que ignora `prefers-reduced-motion`.
