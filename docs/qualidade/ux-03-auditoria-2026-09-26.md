# UX-03 — Auditoria visual: 1ª passada (2026-09-26)

> **Tudo aqui é `ALEGADO`.** Quem escreveu olhou as capturas; nenhum item virou `PASSOU` porque outro agente ainda não auditou em contexto limpo (`AGENTS.md` §5). Esta é a **primeira passada, parcial**: o Antigravity baixou as capturas da varredura `j4` e parou (cota esgotada) antes de escrever qualquer achado; o Claude retomou daí. Nenhuma correção de código foi feita ainda: o handoff manda **mostrar a lista ao dono antes** (`docs/HANDOFF-ANTIGRAVITY-UX-02-UX-03.md` §4).

## 1. O que foi (e não foi) coberto

**Fonte:** as 51 capturas da varredura `e2e/j4-varredura.spec.ts` (17 rotas × 3 larguras: celular 390, tablet 768, desktop 1440), em `qa/varredura-recente/varredura/` (artefato `varredura-telas` do CI, conta descartável "Ana Ribeiro", aluna, com vínculo). Evidências citadas foram copiadas para `qa/evidencias/UX-03/2026-09-26/`.

**Olhadas uma a uma:** as 12 rotas de celular listadas na tabela (§3), mais `desktop_treino`, `desktop_analise` e `tablet_ajustes`. As demais capturas de tablet e desktop **não foram inspecionadas individualmente**.

**Fora desta passada (precisam de captura nova, a varredura `j4` não cobre):** `/login`, `/aceite`, `/onboarding`, `/boas-vindas`, `/redefinir-senha`, `/termos`, `/privacidade`, `/treino/[id]`, `/ajustes/guia`, `/ajustes/politicas`, `/personal/completar`, a 404 e os modais de `src/app/@modal/`. Também não foram cobertos: inglês e espanhol, os 7 temas além do padrão, o viewport 375×812 e 1280×800 exatos, e medição de alvo de toque em px.

## 2. Limite do método (importante para quem continuar)

As capturas da `j4` são de **página inteira**. Nelas a barra inferior fixa aparece **no meio da página** (onde caiu na altura do viewport de captura). Isso é artefato de captura, não defeito do app, e por isso **esta varredura não consegue provar nem refutar "conteúdo escondido pela barra inferior"**. Para esse critério é preciso captura de **viewport rolado** (rolar até o fim e capturar só a janela). Fica como pendência da UX-03.

## 3. Achados

Severidade: ALTA = atrapalha a tarefa principal; MÉDIA = aparência ou uso claramente pior que o resto do app; BAIXA = polimento. Nenhum achado ALTA nesta passada.

| ID | Rota × largura | Achado | Sev. | Evidência |
|---|---|---|---|---|
| UX3-01 | `/treino`, `/analise` (e provavelmente todas) × desktop 1440 | O layout de celular é esticado até a largura inteira: cartões e botão "Continuar treino de hoje" ocupam ~1400 px, a barra inferior vira uma faixa de ponta a ponta. Sem largura máxima de coluna. O PRD (A8) prevê uso no PC. | MÉDIA | `desktop_treino.png`, `desktop_analise.png` |
| UX3-02 | `/analise` × celular | Os gráficos de progressão gastam ~130 px de altura vazia sob uma linha reta plotada no alto (série estável, e1RM 0,0%). Ocupa a tela sem informar. | MÉDIA | `celular_analise.png` |
| UX3-03 | `/ajustes/modelos/novo` × celular | O campo "Nome do modelo" e o botão "Continuar" ficam **colados** (sem espaço entre eles); o anel de foco do campo encosta no botão. | MÉDIA | `celular_ajustes_modelos_novo.png` |
| UX3-04 | `/ajustes/personal` × celular | O cabeçalho mostra o logotipo e um **círculo escuro cortado** no canto esquerdo. **Causa confirmada no código:** `src/app/ajustes/personal/page.tsx` monta `CabecalhoPro` **sem** `voltarHref` e usa o botão `VoltarFlutuante`, que aparece meio escondido sob o cabeçalho; as outras subtelas de Ajustes usam a seta de voltar do próprio cabeçalho. Navegação inconsistente. | MÉDIA | `celular_ajustes_personal.png` |
| UX3-05 | `/ajustes/relatorios` × celular | O título do cabeçalho é cortado ("Histó…"). Cada cartão repete o mesmo botão dourado "Gerar Imagem / Sticker Story" (fica pesado com muitos treinos), e "Sticker Story" é inglês numa tela em português. | BAIXA | `celular_ajustes_relatorios.png` |
| UX3-06 | `/ajustes/anilhas` × celular | As anilhas aparecem com ponto decimal ("2.5", "1.25") num app em português que usa vírgula em outros lugares ("1,5 t", "50,7 kg"). | BAIXA | `celular_ajustes_anilhas.png` |
| UX3-07 | `/treino` × celular | Os chips de filtro por grupo (Todos, Abdômen, Ombro, Costas…) passam da borda direita cortando "Costas", sem pista de que rolam para o lado. | BAIXA | `celular_treino.png` |
| UX3-08 | `/coach` × celular | A caixa de pergunta fica a ~10 px da barra inferior, com moldura dupla (contêiner + campo). Apertado, mas legível. | BAIXA | `celular_coach.png` |

