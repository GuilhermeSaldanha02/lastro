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

### M7 · Chips e controle segmentado
Chips para grupo muscular (catálogo, criar modelo). Segmentado para trocar o que o gráfico mostra — **substitui o seletor que o dono já mandou tirar**.

### M8 · Tabela com cabeçalho de coluna · ⚠️ herda pendência de M5
As séries do treino. **É a peça que resolve em definitivo o desalinhamento que abriu toda esta conversa.** Herda uma pendência real de M5: `.serie` com peso de 3 dígitos + recorde ainda estoura ~15px a 335px de conteúdo — mitigado, não resolvido (ver bloco de M5 acima e `PROGRESS.md`).

### M9 · Título como conteúdo + voltar flutuante · [D5]
Remove `--lastro-clearance-topo` (88px) de todas as telas. **Devolve 88px em cada uma** — o maior ganho de espaço do app. Sub-telas ganham voltar flutuante.
**Cuidado:** toca as 13 telas. É "médio" por peça e **difícil no agregado** — tratar como item de propagação, não de uma tela.

---

## Nível 3 — DIFÍCIL · arquitetura, rota, estado

*Cada um pode quebrar coisa que já funciona. Um por PR, com verificação real.*

### H1 · Folha para tarefa curta · [D6] · ⚠️ herda pendência de M6
Criar modelo, editar perfil, adicionar anilha, editar série.
**Muda rota e histórico — não é CSS.** Precisa: fechar arrastando pra baixo, funcionar com o botão voltar do Android, e não empilhar hierarquia dentro da folha (o HIG proíbe).
**Risco:** o app é PWA offline-first; conferir que a folha não atrapalha a fila de sincronização ao registrar série.
**Herdado de M6:** quando "registrar série" virar folha, o gatilho que hoje é `.botao-secundario` no `.acao-area` de `/treino/[id]` deveria virar `.acao-fantasma` — deixado de fora de M6 porque converter antes esvaziaria a única forma de registrar série na tela atual (D2/D3).

### H2 · Modo de edição · [D8]
Estado novo em todas as listas e grades. Substitui a lixeira visível por linha.
**Preservar:** a confirmação em duas etapas, e **nunca** `window.confirm`.

### H3 · Transições · [D7]
Pílula = só esmaece (200ms) · sub-tela = deslize + esmaecimento (300ms) · folha = sobe (400ms, enfatizada) · segmentado = lateral. **Sem container transform.**
**Custo caiu:** o Next 16 já traz `ViewTransition` do React nativo — conferido em `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`, não de memória.
**Obrigatório:** respeitar `prefers-reduced-motion`.

### H4 · Propagar às 12 telas restantes
O mapa tela a tela está no artifact do vocabulário e deve ser copiado para o `DESIGN.md` no item E5.
**Ordem sugerida:** `/ajustes/anilhas` (pequena, exercita quase tudo) → `/analise` (peça-assinatura) → `/treino/[id]` (a mais complexa) → o resto.
**Regra:** uma tela por PR, olhada no celular antes da seguinte.

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
