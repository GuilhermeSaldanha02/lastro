# Backlog do redesenho — `lastro`

> **Documento de partida, autocontido.** Escrito em 2026-08-15, ao fim da sessão que levantou o redesenho e fechou as 10 decisões com o dono. Quem abrir um chat novo consegue trabalhar a partir daqui sem reler o histórico.
>
> **Nada aqui foi implementado** quando este documento foi escrito. Tudo é decisão já tomada pelo dono ou achado verificado por medição — não é lista de ideias.
>
> **Estado em 2026-08-15 (sessão seguinte):** **toda a Trilha A está fechada** — A1, A2, A3 e A4 (investigação) marcados ✅ abaixo. Na Trilha B, **o Nível 1 inteiro está fechado** — E5 (pré-requisito), E1, E2, E3 e E4, todos ✅ abaixo. Os Níveis 2 (M1-M9) e 3 (H1-H4) continuam por fazer.

---

## 1. Como chegamos aqui — e onde está cada coisa

O dono relatou que "o design e o alinhamento pioraram" e, depois, que o app "parece uma demo". Foram **três rodadas de estudo**, cada uma corrigindo a anterior:

| Documento | O que contém | Estado |
|---|---|---|
| `PROGRESS.md` (bloco "diagnóstico do design") | As 4 causas medidas do defeito original | mergeado, PR #41 |
| `docs/ESTUDO-PADRAO-APLICATIVO.md` | 12 regras com cláusula `Reprova:`, da 1ª rodada | mergeado, PR #42 |
| `docs/ESTUDO-REDESENHO.md` | O estudo em 7 partes (inventário → aplicação) | mergeado, PR #43 |
| `DECISIONS.md` 2026-08-15 | **As 10 decisões do dono, com evidência** | esta sessão |
| **este arquivo** | O que construir, por esforço | esta sessão |

**Peças visuais produzidas na sessão** (artifacts; o dono decidiu olhando estas, não o texto):

| Assunto | Link |
|---|---|
| Direções tipográficas (D1) | https://claude.ai/code/artifact/64c681d3-7b39-429c-bf87-3d0c4965b70d |
| Escala tipográfica (D2) | https://claude.ai/code/artifact/c7c60888-9264-4218-a0c5-f925e60c6870 |
| Superfícies, 9 opções (D3) | https://claude.ai/code/artifact/6d41d51a-d1e2-4bcd-89e3-246d234a1494 |
| Os padrões dos apps premiados (D3 final) | https://claude.ai/code/artifact/493c3ada-4fc7-407b-89dd-65218071c26a |
| **Vocabulário de 10 peças + mapa das 13 telas** | https://claude.ai/code/artifact/a1810b66-5a6a-4883-aa85-7eef85907ca4 |

> ⚠️ Artifact não é fonte durável de projeto. **Antes de implementar, o vocabulário das 10 peças deve virar seção do `DESIGN.md`.** Isso é o item E5 abaixo, e não é opcional.

---

## 2. As travas — não negociáveis

| | |
|---|---|
| 🔒 **Paleta inteira** | nenhum pigmento muda. Nada neste backlog altera cor |
| 🔒 **Pílula de navegação** | `.nav`, `aba-inferior.tsx`, tokens `--lastro-nav-*` e `--lastro-vidro-nav*` ficam intactos |
| 🔒 **Piso de 14px** e **alvo de 48px** | decididos para luz ruim e mão suada (D1/D4 do projeto) |
| 🔒 **Contraste AA medido** | continua valendo, e continua sendo medido, não estimado |

---

## 3. As 10 decisões, em uma linha cada

Detalhe e evidência em `DECISIONS.md` (2026-08-15).

1. **Tipografia** — Fraunces (voz) · Archivo condensada (dado) · Bricolage (corpo).
2. **Escala** — 6 papéis **nomeados**, não números crus.
3. **Superfície** — dois padrões: *navega* → recipiente + chevron; *dado* → sem recipiente, grade.
4. **Ação** — mesmo recipiente, sem chevron; distinguida por **verbo × substantivo**.
5. **Barra de topo** — deixa de existir; o título é conteúdo e rola junto.
6. **Tarefa curta** — vira folha.
7. **Movimento** — conjunto contido do Material 3, **sem** container transform.
8. **Destrutivo** — modo de edição.
9. **Háptico** — descartado (iOS não suporta).
10. **Primeira tela** — `/login`.

---

# TRILHA A — Correções (independente do redesenho)

> Separada a pedido do dono. **São defeitos, não melhorias** — valem por si, mesmo que o redesenho não aconteça. Achados ao investigar a suspeita dele: *"parece que existe 2 caminhos quando abre o link, um antes e um depois"*. A suspeita procede.

### A1 · Parâmetro de retorno morto nas duas pontas · **FÁCIL** · ✅ **FEITO (2026-08-15)**

> Implementado na branch `fix/rota-de-retorno-no-login`. O nome e a sanitização vivem em `src/lib/rota-de-retorno.ts`; as três pontas importam de lá. Verificação, ressalvas e o que ficou não provado em produção: `PROGRESS.md`, bloco "✅ A1". O texto abaixo é o enunciado original, mantido como registro.

`src/proxy.ts:49` escreve `?proximo=<rota>` ao redirecionar pro login. **Ninguém lê `proximo`** — `/login` só lê `erro` e sempre faz `router.push("/")`. Do outro lado, `src/app/auth/callback/route.ts:18` lê `?next=` — **ninguém escreve `next`**. Dois parâmetros mortos, um de cada lado (verificado por busca em todo `src/`).

**Efeito:** abrir `/analise` sem sessão → login → depois de entrar cai em `/`, não em `/analise`.

**Fazer:** unificar o nome do parâmetro; `/login` passa a lê-lo e a redirecionar pra ele depois de entrar; manter a proteção contra redirecionamento aberto que o callback já tem (`startsWith("/") && !startsWith("//")`).
**Check:** sem sessão, abrir `/analise`, entrar, e cair em `/analise`.

### A2 · Duas telas de entrada · **MÉDIO** · [HITL] · ✅ **FEITO (2026-08-15)**

> Decisão do dono: fundir. Implementado na branch `fix/fundir-telas-de-entrada` — `/` sem sessão passa a fazer `redirect("/login")` server-side, em vez de renderizar tela própria. Detalhe: `PROGRESS.md`, bloco "✅ A2". O texto abaixo é o enunciado original, mantido como registro.

`/` sem sessão (`src/app/page.tsx:56`) renderiza uma tela própria — marca + subtítulo + botão "Entrar" — que leva a `/login`, o formulário de verdade. **Duas telas para uma coisa só.** É o "um antes e um depois" que o dono descreveu.

**Decisão do dono pendente:** fundir numa tela só (o formulário já traz a marca) ou manter as duas de propósito. Não decidir sozinho — a home como "porta de entrada única" foi decisão dele em 2026-08-06 (`DECISIONS.md`).
**Casa com:** o item D10 (o `/login` é a tela que prova o redesenho). Fazer junto economiza uma passagem.

