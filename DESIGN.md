# DESIGN.md — `lastro`

> **Fonte ÚNICA do visual.** Nenhum valor de cor, espaçamento ou tipografia é definido em outro lugar. Verificar autoconsistência deste arquivo a cada edição.
>
> **Estado em 2026-08-04:** as restrições funcionais abaixo estão **decididas** — elas derivam do contexto de uso real, não de gosto. A **identidade estética** (paleta, tipografia, personalidade) está **em aberto** e passa pelo gate do Diretor de Arte + aprovação do dono antes de qualquer tela ser construída.

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
| D5 | **Tema escuro como padrão** | Academia com luz baixa, e tela clara à noite cansa. **A decisão é funcional; a paleta ainda não existe** |
| D6 | **Nenhuma ação de registro espera resposta de rede** | ADR/ARCHITECTURE: registrar série é offline-first. A UI confirma na hora |
| D7 | **Estado de sincronização sempre visível, nunca alarmante** | O usuário precisa saber que o dado está salvo local, sem que isso pareça erro |
| D8 | **Contraste AA medido, não estimado** | Gate de acessibilidade é critério do gate visual, não fase posterior |
| D9 | **Foco visível e navegação por teclado funcionais** no PC | O PC é onde os gráficos são lidos com calma |

---

## 3. Tokens

> **Este bloco `:root` é o único lugar do projeto onde um valor literal de cor, espaço, tamanho ou fonte pode existir.** Qualquer hex, `px`, `rem` ou nome de fonte fora daqui — em componente, em Tailwind config, em CSS de módulo, em prop de Recharts — é violação e reprova no review.

### 3.0 Tese visual

**Instrumento, não interface de conversa.** `lastro` se parece com um mostrador de equipamento lido no escuro: fundo profundo quase sem cor, número claro e grande, cor cromática usada só onde ela *significa* alguma coisa. A personalidade **acompanha** o nome sóbrio — nada de gradiente, vidro, brilho ou 3D.

**Referência consultada:** `https://3dgallery-eqrvxb8t.manus.space` — catálogo curado de 179 sites (Lusion, Active Theory, Obys, Awwwards, Godly, Linear, Stripe, luxo/e-commerce 3D). Lida por download do HTML, do CSS (`/assets/index-BAPlKeQi.css`) e do bundle JS. **Nada foi renderizado nem olhado** — ver §3.9.

Dois achados que orientaram a decisão:

1. O CSS da própria galeria é **tema padrão do Tailwind v4** (`--font-sans: ui-sans-serif`, escala slate/blue/cyan em `oklch`). A galeria é uma **régua de artesanato**, não uma especificação de estilo. Não se copia dela nenhum valor.
2. A massa da galeria é imersiva/WebGL/luxo — gradiente, vidro, sobreposição de baixo contraste, texto sobre vídeo. **Esse ramo é incompatível com D4 e D8** (celular suado, luz ruim, contraste AA medido). A adjacência que se adota é o outro ramo do mesmo catálogo — **Linear e Stripe**: hierarquia tipográfica, densidade de dado, contenção. Isso é rejeição por restrição funcional, não por gosto.

### 3.1 Paleta — `:root`

Escuro por padrão (D5). Sem tema claro no MVP: não há segunda persona (PRD §2) e a cena de uso é luz baixa.