**Notas para a UX-02 (não são achados de auditoria):** o `/treino` de hoje já tem **filtro por grupo muscular** (chips) e modo "Editar" para excluir. O que a UX-02 ainda pede está confirmado como ausente: o "treino de hoje" **não é separado** (aparece como "hoje" dentro da lista) e o histórico é uma lista de cartões, **sem agrupamento por mês** (`celular_treino.png`, `desktop_treino.png`).

**Observado e sem problema visível nesta passada:** `/ajustes` (hierarquia clara, grupos legíveis, "Excluir conta" isolado embaixo), `/ajustes/temas`, `/ajustes/modelos` (estado vazio), `/perfil`, `/catalogo/[id]`, `/personal`, `/personal/alunos`. "Sem problema visível" não é medição: alvo de toque e contraste não foram medidos aqui (o `j5-contraste` cobre contraste).

## 4. Correções dos quatro achados MÉDIA (2026-09-26)

O dono pediu a correção de UX3-01 a UX3-04. Uma PR por achado, todas na `main`; e2e completo do CI depois delas (run `36271452439`): **153 passaram**, incluindo um spec novo por correção. As capturas "depois" vêm do artefato da mesma execução (`qa/evidencias/UX-03/2026-09-26-depois/`). Continuam `ALEGADO`: falta outro agente auditar.

| ID | PR | O que mudou | Prova |
|---|---|---|---|
| UX3-01 | #317 | Token `--lastro-largura-app` (48rem): `.corpo` centralizado e barras fixas (`.nav`, `.topo-pro`, `.acao-area`, `.voltar-flutuante`) alinhadas à coluna. Celular e tablet retrato inalterados. | `e2e/j19-coluna-do-app.spec.ts` (1440: coluna ≤ 768 px, centralizada, nav ≤ 768 px; 390: sem mudança). Captura `desktop_treino.png`: coluna centralizada, cabeçalho e nav alinhados. |
| UX3-02 | #318 | `YAxis` escondido com domínio ajustado aos dados (`dominioDoGrafico`, folga = maior entre 25% da amplitude e 5% do maior valor); série estável fica no meio do gráfico, não no topo. | Teste unitário `dominio-grafico.test.ts`. Captura `celular_analise.png`: linha centralizada. |
| UX3-03 | #319 | A seção do passo 1 de "Novo modelo" usa `.pilha` (folga entre alvos vizinhos). | `e2e/j20-modelo-novo-espaco.spec.ts` (folga ≥ 8 px). Captura `celular_ajustes_modelos_novo.png`: ~12 px entre campo e botão. |
| UX3-04 | #320 | `/ajustes/personal` usa o `voltarHref` do `CabecalhoPro` e perde o `VoltarFlutuante` cortado. | `e2e/j21-voltar-personal.spec.ts` (voltar inteiro na tela, alvo ≥ 44 px, leva a Ajustes). Captura `celular_ajustes_personal.png`: seta de voltar visível. |

**Ressalva do UX3-02:** o gráfico continua com a mesma altura; o que mudou é a linha deixar de colar no topo. Tirar o zero do eixo Y realça variações pequenas, por isso a conclusão em palavras e o percentual seguem acima do gráfico. Se o dono preferir um gráfico mais baixo, é decisão de desenho separada.

## 4b. Correções dos quatro achados BAIXA (2026-09-26)