### A3 · `ForcarInicioNoLancamento` pisca · **MÉDIO** · ✅ **FEITO (2026-08-15)**

> Implementado na branch `fix/pisca-forcar-inicio-no-lancamento` — a checagem virou `<script>` cru em `app/layout.tsx`, dentro de `<head>`, seguindo `node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`. Detalhe, e uma tentativa inicial errada que ensinou algo: `PROGRESS.md`, bloco "✅ A3". O texto abaixo é o enunciado original, mantido como registro.

`src/components/forcar-inicio-no-lancamento.tsx` faz `window.location.replace("/")` dentro de `useEffect` — ou seja, **depois** da pintura. No PWA instalado, a tela errada aparece e só então salta.

O comportamento foi pedido pelo dono (2026-08-07) e continua correto. **O que se corrige é a piscada**, não a regra.
**Fazer:** decidir onde a checagem roda antes da pintura (script bloqueante no `<head>`, ou tratar no servidor). Cuidado: `display-mode: standalone` só é legível no cliente.
**Check:** abrir o PWA instalado numa rota não isenta e não ver a tela intermediária.

### A4 · Suspeita não confirmada: service worker servindo a página offline · **FÁCIL (investigação)** · ✅ **INVESTIGADO (2026-08-15)**

> Mecanismo confirmado por teste de rede direto: é artefato do `next dev` reiniciando o processo em recarregamentos completos, janela que não existe em `npm run start`/produção. Nenhum código mudado. Detalhe: `PROGRESS.md`, bloco "✅ A4". O texto abaixo é o enunciado original, mantido como registro.

Durante os testes desta sessão, a aba de `/login` carregou com o título **"lastro — sem conexão"** — `public/offline.html`, servido pelo `sw.js` em qualquer falha de navegação (`sw.js:28-30`). Pode ser uma terceira fonte de "tela A depois tela B".

**Não confirmado em produção.** Foi observado em `npm run dev`, onde pode ser artefato do ambiente.
**Fazer:** reproduzir com a PWA instalada, rede real. Se confirmar, revisar quando o fallback deve entrar.

---

# TRILHA B — Redesenho, por esforço

> Ordenado para equilibrar. Cada nível entrega valor sozinho: dá pra parar no fim de qualquer um sem deixar o app pela metade.

## Nível 1 — FÁCIL · só token, nenhuma marcação muda

*Efeito visual grande, risco baixo. É o melhor retorno por hora do backlog inteiro.*

### E1 · Trocar as três famílias · [D1] · ✅ **FEITO (2026-08-15)**

> `layout.tsx` importa `Bricolage_Grotesque, Archivo, Fraunces` de `next/font/google`, cada uma com os eixos variáveis declarados (`axes`). `tokens.css` aponta os três papéis pros novos tokens de fonte. Detalhe: `PROGRESS.md`, bloco "✅ E1". O texto abaixo é o enunciado original, mantido como registro.

`src/app/layout.tsx` importa hoje `IBM_Plex_Sans/Mono/Serif` de `next/font/google`. Trocar por **Fraunces** (`opsz,wght,SOFT,WONK`), **Archivo** (`wdth,wght`) e **Bricolage Grotesque** (`opsz,wdth,wght`). Todas conferidas por requisição real à API do Google Fonts, com os eixos variáveis confirmados.
**Cuidado:** Archivo é a fonte do **dado** — precisa de `font-variant-numeric: tabular-nums`, que dispensa a monoespaçada de hoje.
**Check:** `npm run build` limpo e nenhuma requisição externa de fonte em produção (o Next hospeda local).

### E2 · Os 6 papéis tipográficos · [D2] · ✅ **FEITO (2026-08-15)**

> `tokens.css` define `--lastro-papel-rotulo/corpo/corpo-leitura/secao/titulo-tela/numero-heroi/bancada`; todo `font-size` de `sistema.css` foi remapeado para um desses sete tokens (o sétimo, `corpo-leitura`, é a variante de 18px do Modo Leitura para `.doc__prosa` — decisão do dono, ver `PROGRESS.md`). `.serie__v` ficou em Título de tela (30px), não Número herói (48px): a medição real da linha (335px de conteúdo a 375px de viewport) mostrou que 48px quebra a linha; 30px é o mesmo valor de antes, sem regressão. Detalhe completo, inclusive o mapa seletor→papel e a justificativa de cada caso não-óbvio: `DESIGN.md` §3.4 e `PROGRESS.md`, bloco "✅ E2". O texto abaixo é o enunciado original, mantido como registro.

Substituir `--lastro-t-meta/corpo/1..8` por **papéis nomeados**: Rótulo (14) · Corpo (16) · Seção (20) · Título de tela (30) · Número herói (48) · Bancada (76).
**Regra que vale como gate:** quem implementa escolhe o **papel**, nunca o pixel.
**Reprova:** tamanho usado sem papel atribuído.

### E3 · Tirar bevel e gradiente das superfícies · [parte da D3] · ✅ **FEITO (2026-08-15)**

> `--lastro-bevel-forte` e `--lastro-grad-sup` foram removidos de `tokens.css`; todo `box-shadow`/`background` que os usava em `sistema.css` caiu pra elevação/superfície plana, exceto `.nav` (trava — mantém `--lastro-bevel`). Detalhe: `PROGRESS.md`, bloco "✅ E3". O texto abaixo é o enunciado original, mantido como registro.

`--lastro-bevel` aparece 20× e o gradiente de superfície 12×. É o que mais data o visual, e **não toca em cor nenhuma**.

### E4 · Tokens de movimento · [D7] · ✅ **FEITO (2026-08-15)**

> `--lastro-dur-3/4/5/6` (250/300/350/400ms) e `--lastro-curva-padrao`/`--lastro-curva-enfatizada` entraram em `tokens.css`. **Só os tokens — nenhum componente foi cabeado a eles ainda** (isso é Nível 2). Detalhe: `PROGRESS.md`, bloco "✅ E4".

Hoje só existem 120ms e 220ms — falta a faixa média. Acrescentar as durações do M3 (250/300/350/400) e as curvas: padrão `cubic-bezier(0.2,0,0,1)`, enfatizada decelerando `cubic-bezier(0.05,0.7,0.1,1)`.

### E5 · **Escrever o vocabulário no `DESIGN.md`** · [pré-requisito de tudo] · ✅ **FEITO (2026-08-15)**

> Virou `DESIGN.md` §6. Uma lacuna encontrada e registrada, não resolvida por invenção: o mapa do artifact tinha 13 telas, mas `/ajustes/modelos/novo` nunca recebeu peça — está anotado como pendência em §6.6. Detalhe completo: `PROGRESS.md`, bloco "✅ E5". O texto abaixo é o enunciado original, mantido como registro.
As 10 peças, os 2 padrões de superfície, a regra verbo × substantivo, os papéis tipográficos e os padrões de transição — cada um com cláusula `Reprova:`, no idioma do documento.
**Este item não é opcional e vem antes do Nível 2.** Sem ele, o vocabulário existe só em artifact, e artifact não é fonte de projeto.

