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

Um lugar, dois nomes. A pessoa não tem certeza de que está no mesmo lugar.

**✅ Decidido pelo dono (2026-08-13): "Treinos" vence.** O item da pílula passa de "Bancada" para **"Treinos"**, batendo com a barra de topo, que já diz isso.

**Atenção ao aplicar — o alcance é maior que trocar uma string:** "Bancada" não é só um rótulo de UI, é vocabulário do projeto. Aparece como **"Modo Bancada"** em `DESIGN.md` §3.5 (o regime de densidade para registro, em pé, com pressa, oposto ao "Modo Leitura") e em vários pontos de `PROGRESS.md`/`DECISIONS.md`. A decisão do dono é sobre **o rótulo que o usuário lê na pílula**, não sobre aposentar o conceito de design. Trocar o rótulo; **manter "Modo Bancada"** como nome do regime nos documentos de design, e deixar isso explícito num comentário para ninguém "unificar" os dois depois por engano.

Também conferir se `aba-inferior.tsx` usa o `id: "bancada"` internamente — o `id` pode continuar como está (é chave interna, não texto visível); só o campo `rotulo` muda.

### A4 · Verificar: "Continuar" vs "Iniciar" nas duas telas — possível regressão

O item 11 de `PROGRESS.md` estabeleceu que `/` e `/treino` ganharam a mesma checagem "Continuar treino de hoje" vs "Iniciar treino de hoje". Na auditoria de 2026-08-13 as duas telas mostraram "Iniciar" — mas a conta QA tinha *semana* em andamento, não *treino aberto hoje*, então o relato não distingue regressão de comportamento correto.

**Como verificar:** criar um treino de hoje com pelo menos 1 série e conferir se **as duas** telas viram "Continuar". Se só uma virar, é regressão do item 11.

---

## B — Achados do dono e correções de hierarquia (2026-08-13)

### B1 · Botão "Registrar treino" na Análise é redundante

**O que o dono viu:** com dado insuficiente para o parecer, `/analise` mostra o estado "Você tem 1 semana fechada. São necessárias 3 para calcular a análise semanal." seguido de um botão verde grande **"Registrar treino"**.

**Palavras dele:** *"não era para tar assim, se já existe o iniciar treino no início, não precisa desse ícone"*.

**Por que ele tem razão, e não é só gosto:** a Início é a **porta de entrada única do app** — decisão registrada desde 2026-08-06, e o motivo de `forcar-inicio-no-lancamento.tsx` existir. A ação primária "iniciar/continuar treino" já mora lá e na Bancada. Um terceiro botão verde de ação primária, numa tela cujo propósito é **ler**, compete com a leitura e dilui a hierarquia — `DESIGN.md` §3.0 diz que cada tela tem **um** elemento que pesa mais, e em `/analise` esse elemento é o parecer (ou, na sua ausência, a explicação de por que ele não existe ainda).

**Escopo da correção:** o botão que manda pra outra tela sai. O texto explicativo permanece — ele é honesto e necessário (E3).

**✅ Decidido pelo dono (2026-08-13, em duas rodadas — esta é a versão final).** Primeira rodada: a tela pode continuar com um botão, mas tem que ser ação da própria Análise, não atalho pra outro lugar ("pode sim continuar com um botão, mas exemplo, 'Solicitar Análise', mas ela fica incolor enquanto não está disponível, só após os dias que ele poder realmente efetuar, aí funciona"). Segunda rodada, depois de eu apresentar duas opções que pareciam mutuamente exclusivas (só botão OU só os 5 cards): **o dono quer os dois juntos** — "quero manter sim os cards como o recomendado mais também quero o que lhe disse o botão, ambos seguir a regra que falei".

**Desenho final — botão + 5 cards, mesma regra de disponibilidade nos dois:**