```css
:root {
  /* ---- Superfícies (escuro é o padrão; não há tema claro no MVP) ---- */
  --lastro-fundo:          #0D1013; /* base. Não é #000: preto puro mata elevação e causa halo em OLED */
  --lastro-sup-1:          #151A1E; /* card, painel de gráfico */
  --lastro-sup-2:          #1E252A; /* linha de série, bloco de veredito do parecer */
  --lastro-sup-3:          #283137; /* topo da pilha: input focado, item selecionado */

  /* ---- Traços ---- */
  --lastro-borda:          #39444C; /* SÓ decorativa/divisória. Nunca é o único limite de um controle */
  --lastro-borda-controle: #74838E; /* limite de qualquer alvo de toque. Cumpre 3:1 em toda superfície */

  /* ---- Texto ---- */
  --lastro-txt:            #F1F4F6; /* corpo, números, títulos */
  --lastro-txt-2:          #B3BEC6; /* secundário, rótulo */
  --lastro-txt-3:          #939EA6; /* procedência, metadado. Piso do que ainda passa AA em sup-3 */

  /* ---- Sinais semânticos (cor NUNCA é o único canal — §3.7) ---- */
  --lastro-alta:           #6BD79B; /* progressão confirmada */
  --lastro-plato:          #E3AC55; /* estagnação. Âmbar, não vermelho — §3.6.5 */
  --lastro-queda:          #E8927A; /* regressão. Terroso, não alarme */
  --lastro-sync:           #8FB6D9; /* estado de sincronização (D7). Azul frio, jamais vermelho */
  --lastro-erro:           #F2796F; /* RESERVADO: falha real e ação destrutiva. Nada mais usa esta cor */

  /* ---- Foco (D9) ---- */
  --lastro-foco:           #9BE7FF;

  /* ---- Ação primária (D3) ---- */
  --lastro-acao-fundo:     #F1F4F6; /* o botão mais importante do app é a coisa mais clara da tela */
  --lastro-acao-txt:       #0D1013;

  /* ---- Espaçamento: base 4px. 48 (D1) cai exatamente na escala ---- */
  --lastro-e-1:   4px;
  --lastro-e-2:   8px;
  --lastro-e-3:  12px;
  --lastro-e-4:  16px;
  --lastro-e-5:  20px;
  --lastro-e-6:  24px;
  --lastro-e-8:  32px;
  --lastro-e-10: 40px;
  --lastro-e-12: 48px;
  --lastro-e-16: 64px;
  --lastro-e-20: 80px;

  /* ---- Alvos ---- */
  --lastro-alvo-min:       48px; /* D1 — piso absoluto de qualquer alvo de toque */
  --lastro-alvo-folga:     12px; /* distância mínima entre dois alvos vizinhos */
  --lastro-alvo-acao:      72px; /* altura da ação primária (D3). Maior que o piso, de propósito */

  /* ---- Tipografia ---- */
  --lastro-fonte-txt:  "IBM Plex Sans", system-ui, sans-serif;
  --lastro-fonte-num:  "IBM Plex Mono", ui-monospace, monospace;

  /* ---- Escala de tamanho. Piso 14px, e 14 só para metadado não-corpo (§3.4) ---- */
  --lastro-t-meta:  14px;
  --lastro-t-corpo: 16px; /* D4 — piso do corpo */
  --lastro-t-1:     18px;
  --lastro-t-2:     20px;
  --lastro-t-3:     24px;
  --lastro-t-4:     30px;
  --lastro-t-5:     38px;
  --lastro-t-6:     48px;
  --lastro-t-7:     60px;
  --lastro-t-8:     76px; /* número em modo bancada, lido a um braço */

  /* ---- Entrelinha ---- */
  --lastro-el-apertada: 1.1;  /* números */
  --lastro-el-titulo:   1.25;
  --lastro-el-corpo:    1.6;  /* prosa do parecer, lida sentado */

  /* ---- Peso ---- */
  --lastro-peso-normal: 400;
  --lastro-peso-medio:  500;
  --lastro-peso-forte:  600;

  /* ---- Raio ---- */
  --lastro-raio-1: 6px;
  --lastro-raio-2: 10px;
  --lastro-raio-3: 14px;

  /* ---- Foco: espessura e afastamento ---- */
  --lastro-foco-espessura: 3px;
  --lastro-foco-afast:     2px;

  /* ---- Barra lateral do bloco de evidência do parecer (§3.6.3) ---- */
  --lastro-barra-evidencia: 3px;

  /* ---- Duração de transição (respeitar prefers-reduced-motion) ---- */
  --lastro-dur-1: 120ms;
  --lastro-dur-2: 220ms;
}
```

### 3.2 Contraste — calculado, não estimado (D8)

Calculado com a fórmula WCAG 2.x (linearização sRGB, `L = 0.2126R + 0.7152G + 0.0722B`, `(Lmax+0.05)/(Lmin+0.05)`) em Node, sobre os hex acima. **Aferição do método:** `#FFFFFF/#000000 = 21.00`, `#777777/#FFFFFF = 4.48`, `#767676/#FFFFFF = 4.54` — batem com os valores canônicos do WCAG.

Limiares: **4.5:1** texto normal · **3:1** texto grande (≥ `--lastro-t-3` em `--lastro-peso-forte`, ou ≥ `--lastro-t-4`) e componente de interface.