---

## Nível 2 — MÉDIO · componentes novos, marcação muda

*Uma peça por vez, cada uma provada numa tela antes de propagar.*

### M1 · A tela de prova: `/login` · [D10] · [HITL] · ✅ **FEITO (2026-08-15) — gate do dono confirmado**

> A2 (fusão das duas telas de entrada) já estava feita antes desta sessão (Trilha A) — `/login` já herdava E1-E4 por reuso de componentes compartilhados (`.entrada__marca`, `.botao-primario`, `.botao-secundario`). O trabalho novo de M1 foi só a peça 9: a marca "lastro" ganhou `--lastro-fonte-serif` (Fraunces), peso `--lastro-peso-forte` (600, igual ao veredito) — antes herdava Bricolage do corpo do texto. No meio do caminho, o dono achou pelo próprio gate um bug real em `.metrica__valor` (regressão de E2, não de M1) — corrigido à parte, ver `PROGRESS.md`. **O dono confirmou ter olhado `/login` no iPhone e aprovou seguir.** Detalhe: `PROGRESS.md`, bloco "✅ M1".

A primeira tela a receber a direção nova. Exercita E1–E4 e estabelece a personalidade. **Fazer junto com A2**, porque as duas mexem na mesma entrada.
**Gate:** o dono olha no iPhone dele antes de qualquer propagação.

### M2 · Rótulo micro + valor grande · ✅ **JÁ SATISFEITO (2026-08-15), sem trabalho novo**

> Auditoria (não build) antes de abrir branch, a pedido de uma consulta ao `advisor` — o item tinha uma linha só de especificação, sem lista de seletores como M1 teve via §6.6. Todo lugar do app onde um número aparece foi conferido contra a cláusula `Reprova:` da peça 1 ("número solto sem rótulo acima, ou rótulo no mesmo papel do número"). Os dois lugares que já são "métrica isolada" — `.metrica__rotulo`+`.metrica__valor` (Início) e `.evidencia__rotulo`+`.evidencia__numero` (parecer) — já cumprem, porque E2 já separou os papéis. Os campos do formulário de série também cumprem (`<label>` padrão). Os lugares que **não** cumprem (linha de série no treino, histórico do exercício) pertencem a M8 (peça 7, cabeçalho de coluna) e ao redesenho maior de `/catalogo/[id]`, não a este item isoladamente. Detalhe: `PROGRESS.md`, bloco "✅ M2".

A peça mais reusada do app: volume, e1RM, carga, frequência.

### M3 · Grade de métricas sem recipiente · [D3] · ✅ **FEITO (2026-08-15)**

> Escopo: só `/ajustes/anilhas`, o exemplo medido no próprio enunciado do item — não `.metrica` (Início), que já é grid mas não teve a borda removida aqui; isso é propagação (H4), não M3. `anilhas-form.tsx` trocou `<ul class="lista"><li><div class="item">` (recipiente com borda, o padrão "navega") por `.grade-anilhas`/`.anilha` — grid de 3 colunas, sem borda nem sombra, só valor + unidade + botão de remover. Medido no Chrome real com 6 pesos típicos (20/15/10/5/2,5/1,25 kg): células de **84px** de altura (meta do backlog: 88px), grid de 320px de largura útil sem overflow, botão de remover com o alvo de toque cheio de 48×48 (D1). Detalhe: `PROGRESS.md`, bloco "✅ M3".

**Medido a 360px:** 6 anilhas em grade = 3 colunas × 2 linhas × **88px**, contra **372px** das 6 linhas de hoje. Devolve 284px no aparelho mais estreito.

### M4 · Linha de navegação e linha de ação · [D3, D4] · ✅ **FEITO (2026-08-15)**

> Escopo: só a metade "navega" — nenhuma linha de ação dentro de lista existe hoje (auditado; ver `PROGRESS.md`), então a metade "ação" fica definida sem consumidor, como `--lastro-papel-bancada` já ficou em E2. Toda linha que usa `.item__link` (`/ajustes` ×3, `/`, `/treino`, `/catalogo/[id]`) ganhou seta via um componente novo (`SetaNavegacao`) — mudança central e de baixo risco: uma classe compartilhada, sem repetir marcação em cada tela. Achado no caminho: `/treino` tinha "ver" como rótulo — um VERBO numa linha de navegação, a reprova exata da peça 3 — trocado pela metadata real (`{n} séries`, mesmo padrão já usado em `/`). Detalhe: `PROGRESS.md`, bloco "✅ M4".

Recipiente macio + chevron para o que navega; mesmo recipiente sem chevron para o que age. **Rótulo de navegação é substantivo; de ação, verbo** — é o segundo canal que compensa a seta ausente.

### M5 · Etiqueta de estado · ✅ **FEITO (2026-08-15)**

> Auditoria antes de codar (mesmo hábito de M2/M4): "progressão" e "platô" só existem hoje em dois lugares — o bloco de evidência do parecer (`bloco-evidencia.tsx`, já tinha ícone+palavra+cor desde antes da Trilha B) e o gráfico de progressão (linha tracejada + anotação de texto, um padrão próprio já justificado por §3.7, fora do escopo desta peça). O único gap real era `.marca--recorde` (série no treino, histórico do exercício): tinha palavra + cor, faltava o ícone. Componente novo `EtiquetaRecorde` (★, `aria-hidden`) reusado nos 2 lugares.
>
> **Achado no caminho, fora do escopo original mas corrigido: `.serie` mostrava "valendo" E "recorde" ao mesmo tempo** (redundante — recorde só existe em série valendo) e, medido com peso de 3 dígitos, isso já estourava a linha em ~103px a 335px de conteúdo real (o pior caso do gate, §4.1) — **bug pré-existente, não causado por este item nem pelos anteriores**. Mitigado: "valendo" some quando é recorde. Reduz o resíduo pra ~15px (só no caso de peso de 3 dígitos + recorde, o mais raro dos casos) — **não fica 100% resolvido**; a correção definitiva é território do M8 (cabeçalho de coluna com largura alocada, não `span`s competindo). Detalhe: `PROGRESS.md`, bloco "✅ M5".

Progressão, platô, recorde. Ícone + palavra + cor — nunca só cor.

### M6 · Ação fantasma dentro da seção · ✅ **FEITO EM PARTE (2026-08-15)**

> Classe nova `.acao-fantasma` (sem borda, sem preenchimento, cor de tinta) aplicada aos 2 dos 3 exemplos nomeados: "adicionar anilha" (`/ajustes/anilhas`, resolve o desequilíbrio nomeado contra "Salvar configuração") e "criar modelo" (`/ajustes/modelos`). **"Adicionar série" (`/treino/[id]`) ficou de fora, de propósito** — hoje é o botão do `.acao-area` (a barra de ação fixa embaixo, D2/D3), não uma ação inline dentro de uma seção; §6.6 já marca essa tela como "registrar e editar viram folha" (H1, Nível 3, ainda não implementado). Converter esse botão pra fantasma agora, antes de H1 mudar a arquitetura do fluxo, arriscaria esvaziar visualmente a única forma de registrar série numa tela que D2/D3 exigem ser óbvia. Revisitar quando H1 acontecer. Detalhe: `PROGRESS.md`, bloco "✅ M6".