- **Botão "Solicitar Análise"**, acima da lista de perguntas. Inativo/incolor enquanto `semanasFechadasComTreino < MINIMO_SEMANAS_PARECER`; ativo quando a 3ª semana fecha.
- **Os 5 cards de pergunta continuam sempre visíveis** (não somem no estado de espera — essa parte da recomendação original se manteve), na hierarquia de **B2** (1 primário + 4 secundários), também inativos/incolores até ter dado suficiente.
- **O que o botão faz quando ativo — perguntado ao dono, resposta escolhida:** ele é um **atalho para a pergunta primária** ("O que mudar na próxima semana?", decidida em B2). Clicar no botão dispara o mesmo parecer que clicar no card primário dispararia. As outras 4 perguntas continuam disponíveis nos cards secundários, para quem quer uma pergunta diferente da primária.

**Por que isso não é redundante, mesmo o botão e o card primário fazendo a mesma coisa:** o botão dá à pessoa com pressa uma ação única, no topo, sem precisar identificar qual dos 5 cards é o "principal" — o card primário já é visualmente maior (B2), mas o botão é ainda mais rápido de achar. Quem quer outra pergunta rola e escolhe entre os cards, incluindo o primário de novo se preferir.

**Três pontos técnicos a resolver na implementação, valem para o botão E para os 5 cards:**

1. **Acessibilidade — não usar `disabled` puro.** Um `<button disabled>` sai da ordem de tabulação e leitores de tela o ignoram, então quem navega por teclado nunca descobre que a Análise existe e está esperando dados. Usar **`aria-disabled="true"`** com o clique inerte, mantendo o elemento focável; assim o percurso K3 de `DESIGN.md` §4.3 continua válido. O `<p className="vazio">` já existente tem `aria-live="polite"`, que explica o motivo.
2. **Contraste no estado inativo, medir.** `.botao-primario:disabled` hoje é `opacity: 0.55`. A WCAG isenta controle inativo do piso de contraste, **mas aqui o botão e os cards carregam a única pista do que vem** — se ficarem ilegíveis, a vantagem de mostrá-los cedo se perde. Medir e decidir o valor com o olho, não herdar o 0.55 sem conferir. Vale tanto para o botão quanto para os 5 cards.
3. **Isto NÃO reverte a tarefa 1.0d** (2026-08-05, "botão sempre disponível, sem bloqueio"). Aquela decisão é sobre **cadência semanal** — não obrigar a esperar a segunda-feira pra pedir o parecer. Esta é sobre **suficiência de dados** — 3 semanas fechadas, `MINIMO_SEMANAS_PARECER`. São regras diferentes e compatíveis; não confundir uma com a outra ao mexer no código.
4. **Um só handler, duas entradas.** O botão e o card primário disparam a mesma pergunta — implementar como duas UI chamando a mesma função (`perguntar(numeroPerguntaPrimaria)`), não duplicar a lógica de disparo do parecer.

---

### B2 · Hierarquia dos 5 cards de pergunta em `/analise`

**O problema, confirmado por evidência visual em 2026-08-13:** as 5 perguntas são cinco cartões idênticos — mesma elevação, mesmo raio, mesmo peso de fonte, sem nenhuma diferença entre eles. É o sintoma que o rediagnóstico de 2026-08-08 já tinha nomeado ("não falta cor: falta diferença") e cuja correção nunca saiu do papel.

**Não é só estética:** cinco alvos de peso idêntico obrigam a ler as cinco frases inteiras antes de decidir. Em pé, com pressa, é o pior formato possível de escolha.

**Recomendação do `diretor-arte`, aceita:** **não** retomar o deck de 10 movimentos (está bloqueado em decisões do dono que continuam abertas). Em vez disso, promover **uma** pergunta a primária — card maior, `--lastro-peso-forte`, `elev-2`, largura total, mais respiro — e densificar as outras quatro (mesmo `--lastro-t-corpo`, `elev-1` ou sem elevação, altura menor). CSS puro, zero tokens novos, não depende de nenhuma decisão pendente.

**✅ Decidido pelo dono (2026-08-13): a primária é "O que mudar na próxima semana?"** — é a pergunta 5 do `PRD.md`, a única que produz ação, e a que alguém em pé quer sem ler as outras quatro.

**Dois limites rígidos ao aplicar:**