| Frente | vs `--lastro-fundo` | vs `--lastro-sup-1` | vs `--lastro-sup-2` | vs `--lastro-sup-3` | Limiar | Veredito |
|---|---|---|---|---|---|---|
| `--lastro-txt` | 17.27 | 15.86 | 14.05 | 12.00 | 4.5 | passa |
| `--lastro-txt-2` | 10.08 | 9.26 | 8.20 | 7.00 | 4.5 | passa |
| `--lastro-txt-3` | 6.98 | 6.41 | 5.68 | **4.85** | 4.5 | passa (margem menor em sup-3) |
| `--lastro-alta` | 10.74 | 9.86 | 8.73 | 7.46 | 4.5 | passa |
| `--lastro-plato` | 9.36 | 8.59 | 7.61 | 6.50 | 4.5 | passa |
| `--lastro-queda` | 8.02 | 7.36 | 6.52 | 5.57 | 4.5 | passa |
| `--lastro-sync` | 8.96 | 8.23 | 7.29 | 6.22 | 4.5 | passa |
| `--lastro-erro` | 7.03 | 6.46 | 5.72 | **4.88** | 4.5 | passa |
| `--lastro-foco` | 13.87 | 12.74 | 11.28 | 9.63 | 3.0 | passa |
| `--lastro-borda-controle` | 4.89 | 4.49 | 3.98 | **3.39** | 3.0 | passa |
| `--lastro-borda` | 1.91 | 1.76 | 1.56 | 1.33 | — | **reprova de propósito** — ver nota A |

Pares fora da matriz:

| Par | Razão | Limiar | Veredito |
|---|---|---|---|
| `--lastro-acao-txt` sobre `--lastro-acao-fundo` | 17.27 | 4.5 | passa |
| `--lastro-acao-fundo` sobre `--lastro-fundo` (limite do botão) | 17.27 | 3.0 | passa |
| `--lastro-foco` sobre `--lastro-acao-fundo` | **1.25** | 3.0 | **reprova** — ver nota B |
| `--lastro-alta` vs `--lastro-plato` | **1.15** | — | ver nota C |
| `--lastro-plato` vs `--lastro-queda` | **1.17** | — | ver nota C |
| `--lastro-alta` vs `--lastro-queda` | **1.34** | — | ver nota C |
| `--lastro-erro` vs `--lastro-queda` | **1.14** | — | ver nota C |

**Nota A — `--lastro-borda` é decorativa por decisão.** 1.91:1 não serve como limite de componente. Ela só separa blocos que já se distinguem por superfície. **Todo alvo de toque usa `--lastro-borda-controle`** (pior caso 3.39:1). Regra de reprovação: qualquer controle cujo único limite visual seja `--lastro-borda` reprova o gate.

**Nota B — o anel de foco nunca encosta na ação primária.** Contra o botão claro ele some (1.25:1). Portanto o foco é sempre desenhado **fora** do elemento, com afastamento: `outline: var(--lastro-foco-espessura) solid var(--lastro-foco); outline-offset: var(--lastro-foco-afast);`. O vão do `offset` mostra a superfície do pai (fundo/sup-1/sup-2/sup-3), onde o anel entrega de 9.63 a 13.87. **Proibido `outline-offset: 0` ou anel interno (`inset`) em qualquer elemento sobre `--lastro-acao-fundo`.**

**Nota C — os quatro sinais têm luminância quase idêntica entre si (1.14 a 1.34).** Isso é proposital: todos foram calibrados para passar AA contra as quatro superfícies, o que os deixa na mesma faixa de claridade. O efeito colateral é que **um sinal não se distingue do outro** para quem tem deficiência de visão de cor — e blocos de alta, platô e queda podem aparecer lado a lado no mesmo parecer.

Consequência obrigatória, não recomendação — **em toda ocorrência, no gráfico e no parecer, cada sinal se distingue por dois canais além da cor:**

| Sinal | Traço no gráfico | Palavra obrigatória no rótulo |
|---|---|---|
| `--lastro-alta` | contínuo | o delta com sinal `+` e o intervalo |
| `--lastro-plato` | tracejado | "sem mudança" + a contagem de semanas |
| `--lastro-queda` | pontilhado | o delta com sinal `−` e o intervalo |