"Adicionar série", "adicionar anilha", "criar modelo". Resolve o desequilíbrio já registrado entre "Adicionar" e "Salvar configuração".

### M7 · Chips e controle segmentado · ✅ **FEITO EM PARTE (2026-08-15)**

> **Chips — implementado.** Classes novas `.chips`/`.chip` (`sistema.css`), token novo `--lastro-raio-chip` (`tokens.css`, mesmo valor de `--lastro-raio-pilula` mas token próprio — aquele é travado só pra aba inferior). Substitui `.selecao-grupos`/`.selecao-grupos__opcao` (grade de 2 colunas, caixa com borda) só em `SeletorGrupoMuscular` — usado em `/treino/[id]` (grupo do dia) e `/ajustes/modelos/novo` (1º passo de criar modelo, e resolve de passagem a lacuna que E5 tinha registrado: essa tela nunca tinha recebido peça mapeada em §6.6). `.selecao-grupos` continua existindo — `modelo-treino-form.tsx` reusa a mesma classe pra escolher EXERCÍCIOS (não grupo muscular), fora do escopo da peça 5, e nomes de exercício variam demais em tamanho pra funcionar bem como chip.
>
> **Segmentado — auditado, sem trabalho novo, nenhum dos dois alvos existe hoje.** Os dois lugares nomeados no próprio enunciado do item ("trocar o que o gráfico mostra", "filtrar histórico do exercício") não têm controle nenhum pra substituir: o gráfico (`grafico-progressao.tsx`) já não tem seletor desde a reescrita de §3.7 (pequenos múltiplos, aprovada 2026-08-14, ANTES das 10 decisões da Trilha B — o próprio §3.7 já fez o trabalho que a peça 4 descreveria, por um caminho diferente: eliminar a escolha em vez de trocar o `<select>` por um segmentado); `/catalogo/[id]` lista o histórico inteiro, sem filtro de métrica nenhum pra trocar. Construir um controle segmentado exigiria **inventar uma funcionalidade de filtro que não existe**, não só reestilizar uma que existe — fora do escopo de um item de redesenho visual. Detalhe: `PROGRESS.md`, bloco "✅ M7".

Chips para grupo muscular (catálogo, criar modelo). Segmentado para trocar o que o gráfico mostra — **substitui o seletor que o dono já mandou tirar**.

### M8 · Tabela com cabeçalho de coluna · ✅ **FEITO (2026-08-15)**

> `.serie` (dentro de `.grupo`, `treino-detalhe.tsx`) passou de linha flex para **grade CSS de 4 colunas** (índice / carga / marca / ação), `sistema.css`. Cabeçalho novo `.grupo__colunas` (rótulo micro, mesmas 4 colunas) renderiza só quando o grupo já tem ao menos 1 série — sem cabeçalho sobre `pendentesDoModelo` (0 linhas). `border-bottom: 1px solid` de `.serie` foi **removida**: era exatamente a "linha solta" que o dono reprovou no diagnóstico original (`ESTUDO-PADRAO-APLICATIVO.md` §0) — a separação agora vem do cabeçalho + altura mínima da linha, não de um traço por linha. Marca (aquecimento/valendo/recorde) ganhou um envelope fixo (`.serie__marca`) pra sempre ocupar a 3ª coluna da grade, mesmo quando nada renderiza dentro — sem isso a coluna de ação "pularia" de posição conforme o estado da série.
>
> **Pendência herdada de M5 — resolvida, não só mitigada.** Testado em navegador real (335px de conteúdo, viewport 375px, extensão Chrome + `javascript_tool`) com o caso real mais extremo (peso de 3 dígitos + recorde: `12 × 142,5 kg` + `★ RECORDE`): renderiza em uma linha só, sem estouro (`scrollWidth === clientWidth === 335`, sem scroll horizontal). A coluna de carga usa `minmax(0, 1fr)` em vez de `1fr` puro — isso é o que permite ao valor quebrar linha (em vez de vazar silenciosamente por trás do `overflow-x:hidden` do body) se algum dia não couber; testado também um caso artificial fora de qualquer uso real (`999 × 999,9 kg`, 3 dígitos nos DOIS lados) e aí sim há colisão visual entre a marca e a quebra de linha — não tratado, porque reps de 3 dígitos não existe no app hoje (nem no dado, nem na UI de registro) e "consertar" isso seria proteger contra um valor que o sistema não produz.
>
> Não implementado (fora do enunciado do item): reordenar as colunas em si (índice/carga/marca/ação) ou introduzir colunas separadas para reps × peso — o valor continua uma string única (`serie.reps × serie.peso`), só a moldura ao redor virou grade alinhada.

As séries do treino. **É a peça que resolve em definitivo o desalinhamento que abriu toda esta conversa.**

### M9 · Título como conteúdo + voltar flutuante · [D5] · ✅ **FEITO EM PARTE (2026-08-15)**

> **Mecanismo construído + 2 das 13 telas convertidas, exatamente como o próprio item pedia** ("tratar como item de propagação, não de uma tela"). Componentes novos `TituloTela` e `VoltarFlutuante` (`src/components/`), classes novas `.titulo-tela`/`.titulo-tela__*`/`.voltar-flutuante`/`.corpo--titulo-conteudo` (`sistema.css`). `.barra-topo` e `--lastro-clearance-topo` **não foram removidos** — continuam existindo e valendo para as 11 telas ainda não convertidas; só deixam de ser usados nas 2 telas convertidas nesta PR.
>
> **Convertidas:** `/catalogo/[id]` (o caso mais simples — sem avatar) e `/treino/[id]` (o caso mais carregado — avatar + link de volta, achado como o cabeçalho mais cheio do app). São as **únicas duas telas que já tinham link de "voltar pro pai"** (`botao-barra` → "Catálogo" / "Treinos") — as únicas que de fato exercitam a metade "voltar flutuante" do item; o resto das telas depende da aba inferior, não de um link de volta.
>
> **Achado corrigido antes do merge:** a primeira versão sobrepunha o círculo de voltar (fixo, 48px, canto superior esquerdo) ao rótulo de contexto do título ("CATÁLOGO" renderizava atrás do círculo). Corrigido com um modificador `.titulo-tela--com-voltar` que empurra o título pra baixo do círculo — só aplicado nas telas que também renderizam `VoltarFlutuante`.
>
> **Decisão explícita, não escondida:** `.grupo` (`sistema.css`) ainda usa `scroll-margin-top: var(--lastro-clearance-topo)` — em `/treino/[id]` isso virou uma reserva sem função (o motivo original, compensar a barra fixa no foco de campo pelo teclado, não existe mais ali), mas a classe é compartilhada com `/ajustes/modelos/novo` (ainda não convertida), onde o offset continua sendo o fix real de 2026-08-10. Fica assim até a propagação chegar nessa tela também.
>
> **Pendente — as 11 telas restantes**, na ordem sugerida por H4 (`DESIGN.md` §6.6): `/ajustes/anilhas` → `/analise` → o resto de `/ajustes/*` e `/perfil` → `/`, `/treino`, `/catalogo`, `/coach`. Cada uma remove a superfície petróleo mais escura (a barra) daquela tela — registrado explicitamente em `DESIGN.md` §2, nota da D5, pra não ler como acidente.