1. **Teto de `--lastro-t-3` no card primário.** `DESIGN.md` §3.0 diz que cada tela tem **um** elemento que pesa mais, e em `/analise` esse elemento é a conclusão em palavras do gráfico de progressão (§3.7 item 2). O card primário precisa pesar mais que os quatro irmãos e **menos** que a conclusão do gráfico. Passar disso cria dois pesos competindo — exatamente o que a restrição existe pra impedir.
2. **`--lastro-alvo-min` (48px) e `--lastro-alvo-folga` intactos nos quatro secundários.** Densificar não pode comer o alvo de toque — D1 é inegociável.

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

**✅ Decidido pelo dono (2026-08-13): configurável**, não conjunto fixo — o inventário de anilhas varia por academia, e um padrão chutado erra pra qualquer pessoa que treine em lugar diferente.

**A decidir na implementação** (não agora): onde a configuração mora (o lugar natural é `/ajustes`, que agora existe justamente pra isso), se persiste no banco ou só local, e se a barra também é configurável (barra olímpica de 20 kg é o padrão, mas existem barras de 15 kg, W, e barra de agachamento mais pesada). **Cuidado com o escopo:** isso pode virar uma tela de inventário grande — a versão mínima útil é uma lista de pesos disponíveis e o peso da barra, nada além disso.

### C4 · Recorde pessoal visível (pesquisa #4)

**Achado do código — importante, muda o desenho:** `calcularPrs` **já está pronto e testado** (`src/lib/analise/prs.ts` + `prs.test.ts`) e é usado por `agregar.ts`, mas ele é **semanal e em lote**: compara o e1RM/volume *da semana* contra o máximo histórico (`e1rmSemanaAtual` vs `e1rmMaximoHistoricoAnterior`) e alimenta só o texto do parecer. Ele responde *"bati recorde esta semana?"* — **não** *"esta série que acabei de fazer é meu recorde?"*.

Ou seja: **PR na linha da série, em tempo real, NÃO sai de graça do que já existe.** Precisa de outro cálculo, comparando a série sendo registrada contra o histórico completo daquele exercício, no momento do registro. **Nenhuma tela do app mostra um recorde hoje** — a funcionalidade existente é invisível ao usuário.

**✅ Decidido pelo dono (2026-08-13): os dois lugares, nesta ordem** — recomendação aceita.

1. **Na linha da série, no momento em que acontece** — construir junto com **C1**, aproveitando a mesma consulta. C1 já vai precisar carregar o histórico do exercício no registro; estender essa consulta para trazer também o "melhor de todos os tempos" torna a detecção em tempo real quase gratuita. É onde o PR tem significado máximo: acabou de fazer, o app avisa na hora.
2. **No histórico do exercício** — depois. Depende de existir uma tela de histórico por exercício, que **hoje não existe**.

**⚠️ Regra que precisa ser decidida na implementação:** com pouco histórico, *toda* série vira PR e o marcador perde o sentido. Precisa de um piso — por exemplo, só marcar a partir de N sessões anteriores daquele exercício. O valor de N é decisão a fechar na hora, com o dono, **não** um número tirado de memória (mesmo padrão dos outros limiares do projeto: se não tem fonte, o documento tem que dizer que é convenção — ver `KNOWLEDGE.md` §3.7).

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
| E3 | ~~Qual pergunta vira a primária em `/analise`~~ — **✅ decidido em 2026-08-13, ver seção B2 abaixo** | resolvido |

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
| G0.3b | **Uma segunda conta QA com 1 ou 2 semanas fechadas** (menos que `MINIMO_SEMANAS_PARECER`) | Para o estado de espera de B1 ser testável. **A conta de G0.1 não serve** — ela tem 3+ semanas e nunca mostra o estado de espera |
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
| G1.4 | `/analise`, conta com **≥ 3 semanas** (estado ativo) | 360, 390, 1280 | Os 5 cards seguem no mesmo degrau; **ou** o card primário compete com a conclusão do gráfico; **ou** o botão "Solicitar Análise" está ausente/inativo apesar de haver dado suficiente |
| G1.4b | `/analise`, conta com **< 3 semanas** (estado de espera, B1) | 360, 390 | O botão "Solicitar Análise" **ou** os 5 cards não aparecem inativos; **ou** aparecem mas ilegíveis; **ou** o texto explicativo sumiu; **ou** algum dos dois leva pra fora da tela |
| G1.4c | `/analise`, conta com **≥ 3 semanas**: clicar em "Solicitar Análise" | 390 | O parecer que abre **não é** o da pergunta primária ("O que mudar na próxima semana?") — o botão e o card primário precisam disparar exatamente o mesmo resultado |
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
| G3.2 | **K3 de §4.3** — escolher pergunta da Análise só com teclado, **nas duas variantes novas** (primária e secundária) | Alguma variante sem anel visível; ordem de tabulação ≠ ordem visual |
| G3.2b | **Estado de espera (B1) só com teclado**, conta com < 3 semanas | O botão "Solicitar Análise" **ou** os cards inativos **não são alcançáveis por `Tab`** — é o sintoma de terem sido feitos com `disabled` puro em vez de `aria-disabled`, e significa que quem usa teclado nunca descobre que a Análise está esperando dados |
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