O dono pediu também a correção de UX3-05 a UX3-08. Mesmo procedimento; e2e completo depois delas: **157 passaram** (run `36274938229`). Uma correção precisou de segunda passada: o teste do UX3-08 mediu 11 px onde exigia 12, e a folga subiu de `e-3` para `e-4` (#326). Capturas em `qa/evidencias/UX-03/2026-09-26-depois-baixa/`. Continuam `ALEGADO`.

| ID | PR | O que mudou | Prova |
|---|---|---|---|
| UX3-05 | #322 | Título "Relatórios · Histórico" (cabia; era "Relatórios e adesivos · Histó…"); botão por treino em contorno em vez de dourado cheio; texto "Gerar imagem para Stories" (era "Gerar Imagem / Sticker Story"). | `j22-relatorios-cabecalho.spec.ts`; `celular_ajustes_relatorios.png`. |
| UX3-06 | #323 | `formatarKg` das anilhas usa `formatarPeso` por idioma (2,5 e 1,25 em português; também no total por lado). | `anilhas-form.test.ts`, `j23-anilhas-decimal.spec.ts`; `celular_ajustes_anilhas.png`. |
| UX3-07 | #324 | Sombras de rolagem em CSS puro em `.chips-carrossel` (treino e catálogo). | `j24-chips-rolagem.spec.ts`; `celular_treino.png` (sombra discreta na borda direita, chip "Costas" ainda cortado, agora com pista). |
| UX3-08 | #325, #326 | Folga de 16 px entre a caixa do Coach e a barra inferior; campo sem contorno em repouso (dourado no foco). | `j25-coach-caixa.spec.ts` (folga ≥ 12 px); `celular_coach.png`. |

**Ressalvas:** (a) a sombra do UX3-07 é sutil por escolha; se o dono a achar fraca, é ajuste de intensidade. (b) No Coach o campo, sem contorno, distingue-se da barra só pelo fundo; se ficar fraco em algum tema, volta o contorno.

## 4c. Cobertura medida e novos achados (2026-09-26)

**Método:** `e2e/j26-cobertura-ux03.spec.ts` (mede e grava, não reprova) percorreu **60 telas** em 375×812 com contas descartáveis: as 12 rotas fora da varredura `j4` (login, termos, privacidade, 404, aceite, onboarding, boas-vindas, completar cadastro, redefinir senha, manual, políticas, detalhe do treino e do exercício), o inglês e o espanhol nas telas principais e 6 temas em Home, Treino e Ajustes; topo **e fim** do viewport, mais métricas (vazamento horizontal, alvo de toque, texto cortado, conteúdo sob a barra inferior). As capturas de "antes" estão em `qa/evidencias/UX-03/2026-09-26-cobertura/`.

**Medido, sem defeito:** vazamento horizontal em nenhuma das 60 telas; nenhum conteúdo escondido pela barra inferior no fim da rolagem (a limitação da §2 fica resolvida para essas rotas); nenhum alvo de toque menor que 44 px entre elementos em bloco (links dentro de texto ficam de fora, como a regra de acessibilidade admite). **Ponto cego da medida:** ela não pega texto que se sobrepõe sem estar cortado (foi o olho que viu o defeito da barra inferior em espanhol) e não mede a faixa de ação fixa do `/treino/[id]` (vista na captura: sem problema).

| ID | Achado | Sev. | Estado |
|---|---|---|---|
| UX3-09 | **Barra inferior em espanhol**: "Entrenamientos" e "Análisis" se **sobrepunham**; em inglês "Workouts"/"Analysis" se encostavam. Em todas as telas para quem usa es/en. | ALTA | **Corrigido** (#329): es "Entrenos", fonte da barra encolhe com a largura em en/es e em pt. `j27-nav-rotulos.spec.ts` (3 idiomas × 360/375/390 px): 9 passaram. |
| UX3-10 | Home em espanhol: "INICIAR ENTRENAMIENTO DE HOY" quebrava em duas linhas com o ícone solto; título do cartão da Análise cortado em es/en ("Análisis Semanal (A…"). | MÉDIA | **Corrigido** (#330): "Iniciar/Continuar entreno de hoy", título sem "(AI Coach)". `j28-home-es-en.spec.ts`. |
| UX3-11 | Termos, Privacidade, `/aceite` e `/ajustes/politicas`: bloco corrido, sem espaço entre parágrafos e seções (o texto que a pessoa precisa ler antes de aceitar). | MÉDIA | **Corrigido** (#331). `j29-texto-legal-e-titulos.spec.ts`. |
| UX3-12 | Título do passo do onboarding e "Criar senha nova" usavam a classe de rótulo (pequena e cinza): hierarquia fraca na primeira impressão. | MÉDIA | **Corrigido** (#331): classe `titulo-cartao`. `j29`. |
| UX3-13 | `/redefinir-senha` é um cartão solto, sem a marca (o login tem o logotipo). | BAIXA | Aberto |
| UX3-14 | A 404 para quem não tem sessão mostra o avatar "AT" (Atleta) no cabeçalho, ligado ao perfil. | BAIXA | Aberto |

**Incidentes do processo (registrados para não se repetir):** (1) a resolução de um conflito de `sistema.css` na #331 perdeu um `}` e a abertura de um comentário; o build da `main` falhou e a #331 foi mergeada com o CI vermelho porque meu encadeamento de comandos não parou no erro; corrigido na #332 e a produção nunca saiu do ar (a Vercel manteve o último deploy bom). (2) Um teste meu (UX3-09) reprovou português a 375 px por 1 px de subpixel; a tolerância virou 2 px (#333). (3) Eu disparava a suíte completa do e2e a cada correção; o dono apontou, e o `ci.yml` ganhou a entrada `specs` (#334): **só as specs que mudaram**.

**Continuam `ALEGADO`.** Ainda sem medir: `/treino/[id]` com séries em estado de erro/offline, os modais de `@modal`, o detalhe do catálogo com mídia, e o contraste dos 6 temas (o `j5-contraste` cobre o tema padrão).

## 5. Próximos passos

1. ~~Dono vê a lista e decide o que corrigir~~ **Feito:** os quatro MÉDIA foram corrigidos (§4). Os quatro BAIXA (UX3-05 a 08) também foram corrigidos (§4b).
2. Completar a cobertura da §1 com capturas novas de **viewport rolado**, em 375×812, incluindo as rotas fora da `j4`, os temas e os idiomas.
3. Só depois de decidido: PRs pequenas de correção, uma por achado ou por rota, cada uma com critério de aceite; e passar os itens para o `QA.md`.
4. Outro agente audita esta lista e as correções (`ALEGADO` → `PASSOU`).