Remove `--lastro-clearance-topo` (88px) de todas as telas. **Devolve 88px em cada uma** — o maior ganho de espaço do app. Sub-telas ganham voltar flutuante.
**Cuidado:** toca as 13 telas. É "médio" por peça e **difícil no agregado** — tratar como item de propagação, não de uma tela.

---

## Nível 3 — DIFÍCIL · arquitetura, rota, estado

*Cada um pode quebrar coisa que já funciona. Um por PR, com verificação real.*

### H1 · Folha para tarefa curta · [D6] · ✅ **FEITO EM PARTE (2026-08-15)**

> **Mecanismo construído + 2 dos 4 fluxos convertidos** (`editar perfil`, `/ajustes` → `/perfil`; `adicionar anilha`, `/ajustes` → `/ajustes/anilhas`) — mesma lógica de propagação de M9: provar o primitivo no caso mais barato, documentar o resto como pendência explícita, não forçar os 4 numa PR só.
>
> **`adicionar anilha` (2026-08-15).** Segundo consumidor do mecanismo — rota interceptada aninhada, `src/app/@modal/(.)ajustes/anilhas/page.tsx` (o marcador `(.)` conta a partir da raiz de `app/`, ignorando o slot `@modal`, igual ao exemplo canônico `(.)photo/[id]` da doc do Next — confirmado por leitura da doc, e depois pelo teste real: a interceptação funcionou de primeira, sem precisar tentar `(..)`). Escopo mantido só na peça 10 — a peça 1 (rótulo micro + valor grande) dessa tela **não** entrou aqui, fica com H4. Consultei o `advisor` antes de codar (Nível 3); ele apontou dois testes que o H1 original (`editar perfil`) não precisava e que este PR cobre: **(a) dado obsoleto ao reabrir** — a folha busca `obterConfigAnilhas()` via server component; testado de ponta a ponta em Chrome real (adicionar anilha de 7,5 kg → salvar → fechar ✕ → reabrir → 7,5 kg presente, sem payload em cache), depois removida a anilha de teste e salvo de novo pra não deixar dado de teste na config real; **(b) folha alta** — `/ajustes/anilhas` é bem mais longa que o formulário de perfil, então é o primeiro consumidor real de `.folha` com scroll interno de verdade. Confirmado: `.folha__cabecalho` (sticky) mantém o ✕ alcançável mesmo com o conteúdo rolado pra baixo e a alça de arraste (`.folha__pega`, sem `sticky`) fora de vista; um arraste iniciado na alça ainda fecha a folha normalmente. Nenhum dos dois é bug — comportamento esperado do CSS que M9/H1 original já escreveu, só nunca tinha sido exercitado por conteúdo desse tamanho.
>
> **Decisão explícita sobre o pós-salvar dentro da folha.** `salvar()` no `AnilhasForm` não navega — só marca `salvo` e mostra "Configuração salva." inline, igual já fazia na rota cheia. Dentro da folha isso significa: salva, a folha continua aberta, o usuário fecha manualmente (✕, Esc, arrastar, ou tocar fora). Decisão de manter o comportamento existente (menor superfície) em vez de inventar fechamento automático — mesmo raciocínio já registrado pra `editar série` ficar fora da conversão.
>
> Fechamento testado em Chrome real nos 4 caminhos (✕, Esc, toque no fundo, arraste na alça) mais o fallback de URL direta (cai limpo na rota cheia com `barra-topo`, intocada) — todos confirmados. `npx tsc --noEmit` (pós-`npm run build`) · `npm run test` (133/133) · `npm run lint` (0 erros, 1 aviso pré-existente em arquivo gerado) · `npm run build` — todos verdes.
>
> **Por que "editar perfil" primeiro, dos 4 nomeados no item.** É o único caso de formulário simples, sem passo-a-passo (`criar modelo` tem 2 passos — grupo → exercícios — e empilhar passos dentro de uma folha é o que o próprio item proíbe, "não empilhar hierarquia"; `adicionar anilha` carrega a calculadora; `editar série` é o mais arriscado dos quatro, ver abaixo) e sem nenhuma interação com a fila offline.
>
> **Como foi construído.** Rota interceptada do App Router (`src/app/@modal/(.)perfil/page.tsx`, parallel route `@modal` em `src/app/layout.tsx`) — clique em `<Link href="/perfil">` (nav client-side) abre como folha por cima de `/ajustes`, sem perder o contexto; acesso direto por URL/refresh continua caindo na rota cheia de sempre (`src/app/perfil/page.tsx`, intocada). Componente novo `Folha` (`src/components/folha.tsx`) + classes `.folha`/`.folha-fundo`/`.folha__*` (`sistema.css`) — primeiro consumidor real de `--lastro-dur-6`/`--lastro-curva-enfatizada` (E4 tinha deixado prontos, sem uso). Fechar funciona por: toque no fundo, botão ✕, tecla Esc, arrastar pra baixo, e o próprio botão voltar do navegador/Android — este último de graça, é o próprio mecanismo de rota interceptada fazendo o trabalho (D6), não lógica escrita à mão.
>
> **Bug real achado e corrigido durante o teste com arraste de verdade (não só clique).** A primeira versão da alça tinha só 4px de altura — abaixo do piso de D1 (48×48px). Testando um arraste de verdade (não só aparência), a primeira tentativa não pegou a alça: selecionou texto do formulário por baixo em vez de arrastar. Corrigido com uma zona de arraste de 48px inteiros (`.folha__pega`) contendo o traço visual de 4px dentro — só depois disso o arraste (com deslocamento real e com soltura abaixo do limiar, testados os dois) funcionou de forma confiável.
>
> **Verificado com navegação real, não só aparência injetada.** `/ajustes` e `/perfil` não exigem login (fora de `PREFIXOS_PRIVADOS` em `src/proxy.ts`) — deu pra testar clique real, histórico do navegador, arraste e fallback de URL direta no Chrome de verdade, não só marcação injetada. **Não testado:** botão físico voltar do Android (só o back do navegador desktop) e leitor de tela real (só a estrutura ARIA — `role="dialog"`, `aria-modal`, `aria-label` — sem correr um AT de verdade). Sem trap de foco dentro da folha (Tab pode sair pro conteúdo por trás) — gap conhecido, não corrigido nesta entrega.
>
> **Pendente — os outros 2 fluxos**, cada um com razão própria pra não entrar ainda: `criar modelo` (esbarra na proibição de hierarquia empilhada — 2 passos, grupo → exercícios; precisaria resolver isso primeiro, não é conversão direta); `editar série` **auditado, não convertido de propósito** — hoje já troca a linha `.serie` por `EditarSerie` inline, no lugar, sem navegação nenhuma (o mesmo resultado que a folha existe pra produzir, por um caminho diferente) — e é o único dos quatro que toca `enfileirar`/`sincronizar` (fila offline) e a atualização otimista, exatamente o risco que o item cita ("conferir que a folha não atrapalha a fila de sincronização"). Convertê-lo sem necessidade clara trocaria um padrão que já funciona por um risco novo — decisão explícita de não fazer, não esquecimento (mesmo raciocínio de M2/M6/M7).
>
> **Sobre a pendência herdada de M6 — continua aberta, não fechada por este PR.** A nota "⚠️ herda pendência de M6" no cabeçalho original condiciona a mudança de `.botao-secundario` pra `.acao-fantasma` em `/treino/[id]` a **"registrar série" virar folha** — e "registrar série" não é um dos 4 fluxos que o próprio H1 nomeia ("criar modelo, editar perfil, adicionar anilha, editar série"). Converter `editar` não toca esse gatilho. Fica pendência aberta pra quando (e se) "registrar" for endereçado.