**Todas as decisões de produto que travavam a lista foram fechadas pelo dono em 2026-08-13** — nada aqui está bloqueado esperando resposta. Só restam decisões técnicas que se fecham na hora de implementar (estão marcadas item a item).

Não é obrigação — é o que faz mais sentido em risco e dependência:

**Leva 1 — higiene visual (tudo CSS/UI, nenhuma mudança de dados)**

1. **A1** (avatar invisível) — P0. Isolado, correção já especificada linha a linha, zero tokens novos.
2. **B1** (botão "Solicitar Análise" + estado de espera) + **B2** (hierarquia dos 5 cards) — **fazer juntas, não é só conveniência:** B1 exibe o botão e os 5 cards sempre visíveis, inclusive no estado de espera, já na hierarquia que B2 define, e o botão dispara a mesma pergunta que o card primário. Implementar separado significa desenhar a lista de perguntas duas vezes e arriscar o botão e o card primário divergirem.
3. **A2** (placeholder do catálogo) + **A3** (rótulo → "Treinos") + **A4** (verificar se "Continuar" é regressão) — pequenos e independentes.

Depois da leva 1, rodar o gate visual da seção G inteiro. Ele foi escrito exatamente para esse conjunto.

**Leva 2 — a entrega de valor real (mexe em dados, não só em tela)**

4. **C1 + C2 + C4(1)** — histórico por exercício, repetir a série certa, e PR na linha da série. **São três itens, uma consulta só:** carregar o histórico do exercício no momento do registro serve aos três. Fazer separado significaria escrever a mesma consulta três vezes. É a maior entrega da lista e a mais pesada.

**Leva 3 — independentes, entram quando der**

5. **C5** (excluir conta) — o cascade já funciona; falta só a porta na UI.
6. **C3** (calculadora de anilhas) — cuidado com escopo: a versão mínima é lista de pesos + peso da barra, nada além.
7. **C4(2)** (PR no histórico do exercício) — depende de existir uma tela de histórico por exercício, que hoje não existe. É o item mais distante da lista.

---

# Itens acrescentados em 2026-08-21 (sessão da auditoria pós-Apex Pro)

Origem: `docs/AUDITORIA-APEX-PRO.md`. Os itens A00/A01/A13 já foram
resolvidos nas PRs `ebcf5d0` e `678ebc5`; o que sobra está aqui.

## T1 — Card "Tema" em `/ajustes` · pedido direto do dono

Criar um card **Tema** dentro de `/ajustes`, onde a pessoa escolhe o tema
visual do app.

- **Agora:** a lista mostra só o tema atual (Apex Pro), já selecionado.
  Nenhuma opção nova entra nesta etapa — o dono acrescenta depois.
- **Escopo travado pelo dono:** *"tema só irá trocar cores"*. Nada de
  trocar tipografia, espaçamento, raio, elevação ou layout. Só a camada
  de cor de `src/app/tokens.css`.
