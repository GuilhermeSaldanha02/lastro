# Backlog da próxima fase — `lastro`

> **Documento de partida para a próxima sessão.** Escrito em 2026-08-13, ao fim da sessão que fechou a tela de Ajustes/Perfil (PR #26). É autocontido de propósito: quem abrir um chat novo consegue trabalhar a partir daqui sem reler o histórico inteiro.
>
> Nada neste documento foi implementado. Tudo aqui é decisão já tomada pelo dono ou achado verificado — não é lista de ideias.

---

## Como este backlog nasceu

Três fontes, nesta ordem:

1. **Auditoria de usabilidade** rodada em 2026-08-13: o controller navegou o app real no Chrome (usuário QA efêmero, 4 semanas de dado real, removido ao final), capturou as 7 telas, e o agente `diretor-arte` analisou as evidências contra `DESIGN.md`. O agente não navega — sua doutrina proíbe alegar ter olhado tela; quem olhou foi o controller, e o agente analisou o relato.
2. **Achado do dono no aparelho real**, mesmo dia: botão redundante na Análise (item B1 abaixo).
3. **Pesquisa de mercado** sobre o que apps consolidados (Hevy, Strong) tratam como essencial, cruzada com o escopo negativo do `PRD.md` §5 e com o código real. O dono aprovou 5 dos 7 candidatos; os 2 recusados estão registrados na seção "Não aprovados", não omitidos.

---

## A — Correções (bugs e inconsistências verificados)

### A1 · Avatar de iniciais é invisível em `/perfil` — **P0**

**O bug.** O círculo de iniciais não aparece de jeito nenhum no corpo de `/perfil`. Não é baixo contraste: são **três** propriedades colapsando na mesma cor contra `--lastro-fundo: #F0EAE0`:

| Propriedade | Token | Valor |
|---|---|---|
| Preenchimento | `--lastro-avatar-iniciais-fundo` | `rgba(240, 234, 224, 0.12)` |
| Letra | `--lastro-barra-txt` | `#F0EAE0` |
| Borda | `--lastro-barra-traco` | `rgba(240, 234, 224, 0.38)` |

**Causa raiz — importa mais que o sintoma.** O componente `<Avatar>` (`src/components/avatar.tsx`) foi desenhado assumindo que sempre vive dentro de `.barra-topo` (fundo petróleo escuro), onde funciona bem. `/perfil` é o **primeiro lugar do app** que usa `<Avatar>` fora da barra, direto no corpo claro (`editar-perfil.tsx`, construído em 2026-08-12). O default é seguro em um único contexto e falha em silêncio em todos os outros — a próxima tela que usar `<Avatar>` fora da barra reproduz o bug idêntico.

**Por que é P0 e não cosmético:** `/perfil` existe justamente para quem **ainda não tem foto**. O único estado que essa pessoa vê ao entrar pela primeira vez é "nome + vazio + botão". Depois que sobe uma foto, `<Avatar>` renderiza `<img>` e o bug some — ou seja, ele só atinge o estado inicial, que é o estado que motiva a tela existir.

**Correção especificada pelo `diretor-arte`** (zero tokens novos — todos os pares já estão medidos em `DESIGN.md` §3.2). Arquivo: `src/app/sistema.css`, bloco `.avatar` / `.avatar--iniciais` (~linhas 118-138). **Não tocar** `avatar.tsx` nem `tokens.css`.

- **`.avatar` (base):** `border` passa de `--lastro-barra-traco` para `--lastro-controle` (3.40:1 sobre `--lastro-fundo`; é o token que a Nota A de §3.2 designa como limite de componente — `--lastro-barra-traco` é translúcido e só existe para o gradiente da barra).
- **`.avatar--iniciais` (base):** vira areia — `background: var(--lastro-sup-2)`, `color: var(--lastro-txt)`. `font-size`/`font-weight`/`letter-spacing` inalterados.
- **Novo override de contexto:** `.barra-topo .avatar` e `.barra-topo .avatar--iniciais` restauram o tratamento petróleo atual. Isso preserva **exatamente** o visual da barra nas 7 telas — a correção não pode mudar um pixel lá.
- **Comentário obrigatório no CSS** explicando que a base é a variante de corpo claro e a barra é o caso especial, com data e motivo. Sem isso alguém "simplifica" de volta.

**Rejeitado, com razão registrada:** envolver o avatar num chip petróleo fora da barra. `DESIGN.md` §3.0 fixa **duas** superfícies petróleo e só duas (barra de topo e pílula tingida); um terceiro círculo petróleo no corpo violaria uma decisão documentada, e reescrever §3.0 por um elemento de 48px não se paga.

**Emenda a `DESIGN.md`.** Inserir ao final de §3.1, imediatamente antes do parágrafo que começa com "**Espaçamento, alvos, escala de tamanho…**", o texto que o `diretor-arte` redigiu verbatim (está no relatório da sessão de 2026-08-13; reproduzi-lo aqui duplicaria fonte de verdade — P7).

**Acessibilidade: não mexer.** `avatar.tsx` marca a variante de iniciais com `aria-hidden="true"`, e está correto nos dois contextos (na barra o nome é anunciado em outro lugar; em `/perfil` o nome está logo abaixo no DOM). Iniciais lidas por leitor de tela seriam ruído.

### A2 · Catálogo repete "Dica de execução ainda não escrita." em 102 cards

**Não confundir com o débito de conteúdo** (item C1 abaixo, FF7/ADR-007 — escrever as dicas é redação humana e continua fora de escopo de código). O problema aqui é outro: a frase repetida 102 vezes é **ruído de varredura**. Cada card gasta uma linha de corpo para dizer "não há nada aqui", e o nome do exercício — única informação real da tela — fica com metade da densidade possível. Para quem está em pé procurando "onde está a cadeira extensora", a lista fica duas vezes mais longa sem ganho nenhum.

**Correção:** suprimir a linha quando `dica_execucao` é `NULL`; comunicar a ausência **uma vez** (cabeçalho do grupo ou topo da tela). Quando a dica existir, ela aparece normalmente. Zero relação com FF7 — não se está gerando dica nenhuma, só parando de anunciar o vazio item a item.

### A3 · Rótulo divergente: "Treinos" (barra de topo) vs "Bancada" (pílula)

Um lugar, dois nomes. A pessoa não tem certeza de que está no mesmo lugar. **Escolher um nome e usar nos dois.** Recomendação do `diretor-arte`: a pílula é a fonte de verdade (ela é o mapa do app; a barra é a legenda da tela atual). **Qual dos dois nomes vence é decisão do dono** — é vocabulário de produto, não de design.

### A4 · Verificar: "Continuar" vs "Iniciar" nas duas telas — possível regressão

O item 11 de `PROGRESS.md` estabeleceu que `/` e `/treino` ganharam a mesma checagem "Continuar treino de hoje" vs "Iniciar treino de hoje". Na auditoria de 2026-08-13 as duas telas mostraram "Iniciar" — mas a conta QA tinha *semana* em andamento, não *treino aberto hoje*, então o relato não distingue regressão de comportamento correto.

**Como verificar:** criar um treino de hoje com pelo menos 1 série e conferir se **as duas** telas viram "Continuar". Se só uma virar, é regressão do item 11.

---

## B — Achado do dono (2026-08-13, aparelho real)

### B1 · Botão "Registrar treino" na Análise é redundante

**O que o dono viu:** com dado insuficiente para o parecer, `/analise` mostra o estado "Você tem 1 semana fechada. São necessárias 3 para calcular a análise semanal." seguido de um botão verde grande **"Registrar treino"**.

**Palavras dele:** *"não era para tar assim, se já existe o iniciar treino no início, não precisa desse ícone"*.

**Por que ele tem razão, e não é só gosto:** a Início é a **porta de entrada única do app** — decisão registrada desde 2026-08-06, e o motivo de `forcar-inicio-no-lancamento.tsx` existir. A ação primária "iniciar/continuar treino" já mora lá e na Bancada. Um terceiro botão verde de ação primária, numa tela cujo propósito é **ler**, compete com a leitura e dilui a hierarquia — `DESIGN.md` §3.0 diz que cada tela tem **um** elemento que pesa mais, e em `/analise` esse elemento é o parecer (ou, na sua ausência, a explicação de por que ele não existe ainda).

**Escopo da correção:** remover o botão do estado "dados insuficientes" em `/analise`. O texto explicativo permanece — ele é honesto e necessário (E3). **Decisão pendente do dono:** o estado vazio fica só com o texto, ou ganha um link discreto (não botão primário verde) para a Bancada?

---

## C — Funcionalidades aprovadas pelo dono (2026-08-13)

Aprovadas depois de pesquisa de mercado cruzada com `PRD.md` §5. Numeração original da pesquisa mantida entre parênteses para rastreio.

### C1 · Coluna "anterior" na linha de série (pesquisa #1) — **a mais importante**

Mostrar, na hora de registrar, **o que foi feito da última vez naquele exercício** (ex.: `16 × 9` em cinza ao lado do campo). Hevy e Strong tratam como básico; é o que torna sobrecarga progressiva possível sem sair da tela.

**Já levantado como escopo em 2026-08-08 e nunca decidido** — agora está aprovado. Exige consulta ao histórico do exercício (não só do treino atual), então é feature de dados, não retoque de UI.

### C2 · Repetir última série — **corrigir semântica** (pesquisa #5)

**Achado do código, verificado nesta sessão:** `repetirUltimaSerie` **já existe** (`src/components/treino-detalhe.tsx:152`, botão em `:407`), mas repete `series[series.length - 1]` — a última série do **treino inteiro**, independente de exercício. Não é "o que eu fiz da última vez neste exercício".

O dono notou que este item "bate exatamente com o 1", e está certo: a versão útil é **por exercício**, que é exatamente o dado que C1 traz. **Tratar C1 e C2 como uma coisa só** — quando o histórico por exercício existir, repetir passa a significar "repetir minha última série deste exercício", que é a ação frequente que o `PRD.md` §4.1 chama de "a ação mais frequente do app".

### C3 · Calculadora de anilhas (pesquisa #3)

Quanto pôr de cada lado da barra para chegar no peso alvo. Elimina conta de cabeça entre séries — cena de uso do `DESIGN.md` §1 (em pé, suado, com pressa).

**Ponto em aberto para a próxima sessão:** o conjunto de anilhas disponíveis varia por academia. Assumir um padrão brasileiro, ou deixar configurável? (Se configurável, onde mora — Ajustes?)

### C4 · Recorde pessoal visível (pesquisa #4)

**Achado do código:** `calcularPrs` **já está pronto e testado** (`src/lib/analise/prs.ts` + `prs.test.ts`), e é usado por `agregar.ts` — mas o resultado só alimenta o texto do parecer. **Nenhuma tela do app mostra um recorde.** É funcionalidade construída e invisível.

Strong dispara uma animação ao bater PR; aqui bastaria marcar a série. **Decisão do dono pendente:** onde o PR aparece — na linha da série no momento em que acontece, no histórico do exercício, ou nos dois?

### C5 · Excluir a própria conta (pesquisa #7)

Hoje só existe "Sair". A exclusão em cascata **já funciona** e foi verificada várias vezes (é o que `qa-treino-helper.sh limpar-usuario` faz, sempre confirmando contagem = 0). Falta a porta na UI — lugar natural é `/ajustes`, abaixo de "Sair".

**Requisitos não-negociáveis:** confirmação explícita inline (nunca `window.confirm()` — `PRD.md` §4.1 e critério A13), e o texto precisa dizer exatamente o que some.

---

## D — Não aprovados nesta rodada (registrados, não esquecidos)

Ofertados na pesquisa de 2026-08-13, o dono não aprovou. **Não estão descartados para sempre** — estão fora desta leva.

| # | Item | Observação |
|---|---|---|
| D1 | **Cronômetro de descanso automático** (pesquisa #2) | Dispara ao fechar a série. Está no escopo negativo do `PRD.md` §5, mas o próprio PRD diz "nenhum está descartado para sempre; estão fora do MVP" |
| D2 | **Exportar histórico (CSV/JSON)** (pesquisa #6) | Recomendação recorrente da pesquisa: posse dos próprios dados. É app pessoal — perder anos de treino por dependência de conta é risco real |

**Também levantados pela pesquisa e recomendados como NÃO fazer** (não foram nem oferecidos ao dono, porque contrariam o `PRD.md` §5): rotinas/templates salvos (chega perto de prescrever programa), supersets, heatmap muscular, medidas corporais, integração Health/Google Fit. A própria pesquisa alerta que excesso de recurso é contraproducente.

---

## E — Decisões de design ainda abertas (do dono, herdadas)

| # | Decisão | Desde |
|---|---|---|
| E1 | **C1b — exibir RIR na linha de série.** Verificado no código: `treino-detalhe.tsx` mostra `reps × peso kg` + rótulo (aquecimento/valendo), **sem RIR**. É feature nova, não polimento | 2026-08-08 |
| E2 | **Zero pontuado do IBM Plex Mono** (`--lastro-fonte-num`). Sinalizado 2× pelo dono como esteticamente ruim; `DESIGN.md` §3.3 documenta o estado atual como escolha deliberada. Não é bug — é preferência não resolvida | 2026-08-08 |
| E3 | **Os 5 cards de pergunta idênticos em `/analise`.** Confirmado por evidência visual em 2026-08-13 que o sintoma persiste. Recomendação do `diretor-arte`: **não** retomar o deck de 10 movimentos (está bloqueado em decisões abertas do dono); em vez disso, promover **uma** pergunta a primária (sugestão: "O que mudar na próxima semana?" — é a única que produz ação) e densificar as outras quatro. CSS puro, zero tokens novos. **Teto rígido: `--lastro-t-3`** — o card primário não pode competir com a conclusão do gráfico, que é o elemento mais pesado da tela por §3.7. **Qual pergunta vira a primária é decisão do dono** | 2026-08-08 |

---

## F — Débitos conhecidos que continuam (sem mudança nesta sessão)

1. **~102 dicas de execução do catálogo** — todas `NULL`. FF7/ADR-007 proíbe gerar por LLM; é redação humana. Critério A9 do PRD não é atendido.
2. **10 das 16 peças visuais** nunca trabalhadas (Bancada: 03/04/05/16 · sistema: 02/06/12/13/14/15).
3. **Sync offline em celular real** (tarefa 2.3) — modo avião → reconectar, nunca testado em aparelho.
4. **Barra superior fixa e PWA "abre sempre em Início"** — lógica testada em navegador, nunca em aparelho com PWA instalado.
5. **Região `gru1` da Vercel** — `vercel.json` pede em código; pode precisar confirmação em Project Settings → Functions, dependendo do plano.
6. **Drift na tabela de `DESIGN.md` §4.2** — C10/C11 documentados como 8.59/9.86, medidos como **5.59/6.17**. Os dois passam o piso, mas comparar contra o valor do doc reprovaria item correto. Corrigir o documento é tarefa própria.
7. **Regressão do item 14 ainda aberta:** em `/treino/[id]`, o título "Treino em andamento" sai com reticências (~185px disponíveis vs ~237px pedidos).
8. **Fase 6 inteira** — review integral do Inspetor, todas as fitness functions, E2E das 3 jornadas, gate visual em celular físico. Não iniciada.

---

## G — Roteiro do gate visual (para executar DEPOIS de aplicar A1/A2/E3)

Especificado pelo `diretor-arte` em 2026-08-13. Reproduzido aqui porque é a parte operacional que a próxima sessão precisa na mão.

> **Este gate não fecha por medição de DOM.** `getComputedStyle` não detecta toda renderização errada. A validação final e insubstituível é **o olho do dono, no celular dele**. Declarar o gate fechado sem essa passagem é falso.

### G0 — Pré-condições (sem elas o gate não mede nada)

| # | Pré-condição | Por quê |
|---|---|---|
| G0.1 | Usuário QA com **≥ 3 semanas fechadas** e **volume semanal ≥ 10.000 kg** | Sem 3 semanas o parecer não renderiza; **sem 10.000 kg o bug do card "Séries valendo" não reproduz** |
| G0.2 | Uma conta **sem `avatar_url`** e uma **com foto real** | O bug A1 só existe na variante iniciais; precisa confirmar que a variante foto não regrediu |
| G0.3 | Um **treino aberto de hoje** com ≥ 1 série | Para A4 (Continuar vs Iniciar) ser testável |
| G0.4 | Chrome **não-maximizado**, aba da extensão em primeiro plano | Senão o resize é ignorado e sai 1366px |
| G0.5 | `./scripts/qa-treino-helper.sh limpar-usuario …` ao final, cascade = 0 | Higiene estabelecida |

> ⚠️ **A auditoria de 2026-08-13 usou uma conta com volume de 2,0 t.** O card "Séries valendo" pareceu alinhado porque o bug **não pode** reproduzir abaixo de 10.000 kg — não porque esteja corrigido. Não registrar aquilo como aprovação.

### G1 — Telas e viewports

Viewports obrigatórios de `DESIGN.md` §4.1: **360×640**, **390×844**, **1280×800**.

> ⚠️ A auditoria de 2026-08-13 rodou a **~500×637** — acima do piso. **Nada do que foi visto está testado no mínimo mandatório de 360px.**

| # | Tela | Viewport | Reprova se |
|---|---|---|---|
| G1.1 | `/perfil`, conta **sem foto** | 360, 390 | O círculo não é distinguível do fundo a um braço de distância; **ou** o preenchimento aparece mas a aresta não |
| G1.2 | `/perfil`, conta **com foto** | 360, 390 | Qualquer mudança em relação a antes da correção |
| G1.3 | **As 7 telas com barra de topo**, conta sem foto | 390 | Qualquer diferença perceptível no avatar da barra — a correção não podia tocar lá |
| G1.4 | `/analise` | 360, 390, 1280 | Os 5 cards seguem no mesmo degrau; **ou** o card primário compete com a conclusão do gráfico |
| G1.5 | `/catalogo` | 360, 390 | A frase de placeholder ainda se repete card a card |
| G1.6 | `/` com volume ≥ 10.000 kg | 360 | Card "Séries valendo" desalinhado, ou número quebrando linha |
| G1.7 | `/coach` | **360** | Qualquer sobreposição entre campo de texto, botão de envio e pílula — **é o lugar mais provável de quebrar em 360px e nunca foi testado lá** |
| G1.8 | `/treino` | 390 | Barra e pílula dizendo palavras diferentes (A3) |
| G1.9 | `/` e `/treino` com G0.3 ativo | 390 | Só um dos dois virar "Continuar" (A4) |
| G1.10 | `/treino/[id]` | 360 | Título cortado com reticências — registrar o estado; não bloquear se estiver fora do escopo da rodada |

### G2 — Contraste (medir na tela renderizada, não estimar)

| # | Par | Esperado | Piso | Reprova se |
|---|---|---|---|---|
| G2.1 | Letra das iniciais sobre o preenchimento (`/perfil`) | **9.99** | 4.5 | < 4.5, ou divergir de 9.99 em > 0.2 |
| G2.2 | Aresta do círculo contra o fundo (`/perfil`) | **3.40** | 3.0 | < 3.0 |
| G2.3 | Letra das iniciais sobre o pior caso do gradiente (barra) | **9.21** | 4.5 | < 4.5 **ou qualquer desvio** — significa que a barra foi tocada |
| G2.4 | Texto do card primário de pergunta (`/analise`) | ≥ 4.5 | 4.5 | < 4.5 |
| G2.5 | Texto dos 4 cards secundários (`/analise`) | ≥ 4.5 | 4.5 | < 4.5 |
| G2.6 | Nome do exercício sobre o card (`/catalogo`) | ≥ 4.5 | 4.5 | < 4.5 |

> ⚠️ **Não reutilizar C10/C11 da tabela de §4.2** — ver débito F6. Comparar contra **5.59/6.17**, não contra o que o documento promete.

### G3 — Teclado e foco (D9, §4.3)

| # | Percurso | Reprova se |
|---|---|---|
| G3.1 | `/perfil` só com `Tab`: alcançar "Trocar foto", acionar com `Enter` e `Espaço` | Foco entra no `<span>` do avatar (é `aria-hidden`, não pode receber foco); ou o anel some sobre a superfície |
| G3.2 | **K3 de §4.3** — escolher pergunta da Análise só com teclado, **nas duas variantes novas** | Alguma variante sem anel visível; ordem de tabulação ≠ ordem visual |
| G3.3 | Anel de foco em todo controle tocado na rodada | `outline-offset: 0`, anel `inset`, ou `outline: none` sem substituto — Nota B de §3.2 |
| G3.4 | `/catalogo` com teclado, após a mudança do placeholder | Card deixa de ser alcançável, ou a ordem muda |

### G4 — Alvos de toque (D1)

| # | Medição | Reprova se |
|---|---|---|
| G4.1 | Caixa dos 4 cards secundários de `/analise` | Abaixo de `--lastro-alvo-min` (48px) em qualquer dimensão — densificar não pode comer o alvo |
| G4.2 | Distância entre os cards secundários | Menor que `--lastro-alvo-folga` |
| G4.3 | Caixa dos cards de `/catalogo` após remover o placeholder | Idem G4.1 |

### G5 — O gate só fecha aqui

O dono abre `/perfil` (sem foto), `/analise` e `/catalogo` **no celular dele** e julga: (a) o círculo de iniciais está visível e parece pertencer ao sistema; (b) o card primário da Análise ajuda a decidir ou parece arbitrário; (c) o catálogo ficou mais fácil de varrer. **Reprovação em qualquer um dos três reprova o gate**, independentemente de tudo acima estar verde.

---

## Sugestão de ordem de ataque

Não é obrigação — é o que faz mais sentido em risco e dependência:

1. **A1** (avatar invisível) — P0, isolado, correção já especificada, sem decisão pendente.
2. **B1** (botão redundante na Análise) — achado direto do dono; só precisa que ele responda se o estado vazio fica com texto puro ou ganha link discreto.
3. **A2** (placeholder do catálogo) + **A3** (nome Treinos/Bancada) + **A4** (verificar regressão) — pequenos, independentes, fecham a higiene.
4. **E3** (hierarquia dos 5 cards) — precisa que o dono escolha qual pergunta é a primária.
5. **C1 + C2** (histórico por exercício e repetir a série certa) — a maior entrega de valor da lista, e a mais pesada: mexe em dados, não só em UI.
6. **C4** (PR visível) — barato, já que o cálculo existe; depende de C1 se o PR aparecer no histórico.
7. **C3** (calculadora de anilhas) e **C5** (excluir conta) — independentes, podem entrar a qualquer momento.