Criar modelo, editar perfil, adicionar anilha, editar série.
**Muda rota e histórico — não é CSS.** Precisa: fechar arrastando pra baixo, funcionar com o botão voltar do Android, e não empilhar hierarquia dentro da folha (o HIG proíbe).
**Risco:** o app é PWA offline-first; conferir que a folha não atrapalha a fila de sincronização ao registrar série.
**Herdado de M6:** quando "registrar série" virar folha, o gatilho que hoje é `.botao-secundario` no `.acao-area` de `/treino/[id]` deveria virar `.acao-fantasma` — deixado de fora de M6 porque converter antes esvaziaria a única forma de registrar série na tela atual (D2/D3).

### H2 · Modo de edição · [D8] · ✅ **FEITO EM PARTE (2026-08-15)**
Estado novo em todas as listas e grades. Substitui a lixeira visível por linha.
**Preservar:** a confirmação em duas etapas, e **nunca** `window.confirm`.

> **Mecanismo construído + 1 dos 4 consumidores convertido** (`/ajustes/modelos`) — mesma lógica de propagação de M9/H1: provar o primitivo no caso mais barato, documentar o resto como pendência explícita.
>
> **Por que `/ajustes/modelos` primeiro.** Consultei o `advisor` antes de codar (Nível 3): dos 4 lugares com lixeira sempre visível hoje (grade de anilhas, lista de treinos, lista de modelos, grade de séries), `/ajustes/modelos` é o único `.item` sem nenhum alvo de toque concorrente — só nome + lixeira, sem `.item__link`. Nos outros três, ligar/desligar a visibilidade da lixeira interage com outra coisa que já existe na linha (ver pendências abaixo), o que teria misturado dois problemas numa PR só.
>
> **Como foi construído.** Componente novo `src/components/lista-modelos.tsx` (client), com estado local `modoEdicao` (boolean) — substitui o JSX que antes vivia direto em `src/app/ajustes/modelos/page.tsx`. Toggle "Editar"/"Concluído" (rótulo muda com o estado, verbo, `.botao-textual`, no cabeçalho da lista via `.grupo__cab`/`.grupo__nome` — reuso do mesmo padrão rótulo+ação já usado em `anilhas-form.tsx` e `FormularioSerie`, nenhuma classe CSS nova). `ExcluirModelo` só é montado quando `modoEdicao` é `true` — a decisão que resolve de graça o risco que o `advisor` apontou (dois estados independentes, modo de edição da tela e "confirmando exclusão" do componente, podendo dessincronizar): desligar o modo de edição desmonta `ExcluirModelo`, e o estado `confirmando` dele deixa de existir junto, sem precisar sincronizar nada à mão. Testado explicitamente: abrir a confirmação de exclusão de um modelo e desligar o modo de edição no meio cancela a confirmação sem apagar nada.
>
> **Guard de lista vazia.** O toggle só renderiza quando `modelos.length > 0` — testado nos dois sentidos: carga inicial com lista vazia (sem toggle) e lista esvaziando em runtime depois de excluir o único modelo restante (toggle some de novo).
>
> **Pendente — 1 consumidor restante:** ~~**grade de anilhas**~~ **✅ feito (2026-08-16), ver abaixo**; ~~**lista de treinos** (`/treino`)~~ **✅ feito (2026-08-16), ver abaixo**; **grade de séries** (`.serie`, `treino-detalhe.tsx`) — a linha inteira é `role="button"` com `onClick` pra abrir edição inline, e a lixeira hoje usa `stopPropagation` pra escapar disso; o modo de edição aqui não é só esconder/mostrar, é decidir o que um toque na linha significa enquanto o modo está ligado — o mais arriscado dos consumidores, fica pra último.
>
> **Verificação:** `npx tsc --noEmit` (pós `npm run build`) · `npm run test` (133/133) · `npm run lint` (0 erros, 1 aviso pré-existente em arquivo gerado) · `npm run build` — todos verdes. `grep window.confirm` → só comentários, nenhuma chamada real. Visual/funcional em Chrome real: 2 modelos criados de teste — estado padrão sem lixeira em nenhuma linha; toggle liga → lixeira aparece nas duas linhas, alvo 48×48 confirmado (`getBoundingClientRect`); excluir → confirma → Cancelar volta ao modo de edição intacto; excluir → confirma → desligar o modo de edição no meio cancela a confirmação sem apagar; exclusão completa re-renderiza a lista sem linha obsoleta; dado de teste removido ao final. Zero erros no console.
>
> **`lista de treinos` (`/treino`) — ✅ feito (2026-08-16).** Segundo consumidor, e o primeiro com um alvo de toque concorrente na mesma linha (`.item__link`, navega pro detalhe do treino). Resolvido sem misturar problemas: o modo de edição só decide se a lixeira renderiza — a navegação da linha nunca muda de comportamento, ligada ou não. Componente novo `src/components/lista-treinos.tsx` (client), mesmo mecanismo de `ListaModelos` (montar/desmontar `ExcluirTreino` junto com `modoEdicao`). Cabeçalho "Histórico" + toggle "Editar"/"Concluído" via `.grupo__cab` (reuso, mesma classe de `ListaModelos`) — o `<h2>` manteve `.doc__secao` (classe original, não `.grupo__nome`, pra não mudar a aparência do título que já existia). Verificação: 4 comandos verdes; `grep window.confirm` → só comentários; Chrome real com os 7 treinos reais da sessão de dev — estado padrão sem lixeira; toggle liga → 7 lixeiras, 48×48 confirmado, `.item__link` e a lixeira lado a lado sem sobreposição (`right` do link = `left` da lixeira, medido); excluir → confirma → aparece; desligar o modo de edição no meio da confirmação → confirmação cancelada, os 7 treinos continuam intactos. Zero erros no console.
>
> **`grade de anilhas` (`/ajustes/anilhas`) — ✅ feito (2026-08-16).** Terceiro consumidor, e o primeiro onde o padrão de M9 (desmontar o botão de excluir quando `modoEdicao` é `false`) não servia: `.anilha` é uma coluna flex sem `.item`/recipiente, medida a 84–88px por célula em M3 — desmontar a lixeira encolheria a coluna e refluiria `.grade-anilhas` inteira ao ligar/desligar o modo. Consultei o `advisor` antes de codar (Nível 3) por essa divergência de padrão; confirmou a abordagem certa: manter a lixeira **sempre no DOM** e alternar uma classe nova, `.botao-icone--oculto` (`visibility: hidden`, `sistema.css`), em vez de montar/desmontar — reserva o espaço da célula incondicionalmente, tira o botão da árvore de acessibilidade e da ordem de tab (`aria-hidden`/`tabIndex={-1}` quando oculto), sem nenhuma reflow. Sem confirmação em duas etapas nova: `removerAnilha` só mexe em estado local (nunca teve confirmação, porque nada persiste até "Salvar configuração" — D8 presume um consumidor que já tinha confirmação; este nunca teve, então nada foi inventado). Toggle "Editar"/"Concluído" no `.grupo__cab` já existente (vazio até então), mesmo padrão dos outros dois consumidores; só renderiza com `anilhas.length > 0`.
> **Verificação:** 4 comandos verdes. Chrome real (extensão, sessão logada) nas duas telas que renderizam `AnilhasForm` — a rota cheia `/ajustes/anilhas` **e** a folha (`@modal/(.)ajustes/anilhas`, H1): medi `.grade-anilhas.getBoundingClientRect().height` antes/depois do toggle nas duas — **184px em ambos os estados, nas duas telas**, confirmando zero reflow. `visibility` computado: `hidden`→`visible` ao ligar o modo, `tabIndex` `-1`→`0`, `aria-hidden` `true`→`false`. Testei a remoção local (1 anilha removida, grade caiu pra 5 itens sem crescer de altura) e confirmei que nada persistiu: recarreguei a página sem salvar e as 6 anilhas originais voltaram intactas. Zero erros no console. Restam **grade de séries**, o último consumidor.