- **Consequência de projeto:** os tokens de cor precisam sair do `:root`
  fixo e virar um conjunto trocável (`[data-tema="..."]`), sem que
  nenhum outro token se mova junto. Hoje cor, espaçamento, tipografia e
  elevação convivem no mesmo `:root` — a separação é o trabalho real
  deste item, não a tela de seleção.
- **Onde a preferência mora:** decidir entre perfil no banco (segue o
  usuário entre aparelhos) e armazenamento local (não precisa de
  migração). Perguntar ao dono antes de implementar.
- **Gate:** o dono olha no aparelho dele; trocar o tema não pode mexer em
  nenhuma medida, só em cor.

## T2 — `/perfil` e `/ajustes/**` fora das rotas privadas (A04) · **ALTA**

`src/proxy.ts:13` não lista `/perfil` nem `/ajustes`. Sem sessão,
`/ajustes/modelos` e `/ajustes/modelos/novo` devolvem **500**; `/perfil`,
`/ajustes` e `/ajustes/anilhas` renderizam shell vazio. Confirmado em
produção. Quem cai nisso é o dono com a sessão expirada, não um atacante.
Correção: acrescentar os dois prefixos. Resolve o A02 (avatar "AT") junto.

## T3 — `--lastro-txt-3` reprova contraste AA (A05/A06) · ✅ **RESOLVIDO em 2026-08-21** (escopo: tema padrão)

Medido: **3,36** sobre `sup-3`, **3,95** sobre `sup-1`, **4,19** sobre o
fundo — piso 4,5. Confirmado ao vivo: 104 elementos no `/catalogo`, 18 na
Home. Eram 40 seletores em `sistema.css`.

**Corrigido:** `#64748B` → `#7C8DA6`. Remedido ao vivo: 4,74 / 5,18 / 5,56
/ 5,90 — todos acima do piso. Zero elemento reprovando no DOM real, nas
mesmas duas telas. `DESIGN.md` §3.0–3.2/§4.2 reconciliados **só na linha
`txt-3`**, com banner datado marcando o resto da tabela como stale contra
o Apex Pro. Entrada em `DECISIONS.md` 2026-08-21.

Verificado antes do fix, e a suposição registrada na primeira auditoria
estava errada: `.evidencia__de`/`.evidencia__seta` (19px) e
`.marca--aquecimento` **não têm `font-weight` declarado** — herdam 400,
não bold. A 19px e peso 400, nenhum dos dois cumpre a isenção de "texto
grande" (exige ≥700 nessa faixa); o piso real sempre foi 4,5, igual ao
resto. Não precisaram de tratamento especial porque o fix do token os
cobre do mesmo jeito que cobre as outras 38 ocorrências — não porque já
passavam antes.

**Escopo original travado pelo dono (opção 2, não a 1) — depois ampliado
com números reais na mão.** A decisão inicial era corrigir só o tema
padrão. Antes de fechar, medi as outras 6 paletas do card de Tema
(`docs/BACKLOG-PROXIMA-FASE.md` T1 — **já mergeado, já no ar**, não é
"trabalho futuro"): 3 delas reprovavam o mesmo bug, ao vivo, hoje —
`petroleo` (4,20), `moka` (4,39), `branco-ouro` (3,86, nem herdava a
correção, tem token próprio). Apresentado ao dono, **corrigido também
na mesma leva.**

| Tema | Antes | Depois | Valor |
|---|---|---|---|
| padrão (`:root`) | 3,36 | **4,74** | `#7C8DA6` |
| `areia` | 4,80 (já passava) | — | herdado, sem mudança |
| `clean` | 4,51 (já passava) | — | herdado, sem mudança |
| `oliva` | 4,59 (já passava) | — | herdado, sem mudança |
| `petroleo` | 4,20 | **4,71** | `#8596AD` (override novo) |
| `moka` | 4,39 | **4,74** | `#8293AB` (override novo) |
| `branco-ouro` | 3,86 | **4,89** | `#556478` (token próprio) |

**As 16 linhas restantes de §3.2 e as 13 de C1–C14 em §4.2** continuam
com número da paleta areia — o documento diz isso explicitamente.
Vira o item **T3b** abaixo, junto com um achado novo e maior.

