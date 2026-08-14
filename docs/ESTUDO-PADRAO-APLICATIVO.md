# ESTUDO — padrão de aplicativo (composição e interação)

> **Status:** estudo de embasamento. **Não é decisão de design ainda** — é o material que a decisão vai usar. Escrito em 2026-08-14, depois de o dono reprovar duas propostas de composição.
>
> **Para quem implementa e para os agentes:** cada regra abaixo termina em **Reprova:**. Isso é de propósito — uma regra que não dá para reprovar num diff não é regra, é opinião.

---

## 0. O pedido que originou este documento

Literal, do dono, depois de reprovar a proposta de linha divisória:

> *"quero que entre nos navegadores, olhe as referências de aplicativos e designer, ui/ux como elas trabalha em cima da interação do cliente, quero que faça um estudo para se embasar e com isso os agentes possa trabalhar, como está hoje precisa mudar já, construímos muita coisas, mas tá na hora de dar um foco nas interação e no visual, **nada de linhas soltas, nada de blocos soltos, não é um site, é um aplicativo então ele deve agir como um**"*

**As duas composições que ofereci e ele reprovou:**

| Proposta | Por que reprova |
|---|---|
| Cartão empilhado (`.item`, como está hoje) | é **"bloco solto"** — N superfícies flutuando sobre o fundo |
| Linha com divisória (anatomia do `.serie`) | é **"linha solta"** — traço correndo direto sobre o fundo da página |

O erro não foi escolher a errada entre as duas. **As duas são vocabulário de página web.** Este documento existe para levantar o vocabulário de aplicativo antes de propor de novo.

## 0.1 Cerca de escopo — ler antes de usar este documento

Este estudo trata de **composição e interação apenas**.

**A paleta, a tipografia e a tese visual do `DESIGN.md` §3 estão aprovadas pelo dono e permanecem.** Não estão em revisão aqui. Já foi medido e registrado (`PROGRESS.md`, 2026-08-14) que a queixa de "cor destoa" **não era pigmento** — fundo e borda são bit a bit idênticos entre a tela reclamada e a não reclamada. Qualquer proposta que saia daqui mexendo em token de cor está fora do escopo deste documento e colide com um gate já aprovado.

**Reprova:** proposta derivada deste estudo que altere `tokens.css` na seção de paleta, ou que reabra a tese "Areia & Azul Petróleo".

## 0.2 Este estudo não reabre o diagnóstico