**Cor nunca é o portador da informação — é reforço.** Bloco de evidência ou trecho de gráfico que dependa só da cor para dizer o que é **reprova o gate**. Ver §3.7 e §3.6.6.

**O que não foi calculado:** nada. **Todo par de cor deste documento tem razão computada**, incluindo os pares sinal-contra-sinal, e o método foi aferido contra os valores canônicos do WCAG. Se um token novo entrar, ele entra com a razão calculada ao lado ou não entra.

### 3.3 Tipografia

| Papel | Família | Por quê |
|---|---|---|
| Números — carga, reps, volume, e1RM, percentual | `--lastro-fonte-num` (IBM Plex Mono) | **Monoespaçada garante avanço tabular por construção.** Não depende de o arquivo trazer a tabela OpenType `tnum`: a largura é igual porque a fonte é monoespaçada, ponto. Coluna de série não "dança" quando 9 vira 10, e o olho compara linha a linha em movimento |
| Texto — prosa do parecer, rótulo, botão | `--lastro-fonte-txt` (IBM Plex Sans) | Desenhada junto com a Mono na mesma superfamília: mesma altura-x, mesmo esqueleto, nenhum choque quando um número aparece dentro de uma frase — que é exatamente o que o parecer faz o tempo todo. Personalidade de instrumento técnico, coerente com o nome |

Ambas são **IBM Plex, licença SIL Open Font License 1.1** — livres para auto-hospedagem.

**Por que não `font-variant-numeric: tabular-nums` numa fonte proporcional:** essa via só funciona se o arquivo `.woff2` embarcado realmente trouxer a feature `tnum`, o que é verificável apenas inspecionando o binário. Monoespaçada resolve estruturalmente. **Ainda assim** o CSS de número declara `font-variant-numeric: tabular-nums slashed-zero;` **puramente como reforço oportunista**: se o `.woff2` embarcado trouxer `tnum` ou `zero`, ganha-se a garantia extra e o zero cortado que separa 0 de O na leitura rápida; se não trouxer, o navegador ignora e a largura continua igual pela monoespaçagem. **Nenhuma dessas duas features é afirmada aqui como presente** — só se confirmam inspecionando o binário que for de fato embarcado, e isso é item de build (§4.5), não premissa deste documento. A garantia que este documento assume é uma só: largura igual por construção.

**Carregamento sem depender de rede no meio do treino** (J1: o elevador derruba o sinal):

1. **Zero requisição a terceiro.** Nenhum `<link>` para `fonts.googleapis.com`. Os `.woff2` moram em `/public/fonts/` e são servidos pela mesma origem.
2. **Só os cortes usados**, estáticos, um arquivo por peso: Plex Sans 400 e 600; Plex Mono 500 e 600. Subconjunto `latin` + `latin-ext` — cobre `ã õ ç á é í ó ú â ê ô` do PT-BR.
3. `<link rel="preload" as="font" type="font/woff2" crossorigin>` para os quatro, no `<head>` do layout raiz.
4. `@font-face` com `font-display: swap` — se algo atrasar, o texto aparece na pilha de sistema e troca depois. Nunca tela em branco esperando fonte.
5. **Serwist (já na stack, CLAUDE.md) faz precache dos quatro arquivos.** Depois da primeira visita, a fonte vem do service worker. É isso que torna verdadeira a frase "não depende de rede", e não a auto-hospedagem sozinha.
6. A pilha de fallback já está declarada dentro de `--lastro-fonte-txt` e `--lastro-fonte-num` (§3.1) e **não se repete em lugar nenhum**. A fallback numérica também é monoespaçada, então a largura tabular sobrevive à troca.

**Verificar no build, não presumir:** se a versão variável de IBM Plex Sans estiver disponível no pacote adotado, ela substitui os dois estáticos e reduz bytes. Isso é otimização a conferir na Fase de implementação — **não é premissa deste documento**.

### 3.4 Escala de tamanho — regra de uso