## T3b — Reconciliar `DESIGN.md`/`DECISIONS.md` com o Apex Pro por inteiro; corrigir acentos de cor no tema claro

Duas pendências, tamanhos bem diferentes:

**1. Reconciliação de documento** (pendência que o T3 deixou explícita):

- Remedir os 14 pares de §4.2 (C1–C14) contra o tema padrão Apex Pro —
  hoje só C3 (`txt-3`) está remedido. Ao vivo, em navegador real (D8).
- Escrever a razão de cada cor do Apex Pro (por que ouro, por que
  esmeralda, por que obsidiana) — quem decidiu foi outra sessão, sem
  registro em `DECISIONS.md` na hora. Sem isso, `DESIGN.md` §3 nunca
  deixa de citar a paleta antiga, porque não há o que pôr no lugar sem
  inventar.
- Remedir C1–C14 contra as 5 paletas restantes (`areia`, `clean`,
  `petroleo`, `moka`, `oliva` — `branco-ouro` seu próprio caso, ver
  item 2).

**2. Bug real, achado ao medir o item acima — ALTA, maior que o T3.**
Medindo `branco-ouro` por inteiro (não só `txt-3`), apareceram **33
elementos reprovando** por três tokens diferentes, nenhum relacionado a
`txt-3`:

| Token | Cor | Pior caso medido | Piso |
|---|---|---|---|
| `--lastro-ouro` | `#B8860B` | 3,04 | 4,5 |
| `--lastro-esmeralda-claro` | `#34D399` | **1,79** | 3,0 (texto grande) |
| `--lastro-ciano` | `#06B6D4` | **2,43** | 3,0 |

Esses acentos foram calibrados para fundo escuro (Apex Pro) e nunca
ajustados para o único tema claro do sistema — `branco-ouro` não os
sobrescreve, herda os valores escuros direto. É mais grave que o T3
porque mexe em cor de marca (ouro, esmeralda, ciano têm significado —
ação, progresso, sincronização), não em cinza neutro, e **1,79:1** é o
pior número já medido nesta auditoria inteira. Provavelmente atinge
outros pontos do `branco-ouro` além do `/catalogo` — não varrido por
completo. Precisa da mesma técnica do T3 (achar valor por bissecção,
remedir ao vivo), mas por cor de marca, não por cinza — exige decisão
de quanto dessaturar/escurecer sem descaracterizar o acento.

## T4 — Meta semanal de treinos configurável

Continuação do A13. A fração "2/4 Treinos (50%)" e a barra de progresso
foram removidas da Home porque o denominador era `const metaTreinos = 4`.
Voltam quando a meta for escolha do dono (campo em `/ajustes`, mesmo
lugar do T1). O CSS `.ai-coach-card__barra` / `__progresso` foi deletado
e precisa ser reescrito.

## T5 — Campo do coach sob a aba inferior (A03) · **ALTA**

Em `/coach`, o campo "Pergunte ao coach…" e o botão de enviar ficam
**9px** por baixo da aba inferior fixa. Medido em 360×640 e confirmado em
produção com o mesmo número. É o único controle da tela.

## T6 — Alvos de toque abaixo de 48px (A07)

`--lastro-alvo-min` vale 48px. Medido: "Ver Todos" **20px**, chips do
catálogo 34px, "Voltar" e avatar do topo 36×36, "Cadastre-se" 36px.

## T7 — Achados menores (A08–A12)

- Erro de cadastro volta cru em inglês, do Supabase.
- "Conta criada — confirme seu e-mail" usa o estilo de **erro**.
- `/treino` diz "Inicie sua primeira sessão **abaixo**"; o botão está acima.
- `/ajustes/modelos`: descrição renderiza 60px **acima** do `<h2>`.
- Estado vazio da `/analise` mistura "2 semanas" e "3 semanas" na mesma frase.
- Chips de grupo muscular na lista de treinos ainda imprimem a chave crua
  do banco; `formatarGrupoMuscular` já existe e resolve.