### H3 · Transições · [D7] · ✅ **FEITO EM PARTE (2026-08-16)**
Pílula = só esmaece (200ms) · sub-tela = deslize + esmaecimento (300ms) · folha = sobe (400ms, enfatizada) · segmentado = lateral. **Sem container transform.**
~~**Custo caiu:** o Next 16 já traz `ViewTransition` do React nativo — conferido em `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`, não de memória.~~ **Errado — corrigido em `DECISIONS.md` 2026-08-16.** O arquivo de doc existir em `node_modules` não significa que a versão de React instalada suporta a API: `ViewTransition` exige `react@canary`/`react@experimental`; este projeto usa `19.2.8` estável (verificado por execução: `require('react').ViewTransition` → `undefined`). Trocar o canal do React por uma peça de transição foi avaliado como risco desproporcional — decisão do dono, 3 caminhos apresentados (não trocar + crossfade à mão / trocar pra canary / deixar H3 pendente). Escolhido: **crossfade à mão**.
**Obrigatório:** respeitar `prefers-reduced-motion`.

> **Consultei o `advisor` antes de codar (Nível 3, broadest-surface change do redesenho até agora — toca a navegação de nível de topo inteira).** Escopo: folha já estava feita (H1); segmentado já tinha sido auditado sem alvo (M7); sobra pílula + sub-tela. Recomendação: só pílula nesta PR — sub-tela precisa de tagging direcional (`transitionTypes` em cada Link, semântica de forward/back) que é decisão de design própria, não cabe na mesma PR.
>
> **Implementação — `.transicao-pilula` em `sistema.css`, CSS puro, sem `ViewTransition`.** `@keyframes lastro-pilula-entra` (opacidade 0→1, `--lastro-dur-2`/220ms — token mais próximo do 200ms do enunciado, 20ms aceito em vez de criar token novo, `--lastro-curva-padrao`). Classe aplicada na região de conteúdo (não no `<header>`, não em `AbaInferior`) das 5 abas de nível de topo: `/` (`page.tsx`), `/treino`, `/analise` (dentro de `analise-interativa.tsx`, onde o `.corpo` de fato vive), `/catalogo`, `/ajustes`. `prefers-reduced-motion` já coberto pelo bloco global existente em `globals.css` (`*, ::before, ::after`) — nada novo precisou ser escrito pra isso.
>
> **Por que só a entrada, não um crossfade simétrico.** Sem `ViewTransition`, não há como coordenar a saída do conteúdo antigo — o Next troca a árvore de rota instantaneamente, e animar essa saída exigiria segurar o conteúdo antigo por um tempo com lógica própria de coordenação (exatamente a complexidade que a API nativa existiria pra evitar). Escopo reduzido, documentado, não escondido.
>
> **`AbaInferior`/`.barra-topo` deliberadamente fora.** Cada uma das 5 páginas remonta esses dois do zero a cada navegação (não vivem em `layout.tsx`) — incluí-los na animação faria a pílula ativa (o elemento que o dedo acabou de tocar) piscar/re-entrar a cada troca de aba.
>
> **Limite honesto da verificação desta sessão.** `npx tsc --noEmit` · `npm run test` (133/133) · `npm run lint` (0 erros) · `npm run build` — todos verdes. Confirmado por inspeção real (Chrome, `getComputedStyle`/`getAnimations()` depois de navegação real entre `/ajustes` e `/treino`): a classe e a animação chegam corretamente configuradas no elemento (duração 0.22s, curva certa, WAAPI reconhece o efeito). **Não consegui observar o efeito rodando ao vivo nesta sessão** — a aba ficou presa em `document.visibilityState: "hidden"` / viewport 0×0 durante toda a tentativa, mesmo depois de pedir ao dono pra desmaximizar o Chrome e trazer a aba pra frente (mesma classe de problema já registrada antes nesta máquina, agora mais severo). Sem `mcp__computer-use__*` disponível nesta sessão (servidor desconectado) pra usar o caminho alternativo de captura já validado outras vezes. **Merge seguro pedindo o dono olhar no próprio aparelho antes** — não só por regra (é mudança de navegação que toca as 5 abas), mas porque a checagem visual de verdade não rolou aqui.

### H4 · Propagar às 12 telas restantes · ✅ **FEITO (2026-08-16)** — mecanismo M9 em 13/13 telas
O mapa tela a tela está no artifact do vocabulário e deve ser copiado para o `DESIGN.md` no item E5.
**Ordem sugerida:** `/ajustes/anilhas` (pequena, exercita quase tudo) → `/analise` (peça-assinatura) → `/treino/[id]` (a mais complexa) → o resto.
**Regra:** uma tela por PR, olhada no celular antes da seguinte.