- **`--lastro-t-corpo` é o piso do corpo (D4)** — o token foi fixado exatamente no valor que D4 exige. Nenhuma prosa, nenhum rótulo de campo, nenhum texto de botão abaixo dele.
- **`--lastro-t-meta` é o único degrau abaixo do corpo, e existe para um único papel:** metadado não-corpo — a linha de procedência do parecer (§3.6.3) e rótulos em caixa alta com entreletra aberta. **Proibido na tela de registro**, que é lida em pé, a um braço.
- Número em modo bancada: `--lastro-t-8`. Número dentro do parecer: `--lastro-t-5`. Título de seção do parecer: `--lastro-t-3`.
- Corpo do parecer: `--lastro-t-1` com `--lastro-el-corpo` — é prosa lida sentada, não rótulo.

### 3.5 Dois modos de densidade, um só conjunto de tokens

O app tem duas cenas opostas: **registro** (em pé, com pressa, suado, uma mão, luz ruim) e **leitura do parecer** (domingo, sentado, com calma, às vezes no PC). Tratar as duas igual prejudica as duas.

**Decisão: sim, tratamentos visuais diferentes — mas é uma só paleta e uma só escala.** São dois *regimes de densidade*, não dois temas. Paleta, famílias e escala são idênticas; o que muda é qual degrau se usa.

| | **Modo Bancada** (registro) | **Modo Leitura** (parecer, gráfico, histórico) |
|---|---|---|
| Unidade de layout | um alvo por linha, largura total | coluna de leitura, medida confortável |
| Número | `--lastro-t-8`, `--lastro-el-apertada` | `--lastro-t-5`, dentro de prosa |
| Texto | `--lastro-t-corpo` para cima, sem `--lastro-t-meta` | `--lastro-t-1` de corpo, `--lastro-t-meta` liberado para procedência |
| Espaço entre blocos | `--lastro-e-6` a `--lastro-e-8` | `--lastro-e-8` a `--lastro-e-16` |
| Ação primária | `--lastro-alvo-acao`, largura total, metade inferior (D2, D3) | botões normais, `--lastro-alvo-min` |
| Elementos por tela | poucos, grandes, redundância zero | densidade maior é aceitável: há tempo de leitura |
| Movimento | quase nenhum — `--lastro-dur-1`, só confirmação de toque | transição de entrada em `--lastro-dur-2` |

**Justificativa:** um parecer de três parágrafos em `--lastro-t-8` vira rolagem infinita e some com a hierarquia; um botão de registrar série em `--lastro-t-corpo` numa lista densa erra o toque com dedo suado. A cena manda (§1).

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

1. **Cabeçalho de emissão.** A pergunta escolhida como título, em `--lastro-t-3`. Abaixo, em `--lastro-txt-3` e `--lastro-t-meta`: o intervalo da semana fechada e a data de emissão. Alinhado à esquerda, sobre `--lastro-fundo`, largura total da coluna de leitura. Isso é o que primeiro diz "documento" em vez de "mensagem".
2. **Veredito.** Uma frase, `--lastro-t-3`, `--lastro-peso-forte`, `--lastro-txt`. É a resposta à pergunta, sem rodeio.
3. **Blocos de evidência** — o coração da tela (§3.6.3).
4. **Prosa de leitura.** Um a três parágrafos em `--lastro-t-1` / `--lastro-el-corpo`, largura de coluna limitada. A prosa *conecta* as evidências; ela não é onde os números moram.
5. **O que fazer** (só na pergunta 5 do PRD §3). Lista curta, cada item ancorado num bloco de evidência acima.

Nada disso é centralizado, nada é cartão flutuante com sombra. É documento: margem esquerda estável, hierarquia por tamanho e peso, ar entre seções em `--lastro-e-8`+.

#### 3.6.3 Como os números do dono aparecem — a decisão central

**Os números saem da prosa e viram dado tipografado.** Esta é a decisão que separa o parecer de um balão de chat: num chat, o número está enterrado no meio da frase, na mesma fonte, do mesmo tamanho. Aqui não.

**Bloco de evidência** — superfície `--lastro-sup-2`, `--lastro-raio-2`, padding `--lastro-e-5`, e uma **barra vertical de `--lastro-barra-evidencia`** na borda esquerda, na cor do sinal (`--lastro-alta`, `--lastro-plato` ou `--lastro-queda`). Três linhas, sempre nesta ordem:

- **Linha 1 — o exercício, pelo nome que o dono usou.** `--lastro-t-corpo`, `--lastro-peso-forte`, `--lastro-txt`. Nome de academia em PT-BR, o mesmo do catálogo (PRD §4.5).
- **Linha 2 — o número, em `--lastro-fonte-num`, `--lastro-t-5`, `--lastro-txt`.** Grande, tabular, com unidade. Quando há comparação, dois números lado a lado com o delta entre eles no sinal correspondente. É a linha que se lê de relance.
- **Linha 3 — a procedência.** `--lastro-t-meta`, `--lastro-txt-3`, `--lastro-fonte-num` para as partes numéricas. Formato: **janela · quantas séries valendo sustentam o número · origem do cálculo.** Exemplo de forma (valores ilustrativos): `4 semanas · 14 séries valendo · calculado no dispositivo`.

**Por que isso responde "é sobre ELE":** um bloco desses é impossível de escrever sem os dados dele. Ele carrega nome de exercício do log dele, número dele, e a contagem de séries dele. É a materialização visual do critério A6 do PRD — *se o bloco pudesse ter sido escrito sem olhar os dados, ele falhou*. E como o bloco é visualmente separado, dá para auditá-lo sem ler a prosa.

**Dentro da prosa**, quando um número precisa aparecer no meio da frase, ele vem em `--lastro-fonte-num` e `--lastro-peso-medio`, na mesma cor do texto. A troca de família já o destaca; **proibido colorir número dentro de prosa** — cor ali confunde com sinal semântico.

#### 3.6.4 Como se mostra que há cálculo determinístico atrás

A regra inegociável do PRD §3 e da CLAUDE.md — o agregador calcula, o LLM só interpreta — precisa ser **visível**, não prometida. Três mecanismos, nesta ordem de importância:

1. **Toda evidência é citável.** Número + unidade + janela + `n` de séries valendo (§3.6.3, linha 3). Chute de modelo não vem com denominador. Isso comunica determinismo melhor que qualquer selo.
2. **A ordem de aparição na tela conta a arquitetura.** O agregador roda local e termina antes de o LLM começar a escrever. Portanto, no estado `gerando`, **os blocos de evidência já aparecem preenchidos**, com números e procedência definitivos, enquanto só a prosa está pendente (§3.6.5). O dono vê que a conta já estava pronta antes do texto existir.
3. **Rodapé de método.** Uma linha em `--lastro-t-meta` / `--lastro-txt-3`: quais métricas alimentaram este parecer e que séries de aquecimento foram excluídas (regra 3 da CLAUDE.md). Texto fixo, não gerado.

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

### 3.7 O gráfico de progressão — sem obrigar a ler eixo

A pergunta que o gráfico responde não é "quanto?", é "**está subindo?**". O eixo fica como recurso de conferência, nunca como via principal.

1. **Rotulagem direta.** Primeiro e último ponto rotulados no próprio gráfico, em `--lastro-fonte-num`. Sem legenda lateral, sem obrigar a cruzar cor com nome.
2. **A conclusão em palavras, acima do desenho.** Uma linha em `--lastro-t-2`: o delta em número e o intervalo, em português — a leitura já feita. Quem só lê essa linha já sabe o resultado; o desenho é a prova.
3. **Platô é desenhado, não deduzido.** O trecho sem mudança vira segmento **tracejado** em `--lastro-plato`, com anotação ancorada dizendo há quantas semanas. Trecho de progressão é **contínuo** em `--lastro-alta`. Traço diferente + rótulo em texto — a nota C de §3.2 torna isso obrigatório.
4. **Sem grade de fundo densa.** No máximo uma linha de referência horizontal com propósito declarado (ex.: melhor marca), rotulada nela mesma.
5. **Área de toque.** Ponto do gráfico tem alvo de no mínimo `--lastro-alvo-min`, mesmo que o marcador desenhado seja pequeno.
6. **Alternativa textual.** Todo gráfico tem um resumo em texto acessível a leitor de tela, com os mesmos números dos rótulos diretos. Sem isso, o gráfico reprova.
7. **Viável na stack (Recharts, CLAUDE.md):** rotulagem direta com componentes de rótulo próprios, linha de referência e segmentos com `strokeDasharray` distinto. Nada aqui exige biblioteca fora da stack.

### 3.8 Autoconsistência — verificação feita

Verificado por busca mecânica neste arquivo:

Método: varredura por expressão regular sobre o arquivo, procurando `#hex`, literais `px`/`rem`/`em` e nome de família fora do bloco `:root` de §3.1, mais conferência cruzada entre tokens declarados e tokens citados.