As quatro causas do defeito atual já estão medidas, registradas e mergeadas (`PROGRESS.md`, PR #41): (1) interior do cartão preso ao `.item__link`, (2) densidade, (3) papel tipográfico invertido, (4) `display:block` quebrando centralização em `<a>`.

**Este estudo muda a resposta de composição, não o diagnóstico.** As causas 1, 3 e 4 continuam válidas e precisam ser resolvidas por qualquer caminho que se escolha.

---

## 1. Referências consultadas — o que foi realmente olhado

| Fonte | O que é | O que se tirou |
|---|---|---|
| [Apple HIG — Lists and tables](https://developer.apple.com/design/human-interface-guidelines/lists-and-tables) | especificação | estilo agrupado; indicador de divulgação; feedback de seleção |
| [Apple HIG — Feedback](https://developer.apple.com/design/human-interface-guidelines/feedback) | especificação | quando confirmar, quando não avisar, feedback por múltiplos canais |
| [Apple HIG — Modality](https://developer.apple.com/design/human-interface-guidelines/modality) | especificação | quando uma tarefa vira folha/modal em vez de tela nova |
| [Material 3 — Lists](https://m3.material.io/components/lists/guidelines) | especificação | anatomia da linha; vãos vs. divisórias; alinhamento de scan |
| [Material 3 — States](https://m3.material.io/foundations/interaction/states/overview) | especificação | os 6 estados obrigatórios de qualquer elemento interativo |
| [Hevy (App Store)](https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350) | **app real, concorrente direto** | telas de registro de série e de detalhe de exercício, olhadas em tamanho real |

O Hevy é o análogo mais próximo que existe do lastro: mesmo domínio (registro de série na academia), mesma escala de dado, 86 mil avaliações. **É a referência que mais pesa aqui** — as especificações dizem o que é permitido; o Hevy mostra o que sobrevive ao uso real no mesmo problema.

### 1.1 O que as telas reais do Hevy mostram

**Tela "Log Workout"** (análogo do `/treino/[id]`):
- barra de topo com dispensar (`⌄`), título, e **a ação primária "Finish" como pílula compacta no canto superior direito** — não um bloco verde de largura total no meio do corpo;
- faixa de resumo logo abaixo: `Tempo 1h15 · Volume 6 800 kg · Séries 18`, rótulo pequeno em cima, valor grande embaixo, **sem caixa em volta**;
- por exercício: miniatura + nome em cor de acento + **`⋮` de excesso à direita**;
- **cabeçalho de coluna** em maiúsculas miúdas: `PREVIOUS · KG · REPS · ✓`;
- cada série é uma linha alinhada **por coluna**, com a anterior em cinza e a marcação de concluída como círculo verde;
- `+ Add Set` como botão largo, **fantasma, sem borda**, dentro da seção.

**Tela de detalhe do exercício** (análogo do `/catalogo/[id]`):
- barra de navegação com `←` e título centralizado;
- **abas sublinhadas**: `Summary · History · How to · Leaderboard`;
- gráfico embutido no fluxo, sem moldura;
- **chips segmentados** para trocar a métrica: `Heaviest Weight · One Rep Max · Best`, o ativo preenchido.

**O achado que mais importa: nas duas telas não há uma única borda de cartão.** A separação é feita por **cabeçalho de seção + respiro + alinhamento de coluna**. É exatamente o "nada de blocos soltos" do dono, aplicado por um app do mesmo domínio com 10 milhões de usuários.

---

## 2. A gramática — containment, e por que ela resolve a frase do dono

### 2.1 As especificações discordam. Não se faz média entre elas.

- **HIG (estilo agrupado):** um recipiente que agrupa as linhas, com **divisórias internas** que recuam junto com o conteúdo.
- **Material 3:** *"Use gaps for contained lists. Limit dividers to uncontained or complex lists, only when a stronger visual separation is necessary."* — ou seja, o oposto: se é contido, separe por **vão**, não por traço.

Fazer média entre os dois é como se volta a "linha solta". **Adota-se o modelo HIG agrupado**, por três razões ancoradas no que este projeto já decidiu:

1. `DESIGN.md` §3.0 já adotou a adjacência **Linear/Stripe** — densidade de dado, contenção, hierarquia por tipo. Contenção é literalmente o nome do modelo agrupado.
2. O lastro é lista de **dado curto e homogêneo** (anilhas, modelos, séries). O vão do M3 gasta altura vertical, que é justamente a causa 2 (densidade) já medida.
3. O modelo agrupado é o único dos três que **não é nem bloco solto nem linha solta** — ver a seguir.

### 2.2 A definição, e por que ela responde exatamente ao que ele disse

**Uma seção = uma superfície contínua.** Dentro dela, as linhas dividem espaço com separadores **internos**, que começam recuados da aresta e nunca tocam a borda do recipiente.

| | O que é | Por que o dono reprova |
|---|---|---|
| Bloco solto | N superfícies com borda e sombra, uma por item, flutuando sobre o fundo | cada item vira uma peça; a lista deixa de ser uma coisa só |
| Linha solta | traço correndo sobre o fundo da página, sem recipiente | o traço não pertence a nada; é régua de documento |
| **Agrupado (adotado)** | **uma** superfície com N linhas dentro; separadores internos, recuados | é **uma peça com partes** — que é como aplicativo organiza informação |

**A ideia organizadora é essa: contenção.** Tudo na seção 3 pende dela.

**Reprova:** lista de itens homogêneos renderizada como N elementos com borda/sombra próprias. **Reprova:** separador que toca a aresta externa do recipiente ou que corre sobre o fundo da página sem recipiente.

---

## 3. Regras de composição

### R1 — Uma seção é um recipiente, não um empilhamento

Toda lista de itens do mesmo tipo mora dentro de **um** recipiente: um `border-radius`, uma borda, uma elevação — no conjunto, **nunca por item**. O item de dentro não tem borda, não tem sombra, não tem raio próprio.

**Reprova:** `box-shadow` ou `border` declarado no item de lista em vez de no recipiente.

### R2 — O cabeçalho de seção pertence à seção

Rótulo da seção fica **fora** da superfície, acima dela, em tamanho de metadado. Nota explicativa fica **abaixo**, também fora, em `--lastro-t-meta`. É o par cabeçalho/rodapé do estilo agrupado — é ele que faz a seção ler como unidade sem precisar de moldura extra.

**Reprova:** texto explicativo de uma seção renderizado dentro do recipiente, disputando espaço com os dados.

### R3 — Alinhamento por coluna é obrigatório em lista de dado

Todo elemento repetido ocupa **a mesma posição horizontal em todas as linhas**. Vale para o valor, para a unidade e para a ação. É o que o M3 formula como *"Place supporting visuals and primary text in the same position in each list item / Don't vary the position of elements within a list"*, e é o que o Hevy resolve com cabeçalho de coluna explícito.

**Esta é a regra que endereça a queixa literal do dono** (*"está tudo desalinhado"*), hoje medida em 32 px de variação da lixeira entre linhas.

**Reprova:** dois itens da mesma lista em que qualquer elemento correspondente tenha `x` diferente. É medível com `getBoundingClientRect()`; não é julgamento de olho.

### R4 — Número e unidade são elementos separados

`"20 kg"` como string única impede alinhamento — "20 kg" e "1.25 kg" viram larguras diferentes de um bloco só. Valor em `--lastro-fonte-num` com `tabular-nums`, alinhado à direita, largura mínima em `ch`; unidade em elemento próprio, menor e mais leve.

**Reprova:** unidade concatenada ao valor na mesma string dentro de um slot de dado.

### R5 — Slot de dado numérico não recebe texto

`--lastro-fonte-num` é para número — carga, reps, volume, e1RM, percentual (`DESIGN.md` §3.3). **Nome de modelo, nome de exercício e rótulo vão em `--lastro-fonte-txt`.** Nome próprio em fonte de número não lê como "estilo diferente": lê como **cor diferente**, porque Mono 400/18px tem haste mais fina que Sans 600/16px, e o bloco maior acaba lendo mais fraco que o menor. Foi essa inversão que o dono reportou como "a cor destoa" — causa 3, já medida.

**Reprova:** conteúdo não-numérico dentro de `.item__data` ou de qualquer slot com `--lastro-fonte-num`.

---

## 4. Regras de interação — a parte que o dono chamou de "como elas trabalha em cima da interação"

### R6 — Os seis estados são obrigatórios

M3 define, e não é opcional em elemento interativo: **repouso, desabilitado, sobre, foco, pressionado, arrastado**. Este projeto já cumpre foco (D9) e pressionado no botão. **Onde falta hoje é na linha de lista:** uma linha que responde ao toque prova que é tocável antes de o usuário tocar.

**Reprova:** elemento interativo sem estado de pressionado perceptível, ou sem anel de foco desenhado fora dele.

### R7 — A afordância tem que dizer a verdade

HIG separa dois adornos que parecem intercambiáveis e não são: **indicador de divulgação (`›`) só quando a linha navega**; botão de informação só quando revela detalhe sem navegar.

Corolário direto para o lastro, e é o erro que produziu a confusão atual: **`.item__link` é a linha que navega, e é a única que pode ter realce de toque.** Linha de anilha não navega — herdar `cursor:pointer` e realce dela seria mentir sobre o que acontece se tocar.

**Reprova:** linha com realce de toque ou `›` que não navega. **Reprova:** linha que navega sem nenhuma pista de que navega.

### R8 — Ação destrutiva não fica visível em toda linha

Hoje o lastro põe um ícone de lixeira em **todas** as seis linhas de anilha. Nenhum app de referência faz isso: destrutivo vive atrás de excesso (`⋮`), de deslize, ou de um modo de edição — HIG registra que no iOS *"people must enter an edit mode before they can select table items"*.

Duas consequências, e a segunda é a que o dono viu: seis lixeiras é seis convites a errar o dedo numa ação irreversível; e é seis elementos de peso visual competindo com os dados que a lista existe para mostrar.

O projeto **não abre mão da confirmação em duas etapas** (`DESIGN.md`: nunca `window.confirm`) — isso continua. A questão é só se o gatilho fica visível o tempo todo.

**Reprova:** ação irreversível disparável em um toque. **Marcar como decisão do dono:** se a lixeira sai de todas as linhas, entra em quê — excesso, deslize ou modo de edição.

### R9 — A ação primária mora onde o polegar alcança, e há só uma por tela

D2 já manda a ação primária ir para a metade inferior. O Hevy resolve pondo "Finish" na barra de topo como pílula compacta — legítimo no iOS nativo, **mas não aqui**: o lastro é PWA em celular grande, e D2 foi decidido olhando alcance de polegar.

O que se importa do Hevy é o outro lado: **ação secundária dentro da seção é fantasma, sem borda pesada** (`+ Add Set`). É o que impede "Adicionar" de competir com "Salvar configuração", que é o desequilíbrio já registrado na tela de Anilhas.

**Reprova:** duas ações com o mesmo peso visual na mesma tela. **Reprova:** ação secundária inline com preenchimento ou borda de mesma força que a primária.

### R10 — Criar coisa curta é folha, não tela nova

HIG: modal serve para *"perform a distinct, narrowly scoped task without losing track of their previous context"*, e manda manter modal simples e curto.

"Criar modelo" hoje é navegação para `/ajustes/modelos/novo` — o usuário sai da tela, perde o contexto e volta por um caminho que ele não escolheu. É comportamento de site. Tarefa curta (nome + lista de exercícios) é candidata natural a folha sobre a tela atual, com dispensar óbvio.

**Reprova:** tarefa de um campo ou dois que exija navegação para outra rota e volta. **Marcar como decisão do dono:** isso muda rota e histórico; não é mudança de CSS.

### R11 — Confirmar sucesso só quando ele não é esperado

HIG: *"because people typically expect their action or task to succeed, they only need to know when it doesn't"* — e avisar de perda de dado só quando ela for **inesperada**.

O lastro acerta hoje em "Configuração salva". Onde a regra vale é para não acrescentar toast/aviso a cada série registrada: a série aparecendo na lista **é** a confirmação. A atualização otimista que a Fase 2 construiu já é a resposta certa.

**Reprova:** confirmação explícita de operação cujo resultado já é visível na tela.

### R12 — Feedback por mais de um canal

HIG: cor, texto, som e háptico juntos alcançam mais gente. `DESIGN.md` §3.2 nota C já diz que cor nunca é o único canal.

**Reprova:** estado comunicado só por cor.

---

## 5. Como isso muda cada tela reclamada

Aplicação das regras acima. **Ainda não é proposta implementável — falta o dono confirmar a gramática da seção 2.**

| Tela | O que muda | Regras |
|---|---|---|
| `/ajustes/anilhas` — inventário | Seis cartões viram **uma** seção contida com seis linhas; valor e unidade separados, alinhados por coluna; lixeira sai de toda linha | R1, R3, R4, R8 |
| `/ajustes/anilhas` — adicionar | "Adicionar" deixa de ser metade da largura da tela e vira ação fantasma dentro da seção | R9 |
| `/ajustes/modelos` — lista | Mesma seção contida; **nome sai da fonte de número**; cada linha navega ou não navega, e a afordância diz qual | R1, R5, R7 |
| `/ajustes/modelos` — criar | Vira botão primário (**já decidido pelo dono**); posição e folha-vs-rota **pendentes de decisão dele** | R9, R10 |
| `/ajustes` | **Não muda de aparência** — é a referência interna que já está certa. Só herda o recipiente | R1 |
| `/perfil` | Nome do usuário ganha papel tipográfico declarado (hoje é `<p>` sem classe, default do navegador) | R5 |

**Restrição inegociável, em qualquer caminho:** `/ajustes`, `/treino`, home e `/catalogo/[id]` saem **pixel-idênticos**. Isso favorece solução aditiva sobre editar `.item`.

---

## 6. O que está decidido, o que não está

**Decidido pelo dono:** "Criar modelo" é ação primária. Nem bloco solto nem linha solta. O app tem de agir como aplicativo.

**Decidido neste estudo (técnico, reversível):** adota-se a gramática agrupada do HIG em vez do vão do M3, justificado em §2.1.

**Pendente de decisão do dono — não avançar sem ele:**

1. A gramática da §2.2 (seção contida) é a direção certa?
2. R8 — a lixeira sai de todas as linhas? Se sai, vai para excesso, deslize ou modo de edição?
3. R10 — criar modelo vira folha ou continua rota própria?
4. Posição de "Criar modelo" (rodapé via `.acao-area` vs. onde está) — ele pediu para decidir *"depois de eu solicitar algo"*.

**Próximo passo, na ordem:** confirmar a gramática (1) → decidir 2 e 3 → só então mockup → só então CSS. A ordem importa: a última proposta foi reprovada porque a gramática não estava acordada, não porque os pixels estavam errados.