> **`/ajustes/anilhas` — ✅ feita (2026-08-16).** Terceiro consumidor real do mecanismo M9 (depois de `/catalogo/[id]` e `/treino/[id]`): `.barra-topo` trocado por `VoltarFlutuante`+`TituloTela comVoltar` na rota cheia de fallback (`src/app/ajustes/anilhas/page.tsx` — a que só é alcançada por URL direta/refresh, já que a navegação por clique a partir de `/ajustes` abre a folha do H1, intocada por esta mudança). Peça 1 (rótulo micro + valor grande) auditada de passagem, como o mapa de `DESIGN.md` §6.6 também exige pra essa tela: os valores de anilha já vivem sob o cabeçalho de seção "Anilhas disponíveis" — considerado contexto suficiente, nenhum markup novo. Verificação: 4 comandos verdes; Chrome real (acesso direto por URL) confirmando sem sobreposição entre o círculo de voltar e o título (`getBoundingClientRect`), sem overflow horizontal, botão de voltar navegando de volta a `/ajustes`, e a folha do H1 continuando a abrir normalmente ao clicar em "Anilhas" a partir de `/ajustes` (mecanismo não afetado).

> **`/analise` — ✅ feita (2026-08-16).** Quarto consumidor do mecanismo M9, e o primeiro numa **aba de nível de topo** (não uma sub-tela alcançada por navegação) — `TituloTela` aplicado **sem** `VoltarFlutuante`, porque não existe "voltar" numa aba primária: a aba inferior já é a navegação. `.barra-topo` (com o avatar como acessório) trocado por `TituloTela contexto="Análise semanal" titulo="Semana fechada" acessorio={<Avatar/>}`, `.corpo--titulo-conteudo` somada ao `.corpo` interno de `analise-interativa.tsx` (onde a div de conteúdo de fato vive, não em `page.tsx`). Verificação: 4 comandos verdes; Chrome real confirmando ausência de `.barra-topo`/`.voltar-flutuante`, `getBoundingClientRect` do avatar (461–509px) vs bloco de título (20–254px) sem sobreposição, sem overflow horizontal, zero erros no console. **Nota de contagem:** `/catalogo/[id]` e `/treino/[id]` já tinham sido convertidas antes, na própria PR que construiu o mecanismo (M9, 2026-08-15) — não fazem parte da fila de H4.

> **Restante da fila — feito numa PR só (2026-08-16), a pedido do dono pra agilizar (teste geral só no fim).** `/`, `/treino`, `/catalogo`, `/ajustes` (abas de nível de topo, sem `VoltarFlutuante` — não existe "voltar" partindo de uma aba primária) e `/ajustes/modelos`, `/ajustes/modelos/novo`, `/perfil`, `/coach` (sub-telas, com `VoltarFlutuante` pro pai real de navegação — `/ajustes/modelos/novo` volta pra `/ajustes/modelos`, não pra `/ajustes`, diferente do que o rótulo "contexto" da tela sugere). Texto de `contexto`/`titulo` preservado igual ao `.barra-topo` original em cada tela — só o mecanismo mudou, não o conteúdo.
>
> **Achado ao verificar `/perfil`.** Clique real via automação não disparou a navegação (nem pra abrir a folha do H1) — investigado, e é falha do ambiente de teste, não do código: a aba estava em `document.visibilityState: "hidden"`. Confirmado disparando `link.click()` via JS diretamente: a folha do H1 abriu normalmente, `.barra-topo` sumiu, mecanismo intacto. Registrado porque quase virou um falso alarme.
>
> **`/ajustes/modelos/novo` corrigido no meio da implementação.** Primeira tentativa usou contexto="Modelos de treino" (nome da tela pai) — errado por analogia mal aplicada com `/catalogo/[id]` (onde contexto = pai real). O padrão correto, confirmado olhando `/treino/[id]` (contexto = data, não nome de tela), é: preservar o texto ORIGINAL do `.barra-topo` de cada tela, e decidir o destino do `VoltarFlutuante` pela hierarquia de navegação real — os dois são independentes. Corrigido pra contexto="Ajustes" (valor original) antes de commitar.
>
> **Verificação:** `npx tsc --noEmit` · `npm run test` (133/133) · `npm run lint` (0 erros) · `npm run build` — todos verdes. Chrome real, as 8 telas: `.barra-topo` ausente e `.titulo-tela` presente em todas; `VoltarFlutuante` correto (href/rótulo) nas 4 sub-telas, ausente nas 4 abas de topo; zero sobreposição entre círculo de voltar e título (medido) em todas as sub-telas; zero overflow horizontal em todas; textos de contexto/título conferidos um a um contra o `.barra-topo` original.
>
> **H4 fechado — 13/13 telas com o mecanismo M9.** `.barra-topo`/`--lastro-clearance-topo` agora não têm mais nenhum consumidor de página — candidatos a remoção de `sistema.css`/`tokens.css`, não removidos aqui (fora do escopo declarado deste item; fica registrado, não decidido).

> **Pendência registrada (2026-08-15) — achado real do dono no iPhone, em `/ajustes`, não corrigido ainda.** Dois problemas visuais, distintos do escopo do H1 (que não tocou `/ajustes`):
> 1. A linha "Modelos de treino" / "Montar listas de exercícios" (`src/app/ajustes/page.tsx`) quebra em 2 linhas e desalinha em relação às outras linhas da lista (`Coach`, `Anilhas`) — `.item__conteudo` usa `justify-content: space-between` entre `.atalho__titulo` e `.atalho__meta` (herdado de M4), o que só funciona bem com pares curtos; esse par é o mais longo da lista e provavelmente precisa empilhar título/meta em vez de lado a lado.
> 2. `Excluir conta` (`src/components/excluir-conta.tsx`, renderizado solto depois do botão "Sair" em `src/app/ajustes/page.tsx`) lê como desconectado do resto da tela.
>
> Melhor momento provável: quando `/ajustes` for propagada aqui em H4 (ela já está na "ordem sugerida" implícita, junto de `/ajustes/anilhas`) — mas fica como decisão de quem pegar o item, não travado a isso.

---

## 4. O que **não** entra neste backlog

- **Háptico** — descartado na D9 por verificação: iOS não expõe Vibration API a web/PWA, e é o aparelho do dono.
- **Container transform** — descartado na D7: o próprio Material 3 o chama de "o mais expressivo", e o dono recusou excesso.
- **Painel rebaixado** (a opção 9 que agradou) — **medido em 1,31:1** entre linha e painel, contra o piso de 3,0 para limite de controle. Serve como agrupamento, não como limite de alvo tocável.
- **Livro-razão** — apresentado e reprovado pelo dono.
- **Mudar qualquer cor** e **mexer na pílula** — travas do dono.

## 5. Regras de execução que valem para todo item

1. Nunca commitar na `main`. Branch, commit, PR, merge.
2. Antes de cada PR: `npx tsc --noEmit && npm run test && npm run lint && npm run build`, do zero, **todos verdes**.
3. Mudança visual **verificada de olho em navegador real**, com usuário QA efêmero removido ao final (cascade = 0 confirmado). Relato de agente não é prova.
4. Contraste **medido**, nunca estimado.
5. `PROGRESS.md` atualizado como ação final de toda tarefa.