- **Todo valor literal de cor, espaço, tamanho, peso, raio e duração do sistema está dentro do `:root`.** As únicas ocorrências fora dele, todas legítimas e nomeadas aqui:
  - **razões de contraste** em §3.2 e §4.2 — resultado de medição, não valor de design;
  - **limiares do WCAG** (4.5 e 3.0) — norma externa, não decisão nossa;
  - os literais `48px` e `16px` que já estavam em **D1 e D4 na §2** (restrições congeladas, anteriores a este gate). Os tokens `--lastro-alvo-min` e `--lastro-t-corpo` foram fixados exatamente nesses valores, e é o token que o código usa;
  - o **nome das famílias** em §3.3 e §5, citado apenas para justificar e para o dono aprovar. O valor efetivo vive só em `--lastro-fonte-txt` / `--lastro-fonte-num`.
- **Todo token citado em prosa existe no `:root`:** conferido, zero divergência. Todo token de cor tem razão calculada em §3.2.
- Alguns degraus de `--lastro-e-*` e `--lastro-t-*` não são citados em prosa — uma escala existe inteira por definição; não é inconsistência.
- Nenhuma cor foi importada da referência visual; a paleta é original e todo par foi calculado.

### 3.9 O que este documento NÃO é

**Nenhuma tela foi renderizada, aberta em navegador ou olhada.** O Diretor de Arte não tem ferramenta que renderize página; a referência visual foi lida por download de HTML/CSS/JS. Toda razão de contraste acima é aritmética sobre hex, não medição em pixel renderizado. **A validação continua sendo o gate de §4, executado pelo controller, com olho em navegador real.**

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
| F4 | Menor texto renderizado em G1 | Qualquer texto abaixo de `--lastro-t-corpo` na tela de registro |
| F5 | Menor texto renderizado em G2 | Qualquer texto abaixo de `--lastro-t-meta`, ou prosa abaixo de `--lastro-t-corpo` |

### 4.6 Fonte única

| # | Verificação | Reprova se |
|---|---|---|
| S1 | Busca por hex (`#[0-9a-fA-F]{3,8}`) em todo o código do app | Qualquer ocorrência fora do arquivo que materializa o `:root` de §3.1 |
| S2 | Busca por literais `px`/`rem` em componentes e por nome de fonte | Qualquer ocorrência fora do `:root` |
| S3 | Cor passada como literal para Recharts | Qualquer prop de cor que não leia um token |

---

## 5. Precisa da aprovação do dono antes de virar código

1. **A personalidade** de §3.0 — instrumento sóbrio, sem gradiente nem 3D, ação primária quase branca em vez de colorida. É a decisão da qual todo o resto pende.
2. **O par tipográfico** IBM Plex Sans + IBM Plex Mono, e o custo de auto-hospedar quatro arquivos.
3. **A divisão em dois regimes de densidade** (§3.5) — se o dono achar que uma tela deve parecer com a outra, §3.5 e §3.6 mudam juntas.
4. **O formato do parecer como documento datado com blocos de evidência** (§3.6) — é a aposta central do projeto inteiro. Se o dono ler e disser "isso é frio", a correção é de tom de texto, não de estrutura.
5. **A escolha do âmbar para platô** em vez de vermelho (§3.6.6): informa sem repreender, mas é menos urgente à primeira vista. Decisão do dono.
6. **O tamanho da linha de procedência.** §3.6.4 a classifica como o mecanismo **mais importante** para mostrar que há cálculo determinístico atrás — e §3.6.3 a renderiza em `--lastro-t-meta` (o único degrau abaixo do corpo) e `--lastro-txt-3` (a razão mais apertada do sistema, 5.68 sobre `--lastro-sup-2`). É o elemento que estabelece confiança, no menor tamanho e no menor contraste do sistema. Defensável porque vive só no Modo Leitura, sentado — mas é o ponto em que este documento mais raspa em D4. **Duas saídas, o dono escolhe:** manter como está, ou promover a procedência a `--lastro-t-corpo` e aceitar que o bloco de evidência fique mais alto.

**Advertência registrada:** a validação final de qualquer peça visual é **olho do dono em navegador real, no celular**. Medição de DOM não substitui — `getComputedStyle` não detecta toda renderização errada.
