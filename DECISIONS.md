# DECISIONS.md — `lastro`

> **HD append-only.** Log de decisões em ordem cronológica. Nunca reescrever entrada antiga.
> Formato: o que mudou · por quê · alternativa descartada · impacto · como reverter.

---

## 2026-08-04 — Bootstrap do projeto

**O que mudou.** Projeto criado do zero em `C:\lastro`, repo privado `GuilhermeSaldanha02/lastro`, branch `chore/bootstrap-projeto`. Documentos de contrato criados: `KNOWLEDGE.md`, `PRD.md` (aprovado e congelado), `ADR.md` (ADR-001 a ADR-008).

**Por quê.** Bootstrap segundo `diretrizes-v7.md`.

**Impacto.** Nenhum código escrito ainda. Todo trabalho de implementação passa a depender do SDD, que ainda não existe.

---

## 2026-08-04 — Glossário travado: série, aquecimento, peso

**O que mudou.** Três termos definidos no grill de domínio viraram contrato (`KNOWLEDGE.md` §1): série = uma execução (1 linha por série); aquecimento = registrado mas fora de toda métrica; peso = o número lido no equipamento, em kg.

**Por quê.** Cada um deles, mal definido, corrompe silenciosamente **toda** a matemática de volume — e a Análise passa a dar parecer confiante sobre número errado.

**Alternativas descartadas.** Série resumida (`3×10×40` em uma linha) — esconde a queda de reps na última série, que é o sinal de fadiga que a Análise usa. Peso real total (barra + anilhas somadas) — comparável entre academias, mas exige cálculo mental entre séries.

**Impacto.** Define o schema da tabela de séries. Mudança posterior exige migração de dados.

**Como reverter.** "Peso" é o único reversível a baixo custo, se o campo de unidade e um marcador de convenção existirem desde o início. As outras duas exigem migração.

---

## 2026-08-04 — Enquadramento: ferramenta pessoal, não produto de mercado

**O que mudou.** A exigência de "monopólio de nicho" da diretriz foi explicitamente descartada. Ver ADR-001.

**Por quê.** O dono definiu uso pessoal/fechado com a chave dele. Manter a linguagem de monopólio seria teatro e levaria a features de crescimento que ninguém vai usar.

**Impacto.** Escopo negativo do PRD ficou muito mais agressivo. Sem rate limit, billing, social ou onboarding.

---

## 2026-08-04 — Sem tela de rotina (ADR-008)

**O que mudou.** A pergunta "meu volume está equilibrado?" deixa de comparar executado vs. plano declarado e passa a derivar o padrão real dos dados registrados.

**Por quê.** Resposta do dono no portão do PRD: "a pessoa escreve e anota e com base nisso o app deixa registrado". Mede o que foi feito, não o que foi prometido.

**Alternativa descartada.** Configurador de divisão (ABC / Upper-Lower / Full body).

**Impacto.** Uma tela a menos no MVP. A lógica de detecção de padrão entra no agregador.

**Como reverter.** Barato — acrescentar a tela depois não invalida dado nenhum.

---

## 2026-08-04 — Desvio consciente: commit direto na `main` para proteger `.env`

**O que mudou.** `.gitignore` commitado diretamente na `main`, fora do fluxo de branch + PR.

**Por quê.** A `main` foi criada apontando para o primeiro commit, que não continha `.gitignore` — ele nasceu depois, na branch de bootstrap. Consequência: qualquer branch criada a partir de `main` (que é a regra do próprio projeto) nasceria **sem proteção de `.env`**, exatamente nas fases 1.1 e 2.1, quando a chave da Gemini e as credenciais do Supabase são criadas. Um segredo commitado por acidente não se "descommita" — fica no histórico.

**Alternativa descartada.** Esperar o merge do PR #1. Deixa a janela de risco aberta justamente na sessão seguinte, que é quando o código começa.

**Impacto.** Um commit na `main` sem review. A regra "nunca commitar na `main`" segue valendo para todo o resto — **desvio consciente é permitido, desviar em silêncio não** (`padrao-proibicoes`).

**Como reverter.** `git revert` do commit. Não se deve.

---

## 2026-08-04 — Correção no gate de evidência: dois escopos separados

**O que mudou.** O hook de `Stop` passou a avaliar working tree e diff-da-branch **separadamente**, em vez de juntar as listas de caminhos.

**Por quê.** Bug encontrado em teste: juntando as listas, um `PROGRESS.md` já commitado na branch mascarava código sujo não commitado — o gate silenciava pelo resto da branch. E a versão original só olhava o working tree, então código **commitado** sem tocar o PROGRESS passava batido, que é o caso mais comum na prática.

**Impacto.** O gate agora cobre os dois casos. Repo sem branch `main` degrada graciosamente (escopo B desativa) em vez de quebrar.

**Como reverter.** Editar `.claude/hooks/gate-evidencia.mjs`.

---

## 2026-08-04 — RIR entra na UI

**O que mudou.** Campo RIR opcional por série valendo, visível na interface.

**Por quê.** Decisão do dono no portão do PRD. Habilita a métrica de séries difíceis (RIR ≤ 3), que mede estímulo real melhor que volume bruto.

**Impacto.** Um toque a mais por série. O agregador precisa tratar RIR ausente sem contaminar a métrica — série sem RIR não é "série fácil", é série sem informação.

---

## 2026-08-04 — Unilateral: reps por lado, volume dobrado

**O que mudou.** Em exercício marcado `unilateral`, as reps são registradas **por lado** e o peso é o de **um** halter — porque é assim que se fala na academia ("rosca com 14, 10 de cada"). O agregador multiplica o volume por 2.

**Por quê.** Coerente com a decisão de glossário "peso = o número que você lê no equipamento". Obrigar o dono a somar os dois lados no meio do treino é exatamente o cálculo mental que aquela decisão existe para evitar. E o volume precisa refletir o trabalho real: 10 reps de cada braço são 20 execuções.

**Alternativa descartada.** Registrar reps totais (20) — apaga a informação de simetria e diverge de como toda academia conta.

**Impacto.** Atinge toda métrica de volume de exercício unilateral. `unilateral` é atributo do **exercício** no catálogo, não da série.

**Como reverter.** Caro: exige reinterpretar dados já gravados.

---

## 2026-08-04 — Peso corporal fica FORA do volume no MVP

**O que mudou.** Exercícios de peso corporal (barra fixa, paralelas) registram apenas a **carga adicional**. Contam em **frequência** e em **séries difíceis**, mas **não entram no volume** — e a UI declara isso onde o número aparece.

**Por quê.** Calcular o volume real exigiria o peso corporal do dono, que **não existe no PRD nem no schema** — e varia no tempo, então um campo único falsearia o histórico. Preencher com valor plausível seria E3 puro: inventar dado de negócio sobre o qual a Análise daria parecer.

**Alternativa descartada.** Tabela de peso corporal ao longo do tempo. É a solução correta, mas é escopo novo e depende de dado que só o dono tem — **fica como pergunta a ele, não como suposição minha.**

**Impacto.** Quem treina muita barra fixa vê volume subestimado. Limitação declarada é honesta; limitação escondida é bug.

**Como reverter.** Barato: acrescentar o registro de peso corporal depois não invalida nada já gravado.

---

## 2026-08-04 — Estagnação: adotado N = 4 semanas

**O que mudou.** `SEMANAS_ESTAGNACAO = 4` fixado em `SDD.md` §4.2 / `limiares.ts`. Antes era placeholder `TODO: copiar de KNOWLEDGE.md §3.7` — mas §3.7 dá uma **faixa** (3–4), não um valor, então não havia nada para copiar. Achado do QA da Fase 1: o placeholder era inexecutável, e quem implementasse escolheria 3 ou 4 sozinho — a decisão sem dono que o placeholder deveria impedir.

**Por quê.** Alinha com `JANELA_SEMANAS = 4`, que já é o horizonte de comparação usado no resto do produto — um horizonte mental, não dois períodos arbitrários. E é o extremo mais conservador da faixa 3–4, gerando menos falso alerta de estagnação.

**Alternativa descartada.** N = 3 — mais sensível, mas sem justificativa melhor que "é o outro número da faixa". Deixar como placeholder até perguntar ao dono — rejeitado porque a spec já tinha rede de segurança suficiente (teste falha com valor 0) e a faixa já é convenção, não ciência; esperar não traria mais rigor.

**Impacto.** `KNOWLEDGE.md` §3.7 atualizado com o valor adotado. `SDD.md` é a fonte única do número em código.

**Como reverter.** Trocar a constante. Barato — não há dado gravado que dependa deste valor além do cálculo de estagnação, que é derivado, não armazenado.

---

## 2026-08-04 — Semana de análise fecha na segunda-feira (implementação da tarefa 1.3)

**O que mudou.** `semanaAnaliseAtual(agora)` retorna a última semana ISO **completa** antes de `agora` — não a semana em andamento que contém `agora`. Implementado em `src/lib/analise/semanas.ts`.

**Por quê.** Era a pergunta aberta 1 do `SDD.md` §8 ("a semana fecha na segunda?"). Ao implementar o agregador, essa decisão deixou de ser adiável: os 30 valores conferidos à mão em `SDD.md` §4.5 só batem sob esta leitura, sem editar nenhum literal do fixture. É evidência forte, não prova de que é o que você quer.

**Pendência real — não fechada por mim.** Isto é implementação técnica do agregador, não a regra de **liberação do botão** (tarefa 1.0d), que é produto: quando a UI mostra "Análise disponível"? As duas precisam concordar, e só a segunda depende de você. Se 1.0d decidir diferente (ex.: liberar em tempo real, olhando a semana em andamento), este arquivo muda — é isolado (`semanas.ts`), o custo é baixo.

**Impacto.** Toda métrica do resumo (volume, e1RM, série difícil) é calculada sobre uma semana sempre fechada, nunca parcial — o que evita comparar 3 dias de treino desta semana com 7 dias da anterior.

**Como reverter.** Editar `semanaAnaliseAtual`. Os 30 testes do agregador são o contrato: mudar essa função exige rever os fixtures também.

---

## 2026-08-05 — Modelo Gemini corrigido: `gemini-2.5-flash` → `gemini-3.6-flash`

**O que mudou.** O ADR-004 registrava `gemini-2.5-flash`, escolhido no bootstrap (2026-08-04) com base em memória de treino, não em doc vigente (violação do próprio E12). Trocado por `gemini-3.6-flash` ao implementar a tarefa 1.4, quando a verificação da doc atual (obrigatória antes de escrever código de integração) revelou o problema.

**Por quê.** `gemini-2.5-flash` tem retirement date de **16 de outubro de 2026** — escolher um modelo a ~2 meses de aposentar seria dívida técnica nascendo já paga. `gemini-3.6-flash` é o modelo GA atual (desde 21/jul/2026), mais barato e mais eficiente em tokens que o antecessor 3.5 Flash (que ele substituiu), com foco em código/planejamento agentic.

**Alternativa descartada.** `gemini-3.6-flash` era a única opção GA sensata no momento da checagem — `gemini-3.1-pro` é mais caro e voltado a raciocínio pesado, desproporcional para interpretar um JSON já calculado; `gemini-3.5-flash` já foi superado pelo 3.6 no mesmo dia de lançamento deste.

**Impacto.** Nenhum código ainda dependia do valor antigo — pego antes de qualquer linha escrita, na checagem E12 que precede a implementação da 1.4.

**Como reverter.** Trocar a constante do modelo em `src/app/api/analise/route.ts`. Barato — nenhum dado gravado depende disso.

---

## 2026-08-05 — Bug crítico no validador: data ISO e sigla com dígito rejeitavam parecer correto

**O que mudou.** `validarNumeros` (tarefa 1.4) tinha dois bugs que faziam pareceres **corretos** da Gemini serem rejeitados sistematicamente: (1) data ISO no texto ("2026-07-27") tinha o hífen antes do mês/dia lido como sinal de menos, produzindo "-07" e "-27" que nunca batiam com os componentes de data positivos do conjunto CONTEXTO; (2) a sigla "e1RM" tem um dígito embutido ("1") que o regex de extração capturava como se fosse um número citado pelo modelo. Corrigido: datas ISO são separadas em componentes antes da extração genérica; um dígito com letra imediatamente antes não conta como início de número (lookbehind negativo).

**Por quê.** Achado pelo agente `qa-treino`, persona "Consistente Pesado" — nenhum teste anterior (1.4, 1.5) tinha citado data no formato ISO nem a sigla "e1RM" repetidas vezes no mesmo parecer real. Com um histórico mais rico (16 treinos, 8 sessões por exercício), a Gemini escreveu naturalmente nesses dois formatos, e o validador rejeitou 100% das primeiras tentativas — sempre caindo no fallback determinístico, nunca mostrando o parecer real do LLM.

**Alternativa descartada.** Adicionar os componentes negativos de data ao conjunto branco como "aceitos" — rejeitado porque mascararia a causa raiz (o regex errado) e poderia esconder intrusos reais que coincidem com esses valores pequenos por coincidência.

**Impacto.** Sem essa correção, a peça-assinatura falharia silenciosamente na maioria dos usos reais (qualquer parecer que mencionasse a data do período, algo que o `DESIGN.md` exige no cabeçalho) — o usuário veria só o resumo determinístico, nunca a interpretação da IA. É o tipo de bug que só aparece testando com dado realista, não com fixture pequena.

**Como reverter.** Reverter o commit — os dois testes novos (`validador.test.ts`) travam a correção; removê-los sem reverter a lógica quebraria a suíte silenciosamente no futuro se alguém tentar "simplificar" o regex de volta.

---

## 2026-08-05 — Quota da Gemini medida: 20 req/dia, invalida premissa do ADR-001

**O que mudou.** A tarefa 1.0c (medir a quota real da Gemini) deixou de ser pendência — foi resolvida da forma mais cara possível: o `qa-treino` bateu em `RESOURCE_EXHAUSTED` (HTTP 429) em uso real. Limite medido: **20 requisições/dia** para `gemini-3.6-flash` no free tier. Registrado em `KNOWLEDGE.md` §3.2.

**Por quê isso importa.** O `ADR-001` afirmava "o free tier cobre um usuário com folga, sem teto de gasto" — essa premissa está **errada**. Com 20 req/dia e até 2 chamadas por pergunta (1ª tentativa + retry), sobram ~10 perguntas/dia, contando junto qualquer chamada de desenvolvimento. Isso não é folga, é orçamento apertado — especialmente durante a fase de desenvolvimento/QA, quando o próprio processo de testar consome a mesma quota do uso real.

**Impacto imediato.** A rodada de `qa-treino` (persona "Consistente Pesado" completa, "Irregular" parcial, "Amplo" não iniciada) foi interrompida — sem quota sobrando até o reset diário.

**Decisão pendente, não tomada aqui — é do dono.** Três caminhos possíveis, cada um com trade-off real:
1. **Aguardar o reset diário** e seguir usando `gemini-3.6-flash` no free tier — grátis, mas ~10 perguntas/dia é pouco até para uso normal (5 perguntas da Análise já usam metade, sem folga para retry ou para o coach 24h da Fase 5).
2. **Trocar para um modelo com quota maior** (ex.: `gemini-2.5-flash-lite`, que tinha quota historicamente mais alta) — mais barato/generoso, mas `gemini-2.5-*` aposenta em 16/out/2026 (mesma razão que já descartou `gemini-2.5-flash` como escolha principal).
3. **Habilitar billing** no projeto Google Cloud — sai do free tier, custo real por uso, mas remove o teto de 20/dia.

**Como reverter.** Não há o que reverter — é um fato medido sobre a conta do dono, não uma decisão de código.

---

## 2026-08-05 — Tarefa 1.0d resolvida: botão Análise sempre disponível, sem bloqueio semanal

**O que mudou.** TODO do PRD §3 resolvido: o botão da Análise Semanal fica **sempre disponível** — não bloqueia até a semana ISO fechar (segunda-feira). Nenhuma mudança de código: é exatamente o comportamento já implementado na tarefa 1.5.

**Por quê.** Decisão do dono. Bloquear o botão até segunda-feira significa que um usuário novo não vê **nenhum** parecer nos primeiros dias de uso — pior primeiro contato possível com a peça-assinatura. Manter sempre disponível aceita uma confusão pontual menor (clicar terça e não ver o treino de hoje refletido, porque a semana em andamento nunca entra na Análise) em troca de nunca deixar a tela vazia.

**Alternativa descartada.** "Sempre disponível + aviso de poucos dados" — melhor dos dois mundos, mas exige código novo (detectar semana fechada com poucos dados, mostrar aviso) fora do escopo já fechado da 1.5. Não descartada para sempre — candidata a entrar na Fase 3 (polimento de UI), se o dono achar que a confusão é recorrente na prática.

**Impacto.** Nenhum — código já implementado dessa forma. Só fecha a pendência formal.

**Como reverter.** Se a confusão for real no uso do dia a dia, revisitar como a alternativa descartada acima (Fase 3), não como reversão desta decisão.

---

## 2026-08-05 — Revisão estática do Inspetor QA: 4 bugs reais corrigidos antes do PR da Fase 1

**O que mudou.** Antes de abrir o PR da Fase 1, rodei uma revisão estática de todos os 13 commits (agente Inspetor QA). Ele reportou 8 achados + itens menores. Segui E8 (review é alegação, não verdade) e reproduzi cada achado de severidade alta isoladamente antes de tocar em código — 4 se confirmaram como bugs reais, todos corrigidos nesta rodada:

1. **Fuso horário (UTC vs. Brasília) quebrando a fronteira da semana ISO.** `criarTreino` (`src/lib/dados/treino.ts`) gravava `data = new Date().toISOString().slice(0,10)` — UTC puro. BRT é UTC-3, então um treino feito às 22h de domingo em Brasília (01h de segunda em UTC) era salvo com a data de **segunda**, empurrando o treino pra semana ISO seguinte. O mesmo problema existia em `route.ts` (`agora = new Date()`), afetando qual semana a Análise considera "a última completa". Corrigido com `src/lib/tempo.ts` (`dataLocalBrasil`, `Intl.DateTimeFormat` fixado em `America/Sao_Paulo`) nos dois pontos. Reproduzido e travado por teste (`tempo.test.ts`): 22h de domingo BRT → ainda é domingo.
2. **Validador rejeitava queda percentual sem sinal escrito.** Prosa natural em português ("seu supino caiu 15%") nunca escreve o sinal de menos que existe no `delta_pct` numérico (-15) — o parecer correto virava "intruso". Corrigido expandindo o conjunto de comparação com o módulo de cada valor (`Math.abs`), sem perder especificidade (a magnitude ainda precisa vir do dado real, só o sinal fica livre).
3. **Separador de milhar PT-BR ("12.480") lido como decimal.** `normalizarToken` só troca vírgula por ponto; um volume real de 12480kg escrito como "12.480" virava `12.48` e nunca batia com o dado. Corrigido normalizando o padrão `\d{1,3}(\.\d{3})+` antes da extração genérica (mesma técnica já usada para data ISO).
4. **Exercício sem sessão numa semana virava "estagnado".** `estagnacao.ts` tratava `volume = 0` (nenhuma série naquela semana) como "sem melhora", igual a um exercício realmente treinado sem progresso — violando a Regra da Presença (ausência ≠ valor neutro). Corrigido: `ValoresSemanaisExercicio.volume` agora é `number | undefined` (`undefined` = sem sessão), e `calcularEstagnacoes` filtra semanas ausentes antes de contar o streak.

Também corrigidos, achados menores confirmados por leitura direta (sem precisar de reprodução isolada): texto fixo "rosca alternada" na UI aparecia para **qualquer** exercício unilateral (`formulario-serie.tsx`, generalizado para "Exercício unilateral"); o exercício placeholder de teste `seed.sql` chamava-se "Rosca direta" (nome de exercício tipicamente bilateral) mas estava marcado `unilateral: true` — renomeado para "Rosca alternada".

**Por quê.** Os 4 bugs numerados são da MESMA classe do bug crítico já corrigido na tarefa anterior (validador rejeitando parecer correto / dado numérico mal interpretado) — silenciosos, só aparecem com dado ou cenário realista, e minam diretamente a promessa da peça-assinatura ("cita números e exercícios reais do dono"). O de fuso horário é o mais sério dos quatro: pode fazer um treino sumir da semana certa sem qualquer erro visível.

**Achados NÃO corrigidos, registrados como pendência conhecida (baixa severidade, não bloqueiam o PR):** a Análise não deixa explícito no parecer/UI qual semana está sendo analisada (achados #5/#6 do Inspetor); `grupos_sem_estimulo` sem teto de tamanho (achado #7); boilerplate do Next não customizado em `page.tsx`/`layout.tsx`. Nenhum desses compromete a correção dos números — são polimento, candidatos à Fase 3.

**Como reverter.** Reverter o commit — `tempo.test.ts`, os 2 testes novos em `validador.test.ts` e o T-S3 em `estagnacao.test.ts` travam as 3 correções de lógica; removê-los sem reverter o código quebraria a suíte silenciosamente.

---

## 2026-08-06 — CRUD de treino e série: editar, excluir, com confirmação inline

**O que mudou.** Adição de escopo ao PRD §4.1 (ADIÇÃO, não versão nova — complementa o MVP sem mudar direção): agora dá para **editar uma série**, **excluir uma série** e **excluir um treino inteiro**, cada exclusão atrás de confirmação explícita na tela, nunca `window.confirm()`.

**Por quê.** Registrar sem poder corrigir não é MVP — é armadilha: um peso digitado errado ficava contaminando a Análise Semanal até alguém notar, e não havia como tirar um treino de teste ou duplicado da lista. O dono apontou a falta diretamente ("cadê a opção de apagar o dia de treino?").

**Estado em que este trabalho foi encontrado.** Parte já existia, sem commit, no working tree: `atualizarSerieRemoto`, `excluirSerieRemoto`, `excluirTreinoRemoto`/`excluirTreino` em `src/lib/dados/treino.ts`, os três tipos novos em `TipoMutacao` (`src/lib/offline/db.ts`), e o componente `src/components/excluir-treino.tsx` já pronto. Nada disso estava commitado nem ligado a nenhuma tela — `tsc` não compilava (o mapa de executores da fila offline não cobria os 3 tipos novos, e `buscarTreino` não populava o campo `totalSeries` que a própria confirmação de exclusão precisa). Esta entrada documenta o trabalho **completo**: o que já existia mais o que faltava.

**Decisões tomadas para fechar:**
- **Editar/excluir série entram na MESMA fila offline da criação** (D6) — já decidido por quem começou o trabalho, mantido: é a mesma cena, corrigir um erro no meio do treino, sem sinal.
- **Excluir treino é online-only**, deliberadamente. É ação mais rara, tipicamente feita revendo o histórico com calma — não é a cena que D6 protege.
- **A linha da série inteira é o alvo de edição** (tocar nela abre o formulário), não um lápis pequeno — D1 (dedo suado, sem precisão fina). Só o ícone de excluir é um alvo à parte, com `stopPropagation` para não abrir a edição junto.
- **Editar não pode trocar o exercício** da série — `atualizarSerieRemoto` não aceita `exercicioId`. Mudar a que exercício uma série pertence é operação diferente, fora de escopo aqui.
- **Cor do botão destrutivo:** `--lastro-erro`, cujo comentário em `tokens.css` foi corrigido de "reservado a falha real" para "falha real e ação destrutiva" — esse era o escopo original do token antes da troca de paleta da Fase 3, só não tinha sido usado ainda.

**Alternativa descartada.** `window.confirm()` nativo para a exclusão — mais rápido de implementar, descartado porque no celular é um alerta de sistema, fácil de tocar "OK" sem ler, e não mostra quantas séries somem junto.

**Impacto.** PRD §4.1 e §7 (critérios A11–A13) atualizados. Nenhuma migração nova: o schema já previa isto desde o início (`grant update, delete`, `on delete cascade`, RLS `for all`) — só a camada de aplicação faltava.

**Como reverter.** Reverter o commit desta entrada. Os testes de `outbox.test.ts` foram atualizados para cobrir os 3 executores novos — removê-los sem reverter o código quebraria a suíte silenciosamente.

---

## 2026-08-06 — Stack real diverge do ADR-004: Serwist e Playwright nunca adotados

**O que mudou.** Nada no código — esta entrada só registra um drift que já existia e nunca tinha sido documentado. `ADR.md` (ADR-004) decidiu **Serwist** para o service worker e **Vitest + Playwright** para testes. O que foi construído: um `public/sw.js` **hand-rolled mínimo** (install/activate/fetch passthrough, sem estratégia de cache — suficiente pra passar o critério de instalabilidade do PWA) e **só Vitest**, sem nenhum teste E2E.

**Por quê registrar agora.** `ADR.md` é append-only — a entrada original não se apaga nem se reescreve. Mas `ARCHITECTURE.md` (snapshot vivo) e `CLAUDE.md` (índice) citavam Serwist e Playwright como se estivessem em uso, o que é falso. Um agente novo lendo esses arquivos tentaria integrar Serwist a um service worker que não o usa.

**Alternativa descartada.** Reescrever a entrada do ADR-004 para "corrigir" — descartado porque viola a própria regra do documento (decisão nova é entrada nova). Esta entrada é a correção, não uma edição da original.

**Impacto.** Nenhum funcional. `ARCHITECTURE.md` e `CLAUDE.md` foram corrigidos para descrever a stack real, com nota apontando pra cá.

**Decisão pendente, não tomada aqui — é do dono:** adotar Serwist de verdade (o SW mínimo não tem estratégia de cache — funciona, mas não é robusto) e escrever os primeiros E2E com Playwright são candidatos à Fase 6 (Integração final), não urgência.

**Como reverter.** Não há o que reverter — é registro de um fato sobre o código, não uma mudança nele.

---

## 2026-08-07 — CSS responsivo cai da lista; barra superior fixa entra; regra de platô do gráfico separada do PRD §10

**O que mudou.** Três decisões do dono, resolvendo a tensão registrada em `PROGRESS.md` (pendência 3):

1. **CSS responsivo pra tablet/desktop — cancelado.** Confirmado: a direção é 100% mobile, a tarefa registrada antes da Fase 3 foi superada pela decisão da barra inferior fixa. Não entra mais na lista de pendências.
2. **Barra superior fixa — nova tarefa.** Além da aba inferior (`position: fixed` + `env(safe-area-inset-bottom)`), a barra superior também fica fixa, com `env(safe-area-inset-top)` equivalente.
3. **Regra de platô do gráfico de progressão (§3.7 item 3) é descritiva, separada do limiar clínico do PRD §10.** O gráfico precisa de tracejado + anotação "há quantas semanas" pra passar o gate G6, mas o `N` de semanas de estagnação clínica (PRD §10) segue TODO, sem número inventado — como já era o precedente do projeto (peso corporal, entrada de 2026-08-04). São perguntas diferentes: o gráfico descreve o que os pontos mostram; o PRD §10 é o limiar que a Análise usa pra aconselhar ação.

**Valor da regra descritiva, definido pelo dono após pesquisa (fontes: RITFit, FitnessAI, Carbon Performance, Barbell Medicine — convergem em 3-4 semanas sem melhora mensurável como o limiar comum de plateau; nenhuma dá % de tolerância, que é convenção de app):** **3 semanas consecutivas com variação de e1RM/volume dentro de 2% contam como platô.**

**Por quê.** O gate visual (G6, `DESIGN.md` §4.1) bloqueia merge sem o platô desenhado — não dá pra esperar pesquisa clínica pra entregar a Fase 3. Separar as duas perguntas evita tanto inventar o `N` clínico (E3 — dado de saúde sobre o qual a Análise daria parecer) quanto travar o gráfico indefinidamente.

**Alternativa descartada.** Esperar a pesquisa do PRD §10 antes de desenhar platô — descartado pelo dono porque bloqueia toda a Fase 3 por um número que serve a um propósito diferente (aconselhamento clínico, não descrição visual).

**Impacto.** Gráfico de progressão pode ser construído agora. PRD §10 continua aberto — não foi resolvido, só desacoplado do gráfico.

**Como reverter.** Trocar o par (3 semanas, 2%) por outro é barato — é constante isolada, não decisão estrutural. Se o PRD §10 depois definir um `N` clínico e o dono quiser unificar as duas regras, é decisão nova, não edição desta.

---

## 2026-08-07 — Gráfico de progressão: escopo, implementação, métrica única (e1RM)

**O que mudou.** Duas decisões de escopo do dono, mais a implementação:

1. **Onde o gráfico mora:** dentro de `/analise`, como companhia visual do parecer da semana — não uma rota nova, não dentro do catálogo. Alternativas descartadas: rota dedicada `/progresso` com seletor (mais flexível, mas sem lugar óbvio na navegação de 5 abas); dentro do catálogo por exercício (amarra o gráfico à dica de execução, que é conteúdo estático, não a leitura semanal).
2. **Métrica plotada:** só **e1RM** por semana, não volume. `PRD.md` §4.2 pede os dois; e1RM foi escolhido por responder mais diretamente "está subindo minha força" (a pergunta que `DESIGN.md` §3.7 declara como a que o gráfico existe pra responder). Volume por exercício fica de fora desta entrega — extensível depois, é aditivo.
3. **Seleção do exercício:** sem seletor explícito na primeira decisão do dono — implementado com seletor (seleciono automaticamente o exercício com mais sessões nas últimas 12 semanas como padrão, com `<select>` pra trocar). Não replica a lista `tendencia_e1rm` do agregador (SDD, Fase 1) exatamente — evita acoplar o gráfico ao pipeline que alimenta o LLM; é uma leitura própria, mais simples, sobre o mesmo dado bruto.

**Peças novas:** `src/lib/analise/progressao.ts` (`calcularSeriesSemanais`, `detectarPlato` — puras, 11 testes) · `src/lib/dados/progressao.ts` (`carregarProgressao`, server, mesmo padrão de `resumo-home.ts`) · `src/app/api/progressao/route.ts` · `src/components/grafico-progressao.tsx` (Recharts, instalado nesta entrada — não estava no `package.json` apesar do ADR-004 já ter decidido por ele) · CSS em `sistema.css` (`.grafico-progressao*`). `npx tsc --noEmit`, `npm run test` (77 passando), `npm run lint`, `npm run build` — todos verdes.

**Achado à parte, não resolvido aqui:** `limiares.ts` já tem `SEMANAS_ESTAGNACAO = 4` e `FAIXA_SERIES_SEMANAIS = [10, 20]` marcados como "RESOLVIDO" (comentário cita SDD §4.2 escolhendo um ponto dentro da faixa de `KNOWLEDGE.md`), mas `PRD.md` §10 e `PROGRESS.md` (pendência 6) ainda listam os dois como TODO — "assunto de saúde, fonte primária pesquisada, não número de memória". A implementação já usa os valores da SDD em produção; o PRD nunca foi atualizado pra refletir isso, nem a pesquisa de fonte primária que o PRD exige foi feita. Fica registrado — é uma divergência real entre o que o PRD promete e o que o código faz, mas mexer nela é fora do escopo desta tarefa (o dono não pediu, e são números que já estão em uso na Análise real).

**Impacto.** `DESIGN.md` §3.7 tem entregável de código. Falta só o gate visual G6 (`DESIGN.md` §4.1) em navegador real — telas atrás de login, é o dono quem executa, mesma ressalva já registrada para `/treino` e `/analise`.

**Como reverter.** Componente e rotas são aditivos — remover `<GraficoProgressao />` de `analise/page.tsx` tira o gráfico da tela sem quebrar nada. `recharts` fica como dependência não usada se isso acontecer.

---

## 2026-08-07 — Gate G6/C10/C11 do gráfico rodado contra dado real (usuário QA efêmero)

**O que mudou.** O dono autorizou duas exceções pontuais às regras padrão pra fechar a verificação do gráfico de progressão: (1) criar um usuário de teste real no Supabase hospedado via `qa-treino-helper.sh criar-usuario` (mecanismo já existente no repo, usado pelo agente `qa-treino`); (2) inserir 6 semanas de série de teste pra esse usuário via SQL direto (`do $$ ... $$`), depois que ficou claro que a UI não permite registrar treino com data retroativa (`criarTreino()` em `src/lib/dados/treino.ts:216` sempre usa a data de hoje — registrar pela tela só dava pra criar 1 sessão por dia real).

**Achado de processo:** a primeira tentativa de verificar contra `https://lastro-pi.vercel.app` deu 404 em `/api/progressao` — a produção roda `main`, não o branch `feat/grafico-progressao` (nunca foi deployado). A verificação real só foi possível contra `npm run dev` local, que aponta pro MESMO projeto Supabase hospedado (`.env.local`), então o dado é real, só a aplicação é que rodou local.

**Resultado do gate (dado real, não sintético):** delta 22/06→27/07 = 14.3% (conferido à mão), platô detectado exatamente nas 3 semanas mais recentes (92.1/92.5/91.5 kg — variação 1.09% < 2%), rótulos diretos no primeiro/último ponto presentes, linha de referência "melhor marca" correta (92.5 kg = máximo real), alternativa textual completa em `role="list"` fora do gráfico, cada ponto focável por teclado com `aria-label` (K6), sem sobreposição barra-de-topo/conteúdo em 360×640 nem 390×844 (medido via `getBoundingClientRect`, não estimado), traço do platô com `stroke-dasharray="6 5"` real renderizado (distinção não depende só de cor).

**Achado não corrigido:** `DESIGN.md` §4.2 (C10, C11) declara contraste esperado de 8.59 e 9.86 pros pares plato/sup-1 e alta/sup-1. Medido agora com a fórmula WCAG contra os tokens reais (`--lastro-plato: #8A5A0B`, `--lastro-alta: #1B6B3A`, `--lastro-sup-1: #FBF8F3`): **5.59 e 6.17** — os dois ainda passam o limiar de reprovação (3.0), mas a tabela do doc não bate com o CSS atual. Não fica claro se o doc nunca foi atualizado depois de uma mudança de cor, ou se a medição original tinha um erro. Fica registrado, sem correção — não foi pedido e os dois pares continuam dentro do limite de aceitação.

**Impacto.** Gráfico de progressão passa no gate G6/C10/C11 com dado real. Usuário e séries de teste foram removidos (`limpar-usuario`, cascade = 0 linhas confirmado) — nenhum resíduo no banco de produção.

**Como reverter.** Nada a reverter — verificação, não mudança de código.

---

## 2026-08-07 — Inspetor-qa no PR #12: 4 achados corrigidos, sem gap de segurança

**O que mudou.** Rodada de revisão em contexto limpo (papel `inspetor-qa`) contra o diff do PR #12, antes do merge na main. 4 achados reais, todos corrigidos:

1. **Rótulo do último ponto sumia no caso comum (sem platô).** `rotularExtremos` estava preso à linha errada — a de platô, que fica vazia quando não há platô. Corrigido: uma função única de rótulo, presente nas duas `<Line>`, que só desenha onde o índice bate E a linha tem valor ali.
2. **Peso 0 (assistida sem carga externa) quebrava a matemática.** `(atual − 0) / 0` é `Infinity`; texto virava "e1RM subiu Infinity%". No platô, `0/0` é `NaN`, e `NaN > tolerância` é `false` em JS — um histórico todo em 0 passava como platô válido por acidente, não por decisão. Corrigido nos dois lugares: delta vira valor absoluto em kg quando a base é 0; platô só aceita extremos exatamente 0, qualquer variação a partir de 0 reprova.
3. **"Melhor marca" implicava recorde histórico, mas só olhava as 12 semanas do gráfico** — divergindo do PR real que `prs.ts` já calcula em outro lugar do app (P7: duas fontes de verdade pro mesmo conceito). Não unifiquei as duas (mudança maior, fora de escopo) — só corrigi o rótulo pra dizer "no período", que é o que o número de fato mede.
4. **Exercício padrão do seletor ignorava a janela de 12 semanas mostrada.** Escolhia por sessões no histórico TODO; um exercício treinado por um ano e parado há 4 meses abria a tela em "dados insuficientes" mesmo com outro exercício ativo essa semana. Corrigido: o padrão agora prioriza sessão dentro do período visível, com fallback pro histórico todo só se nenhum exercício tiver sessão recente nenhuma.

**Passe de segurança (obrigatório por ser endpoint público novo):** sem achado. Auth por `getUser()` antes da query, RLS por `auth.uid()` em `treino`/`serie`, `exercicioId` de entrada neutralizado pela própria filtragem por usuário, sem vazamento de mensagem de erro do Supabase.

**Impacto.** 79 testes (2 novos, cobrindo o platô em peso 0). `tsc`/`test`/`lint`/`build` verdes de novo depois da correção.

**Como reverter.** Cada achado é um guard isolado — reverter qualquer um sozinho não derruba os outros.

---

## 2026-08-07 — Formulário de série sempre começa em branco (achado do dono)

**O que mudou.** `FormularioSerie` (`src/components/formulario-serie.tsx`) pré-selecionava `exercicios[0]` (o primeiro em ordem alfabética) e `tipo: "valendo"` assim que abria — o dono reportou que o botão pra abrir o formulário na primeira série do treino dizia "Outra série" (implicando que já existia uma) e o exercício vinha com um já marcado sem a pessoa escolher. Os dois campos agora começam em `""`, com `<option disabled>` de placeholder e `required` nativo — o navegador bloqueia o envio até a pessoa escolher os dois de propósito. `treino-detalhe.tsx` também: o botão só diz "Outra série" quando já existe pelo menos 1 série no treino; antes disso diz "Adicionar exercício".

**Por quê.** Pré-selecionar o primeiro exercício por ordem alfabética nunca teve relação com o que a pessoa ia treinar — e vai piorar assim que o catálogo crescer de 5 pra ~80-100 exercícios (próxima tarefa): o primeiro em ordem alfabética vira ruído ainda mais aleatório.

**Verificado:** usuário QA efêmero, fluxo completo — treino novo abre com "Adicionar exercício"; formulário abre com os dois selects em branco (`checkValidity() === false`, bloqueia envio); depois de registrar 1 série, o botão passa a dizer "Outra série". `tsc`/`test` (79 passando)/`lint`/`build` verdes. Usuário removido ao final.

**Alternativa descartada.** Manter o exercício pré-selecionado só entre séries CONSECUTIVAS do mesmo exercício (conveniência real: bater várias séries seguidas do mesmo exercício sem reselecionar) — na prática já é o comportamento resultante, porque o `<select>` é controlado e não reresene sozinho no `formulario.reset()` nativo. Só a primeira abertura do formulário (sem nenhuma série ainda) força a escolha.

**Impacto.** Nenhuma migração — é comportamento de formulário, não schema.

**Como reverter.** Voltar `useState(exercicios[0]?.id ?? "")` e `useState("valendo")`, e o `?  "Outra série"` incondicional em `treino-detalhe.tsx`.

---

## 2026-08-07 — Catálogo amplo: 87 exercícios, 3 grupos musculares novos

**O que mudou.** `supabase/migrations/0003_catalogo_amplo.sql`, aplicada no Supabase hospedado (`npx supabase db push --linked`): 82 exercícios novos + os 5 de teste que já existiam = **87 exercícios**, cobrindo 10 grupos musculares. Três grupos novos saem de dentro de "pernas" (que cobria tudo sob o id `quadriceps`): **glúteo, posterior de coxa, panturrilha**. O `nome` do grupo `quadriceps` mudou de "Pernas" pra "Quadríceps" — fazia sentido como rótulo genérico antes da separação, não faz mais.

**Escopo, decidido com o dono:**
1. Catálogo **genérico amplo** (~80-100), não a rotina pessoal dele — diferente do que `SDD.md` §3.5 original previa ("os 10-15 exercícios que o dono faz", TODO bloqueado). Essa mudança de escopo é do dono, registrada aqui porque diverge do documento original.
2. Separar glúteo/posterior de coxa/panturrilha de "pernas".
3. `dica_execucao` fica `NULL` em toda linha nova — **não escrevi nenhuma**. FF7/ADR-007 é claro: dica de execução é conteúdo curado por humano, nunca gerado por LLM, mesmo que eu pesquise fontes reais. Isso conta como "gerado" de qualquer forma. A tela do catálogo já trata "sem dica" como estado honesto (87 de 87 exibem "Dica de execução ainda não escrita.").

**Por quê este método (migração + `db push`), não `seed.sql`.** O projeto abandonou Postgres local (`DECISIONS.md` 2026-08-04) — só existe o banco hospedado. `seed.sql` nunca roda contra ele; só migração aplica. Atualizei o cabeçalho de `seed.sql` pra não afirmar mais "isto não é o catálogo real" (falso agora) sem prometer que o arquivo *é* o catálogo real (também falso — ele é fixture mínima pros testes do agregador, propósito diferente).

**Verificado:** usuário QA efêmero (criado e removido) — `/catalogo` lista os 87 em 10 seções por grupo, com `UNILATERAL` marcado corretamente nos que contam reps por lado; o seletor de exercício em `FormularioSerie` mostra as 87 opções (88 com o placeholder). Contagem por grupo conferida via SQL direto no banco.

**Impacto.** Nenhum código tocado — só dado. `tsc`/`test`/`lint`/`build` continuam verdes (nada mudou de comportamento de app).

**Como reverter.** `delete from exercicio where criado_em > '2026-08-07'` reverteria as linhas novas (não as 5 de teste antigas, que são anteriores). Reverter os grupos musculares novos exigiria primeiro mover ou apagar os exercícios que os referenciam (FK).

---

## 2026-08-07 — Seleção de grupo muscular antes da lista de exercícios

**O que mudou.** `src/components/seletor-grupo-muscular.tsx` (novo) — antes de `FormularioSerie` aparecer, a pessoa escolhe um ou mais grupos musculares ("peito e ombro", "só perna"); a lista de exercícios do formulário filtra só pelos grupos escolhidos. `treino-detalhe.tsx` guarda a escolha em estado de sessão (`gruposEscolhidos`) — some "Trocar grupo" pra resetar, mas fechar/reabrir o formulário ("Outra série") mantém a escolha, não pergunta de novo a cada série. `treino/[id]/page.tsx` trocou `listarExercicios()` por `listarCatalogo()` pra ter o nome do grupo (não só o id).

**Por quê não persistido no banco.** O app não prescreve programa (PRD §5, escopo negativo) — a escolha vive só no estado do componente, se recarregar a página ela some. É conveniência de tela pra filtrar 87 exercícios, não um plano salvo.

**Verificado:** usuário QA efêmero (criado e removido) — seletor aparece com os 10 grupos, começa sem nada marcado (mesma regra do formulário, 2026-08-07 "sempre iniciar em branco"); marcar Peito+Ombro filtra o `<select>` de 87 pra exatas 22 opções (12+10); "Trocar grupo" volta ao seletor; registrar série e reabrir "Outra série" pula direto pro formulário com o grupo ainda escolhido. `tsc`/`test` (79)/`lint`/`build` verdes.

**Nota de processo:** ficou só no branch local, sem PR, por pedido explícito do dono — mergeada depois que ele revisou (2026-08-07, mesmo dia).

**Impacto.** Muda o fluxo de "adicionar exercício" em `/treino/[id]` — primeira vez por sessão pede grupo antes do exercício.

**Como reverter.** Reverter o commit — sem migração, sem dado tocado.

---

## 2026-08-07 — Treino vazio não conta em nada (achado do dono, QA manual)

**O que mudou.** Três correções relacionadas, achadas testando manualmente pelo Chrome:

1. **`criarTreino()` reaproveita o treino de hoje em vez de duplicar.** Antes, cada clique em "Iniciar treino de hoje" inseria uma linha nova em `treino`, mesmo se já existisse uma pra hoje sem nenhuma série. `src/lib/dados/treino.ts` agora consulta antes de inserir — se já existe treino de hoje, só redireciona pra ele.
2. **`/treino` (Bancada) ficou sem checagem, ao contrário da home.** A home (`src/app/page.tsx`) já mostrava "Continuar treino de hoje" condicionalmente, mas `src/app/treino/page.tsx` sempre oferecia "Iniciar treino de hoje" como form estático, não importa o estado — clicar de novo criava outro treino vazio. Agora ela faz a mesma checagem da home e mostra "Continuar" quando já existe.
3. **Treino sem nenhuma série não conta em `carregarResumoHome` (`src/lib/dados/resumo-home.ts`).** `treinosNaSemana`, `recentes` e `semanasFechadasComTreino` agora filtram por `(t.serie?.length ?? 0) > 0` antes de contar. `treinoDeHojeId` continua sem filtro — é o link de "continuar", precisa existir mesmo vazio.

**Por quê.** O dono descreveu exatamente o sintoma: "toda hora eu clicar em iniciar treino mas não ter adicionado nada, contar, isso não deveria existir." Um treino vazio criado por clique acidental (ou por reabrir a tela sem lembrar que já tinha começado) não é um treino feito — não devia aparecer em "treinos recentes" nem inflar "Treinos: N" da semana.

**Verificado:** usuário QA efêmero — cliquei "Iniciar treino de hoje" na Bancada, voltei pra Bancada sem adicionar nada: já mostrava "Continuar treino de hoje" (não "Iniciar" de novo), e o link levava pro MESMO id. Conferido direto no banco: só 1 linha em `treino`, 0 séries. Home mostrava "Treinos: 0" e "Nenhum treino ainda" em recentes, mesmo com o treino vazio existindo. `tsc`/`test` (79)/`lint`/`build` verdes.

**O que NÃO mudei:** `listarTreinos()` (histórico completo em `/treino`) continua mostrando treinos vazios — de propósito, pra o dono conseguir ver e apagar um treino vazio que sobrou (via `ExcluirTreino`, já existente). Escondê-lo ali também deixaria um resíduo órfão sem jeito de limpar pela UI.

**Pergunta em aberto, não resolvida aqui:** o dono também relatou "a página já deve abrir no início, ela tá abrindo em bancada" — não encontrei a causa (manifest `start_url` é `/`, login por e-mail redireciona pra `/`). Pode ser resíduo de sessão de teste anterior, ou outro fluxo específico. Fica pendente até o dono detalhar quando exatamente isso acontece.

**Impacto.** Muda o que "conta" como treino feito nas estatísticas da home — sem migração, sem mudança de schema.

**Como reverter.** Reverter o commit — os três pontos são independentes, mas foram feitos juntos por serem sintoma do mesmo achado.

---

## 2026-08-07 — PWA instalado sempre abre em Início, nunca retoma a última tela

**O que mudou.** A pergunta em aberto da entrada anterior tinha causa: `manifest.webmanifest`/redirects de login já apontavam certo pra `/`, mas `start_url` só vale no **primeiro** lançamento do PWA depois de instalado — Chrome/Android, depois disso, costuma **restaurar a última página** ao reabrir o ícone (mesmo comportamento de restaurar aba, não é bug do app). `src/components/forcar-inicio-no-lancamento.tsx` (novo, montado no layout raiz) força `window.location.replace("/")` quando: (a) o app está rodando em modo instalado (`matchMedia("(display-mode: standalone)")`) e (b) a rota atual não é `/`, `/login` nem `/auth/callback`.

**Por quê funciona sem também disparar em navegação interna.** O `useEffect` que faz a checagem roda uma vez por **carregamento de documento** — lançar o ícone do PWA, F5, aba nova — porque o layout raiz do App Router **persiste** entre rotas; clicar num `<Link>` dentro do app nunca remonta o layout raiz, então nunca reexecuta o efeito. É a distinção exata que se precisava: só no lançamento "frio", nunca ao navegar dentro do app já aberto.

**Decisão explícita do dono, com o risco declarado antes:** perder a conveniência de "reabrir o ícone continua o treino em andamento" — o dono confirmou que quer sempre abrir em Início, mesmo perdendo isso.

**Verificado:** lógica do guard testada isoladamente (roda em standalone + rota não-isenta → true; roda fora de standalone → false; roda em `/login` mesmo em standalone → false). Navegação normal (sem standalone) confirmada sem regressão — `/catalogo` sem sessão ainda bounce pro `/login` normalmente. **Não verificado com o PWA de fato instalado num aparelho** — `matchMedia("standalone")` só é `true` fora do navegador comum; fica para o dono confirmar no celular.

**Impacto.** Componente novo, sem tocar rota nem dado. Só age quando `display-mode: standalone` é verdadeiro (nunca em navegador comum).

**Como reverter.** Remover `<ForcarInicioNoLancamento />` de `src/app/layout.tsx` — o componente é aditivo.

---

## 2026-08-07 — Perfil do usuário (nome, foto): tabela dedicada, trigger, avatar do Google baixado para Storage

**O que mudou.** PROGRESS.md pendência 4, adiantada a pedido do dono (estava marcada pra "próxima fase"). Cinco decisões de escopo fechadas com o dono antes de codar:

1. **Cadastro por e-mail passa a exigir nome** (campo obrigatório, novo em `/login`) — antes só pedia e-mail/senha.
2. **Exibição:** barra de topo de toda tela logada (`/`, `/treino`, `/treino/[id]`, `/analise`, `/catalogo`, `/coach`), não só uma.
3. **Persistência:** tabela `public.usuario` nova (migração `0004_perfil_usuario.sql`), não `user_metadata` do Auth — mais correto se o perfil crescer, e mantém a mesma disciplina de RLS por `auth.uid()` (FF5) que o resto do schema já segue.
4. **Foto do Google:** baixada e re-hospedada no bucket `avatares` (Supabase Storage), nunca hotlink direto pra `avatar_url` do Google — evita quebrar se a política de acesso do Google mudar.
5. **Sem foto (cadastro por e-mail):** iniciais do nome. Upload manual de foto própria foi pedido em seguida, mas **adiado explicitamente pelo dono** pra depois — vira PROGRESS.md pendência 13, não construído agora.

**Trigger, não código de aplicação, cria a linha de perfil.** `usuario_cria_perfil()` roda `AFTER INSERT ON auth.users`, lê `raw_user_meta_data->>'full_name'` (Google) ou `->>'nome'` (e-mail, passado via `options.data` no `signUp`), com fallback pro local-part do e-mail se nenhum dos dois existir. **`SECURITY DEFINER`, de propósito — e isso diverge do trigger `serie_herda_usuario` da migração 0001, que é deliberadamente SEM definer.** A diferença: `serie_herda_usuario` depende de rodar sem privilégio elevado pra que a RLS de `treino` bloqueie inserir série em treino alheio; `usuario_cria_perfil` não tem esse papel de guarda — ele só espelha o cadastro pra uma tabela de perfil, e sem definer o insert falharia sempre (a sessão do signup ainda não existe no instante em que a linha de `auth.users` é gravada). Um `coalesce` de 3 níveis garante que o trigger nunca lance exceção — um trigger que aborta em `auth.users` derruba o signup/OAuth inteiro, não só a criação do perfil.

**Achado real que teria vazado pra produção sem ele — backfill de conta pré-existente.** O trigger só dispara em conta **nova**; a conta real do dono (Google, verificada na tarefa 2.1) já existia antes desta migração e não passaria pelo trigger nenhuma vez. Sem um `insert ... on conflict do nothing` cobrindo `auth.users` inteiro, o dono seria o único a ver a barra de topo quebrada (nome vazio) — e qualquer usuário de QA efêmero criado **depois** da migração passaria pelo trigger normalmente, escondendo o buraco atrás de um teste verde. Aplicado e conferido: as 3 contas reais que já existiam (`gabrielcartaxomerces@gmail.com`, `fazinrodrigo@hotmail.com`, a do dono) ganharam linha em `public.usuario` com nome vindo do metadado real (`full_name` quando existia, local-part do e-mail quando não).

**Bucket `avatares` é PÚBLICO — decisão explícita, não default silencioso.** Diverge da postura "RLS em tudo" do resto do projeto (FF5): foto de perfil não é dado sensível como série/treino, e público evita assinar URL a cada render da barra de topo (a barra renderiza em toda página logada). Escrita continua restrita a `{auth.uid()}/...` via policy em `storage.objects`; só a leitura é aberta. `delete from auth.users` cascade não alcança Storage — excluir uma conta deixa o arquivo de avatar órfão no bucket. Aceito como está; não construída limpeza automática pra isso (custo desproporcional a um app de 1-3 usuários).

**O download do avatar do Google não pode derrubar login.** `sincronizarAvatarGoogle()` (`src/lib/dados/perfil.ts`) roda dentro do `/auth/callback` **depois** da troca de código por sessão, envolta em try/catch que só loga — se o Google estiver fora do ar ou a URL der 404, o dono ainda consegue entrar, só fica sem foto. Gated por `avatar_url is null`: não baixa de novo a cada login.

**Verificado, não só relatado (E8):**
- `npx tsc --noEmit` limpo · `npx vitest run` 79/79 · `npm run lint` 0 erros · `npm run build` limpo.
- Migração aplicada no banco hospedado (`npx supabase db push --linked`, `migration list` confirma local=remote=0004).
- Backfill: `auth.users` = `public.usuario` = 3, antes e depois de qualquer teste.
- FF5 estendido: `usuario` passa o mesmo check de `scripts/ff5-rls.sql` (RLS ligada + policy referenciando `auth.uid()` de fato).
- Trigger com dado real da aplicação (não só via SQL direto): cadastro pela UI real (`/login`, campo Nome = "QA Perfil Teste") gravou exatamente esse nome na linha criada pelo trigger, conferido no banco.
- UI real, sessão real (usuário QA efêmero, e-mail): barra de topo de `/treino` renderizou o avatar de iniciais ("Q", do local-part do e-mail de teste, sem nome). Contraste **medido** via `getComputedStyle` (não lido do design system): pior caso do gradiente da barra dá 6.72:1 entre o texto das iniciais e o fundo do círculo — acima do piso AA de 4.5:1. Círculo 48×48 (`--lastro-alvo-min`), `border-radius: 50%`, sem token novo inventado.
- Cascade: `delete from auth.users` levou a linha de `public.usuario` junto nos dois usuários de teste — contagem voltou a 3=3 nos dois casos.
- Limpeza: os 2 usuários de teste (um via `signUp` real da UI, outro via `qa-treino-helper.sh`) removidos, confirmado por contagem.

**Não verificado — só o dono pode fazer isso.** O caminho de download do avatar do Google (`sincronizarAvatarGoogle`) nunca disparou numa verificação real: usuário de QA é sempre criado por e-mail (sem `avatar_url` do Google no metadado), e forjar isso por SQL não prova que o `fetch()` real contra a URL do Google funciona. Fica pendente até o dono logar de novo com a conta Google real — PROGRESS.md pendência 4 registra isso como o primeiro lugar a olhar se a foto não aparecer.

**Alternativas descartadas.** `user_metadata` do Supabase Auth em vez de tabela — mais simples, mas menos flexível se o perfil crescer, e o dono preferiu a tabela. Hotlink direto da `avatar_url` do Google em vez de baixar pro Storage — mais simples, mas frágil a mudança de política do Google; o dono escolheu o caminho mais robusto. Ícone genérico em vez de iniciais pro estado "sem foto" — o dono preferiu iniciais.

**Impacto.** Schema novo (`public.usuario`), bucket novo (`avatares`), trigger novo em `auth.users` (afeta todo signup/OAuth futuro, verificado que não quebra nenhum). `criarContaComEmail` ganhou parâmetro `nome` — assinatura mudou, únicos chamadores são `login/page.tsx`. `app/analise/page.tsx` e `app/coach/page.tsx` viraram Server Components (extraída a parte interativa pra `components/analise-interativa.tsx` e `components/coach-interativo.tsx`) — necessário pra buscar o perfil com `cookies()` antes de renderizar a barra de topo; Client Component não importa Server Component diretamente.

**Como reverter.** Reverter o PR. Sem migração `down` escrita (convenção do projeto até aqui) — reverter o schema exigiria uma migração nova que dropasse `public.usuario`, o bucket `avatares` e o trigger, mantendo `auth.users` intocado.

---

## 2026-08-07 — Perfil do usuário: "Sair" movido pra Início; Google verificado em produção

**O que mudou.** Dois achados do dono, no mesmo dia do PR de perfil (`#18`, mergeado em `main`):

1. **Barra de topo não estava padronizada** — "Sair" vivia na tela Bancada (`/treino`), sem relação com o que a tela faz. Movido pra Início (`/`), a porta de entrada única do app desde 2026-08-06 — é de lá que faz sentido sair. Bancada passou a mostrar só o avatar, igual às telas sem ação secundária (Análise, Catálogo, Coach).
2. **Login com Google não funciona em preview do Vercel** — testado ao tentar verificar o avatar antes do merge: o redirect OAuth configurado no Supabase aceita só `localhost:3000` e o domínio de produção, não o domínio dinâmico de preview por branch (`lastro-git-<branch>-audicon.vercel.app`). O clique em "Entrar com Google" no preview termina em `localhost:3000/?code=...`, que não existe pra fora da máquina do dono. **Login por e-mail não é afetado** — só OAuth depende do redirect registrado.

**Por quê o Google só pôde ser verificado depois do merge.** A pendência do PR original ("caminho do Google não verificado, exige o dono") não era só falta de oportunidade — era um bloqueio de infra real: nenhum ambiente de preview jamais completaria esse login enquanto o Supabase não tiver esse domínio na allowlist. Confirmar isso antes de insistir em testar no preview evitou repetir a tentativa em vão.

**Verificado, com o dono, em produção real (`lastro-pi.vercel.app`), depois do merge:** login com a conta Google real do dono completou; `avatar_url` do Google foi baixada e re-servida do bucket próprio — `read_network_requests` confirmou `GET .../storage/v1/object/public/avatares/{uid}/avatar.jpg` → **200**. Avatar (a foto real, não iniciais) renderizado na barra de topo de `/` e `/treino`, com "Sair" agora só em `/`. Última pendência da tarefa 4 fechada.

**Alternativa descartada.** Adicionar o domínio de preview à allowlist do Supabase só pra viabilizar este teste — rejeitado: a allowlist de redirect é superfície de segurança do OAuth (E3-adjacente, mexe em auth), e o domínio de preview muda a cada branch — manter isso atualizado seria trabalho permanente por um teste pontual. Testar direto em produção, depois do merge, foi mais barato e não abre superfície nova.

**Impacto.** Nenhuma mudança de schema. `src/app/page.tsx` ganhou o formulário de `sair`; `src/app/treino/page.tsx` perdeu. Achado de infra (redirect OAuth) é só conhecimento registrado — nada mudou na configuração do Supabase.

**Como reverter.** Reverter o commit — os dois achados são independentes, mas foram registrados juntos por terem saído da mesma rodada de QA.

---

## 2026-08-07/08 — Polish visual reativo por print (branch `fix/consistencia-visual-telas`) — pausado, troca de abordagem decidida pelo dono

**O que mudou.** O dono relatou insatisfação visual genérica ("muita coisa desalinhada, espaçamento errado, telas repetidas") e pediu uma passada de design. Em vez de acionar `diretor-arte` (que já existe em `.claude/agents/`, dono de `DESIGN.md`), a sessão rodou a skill externa `impeccable` num subagente Sonnet 5 (auditoria de código) seguida de correção reativa, tela por tela, a partir de prints reais do celular do dono — não de uma auditoria completa contra `DESIGN.md`.

**Corrigido e commitado nesta branch (2 commits, não mergeados):**
1. `barra-topo__titulo` não quebra mais em 2 linhas (`white-space: nowrap` + `text-overflow: ellipsis`, wrapper `barra-topo__info` com `min-width: 0`) — corrige o vazamento de conteúdo atrás do cabeçalho `fixed` na tela "Treino em andamento", único título longo o bastante pra quebrar em 375px.
2. Respiro entre rótulo de data e título: `--lastro-e-1` (4px) → `--lastro-e-2` (8px).
3. `.metrica__rotulo` (cards "Esta semana") ganhou `min-height: 2.6em` pra igualar a altura dos 3 rótulos e alinhar os números — **medido, não só lido**: os 3 `top` de `.metrica__valor` ficaram idênticos (369.75px) contra um usuário QA efêmero.
4. `.selecao-grupos` (chips de grupo muscular) virou `grid-template-columns: 1fr 1fr` em vez de `flex-wrap` com largura de conteúdo — **medido**: os 10 chips ficaram com exatamente 162px cada, 2 colunas alinhadas.
5. (De um subagente anterior, mesma branch) 3 literais fora de token migrados pra `tokens.css`: cor do avatar de iniciais, cor do botão destrutivo, tamanho de fonte do gráfico de progressão.

**Não corrigido — reportado pelo dono como ainda errado no último print (2026-08-08):** o card "Séries valendo" segue desalinhado mesmo depois do fix #3. Hipótese não verificada: a altura TOTAL dos 3 cards ainda diverge porque só "Volume" tem a linha extra de unidade (`kg`) abaixo do número — igualar a altura do rótulo não iguala a altura do card inteiro. Não investigado a fundo.

**Não mudado, decisão pendente do dono:** o zero pontuado do IBM Plex Mono (`--lastro-fonte-num`), sinalizado 2x pelo dono como visualmente ruim. `DESIGN.md` §3.3 documenta a fonte como escolha deliberada (superfamília com Plex Sans, avanço tabular monoespaçado, pré-cache offline via Serwist) — trocar reabre uma decisão de identidade e mexe no cache do PWA. Controller recusou trocar sem confirmação explícita do dono especificamente sobre isto.

**Por que a abordagem foi pausada.** O dono identificou que o ciclo print→fix→print estava encontrando problema novo a cada rodada sem convergir, e que a skill `impeccable` (auditoria só de código, sem olho no navegador real) não estava rendendo — a causa real de cada bug só apareceu quando o dono mandou print real do celular, não quando o agente leu `tokens.css`/`sistema.css` sozinho. Decisão do dono: próxima sessão troca pra fluxo de agente já instalado no projeto (`diretor-arte`, Opus 5, dono de `DESIGN.md`) fazendo auditoria completa contra os tokens documentados, em vez de corrigir 1 print de cada vez.

**Alternativa descartada.** Continuar o loop reativo pedindo mais prints — descartada pelo próprio dono, que pediu sessão nova com prompt novo em vez de continuar nesta.

**Verificado, não só relatado (E8):** `tsc --noEmit`, `npm run lint` (0 erros, 1 warning pré-existente em `block-navigation.js`, não tocado) e `npm run build` limpos nos 2 commits. Medições de alinhamento feitas via `getComputedStyle`/`getBoundingClientRect` contra `localhost` autenticado por usuário QA efêmero (`qa-visual-fixo@lastro.test`, criado e apagado 3 vezes ao longo da sessão pelo script padrão do projeto, contagem confirmada = 0 toda vez). Screenshot automático da ferramenta de preview **não funcionou nesta sessão** (painel do navegador não compositava do lado do dono) — toda verificação visual foi por medição de DOM + prints reais mandados pelo dono, nunca por captura própria do controller. Isso é uma lacuna real: medição de DOM não substitui olho (padrão do projeto, `padrao-verificacao`), e a única razão de ter funcionado aqui é o dono ter mandado prints manualmente.

**Impacto.** `sistema.css`, `tokens.css`, 6× `page.tsx` (barra de topo), `avatar`/`botao-destrutivo`/`grafico-progressao.tsx`. Nada em `main`. `.claude/launch.json` criado nesta sessão (config do preview local, `npm run dev` porta 3000/3002) — não existia antes, é infra reutilizável, não parte do fix.

**Como reverter.** Branch não mergeada: `git checkout main` descarta tudo, ou manter a branch e só não mergear. Se a próxima sessão decidir recomeçar do zero visualmente, `git branch -D fix/consistencia-visual-telas` depois de confirmar que nada nela vale a pena reaproveitar.

## 2026-08-08 — Troca de abordagem executada: auditoria estrutural + pesquisa de referências, proposta entregue como peça visual (nada aplicado)

**O que mudou.** A sessão anterior parou o ciclo print→fix→print. Esta sessão executou a troca decidida: acionou o `diretor-arte` (Opus 5, dono de `DESIGN.md`) para auditoria estrutural completa das 7 telas contra os tokens, e depois — a pedido do dono — levantou pesquisa de referências de design mobile e de apps de treino para **evoluir** o desenho mantendo a base "Areia & Azul Petróleo".

**A causa raiz do "Séries valendo", achada e diferente da hipótese registrada.** `DECISIONS.md` 2026-08-07/08 supunha divergência de **altura** de card. Está errado: os 3 cards são itens de grid com `align-items: stretch`, então as alturas já são idênticas por construção. O que estoura é **largura**: 375 − 40 (padding do corpo) − 24 (2 vãos) = 311 ÷ 3 = 103,67px por card, − 26px (padding + 2 bordas) = **77,67px úteis**. O valor é mono 30px ≈ 17,4px/caractere → cabem 4,4 caracteres. `formatarVolume` devolve `14,2k` (5 caracteres, 87px) a partir de ~10.000 kg, e quebra. Abaixo disso devolve `9,9k` (4 caracteres) e **não** reproduz. **Isso reconcilia a contradição do registro anterior:** a medição que deu os 3 topos idênticos (369,75px) foi contra usuário QA efêmero, de volume baixo — os topos eram idênticos de verdade; o print do dono é que era dado real. **Consequência de processo: o gate desta área tem pré-condição de dado (V0, volume ≥ 10.000 kg), senão não mede nada.**

**Regressão introduzida por esta própria branch, registrada e não corrigida ainda.** O fix "título não quebra em 2 linhas" (`white-space: nowrap` + `ellipsis`) trocou quebra por corte: em `/treino/[id]` sobram ~185px para o título (335 − avatar 48 − vão 12 − botão "Treinos" ~78 − vão 12) e "Treino em andamento" em t-3/600 pede ~237px. É a única das 7 telas onde isso acontece. Correção prescrita: encurtar o título para "Treino" (a data já vive em `.barra-topo__contexto`) **e** remover o `.botao-barra` "Treinos", que duplica "Bancada" da aba inferior.

**Decisão de método: a proposta virou peça visual, não documento.** O registro anterior prova que auditoria em texto não converte — a skill `impeccable` não achou os bugs, e o próprio dono recusou decidir no abstrato duas vezes (zero do Plex Mono, regra §3.4). Por isso a entrega desta rodada é um **deck renderizado**, com mockups antes/depois em 375×812 escala 1:1 usando os tokens reais, para o dono abrir no celular e **apontar**: <https://claude.ai/code/artifact/8bf7ef96-981e-4603-8b96-c7b6b6d8ae01>. Fonte em `scratchpad/deck/` (`deck.src.html` + `build.py`, que embute as fontes como data URI).

**Alternativa descartada:** entregar a auditoria e a pesquisa como um segundo documento longo em Markdown. Descartada porque repetiria exatamente o modo de falha já registrado — o dono valida com o olho, e a rodada anterior gastou uma auditoria inteira que ele abandonou antes de agir sobre ela.

**Tese aprovada pelo `diretor-arte`, aguardando o dono.** O app deixa de ser grade de cartõezinhos equivalentes e passa a ter **uma coisa grande por tela**; cartão passa a significar *porta* (só onde se toca e navega), e `--lastro-t-8` (76px), reservado há duas fases e nunca usado, vira o instrumento da hierarquia. **Nenhuma cor da paleta muda.** 10 movimentos nomeados, 7 tokens novos, 1 alterado (`.metrica__valor` t-4 → t-3).

**"Séries valendo" — 3 opções comparadas, recomendação C.** (A) subgrid + t-3: corrige, mas mantém 26px de moldura por coluna, deixa linha de unidade vazia em 2 dos 3 cards e depende de `subgrid` (E9/P6). (B) empilhar em largura total: elimina a aritmética, mas custa ~270px contra ~110px e joga "Análise Semanal" abaixo da dobra. **(C) faixa sem cartão (Hevy): recomendada** — sem borda/padding/fundo a coluna vai a 103,67px, a unidade cabe inline, e os 6 elementos viram itens de um único grid, então os topos são idênticos por construção, sem `subgrid` e sem `min-height`.

**Achado só possível por ter construído a peça (E8 na prática).** Ao renderizar e **medir** o mockup, `14 200 kg` (a forma com espaço fino que a especificação em texto pedia) deu 108px numa coluna de 101px — não cabia, e as colunas saíam desiguais (108/96/96), porque `1fr` é `minmax(auto, 1fr)` e conteúdo `nowrap` empurra o mínimo. Corrigido na proposta: espaço fino **só** no número herói; na faixa continua `14,2k`, e o vão da faixa desce de `--lastro-e-4` para `--lastro-e-3` (folga de 1px → 3,67px). Registrado em `KNOWLEDGE.md` §5.

**Zero do IBM Plex Mono — verificado na fonte, e a pergunta mudou.** Inspecionados com `fontTools` os `.woff2` que o `next/font` já baixou: o glifo `zero` tem **3 contornos**, o terceiro um ponto centrado de 124×118 unidades (é ponto, não barra — a reclamação do dono procede), e o subset **não tem a feature OpenType `zero`** (só `ccmp/dnom/frac/numr`). Portanto `font-variant-numeric: slashed-zero` seria no-op: **não dá para corrigir por CSS, só trocando a família** — 38 usos e o cache offline do PWA. As 3 opções reais (manter / mono do sistema / abandonar o mono nos números) foram renderizadas lado a lado no deck, em tamanho grande e pequeno, para o dono apontar. **Nada decidido, nada tocado.**

**Botão do Google no login — os dois conflitos resolvidos, um vira exceção declarada.** (a) O guia pede texto 14/20 e D4/§3.4 impõem piso de 16px: resolvido **por escala**, não por exceção — fator 1,2× dá altura 48px (= `--lastro-alvo-min` exato), texto 16,8px, logo 21,6px, paddings 14,4/12/14,4; as duas regras passam a valer juntas. (b) Fundo estranho à paleta é assumido de propósito (o guia proíbe tingir), mas **a variante importa**: Neutral `#F2F2F2` sobre a areia `#F0EAE0` daria ~1,05:1 e o botão sumiria como caixa — por isso variante **Light**, com o traço `#747775` obrigatório cumprindo o limite de 3:1. **A exceção declarada é outra e é obrigatória:** o guia especifica Google Sans, não auto-hospedável, contra a regra de zero requisição a terceiro (§3.3 item 1) — usa-se a fonte do app no peso médio, e isso entra no `DESIGN.md` como exceção nomeada (P2), não silenciosa.

**Achado sobre as diretrizes, não sobre o app.** A galeria de referência permanente que o prompt do `diretor-arte` manda consultar antes de decisão visual foi carregada: 179 referências de WebGL/3D e e-commerce de luxo. Não calibra um PWA de academia de uma mão só — e `DESIGN.md` §3.0 já registrava que esse ramo é incompatível com D4 e D8. **O mandato aponta para um lugar inútil nesta classe de tarefa**; deveria ser reescrito para a régua de acabamento não-3D (Stripe, Linear, Vercel). Pendência de documento.

**Verificado, não só relatado (E8).** Contraste do próprio deck **medido** (não estimado) nos dois temas: pior par de texto 4,66:1 no claro e 5,54:1 no escuro, ambos acima do piso AA. Fontes reais carregadas (`document.fonts.check` = true nas duas famílias), zero rolagem horizontal do corpo, zero estouro nas 8 molduras de 812px, colunas da faixa medidas em 103px iguais. **O que NÃO foi verificado:** o app rodando. A captura de tela automática do painel do navegador **falhou de novo** (mesma causa da sessão anterior — não compositava). Contornei para a pesquisa baixando as imagens de referência e lendo como arquivo, mas nenhuma tela do `lastro` real foi vista nesta sessão.

**Impacto.** Nenhum arquivo de `src/` tocado. Alterados: `KNOWLEDGE.md` (§2.1 nova, 2 lições em §5), `PROGRESS.md` (item 14), este arquivo. Branch `fix/consistencia-visual-telas` segue com os mesmos 3 commits, não mergeada.

**Como reverter.** Reverter os 3 arquivos de documento (`git checkout -- KNOWLEDGE.md PROGRESS.md DECISIONS.md`) e ignorar o deck, que vive fora do repositório. Nada em `src/`, nada em `main`.

## 2026-08-08 (2) — Rediagnóstico: o problema não era alinhamento, era ausência de voz

**O que mudou.** O dono leu a proposta anterior e respondeu que o sistema "está funcional, mas feio, sem detalhes, sem vida", e que a skill `impeccable` também não tinha ajudado. Isso invalida o enquadramento da rodada anterior: os 10 movimentos propostos eram **higiene** (alinhamento, hierarquia, token), não estética. Consertam o que está quebrado; não produzem beleza. Registrado como rediagnóstico, não como ajuste.

**Por que a auditoria de token nunca ia resolver.** `impeccable` verifica se um valor está *fora* do sistema. Todos os valores do lastro estão **dentro** do sistema — o problema é que estão todos no **mesmo degrau** dele: maior número da tela em 30px (com `--lastro-t-8` de 76px reservado e nunca usado), sete componentes distintos com a mesma `elev-1`, todo cabeçalho de seção no mesmo versalete cinza de 14px. Não falta cor: falta **diferença**.

**A restrição que explica tudo, e que precisa estar escrita.** As três referências que o dono trouxe (WHOOP, Oura, Ultrahuman) são **escuras**, e não por acaso: dado colorido brilha sobre preto, e o fundo faz metade do trabalho. O lastro é areia `#F0EAE0` com uma tinta e um verde. **Num fundo claro e quente não se compra vitalidade com brilho nem saturação** — tentar produz wellness pastel, que é anti-referência declarada. Sobra uma moeda só: **contraste de escala, de peso e de densidade.** Esta frase deve entrar em `DESIGN.md` §3.0 como restrição derivada da paleta.

**A ideia que organiza a estética, ancorada no produto.** "Lastro" é o peso que dá estabilidade e, em português, o que dá substância (lastro financeiro). A tese do PRD é que o log é infraestrutura e o produto é a leitura — ou seja, **os números lastreiam a leitura**. Logo, contraste de escala não é escolha de gosto: é a metáfora do produto. Cada tela tem um peso e o resto flutua em volta dele.

**Quatro fontes de vida, em ordem de retorno:** (1) elevação volta a significar algo — cartão só onde se toca e navega, dado sobre a areia sem moldura (é remoção, custo zero); (2) os numerais viram a identidade — mono tabular grande com delta e sinal; (3) o parecer ganha voz de documento emitido — sobrancelha + veredito em **IBM Plex Serif**, mesma superfamília, auto-hospedável, nenhum fornecedor novo; (4) **um** momento de movimento — a série registrada acende a linha inteira.

**Textura de papel: recusada em quase tudo, mantida num lugar só.** "Areia é granulada" não é justificativa, é decoração. Sobreviveu apenas no tratamento B do login, onde a ideia é a **caderneta de treino** — e caderneta é impressa em papel. Se o dono recusar o tratamento, a textura cai junto e nada mais depende dela.

**Login entregue como 3 apostas, não 1 refino.** O dono citou o login pelo nome e decide apontando. **A** (Placa): escala pura, marca em 88px sobre risco pesado. **B** (Caderneta): serifada, campo com pauta em vez de caixa, grão de papel. **C** (Massa): o petróleo deixa de ser faixa de 88px e vira campo de 44% da tela. O botão do Google é **idêntico nos três** (variante Light, escala 1,2×), para que a única variável julgada seja personalidade.

**Achado contra a própria proposta anterior (E8).** Ao construir o mockup, medi que eu havia usado `--lastro-t-8` (76px) no parecer da Análise — **violando o §3.5 do próprio `DESIGN.md`**, que reserva t-8 ao Modo Bancada e manda `--lastro-t-5` (38px) no Modo Leitura. Corrigido no deck. Um erro que só apareceu porque a peça foi construída e medida, não descrita.

**Correção de erro da rodada anterior:** os mockups do deck v1 mostravam a aba inferior com **4 seções**; o app tem **5** (`aba-inferior.tsx`: Início, Bancada, Análise, Catálogo, Coach). O briefing do dono pegou isso. Corrigido em todas as 10 molduras.

**Volume passa a ser `14,2 t`.** Hoje `formatarVolume` devolve `14,2k` e a UI acrescenta `kg`, produzindo **"14,2k kg"** — dois indicadores de magnitude na mesma expressão. Ideia veio do StrengthLog, que mostra "2.6 ton". Mais curto, mais limpo, e cabe folgado na faixa de 103px.

**Alternativa descartada.** Buscar "vida" por saturação, brilho ou superfície escura — descartada porque quebraria a paleta aprovada e cairia na anti-referência (wellness pastel ou academia agressiva).

**Levantado como escopo, não aplicado:** a coluna "antes 16 × 9" ao lado de cada série (Hevy e Strong mostram o resultado da sessão anterior junto do campo em edição). É a informação mais útil no momento do esforço e o lastro não tem — **mas é feature, exige consulta ao histórico do exercício, e é decisão do dono.** Aparece no mockup só para ele julgar o efeito.

**Verificado, não só relatado (E8).** Medido no deck renderizado: três famílias carregadas (`document.fonts.check` true para Sans, Mono e Serif), zero rolagem horizontal, ressalvas do método **dentro** das duas molduras do parecer (197px e 14px de folga), as 10 molduras com nav de 5 abas, nenhum alvo de toque abaixo de 48px, faixa de métricas com 3 colunas iguais de 103px, e só "Treino em andamento" truncando (que é a demonstração da regressão R1). Contraste medido no escopo lastro: pauta do campo 3,40:1 (limite de componente, piso 3,0), alta 5,47, platô 4,95, queda 5,78, procedência 5,58 — todos acima do piso. **O que NÃO foi verificado: o app rodando.** A captura de tela do painel do navegador falhou pela terceira sessão seguida.

**Impacto.** Nenhum arquivo de `src/` tocado. Deck v2 no mesmo endereço: <https://claude.ai/code/artifact/8bf7ef96-981e-4603-8b96-c7b6b6d8ae01>. Fonte em `scratchpad/deck/`.

**Bloqueado aguardando o dono:** login A/B/C · zero do Plex Mono A/B/C · tamanho de texto A/B · a coluna "anterior" entra ou não.

**Como reverter.** Nada em `src/`, nada em `main`. Reverter os documentos com `git checkout -- DECISIONS.md PROGRESS.md`.

## 2026-08-08 (3) — 16 peças visuais recebidas: o que se absorve, o que se rejeita

**O que mudou.** O dono trouxe um pacote de **16 mockups conceituais** (`lastro-pecas-modulares-para-claude.zip`, em `Downloads`), um guia de uso e a `diretrizes-v7.md`. As peças são a resposta por apontamento às 4 decisões que a rodada anterior deixou bloqueadas. **Nenhum arquivo de `src/` foi tocado** — esta entrada é o relatório de absorção que o próprio guia exige ("explique quais peças foram absorvidas e quais foram descartadas, e por quê") antes de codificar.

**Diretrizes v7 — nada a instalar.** O Passo 5 da v7 (`.claude/agents/`, `.claude/skills/padrao-*`, hooks em `.claude/settings.json`) já está em disco neste projeto, com 6 agentes e 7 padrões. Os Passos 0–2 são de bootstrap e **não se aplicam**: rodá-los reabriria o `PRD.md`, que está congelado. A v7 entra como conduta, não como sessão de inicialização.

**O que as peças entregam que o deck v2 não tinha.** A peça 08 (parecer semanal) valida a tese do rediagnóstico e a corrige num ponto: **o maior salto de escala está no veredito, não no numeral.** O documento se lê como emitido — sobrancelha em versalete, risco verde curto, linha "Semana de … · Emitido em …", evidência com barra lateral colorida + rótulo + frase em negrito + prosa de procedência, "O QUE FAZER" numerado em blocos discretos, assinatura no rodapé. A peça 01 confirma as três remoções baratas já propostas (cartão só onde se toca, dado sobre a areia sem moldura, numeral mono tabular como identidade).

**Conflitos entre as peças e contratos congelados — verificados no código, não em documento:**

| # | A peça mostra | O projeto tem | Veredito |
|---|---|---|---|
| C1a | `RPE 7/8/9` na linha de série (01, 03) | **RIR** — nome de campo, função e contrato de API (`series-dificeis.ts`, `limiares.ts`, `validador.ts`) | Rejeitar o rótulo. RPE e RIR são escalas **inversas**: trocar o nome sem trocar a conta produz número plausível e errado, e o LLM depois interpreta esse número |
| C1b | RIR/RPE visível em toda linha | **Não é exibido em lugar nenhum** — só capturado nos formulários (`formulario-serie.tsx:172`, `editar-serie.tsx:123`) | **Feature, não polimento.** Mesmo caso da coluna "anterior 16 × 9". Decisão do dono |
| C2 | 4 abas (Treino de hoje · Análise semanal · Progresso · Histórico) | 5 abas (`aba-inferior.tsx:16-44`) | Rejeitar o conteúdo, absorver o tratamento da barra (peça 12) |
| C3 | Areia `#F3EDE3`, Petróleo `#0E2A36`, Verde `#22B573` | `tokens.css`: `#F0EAE0`, barra `#17414F→#0E2833`, ação `#46C27B→#35A866` | **Tokens vencem.** Cada hex do `tokens.css` traz a razão de contraste **medida** ao lado; adotar o hex da peça invalida a medição inteira |
| C4 | Veredito em Plex **Sans** bold | Proposta pendente do deck v2: Plex **Serif** | Decisão viva do dono — a peça contradiz uma proposta que ele ainda não julgou |
| C5 | Manchete muito grande | §3.5 reserva `t-8` ao Modo Bancada; Modo Leitura para em `t-5` | **Não medir na peça:** a 08 não tem moldura de celular, é pôster 1440×2560. Só a *razão* veredito:corpo transfere, e a conferência é no navegador |
| C6 | `Volume total 18.450 kg` | `page.tsx:39-40` ainda devolve `14,2k` + a UI acrescenta `kg` = **"14,2k kg"** | A decisão de 2026-08-08 (2) mandou virar `14,2 t` e **nunca foi implementada**. A peça mostra uma terceira variante. A decisão vence |

**GATE VISUAL DESTRAVADO — o método que funciona.** `preview_start lastro-dev` sobe (porta 3002) e `read_page` responde, mas `computer screenshot` do painel interno falha com *"the Browser pane is not displayed, so the page is not compositing frames"* — **e abrir o painel não resolveu**; o `computer screenshot` da extensão do Chrome também estoura (CDP `Page.captureScreenshot`, 30s). Não é página pesada nem timeout de render.

**O que funciona é a combinação:** a extensão Claude-in-Chrome **navega e redimensiona** (`mcp__claude-in-chrome__navigate` / `resize_window`) e o **computer-use captura a tela** (`mcp__computer-use__screenshot` + `zoom`, Chrome concedido em tier `read`). Três pré-condições descobertas na prática, todas obrigatórias:

1. **A janela do Chrome não pode estar maximizada** — o Chrome ignora `resize_window` em janela maximizada, e sem isso a captura sai em 1366px, largura em que o app (100% mobile) não foi desenhado.
2. **A aba que a extensão controla precisa estar em primeiro plano na janela** — ela navega uma aba de fundo sem trazê-la pra frente, e a captura mostra a aba ativa, não a dela. Um clique do dono resolve, uma vez por sessão.
3. `read_page` / `get_page_text` / `javascript_tool` funcionam o tempo todo, independentemente disso — não dependem de composição de frames.

**Primeira observação real do app rodando em 390×844** (Início e Análise, conta real do dono): a tela de Análise **confirma o rediagnóstico por evidência visual**, não por medição. As 5 perguntas são 5 cartões areia idênticos — mesma `elev-1`, mesmo raio, mesmo peso de texto — sem nenhuma hierarquia entre a pergunta mais usada e as outras. `PROGRESSÃO` e `ESCOLHA A PERGUNTA` saem no mesmo versalete cinza de 14px do `ESTA SEMANA` da Início. O único elemento com voz na tela é a barra de topo escura — que é justamente o par sobrancelha + título que a peça 08 usa no cabeçalho do parecer. **A direção da peça já está certa no único lugar onde o app a aplica.**

**Limite do gate hoje:** a conta do dono está com `Volume 0 kg / Séries valendo 0` e sem semana fechada com treino, então (a) o parecer não renderiza e (b) o desalinhamento do card "Séries valendo" não reproduz (só com volume ≥ 10.000 kg). O gate da peça-assinatura exige dado seedado — usuário QA efêmero, como na tarefa do gráfico.

**Alternativa descartada.** Absorver as peças como especificação — média entre os hexes da peça e os tokens, rótulo RPE junto do cálculo de RIR, barra de 4 abas. Descartado: é composição de fontes descasadas, e cada item acima tem uma fonte única que já venceu a discussão.

**Impacto.** Nenhum arquivo de `src/` tocado. Alterados: `PROGRESS.md` (item 14, sub-entrada 3) e este arquivo. Rascunho longo do relatório fora do repositório.

**Bloqueado aguardando o dono:** C1b · C4 · C5 · C6 · as peças entram no repo (45 MB, exigiria LFS) ou ficam fora.

**Como reverter.** `git checkout -- PROGRESS.md DECISIONS.md`. Nada em `src/`, nada em `main`.

## 2026-08-08 (4) — Backlog aprovado: DESIGN.md amendado, C6 implementado

**O que mudou.** O dono aprovou minha recomendação para C4/C5/C6 e pediu backlog fatiado em vez de tudo de uma vez. Ordem: C6 → `DESIGN.md` → seed QA → parecer (cabeçalho, evidência, gráfico, estados) → gate final. Esta entrada cobre os dois primeiros itens.

**C6 implementado.** `formatarVolume` em `src/app/page.tsx` passou a devolver `{ valor, unidade }` em vez de string fixa: abaixo de 1000 kg mostra kg cheio, a partir daí `t` com 1 casa decimal. Os dois pontos de uso (card "Volume" da semana e meta de "Treinos recentes") atualizados. `tsc --noEmit` limpo. Verificado no navegador (Chrome + computer-use, método da entrada anterior): card "Volume" mostra `0 kg`, caso zero correto — o caso `≥1000 kg → t` só é observável com dado real, revalidação fica pendurada na tarefa de seed do QA.

**`DESIGN.md` amendado — duas entradas, autoconsistência conferida (P2):**
- **§3.0** ganhou a restrição do rediagnóstico por escrito: fundo areia claro não sustenta vitalidade por brilho/saturação (produz wellness pastel); a moeda que sobra é contraste de escala, peso e densidade. Isso deixa de ser um argumento solto no `DECISIONS.md` de 08/08 e vira regra citável.
- **§3.6.2 item 2 (Veredito)** subiu de `--lastro-t-3` (24px, igual ao título do cabeçalho) para `--lastro-t-6` (48px) — nomeado como exceção em §3.4. É a aplicação direta da restrição de §3.0: título e veredito no mesmo degrau era o próprio sintoma que o rediagnóstico descreveu. Conferido: nenhuma outra menção a tamanho de veredito no documento ficou desatualizada.

**Por que `--lastro-t-6` e não `--lastro-t-8`.** `t-8` (76px) é reservado ao Modo Bancada (número lido a um braço) — usá-lo no parecer é a mesma violação de §3.5 que a sessão de 08/08 já tinha se pego cometendo. `t-6` cria o salto de escala sem invadir o degrau do outro modo.

**Nada em `src/components/parecer.tsx` ainda usa este token** — o componente não tem conceito de veredito hoje. A amenda é preparatória; a construção é a próxima tarefa do backlog (cabeçalho de emissão, peça 08).

**Impacto.** `src/app/page.tsx` (C6). `DESIGN.md` (§3.0, §3.4, §3.6.2). Nenhuma migration, nenhum contrato de API tocado.

**Como reverter.** `git checkout -- src/app/page.tsx DESIGN.md`.

## 2026-08-08 (5) — Backlog fatiado: achado de arquitetura, decisão do dono, replanejamento

**O que mudou.** Ao planejar as tarefas #4/#5 (cabeçalho e cards de evidência do parecer), achei que `/api/analise` **já calcula** `resumo` (ResumoCompacto, tudo que §3.6.3 precisa) antes de chamar o Gemini — só não devolve ao cliente. `parecer.tsx` já documentava isso como "LIMITAÇÃO CONHECIDA" havia sessões. Consultei o revisor antes de tocar um contrato documentado (SDD §6.2); ele apontou dois problemas reais antes de eu escrever código.

**Problema 1 — devolver `ResumoCompacto` inteiro ao cliente era o desenho errado.** Ele é o payload do PROMPT (dimensionado contra `MAX_BYTES_RESUMO`, moldado pro LLM), não o contrato da TELA. Devolvê-lo cru acopla o formato que a UI lê ao formato que o prompt usa — qualquer ajuste futuro de prompt muda silenciosamente o que a tela recebe. Decisão: uma fatia própria, tipada, com só os campos que §3.6.3 usa.

**Problema 2 — a seed provou um caso real de dois sinais discordando do mesmo exercício.** O parecer descreveu Levantamento Terra e Desenvolvimento como "subiu X%" (comparação de 4 semanas, `tendencia_e1rm`) mesmo semeados como platô nas últimas 3 semanas (regra do gráfico, `PLATO_GRAFICO_SEMANAS`). Os dois cálculos estão corretos — são janelas diferentes, ambas documentadas em `limiares.ts`. O gap é que **nada em `DESIGN.md` dizia qual sinal pinta a barra lateral do card quando os dois discordam**, e §3.6.6 já proíbe exatamente essa ambiguidade entre exercícios diferentes — faltava a regra para o mesmo exercício.

**Decidido e escrito em `DESIGN.md` §3.6.3:** o bloco de evidência é dono da **janela de comparação** (`tendencia_e1rm`/`estagnacoes`, a mesma que a prosa interpreta). A leitura de platô do gráfico vive só no gráfico (§3.7/peça 10) — as duas nunca competem pela mesma barra lateral. Se algum dia a UI precisar mostrar as duas leituras juntas, a segunda entra como texto qualificado, nunca como segunda cor.

**Achado à parte, não é bug:** a prosa chamou Remada Curvada (semeada em queda constante) de "estagnação de 4 semanas sem progresso". Conferido em `estagnacao.ts`: a definição é "sem novo máximo por N semanas", que **inclui queda por construção** (uma semana em declínio nunca bate o máximo corrente, logo conta pro streak). É o comportamento documentado, não um bug do agregador — mas é um lembrete de que "estagnação" no código é mais amplo que "platô" na leitura comum, e a prosa devia deixar isso claro quando descrever regressão como estagnação.

**Pergunta ao dono: como montar o número do card, já que `ResumoCompacto` só tem e1RM + contagem de sessões por exercício, não volume nem séries valendo por exercício** (só por grupo muscular). Duas opções — usar o que já existe (e1RM + sessões, sem tocar o agregador testado) ou estender o agregador pra ter peso×reps e séries valendo por exercício, igual à peça 09. **O dono escolheu estender o agregador.** É fase nova (E4), não retoque: `tipos.ts` (`ResumoCompacto`), `agregar.ts` (testado, SDD §D2), testes novos, e checar se o resumo ainda cabe em `MAX_BYTES_RESUMO`.

**Backlog replanejado, em ordem:**
1. Agregador — `volume_por_exercicio` em `ResumoCompacto` (peso, reps, séries valendo, delta) — tarefa nova, maior do que as anteriores.
2. API — fatia de evidência própria (não `ResumoCompacto` cru) devolvida junto de `parecer`; amendar SDD §6.2.
3. Cabeçalho de emissão + veredito (peça 08) — não depende do agregador, pode andar em paralelo.
4. Cards de evidência (peça 09) — depende de 1 e 2.
5. Gráfico (peça 10), estados (peça 11), gate final — como já estava.

**Dois soltos que o revisor apontou, registrados agora:**
- **Usuário QA efêmero:** `qa-lastro-parecer@example.com` / UUID `343f521f-ac58-4924-a4cf-87038bcb9812`, 5 semanas fechadas (Mondays 2026-06-29 a 2026-07-27), volume da semana mais recente **10.420 kg**. Agachamento Livre e Supino Reto em alta, Levantamento Terra e Desenvolvimento em platô (últimas 3 semanas), Remada Curvada em queda. Verificado ponta a ponta contra `/api/analise` real. **Fica vivo até o gate final** (tarefa "Gate final"), que deve rodar `./scripts/qa-treino-helper.sh limpar-usuario qa-lastro-parecer@example.com` ao terminar.
- **`.claude/launch.json` está untracked.** É o que faz `preview_start lastro-dev` funcionar nesta sessão (a configuração do dev server, porta 3000→3002 quando 3000 está ocupada). Se a sessão terminar sem commitá-lo, a próxima precisa recriá-lo (conteúdo: `{"name":"lastro-dev","runtimeExecutable":"npm","runtimeArgs":["run","dev"],"port":3000}`). Ainda não commitado — decisão de manter fora do controle de versão ou commitar fica para o dono.

**Impacto.** `DESIGN.md` (§3.6.3, regra de precedência). `DECISIONS.md`, `PROGRESS.md`. Nenhum arquivo de `src/` tocado ainda nesta rodada — a extensão do agregador é a próxima tarefa.

**Como reverter.** `git checkout -- DESIGN.md DECISIONS.md PROGRESS.md`.

## 2026-08-08 (6) — Agregador estendido, API devolve evidência, verificado ponta a ponta

**O que mudou.** Tarefas #9 e #10 do backlog concluídas e commitadas (`a4168e3`, `a08dc51`). `ResumoCompacto` ganhou `volume_por_exercicio` (peso×reps×séries valendo por exercício, top set do treino mais recente). `/api/analise` devolve `evidencia` — fatia própria que funde `tendencia_e1rm` (dono do sinal alta/platô/queda) com `volume_por_exercicio` (os números da Linha 2) — nas 3 branches, inclusive o fallback determinístico. 89 testes, `tsc`/lint limpos.

**Achado durante a verificação ponta a ponta: o tempo real passou por baixo do seed.** A seed original (tarefa #3) cobria 5 semanas terminando em 2026-07-27, calculada quando "agora" da sessão era 2026-08-08. Entre então e a verificação desta tarefa, o relógio real avançou o suficiente para a "semana atual" da análise rolar para 2026-08-03 — a seed ficou uma semana pra trás, `evidencia.blocos` voltou vazio na primeira chamada. **Não é bug do código**, é a natureza de dado semeado com data fixa numa sessão longa. Corrigido semeando a 6ª semana (treino 2026-08-05, mesmas 5 exercícios, tendências continuadas). Reverificado: os 3 sinais saem corretos com dado real —

- **Alta:** Agachamento Livre (+7,9%), Supino Reto (+11,5%)
- **Platô:** Levantamento Terra e Desenvolvimento Militar, `delta_pct` exatamente `0` — a zona-morta de classificação nem precisou arredondar
- **Queda:** Remada Curvada (-8,1%), com `semanas_sem_progresso: 4` presente como campo qualificado — **não** reclassificado como platô, confirmando a regra de precedência escrita em `DESIGN.md` §3.6.3

**Lição para sessões futuras com QA seedado por data fixa:** se a sessão atravessar uma virada de semana ISO (segunda-feira 00:00 em `America/Sao_Paulo`), a "semana atual" da análise rola e o seed mais recente vira "semana anterior" sem dado. Verificar `resumo.periodo.semana_atual_inicio` contra a data real antes de reusar um seed antigo — não assumir que ele continua válido só porque passou uma vez.

**Impacto.** Nenhum arquivo de `src/` tocado nesta entrada (só documentação); o código já foi commitado nas duas entradas anteriores. Seed em Supabase: `qa-lastro-parecer@example.com` agora com 6 semanas (2026-06-29 a 2026-08-03).

**Próximo passo:** tarefa #4 do backlog — cabeçalho de emissão + veredito do parecer (peça 08), que não depende de mais nada.

**Como reverter.** `git checkout -- DECISIONS.md`. Seed no Supabase seguirá limpo pelo `limpar-usuario` na tarefa "Gate final".

## 2026-08-10 — Tarefa 4 concluída: cabeçalho + veredito, verificado no navegador real

**O que mudou.** Peça 08 (cabeçalho de emissão + veredito) construída e commitada (`f92d16c`). `PROGRESS.md`/backlog seguem em #5 (cards de evidência).

**Achado que bloqueava a tarefa, resolvido antes de escrever componente.** A resposta real da API trazia markdown cru (`###`, `**`, `*`, crase) — `parecer.tsx` renderiza como `<p>{texto}</p>`, sem parser, então isso apareceria como asteriscos literais na tela. E a primeira frase (que vira o veredito em destaque) saía genérica ("sim, você está progredindo"), sem exercício nem número — o oposto do que a peça-assinatura pede. Os dois são o mesmo tipo de defeito: prompt sem trava suficiente. Corrigido em `prompt.ts` (`SYSTEM_INSTRUCTION`): proíbe markdown, exige que a 1ª frase cite exercício+número, exige decimal em vírgula (o modelo escrevia "11.5" em inglês). **Verificado empiricamente contra a API real nas perguntas 1, 2 e 5 antes de tocar em UI** — 3/3 vieram específicas, sem markdown, com vírgula.

**`separarVeredito`** (`src/lib/texto/`) corta a 1ª frase do parecer; testado com o texto real capturado da API (não só fixture sintética). `formatarDataCurta` extraída de `page.tsx` para `tempo.ts` — fonte única (E10), reusada pelo cabeçalho do parecer.

**Verificado no navegador real — o método que funciona nesta máquina, achado nesta sessão.** Nem o painel interno nem o `computer` (desktop) da extensão capturam de forma confiável aqui: o desktop screenshot ficou preso mostrando uma janela/aba **desatualizada** por várias tentativas (inclusive depois de F5, de limpar service worker e cookies via `javascript_tool`, e de abrir aba nova) — a extensão via `get_page_text`/`read_page` sempre mostrou o estado real e correto, só a captura de imagem do **desktop** ficava obsoleta. **O que resolveu:** usar `mcp__claude-in-chrome__computer{action:"screenshot"}` (escopo da aba, dentro da extensão) em vez de `mcp__computer-use__screenshot` (escopo do desktop). Login como usuário QA também exigiu limpar cookies manualmente via `document.cookie` — o botão "Sair" da UI e um simples reload não derrubaram a sessão anterior de forma confiável.

**Confirmado visualmente:** sobrancelha "ANÁLISE SEMANAL" pequena → título `t-3` → linha "Semana de 3 ago — 9 ago · Emitido em 10 de ago. de 2026" (junta `evidencia.periodo` com a data de emissão, como `DESIGN.md` §3.6.2 pede) → risco → veredito em `t-6`, claramente maior e mais pesado que o título. O salto de escala da restrição de §3.0 está na tela, não só no código.

**Achado para o dono julgar, não decidido aqui:** em viewport de 375–500px, uma frase composta longa em `t-6` ocupa ~8 linhas e domina a tela inteira. É fiel à decisão de §3.0/§3.6.2, mas vale o olho real antes de fechar a tarefa 8 (gate final) — se parecer exagerado, a correção é limitar o comprimento da frase no prompt (pedir concisão), não reduzir o token.

**Impacto.** `src/app/api/analise/prompt.ts`, `src/lib/texto/` (novo), `src/lib/tempo.ts`, `src/app/page.tsx`, `src/components/parecer.tsx`, `src/components/analise-interativa.tsx`, `src/app/sistema.css`. `.claude/launch.json` finalmente commitado (estava untracked desde a sessão anterior). 94 testes, `tsc`/lint limpos.

**Como reverter.** `git revert f92d16c`.

## 2026-08-10 (2) — Tarefa 5 concluída: cards de evidência, verificados no navegador

**O que mudou.** Peça 09 construída e commitada (`c23a13d`). Backlog segue em #6 (gráfico).

**`BlocoEvidencia`** (`src/components/`) renderiza cada item de `evidencia.blocos` com coluna de sinal (ícone + palavra "Alta"/"Platô"/"Queda"), exercício, número (`peso × reps` do top set), procedência (`janela · séries valendo · calculado no dispositivo`) e delta à direita. `formatarDelta` (`src/lib/texto/`) decide o texto do delta por sinal: alta só o percentual, queda percentual+janela, platô usa o streak real de `semanas_sem_progresso` quando o mesmo exercício também está em `estagnacoes`, e cai para a janela de comparação quando não está — os dois critérios existem porque são famílias diferentes (delta≈0 na janela de 4 semanas vs. streak de 4+ semanas sem novo máximo), confirmado com o seed real: Levantamento Terra e Desenvolvimento saem "platô" sem estar em `estagnacoes`.

**Dois achados corrigidos ao ver renderizado, não só testado:**
1. `peso_referencia` saía com **ponto** decimal ("102.5") — JSX faz `String(n)` puro, sem localização. `formatarPeso` adicionado.
2. Ao escrever o CSS do layout (coluna de sinal, coluna de delta), usei `rem` **literal** em `sistema.css` por engano — viola a regra de fonte única do projeto (só `tokens.css` pode ter literal). Corrigido antes de commitar: dois tokens novos, `--lastro-evidencia-col-sinal`/`--lastro-evidencia-col-delta`.

**Verificado no navegador real** (extensão Chrome, login QA): os 3 sinais (alta verde, platô âmbar, queda terracota) renderizam com cor + ícone + palavra + delta — a redundância de 3 canais que §3.2 nota C e §3.6.6 exigem, não só cor. Cores reusam tokens já medidos (`--lastro-alta`/`--lastro-plato`/`--lastro-queda`), nenhum contraste novo a validar — medição rigorosa fica pra tarefa 8 (gate final).

**Impacto.** `src/components/bloco-evidencia.tsx` (novo), `src/components/parecer.tsx`, `src/lib/texto/formatar-delta.ts` (novo), `src/app/sistema.css`, `src/app/tokens.css`. 104 testes (10 novos), `tsc`/lint limpos.

**Como reverter.** `git revert c23a13d`.

## 2026-08-10 (3) — Tarefas 6 e 7: gráfico já pronto, estado "dados insuficientes" construído

**Tarefa 6 (peça 10, gráfico) — nenhum código necessário.** Conferi `grafico-progressao.tsx` contra os 7 itens de `DESIGN.md` §3.7 um a um: rotulagem direta ✓, conclusão em palavras em `t-2` acima do desenho ✓, platô desenhado com `strokeDasharray` em `--lastro-plato` + anotação "há N semanas" ✓, linha de referência única ("melhor marca") ✓, alvo de toque ✓, alternativa textual pro leitor de tela ✓, stack viável (Recharts) ✓. Já tinha sido construído e verificado numa sessão anterior (`PROGRESS.md` item 1, 2026-08-07) e eu mesmo vi renderizando corretamente com dado real várias vezes nesta sessão. Rodei também a verificação executável de literais (`grep` de §3.8) em `sistema.css` — vazia, nenhuma violação. Marcado concluído sem commit novo.

**Tarefa 7 (peça 11) — o estado "sem dados suficientes" não existia.** As outras três (gerando, erro da API, pronto) já estavam corretas desde a tarefa 10 (a evidência estruturada passou a vir nas 3 branches da rota). Mas a lista de 5 perguntas ficava sempre clicável, mesmo com uma semana só de dado — o app dependia do LLM escrever na prosa que faltava informação, quando `DESIGN.md` §3.6.5 exige um bloqueio **determinístico**, com o número exato de semanas que faltam, antes de qualquer chamada à API.

**`MINIMO_SEMANAS_PARECER = 3`** (`limiares.ts`) — mesmo número já citado informalmente em sessões anteriores e no mockup de referência ("São necessárias 3"), não é limiar estatístico novo. Reusa `semanasFechadasComTreino`, que a Home já calculava (`carregarResumoHome`) — sem duplicar consulta (E10). Abaixo do piso, `/analise` esconde a lista de perguntas e mostra "Você tem N semana(s) fechada(s). São necessárias 3 para calcular a análise semanal." + CTA "Registrar treino", em cor neutra (nunca `--lastro-erro`).

**Verificado no navegador com um usuário QA descartável** — criado com 1 semana, testado, **deletado logo em seguida** (cascade confirmado, 0 linhas). Não usei o QA principal (6 semanas, ainda serve pra tarefa 8) nem tentei logar como o dono (login dele é Google OAuth; não tenho a senha e não é apropriado automatizar login pessoal dele).

**Impacto.** `src/lib/analise/limiares.ts`, `src/app/analise/page.tsx`, `src/components/analise-interativa.tsx`. 104 testes, `tsc`/lint limpos. Commit `6d12a5b`.

**Estado do backlog:** só falta a tarefa 8 — gate final com contraste medido e o olho do dono.

**Como reverter.** `git revert 6d12a5b`.

## 2026-08-10 (4) — Gate final: contraste medido, navegador real, build limpo

**O backlog inteiro do parecer semanal (peça-assinatura) está fechado.** 8 tarefas, commits `0ac5f0c` → `6d12a5b`, todas verificadas no navegador real com dado real (não só teste unitário).

**Contraste medido — fórmula do próprio `DESIGN.md` §3.2 (linearização sRGB), rodada ao vivo no `/analise` renderizado, não estimado:**

| Elemento | Cor | Fundo | Tamanho/peso | Contraste |
|---|---|---|---|---|
| `.doc__veredito` | `--lastro-txt` | `--lastro-fundo` | 48px / 600 | **11.54:1** |
| `.evidencia__numero` | `--lastro-txt` | `--lastro-grad-sup` (pior stop) | 38px / 500 | **12.39:1** |
| `.evidencia__procedencia` | `--lastro-txt-3` | `--lastro-grad-sup` | 14px / 400 | **5.99:1** |
| Rótulo "Alta" (ícone+palavra) | `--lastro-alta` | fundo | 14px / 600 | **5.47:1** |
| Rótulo "Platô" | `--lastro-plato` | fundo | 14px / 600 | **4.95:1** |
| Rótulo "Queda" | `--lastro-queda` | fundo | 14px / 600 | **5.78:1** |
| Delta "Alta" | `--lastro-alta` | `--lastro-grad-sup` | 14px / 600 | **5.87:1** |
| Delta "Platô" | `--lastro-plato` | `--lastro-grad-sup` | 14px / 600 | **5.31:1** |
| Delta "Queda" | `--lastro-queda` | `--lastro-grad-sup` | 14px / 600 | **6.21:1** |

Método aferido contra os canônicos WCAG antes de medir (`#FFFFFF/#000000 = 21.00`, `#FFFFFF/#777777 = 4.48` — bateram). Todos os valores folgados acima do piso AA (4.5:1 texto normal, 3:1 texto grande) — nenhum elemento novo desta sessão introduziu risco de contraste, porque todos reusam tokens já medidos em `tokens.css` (nenhuma cor nova).

**`npm run build` limpo** (produção, Turbopack, `/analise` e `/api/analise` compilam). `npx tsc --noEmit` limpo. 104 testes. `npm run lint`: 0 erros.

**O que fica pro dono — a parte que não se automatiza.** Confirmei estrutura, texto, cor e contraste; **não substituo o olho do dono** (`padrao-verificacao` item 3). Ele precisa:
1. Logar em `http://localhost:3002` com a conta dele (Google) e olhar `/analise` no celular de verdade — o app é 100% mobile, viewport de desktop engana.
2. Julgar se o veredito em `t-6` (visto ocupando ~8 linhas numa tela de 375-500px) está bom ou exagerado — é fiel à decisão, mas ninguém tinha visto renderizado antes de hoje.
3. Decidir se quer a conta QA (`qa-lastro-parecer@example.com`) mantida viva por mais uma sessão pra ele mesmo olhar os 3 sinais com dado real, ou se já pode limpar (`./scripts/qa-treino-helper.sh limpar-usuario qa-lastro-parecer@example.com`). **Não limpei nesta entrada** — decisão do dono.

**Impacto.** Nenhum arquivo de `src/` tocado nesta entrada (é documentação do gate). Branch `fix/consistencia-visual-telas` segue não mergeada — merge é decisão do dono, depois do olho dele.

**Como reverter.** N/A (só documentação).

## 2026-08-10 (5) — Nav inferior vira pílula flutuante (pedido do dono)

**O que mudou.** `.nav` (`aba-inferior.tsx`/`sistema.css`) deixou de ir de ponta a ponta e ficar colada no rodapé para flutuar como uma pílula com margem dos três lados (`--lastro-e-4` lateral, `--lastro-e-3` + área segura embaixo), raio total (`--lastro-raio-pilula`, token novo, 999px). Item ativo ganhou uma pílula de fundo própria (`--lastro-sup-2`) atrás do ícone+rótulo, além do peso/cor que já existia.

**Origem do pedido:** o dono mandou um print da barra inferior do Instagram (pílula escura flutuante, só ícones, pílula de destaque no item ativo) e perguntou se dava pra adaptar. Passou pelo processo de brainstorm antes de qualquer código — a primeira leitura minha ("copiar a barra do Instagram") estava errada; o dono corrigiu explicitamente: **"quero que você adapte na realidade, não que crie igual... a tela preta e símbolos não têm nada a ver com a nossa bar."** Absorvido: o formato (pílula flutuante, destaque do item ativo). Rejeitado: a paleta escura (violaria DESIGN.md §3.0 — a barra de topo é a ÚNICA superfície escura do padrão, decisão já registrada) e a ausência de rótulos (o dono pediu explicitamente pra manter o texto).

**`--lastro-clearance-nav` recalculado**, não só reduzido — a pílula flutuante soma respiro vertical interno (`e-2` × 2) e a folga que a separa da borda (`e-3`) ao que já existia (altura do alvo + área segura). Sem isso o conteúdo por trás ficaria menos protegido do que antes, quando a barra encostava direto no rodapé.

**Verificado no navegador real** (extensão Chrome, login QA), em 4 telas (Início, Coach, Análise, Bancada): pílula flutua com margem visível dos três lados, item ativo mostra a pílula de fundo clara, nenhum conteúdo fica escondido atrás dela. Contraste da combinação nova (verde-ação sobre `--lastro-sup-2`, que não existia antes — o item ativo antes ficava sobre o vidro da barra, não sobre uma superfície própria) medido ao vivo: **5,69:1** (ativo) e **6,30:1** (inativo) — ambos folgados acima do piso AA. Alvo de toque do item ativo: 48px de altura, bate `--lastro-alvo-min`.

**Impacto.** `src/app/tokens.css` (token novo + `--lastro-clearance-nav` recalculado), `src/app/sistema.css` (`.nav` reescrita). Nenhum arquivo `.tsx` tocado — `aba-inferior.tsx` não mudou, só o CSS que o estiliza. `tsc`, 104 testes, lint e `npm run build` limpos. Branch `feat/nav-inferior-pilula`.

**Como reverter.** `git checkout -- src/app/tokens.css src/app/sistema.css` ou `git revert` do commit.

## 2026-08-10 (6) — Nav inferior: legibilidade pra usuário mais velho, tingimento em petróleo

**O que mudou.** Duas correções na pílula recém-criada (entrada anterior), a partir de feedback direto do dono sobre acessibilidade real, não WCAG numérico: *"pensando na usabilidade, se alguém mais velho for utilizar, pode tá muito apagado."*

1. **Texto/ícone inativo:** subiu de `--lastro-txt-3` (o tom mais fraco do sistema, reservado a metadado — nunca pensado pra navegação primária) para `--lastro-txt-2`, com peso 500→600. Item ativo sobe junto, 600→700 (`--lastro-peso-max`), pra manter a diferença de peso entre os dois estados.
2. **Fundo da pílula tingido de petróleo:** o dono pediu explicitamente a cor da barra de topo (`--lastro-barra-a`), bem diluída — não o verde de ação (checado com ele antes de mexer: "verde é a ação, e só a ação" continua valendo, essa é OUTRA cor, já reservada ao topo). Tokens novos `--lastro-vidro-nav` (`rgba(23,65,79,0.16)`) e `--lastro-vidro-nav-opaco` (`#CDCFC9`, fallback sólido) substituem os antigos `--lastro-vidro`/`--lastro-vidro-opaco` (baseados em sup-1, quase brancos) só na aba inferior — os tokens antigos continuam existindo pra quem mais usa.

**Achado de medição — a primeira tentativa de medir deu errado, corrigido antes de aceitar o número.** `getComputedStyle(nav).backgroundColor` devolve o `rgba` **cru**, sem misturar com o que está atrás — medir contraste direto contra isso dá `1.36:1` (leitura de um fundo quase preto que não existe na tela). O fundo é translúcido; o contraste real depende do que está atrás. Composto à mão (alpha blend correto) contra `--lastro-fundo` (o backdrop real, confirmado via `getComputedStyle(document.body)`): **5,16:1** — passa AA. Testado também contra o backdrop mais claro possível (`--lastro-sup-1`) — contraste só melhora (fundo mais claro favorece texto escuro), então `--lastro-fundo` já é o pior caso.

**Verificado no navegador real:** ícones/rótulos claramente mais escuros e mais pesados; a pílula lê como tingida (cinza-esverdeada), não mais quase-branca — visualmente ligada à barra de topo sem ficar escura. `npx tsc`, testes, lint e `npm run build` limpos.

**Impacto.** `src/app/tokens.css` (2 tokens novos), `src/app/sistema.css` (`.nav`/`.nav a`/`[aria-current]`). Nenhum `.tsx` tocado.

**Como reverter.** `git checkout -- src/app/tokens.css src/app/sistema.css` ou `git revert` do commit.

## 2026-08-11 (2) — Nav: petróleo de verdade, corrigido depois de feedback direto no celular

**O que mudou.** Dois PRs seguidos (#25) corrigindo a pílula da entrada anterior (PR #22 — vidro quase transparente tingido, "não ficou legal" segundo o dono depois de testar no aparelho real).

**Correção 1 — cor.** O dono pediu o oposto do que eu tinha feito: a pílula precisa **ser** a cor petróleo (mais clara que `--lastro-barra-a`, não um vidro diluído em 16% de alpha). Sem fundo areia no item ativo — destaque só por **traço mais grosso** do ícone (`--lastro-nav-traco-ativo`, 2→2.75) e **peso maior** da letra (600→700). Calibrado por contraste medido em três voltas: 0.55 de alpha reprovou (2,24:1/2,91:1), 0.78 com texto a 0.94 de opacidade bateu (**4,78:1/5,16:1**).

**Correção 2 — o contorno "sumiu".** O dono reclamou "cadê a alteração que pedi" sobre o contorno dos ícones. Testando eu mesmo (não só relatando), achei a causa: o contorno usava sombra **escura**, que ficou invisível porque a Correção 1, na mesma leva, também escureceu o fundo da pílula. Contorno escuro sobre fundo escuro não aparece — erro meu, de não re-checar uma decisão anterior (o contorno) contra uma mudança nova (o fundo). Trocado para halo **claro** (mesma tinta do texto, blur 2px, opacidade 0.9) — visível na captura.

**`DESIGN.md` §3.0/D5 amendado de novo:** duas superfícies petróleo agora (a barra de topo continua a mais escura das duas), não mais uma só.

**Fluxo desta vez:** implementei tudo local primeiro, sem commit, aguardando aprovação visual — o dono pediu explicitamente pra não empurrar até ele olhar. Só depois de ele confirmar (mesmo indiretamente, ao pedir "subir pra main pra eu testar no aparelho") é que commitei, empurrei, abri PR e mergeei.

**Impacto.** `src/app/tokens.css`, `src/app/sistema.css`, `DESIGN.md`. Nenhum `.tsx` tocado. `tsc`, 104 testes, lint e build limpos nos dois commits.

**Ainda em aberto:** confirmação do dono no aparelho real, depois do deploy da Vercel completar.

**Como reverter.** `git revert ea69168`.

## 2026-08-12 — Ajustes na pílula: Coach vira sub-tela, perfil e Sair ganham lar

**O que mudou.** Pedido direto do dono, passou por brainstorm antes do código (`AskUserQuestion` em 3 pontos): a 5ª posição da pílula, hoje "Coach", vira "Ajustes" (engrenagem, rótulo escolhido entre "Config"/"Ajustes"/"Perfil"/"Configuração (sem abreviar)" — "Ajustes" venceu por caber no mesmo padrão de tamanho dos outros rótulos). Dentro de `/ajustes`: card de perfil (leva pra `/perfil`, novo), linha "Coach" (leva pra `/coach`, que continua existindo, só sem link direto na pílula) e botão "Sair" (que só existia na Início até aqui — saiu de lá, "evita repetição" nas palavras do dono). `/perfil` ganhou upload de foto de verdade, fechando o item 13 de `PROGRESS.md` (pendente desde 2026-08-07: quem cadastra por e-mail não tem avatar do Google pra baixar).

**Por que Coach perde o acesso de 1 toque.** Decisão explícita do dono, não inferida: perfil e Sair não tinham lugar nenhum (perfil nem tela própria tinha), e juntar os três embaixo de uma coisa só "otimiza" a pílula. Coach continua inteiro, só a 1 toque a mais de distância.

**Processo:** `brainstorming` → spec (`docs/superpowers/specs/2026-08-12-ajustes-nav-perfil-design.md`) → `writing-plans` (`docs/superpowers/plans/2026-08-12-ajustes-nav-perfil.md`, 10 tasks) → `subagent-driven-development` (implementador + spec-reviewer + code-quality-reviewer por task). Detalhe de execução, achados e verificação ponta a ponta: `PROGRESS.md`, item 17 de "Pendências consolidadas".

**Achado de arquitetura, o mais caro da sessão.** O plano assumia que `"use server"` **inline** dentro do corpo de uma função isolava só ela pro bundle do cliente, deixando o resto do arquivo (`perfil.ts`, com `obterPerfil`/`sincronizarAvatarGoogle` usando `next/headers`/`next/cache`) livre. Errado para o Turbopack deste Next 16.3.0: `npm run build` (não `tsc`, não os testes, não os dois primeiros reviews — só o build de produção) quebrou com `Error: You're importing a module that depends on "next/headers"`. Corrigido movendo a Server Action pra arquivo próprio (`src/lib/dados/atualizar-avatar.ts`), `"use server"` no topo do arquivo inteiro — o padrão que `treino.ts`/`auth.ts` já usavam. Regra geral daqui pra frente: Server Action chamada por Client Component nunca divide arquivo com função server-only comum.

**Bug pego no review antes de existir usuário real:** caminho de upload determinístico por formato (`{uid}/avatar.jpg`) + `upsert:true` fazia a segunda troca de foto do mesmo formato gerar a mesma URL — nem banco nem navegador percebiam a mudança. Corrigido com cache-buster (`?v=timestamp`) persistido na própria `avatar_url`, e `revalidatePath("/", "layout")` acrescentado (padrão já usado em `criarTreino`) pra não depender só de estado local do componente.

**Verificado no navegador real** (usuário QA efêmero, extensão Chrome — painel interno de novo não compositou frame, mesma limitação de sempre; upload real via `file_upload` da extensão, não clique em seletor nativo): fluxo completo pílula → Ajustes → Perfil → upload → avatar atualizado em outras telas sem reload → Sair encerrando sessão de verdade. Detalhe telha por telha em `PROGRESS.md`.

**Impacto.** `src/components/aba-inferior.tsx`, `src/app/ajustes/page.tsx` (novo), `src/app/perfil/page.tsx` (novo), `src/components/editar-perfil.tsx` (novo), `src/lib/dados/atualizar-avatar.ts` (novo), `src/lib/dados/validar-avatar.ts` (novo), `src/lib/dados/perfil.ts`, `src/app/coach/page.tsx`, `src/app/page.tsx`, `src/app/sistema.css` (1 regra utilitária, sem token novo). `DESIGN.md` não mudou — nenhuma cor/tipografia nova, só reuso de classes já medidas.

**Mergeado.** [PR #26](https://github.com/GuilhermeSaldanha02/lastro/pull/26) na `main`, branch apagada. Confirmado pelo dono no aparelho real, mesmo dia: "tudo está rodando corretamente".

**Como reverter.** `git revert` do merge commit do PR #26.

## 2026-08-12 (2) — `fix/consistencia-visual-telas` reconciliada: já estava tudo na `main`

**O que aconteceu.** Ao revisar o backlog, a branch `fix/consistencia-visual-telas` (aberta 2026-08-07, PROGRESS.md item 14) aparecia como "pausada, não mergeada, 20 commits à frente de `main`". Rodei `git merge-base --is-ancestor fix/consistencia-visual-telas main` pra checar o estado real antes do dono decidir o que fazer com ela — **deu positivo**: o tip da branch (`fb7e671`) já era ancestral direto da `main`. `git diff main...fix/consistencia-visual-telas --stat` confirmou zero diferença de conteúdo.

**Conclusão:** não existe mais nada pra mergear. Em algum momento entre 08/10 e agora o trabalho da branch entrou na `main` por outro caminho (provavelmente as sessões de correção da cor petróleo da nav, que tocaram os mesmos arquivos), e a branch só ficou como ponteiro órfão — nunca apagada. Não é perda de trabalho, é limpeza de referência.

**Ação:** `git branch -d` local (delete seguro, só funciona porque git confirma que está mergeada) + `git push origin --delete` remoto. `PROGRESS.md` item 14 corrigido pra refletir isso.

**O que continua genuinamente em aberto** (não é sobre a branch, é sobre decisão do dono — confirmado por leitura direta do código hoje, não só do doc):
- **C1b — RIR na linha de série.** Conferido em `src/components/treino-detalhe.tsx`: a linha da série mostra `reps × peso kg` + o rótulo (aquecimento/valendo), **sem RIR**. Continua sendo feature nova, não polimento — decisão do dono.
- **Zero pontuado do IBM Plex Mono** (`--lastro-fonte-num`) — sinalizado 2x pelo dono como visualmente ruim, mas nunca decidido trocar; `DESIGN.md` §3.3 documenta o estado atual como escolha deliberada, não como pendência técnica.

**Impacto.** Só `PROGRESS.md`. Nenhum arquivo de `src/` tocado — é reconciliação de registro, não mudança de produto.

**Como reverter.** N/A (só documentação; a branch apagada pode ser recriada a partir do commit `fb7e671` se algum dia precisar, mas ele já está na história da `main`).

## 2026-08-13 — Auditoria de usabilidade + escopo da próxima fase aprovado pelo dono

**Contexto.** O dono pediu uma auditoria de usabilidade do estado atual do app, com o agente de design navegando o Chrome. **O agente não navegou** — a doutrina do `diretor-arte` (`.claude/agents/diretor-arte.md`) proíbe explicitamente alegar ter olhado tela ("Você NÃO executa o gate visual — você o especifica"). O arranjo que respeita as duas coisas: **o controller navegou o app real** (extensão Chrome, usuário QA efêmero com 4 semanas de dado real, removido ao final com cascade = 0), capturou as 7 telas, e o agente analisou as evidências contra `DESIGN.md`.

**Achado P0 — avatar de iniciais invisível em `/perfil`.** Não é baixo contraste: preenchimento (`--lastro-avatar-iniciais-fundo`), letra (`--lastro-barra-txt`) e **borda** (`--lastro-barra-traco`) compõem os três para a própria areia `#F0EAE0` do fundo. O agente achou a terceira propriedade (a borda) que o relato do controller não continha — uma correção que só trocasse fundo e letra deixaria o círculo sem aresta.

Causa raiz que importa mais que o sintoma: `<Avatar>` foi desenhado com o **default seguro no contexto errado** — só funciona dentro de `.barra-topo`, e falha em silêncio em qualquer outro lugar. `/perfil` (2026-08-12) foi só o primeiro lugar a exercitar isso. **Correção especificada: inverter o default** (variante clara vira base, petróleo vira override sob `.barra-topo`), não adicionar classe opt-in — porque opt-in alguém esquece de aplicar e o bug volta. Zero tokens novos: os três pares já estavam medidos em §3.2.

**Rejeitado com razão registrada:** chip petróleo fora da barra criaria uma **terceira** superfície petróleo, contra §3.0 que fixa duas. Não se reescreve §3.0 por um elemento de 48px.

**Achado do dono, no aparelho real (mesmo dia): botão "Registrar treino" em `/analise` é redundante.** *"se já existe o iniciar treino no início, não precisa desse ícone"*. Ele tem razão por decisão já registrada, não por gosto: a Início é a porta de entrada única do app (2026-08-06), e um terceiro botão verde de ação primária numa tela cujo propósito é **ler** dilui a hierarquia que §3.0 exige (um elemento pesa mais por tela).

**Escopo da próxima fase — pesquisa de mercado cruzada com o `PRD.md` §5.** Pesquisados Hevy e Strong (as réguas nomeadas em §8 do PRD) e a literatura sobre abandono de log. Achado central da pesquisa: **o que mata o hábito é fricção, não falta de recurso.** 7 candidatos levados ao dono, filtrados pelo escopo negativo. **Aprovados 5:**

| Item | Observação verificada no código |
|---|---|
| Coluna "anterior" na linha de série | Levantado em 2026-08-08, nunca decidido. Exige histórico por exercício — é feature de dados |
| Repetir última série (corrigir semântica) | **Já existe** (`treino-detalhe.tsx:152`/`:407`) mas repete a última do **treino inteiro**, não do exercício. O dono notou que "bate exatamente com o 1" — e bate: vira uma coisa só |
| Calculadora de anilhas | Novo. Em aberto: conjunto de anilhas fixo ou configurável |
| Recorde pessoal visível | **`calcularPrs` já está pronto e testado** (`src/lib/analise/prs.ts`), mas só alimenta o texto do parecer — **nenhuma tela mostra um PR**. Funcionalidade construída e invisível |
| Excluir a própria conta | Cascade já funciona (é o que o `qa-treino-helper.sh` usa). Falta só a porta na UI |

**Não aprovados, registrados e não esquecidos:** cronômetro de descanso automático e exportar histórico (CSV/JSON). **Recomendados como não-fazer** (nem oferecidos, contrariam §5): rotinas/templates salvos (chega perto de prescrever programa), supersets, heatmap muscular, medidas corporais, integração Health/Fit.

**Sobre os 5 cards idênticos de `/analise`:** confirmado por evidência visual que o sintoma do rediagnóstico de 2026-08-08 persiste. Recomendação do agente: **não** retomar o deck de 10 movimentos (bloqueado em decisões abertas do dono); promover **uma** pergunta a primária e densificar as outras quatro, com teto rígido em `--lastro-t-3` para não competir com a conclusão do gráfico (§3.7). Qual pergunta vira primária é decisão do dono.

**Impacto.** `docs/BACKLOG-PROXIMA-FASE.md` (novo, autocontido), `PROGRESS.md` (ponto de retomada aponta pra ele), este arquivo. **Nenhum arquivo de `src/` tocado** — nada foi implementado nesta sessão, de propósito: o dono pediu o documento para começar num chat novo.

**Como reverter.** N/A (só documentação).

---

## 2026-08-13 (2) — Proposta do dono ("configuração de treinos") avaliada contra `PRD.md` §5/§9 — Scope Change em aberto, decisão pendente

**Contexto.** Ao decidir onde morar o botão "repetir" para corrigir C2 (`repetirUltimaSerie` usa `series[series.length - 1]` — a última série do **treino inteiro**, `src/components/treino-detalhe.tsx:101,152`, não a última do exercício específico), foram apresentadas ao dono duas opções técnicas restritas (mover o botão para dentro de cada grupo de exercício já registrado, vs. manter o botão único e adicionar um por exercício no formulário). A resposta foi além do que foi perguntado — texto literal do dono:

> "quero ambos, por isso precisa ser revisto a tela, chamar dois agentes e pesquisar sobre e ver qual a melhor maneira de manter sem que o usuario tenha algum conflito, uma das maneira que eu pensei e abrir um tela chamada, configuração de treinos, assim a pessoa podendo montar os treinos dela antes e no dia ela selecionar, treino já montado ou treino novo, caso for treino novo configura, não sei como, so estou falando oque vem de pensamento, procurar com eles (agentes) e pesquisa a melhor maneira de realizar isso"

Ou seja: uma tela nova onde a pessoa monta treinos com antecedência (uma lista de exercícios salva) e, no dia, escolhe "treino já montado" (carrega a lista) ou "treino novo" (fluxo atual).

**O que `PRD.md` §5 diz, citação exata:**
> "❌ Planos e periodizações gerados automaticamente. O app **analisa** o que foi feito; não prescreve programa."

**O que `PRD.md` §9 já resolveu no portão de aprovação (2026-08-04), citação exata:**
> "**Sem tela de configuração de rotina.** O dono anota o que treinou; a Análise **deriva o padrão real dos dados registrados** em vez de comparar com uma divisão declarada. Consequência: a pergunta 'meu volume está equilibrado?' não compara com um plano — ela detecta o padrão efetivo e aponta grupos musculares negligenciados. Isso mede o que foi feito, não o que foi prometido, e elimina uma tela inteira do MVP."

Essa decisão (ADR-008, `DECISIONS.md` 2026-08-04 "Sem tela de rotina") já descartou explicitamente a alternativa "Configurador de divisão (ABC / Upper-Lower / Full body)".

E o próprio `docs/BACKLOG-PROXIMA-FASE.md` seção D, escrito nesta mesma sessão (2026-08-13), já registra: "**Também levantados pela pesquisa e recomendados como NÃO fazer** (não foram nem oferecidos ao dono, porque contrariam o `PRD.md` §5): rotinas/templates salvos (chega perto de prescrever programa)..." — a pesquisa de mercado já tinha visto essa categoria de feature e a descartou preventivamente, sem nem apresentar ao dono, exatamente por esse motivo.

**Avaliação, sem condescendência.** A ideia do dono não é literalmente "plano gerado automaticamente" — a lista de exercícios seria escrita manualmente por ele, não gerada por IA nem prescrita pelo app. Nesse sentido estrito, não viola a letra de §5 (que fala de geração **automática**). Mas ela reproduz **exatamente** a "tela de configuração de rotina" que §9 resolveu não ter, com a mesma alternativa ("Configurador de divisão") já descartada por nome no ADR-008. E é, por definição, o item "rotinas/templates salvos" que a pesquisa desta sessão classificou como "chega perto de prescrever programa" e nem chegou a oferecer. Uma tela onde o dono pré-declara "treino A = supino, agachamento, remada" e depois seleciona "treino A" no dia é uma divisão declarada com nome — a diferença entre isso e "prescrever programa" é de grau, não de tipo: o app passaria a ter o conceito de "um treino planejado com antecedência" na estrutura de dados, algo que §9 rejeitou deliberadamente em nome de medir o que foi feito, não o que foi prometido. **Não existe leitura honesta em que isso "cabe no MVP como está".**

**Classificação (protocolo de Scope Change).** **ADIÇÃO condicionada a reabrir uma decisão já resolvida** — não é "não é scope change": toca `PRD.md` §5 e §9 diretamente e contraria ADR-008 por nome. Também não é "VERSÃO NOVA": não muda a tese do produto (a Análise Semanal continua sendo a peça-assinatura; isto é sobre a tela de registro). Mas por reabrir uma decisão já fechada no portão de aprovação, não pode ser implementada em silêncio — precisa de confirmação explícita do dono, atualização do texto do PRD §9 (não do congelamento geral) e registro aqui, o que esta entrada já inicia.

**Três opções apresentadas — nenhuma decidida aqui.**

**Opção 1 — Só corrigir C2, sem tela nova (mínimo, já dentro do backlog aprovado).**
**Os dois pontos de entrada sobrevivem** — o botão único de 1 toque (repete a última série do exercício em foco no momento) e um "repetir" dentro do formulário por exercício —, ambos passam a filtrar por `exercicioId` antes de pegar a última série, e ambos chamam a mesma função (`repetirUltimaSerieDoExercicio(exercicioId)`), não duas lógicas paralelas. É o mesmo padrão "um handler, duas entradas" que o dono já aprovou em B1 (botão "Solicitar Análise" + card primário disparando `perguntar(numeroPerguntaPrimaria)`). Construído junto com C1 (coluna "anterior" na linha, que já exige a mesma consulta de histórico por exercício — o backlog já trata os dois como uma coisa só). Zero telas novas, zero mudança no PRD. Resolve o bug relatado e verificado nesta sessão, sem aposentar nada que ele pediu para manter ("quero ambos" — resposta à pergunta A/B original). **Não** resolve a ambição maior do dono (montar um treino com antecedência para reaproveitar em outro dia) — só corrige o que já estava quebrado.

**Opção 2 — Tela "Configuração de Treinos", como o dono descreveu.**
Nova tela: criar/nomear um "treino salvo" (lista de exercícios, sem prescrever séries/reps/carga — isso continua sendo decidido no registro do dia). Ao iniciar um treino, escolher "treino já montado" (pré-popula os exercícios a registrar) ou "treino novo" (fluxo atual, sem alteração). Isso **reabre e reverte** a decisão §9/ADR-008. Exige: atualizar `PRD.md` §9 com a nova decisão (não editar em silêncio — é o próprio protocolo de Scope Change), avaliar impacto em ADR/SDD, e decidir explicitamente que a pergunta "meu volume está equilibrado?" continua comparando com o padrão real dos dados (não passa a comparar com o plano salvo — isso sim cruzaria para prescrição). É a opção de maior escopo das três.

**Opção 3 — Híbrida: "repetir treino anterior" a partir do histórico real, sem tela de configuração.**
Em vez de uma tela onde o dono pré-cadastra treinos do zero antes de qualquer sessão real acontecer, ao iniciar um treino novo o app mostra os últimos treinos distintos já registrados (por combinação de exercícios) como atalho, com uma ação "usar esses exercícios de novo" — carrega a lista de exercícios daquele treino passado, sem criar peso, reps ou séries automaticamente. Não existe conceito de "treino planejado com antecedência" na estrutura de dados — é derivado do que já foi feito, coerente com a letra de §9 ("a Análise deriva o padrão real dos dados registrados"). Atende à motivação real do dono (não escolher exercício por exercício do zero toda vez) sem reabrir §9 nem chegar perto de §5. Ainda é ADIÇÃO de escopo (feature nova, precisa entrar no PRD como complemento), mas não exige reverter nada já decidido.

**Recomendação deste agente, para levar ao dono — não é decisão tomada.** Opção 1 acontece de qualquer forma — é bug verificado, já dentro do escopo aprovado, sem Scope Change. Entre Opção 2 e Opção 3, a diferença real não é "quanto trabalho" — é se a lista de exercícios de um "treino já montado" é **escrita com antecedência, num dia em que a pessoa não está treinando** (Opção 2, reabre §9/ADR-008), ou **derivada de um treino que já aconteceu de verdade** (Opção 3, mantém §9 intacto). Opção 3 entrega a experiência "treino já montado" que o dono descreveu — a diferença é só de onde a lista vem, não se o recurso existe. Não é prêmio de consolação por Opção 2; é uma resposta real, só que sem reabrir uma decisão que ele mesmo tomou conscientemente em 2026-08-04. Mas só ele sabe se "montar antes de qualquer treino acontecer" é parte do que ele quer — por isso a pergunta abaixo, não um menu.

**Nota sobre a forma de perguntar.** Apresentar 1/2/3 lado a lado tende a voltar como "quero todas" — foi exatamente o que aconteceu na rodada B1 deste mesmo backlog ("quero manter sim os cards... também quero o que lhe disse o botão, ambos") e é o padrão da resposta que gerou esta entrada ("quero ambos"). Opção 1 não é opcional — ela resolve o bug e entra de qualquer forma. O que precisa ir ao dono é uma pergunta única, que separa Opção 2 de Opção 3 sem forçá-lo a escolher lados que ele pode não ver como excludentes.

**Impacto.** Nenhum código tocado. `PRD.md` **não foi editado** (está congelado; qualquer uma das três opções, se aprovada, gera edição registrada separadamente). Esta entrada é a análise de escopo pedida pelo dono antes de qualquer linha de implementação de C1/C2.

**Como reverter.** N/A — é registro de análise, não mudança de código ou de contrato.

---

## 2026-08-13 (3) — Decisão do dono: Opção 2 confirmada, com limites explícitos — reversão consciente de `PRD.md` §9/ADR-008

**O que mudou.** O dono respondeu à pergunta discriminante da entrada anterior (2026-08-13 (2)), de próprio punho:

> "eu quero que a pessoa possa fazer como eu lhe disse, mas que elas tambem possa ter como configurar (não peso e nem repetições) mas os exercicios que ela ja faz, ai questão de series e pesos ela prenche normalmente, mas ai como lhe disse dessa de exercicios ela ja pode (opcional) ja configurar os exercicios que faz, essa pagina vai ficar lá em configurações"

Confirma **Opção 2** ("Tela Configuração de Treinos", pré-cadastro escrito com antecedência) e não Opção 3 (derivada de treino já realizado) — o dono quer poder montar a lista de exercícios **antes** de qualquer sessão real acontecer. Com quatro limites que o próprio texto já fixa, sem margem de interpretação:

1. **A pré-configuração é só a lista de exercícios.** Nunca série, peso ou reps — isso "ela prenche normalmente", no fluxo de registro do dia, sem mudança. O "treino salvo" é uma lista de `exercicioId`, nada além disso.
2. **É opcional.** Quem não configura nada usa o app exatamente como hoje. "Treino novo" continua existindo e é o caminho padrão para quem não montou nada — não é substituído, é complementado.
3. **A tela mora em `/ajustes` (Configurações)**, não em rota nova solta na navegação principal.
4. **No dia do treino, a pessoa escolhe** entre o(s) treino(s) já montado(s) (pré-popula os exercícios a registrar) ou começar do zero (fluxo atual, inalterado).

**Por quê isso é reversão consciente, não silenciosa, de `PRD.md` §5 e §9.** §9 (2026-08-04) resolveu explicitamente "Sem tela de configuração de rotina" e descartou por nome o "Configurador de divisão (ABC / Upper-Lower / Full body)" — é ADR-008. A tela que o dono pediu agora é, por definição, esse configurador. A diferença que evita cruzar para §5 ("não prescreve programa") é o mesmo limite que o dono impôs sozinho, sem ser perguntado sobre isso: a lista de exercícios não carrega série/peso/reps, e a pergunta "meu volume está equilibrado?" continua **derivando o padrão real dos dados registrados**, não comparando com o treino salvo — o treino salvo é atalho de UI para o registro do dia, não um plano que a Análise passa a usar como referência. Essa distinção não muda com esta decisão: nenhuma métrica da Análise Semanal passa a ler a tabela de treinos salvos.

**Classificação (protocolo de Scope Change).** **ADIÇÃO** — complementa o MVP (uma tela nova em Ajustes, opcional, sem prescrição de série/peso/carga), não muda a tese do produto (a Análise Semanal continua a peça-assinatura, continua medindo o que foi feito). Não é VERSÃO NOVA.

**Alternativa descartada.** Opção 3 (derivar "treino já montado" do histórico real, sem tela de pré-cadastro) — era a recomendação deste agente por manter §9 intacto sem reabri-la, mas o dono, ao responder, deixou claro que quer o pré-cadastro escrito com antecedência ("configurar os exercícios que faz" antes do dia), não uma sugestão derivada de sessões passadas. Opção 1 (só corrigir C2, sem tela nova) segue implementada de qualquer forma — é bug já verificado, dentro do escopo aprovado, independente desta decisão.

**Impacto.** `PRD.md` §9 editado nesta mesma entrada de trabalho para registrar a decisão revista (ver diff em `PRD.md`). `ADR.md` e `SDD.md` **não tocados aqui** — ficam com o `arquiteto`, que escreve a spec técnica em paralelo. Nenhum código implementado ainda.

**Como reverter.** Editar `PRD.md` §9 de volta e registrar nova entrada aqui — nunca reescrever esta. Nenhuma migração de dado envolvida ainda, porque nada foi implementado.

---

## 2026-08-15 — Redesenho: as 10 decisões do dono, com evidência

**Contexto.** Depois de reprovar duas propostas de composição ("nada de linhas soltas, nada de blocos soltos, não é um site, é um aplicativo"), o dono pediu estudo em partes sequenciais e decidiu item a item, olhando cada opção renderizada com a paleta real. Estudo em `docs/ESTUDO-REDESENHO.md`; o que construir, em `docs/BACKLOG-REDESENHO.md`.

**Travas dadas por ele, válidas em todas as 10:** paleta inteira e pílula de navegação intocadas; todo o resto aberto — inclusive a tipografia, que o estudo anterior havia cercado como aprovada.

| # | Decisão | Alternativa descartada | Por quê |
|---|---|---|---|
| D1 | **Fraunces** (voz) · **Archivo condensada** (dado) · **Bricolage** (corpo) | A (tudo Archivo) e C (tudo Fraunces+Bricolage), que ele gostou separadamente | Não é meio-termo, é divisão de trabalho: a serifa carrega a prosa do parecer (o produto), a condensada carrega carga/e1RM/volume (o dado). Espelha a tese "o log é infraestrutura, o produto é a leitura". **Custo aceito: 3 famílias** — o HIG alerta contra misturar muitas, então a terceira só se sustenta como papel funcional, nunca decoração |
| D2 | **6 papéis nomeados**, não números | "só encolher para 6 números" (minha proposta original) | **A pesquisa corrigiu minha recomendação.** M3 tem 15 estilos e o HIG ~11 — nenhum defende "menos degraus". O M3 diz: *"No single product will use all the styles… select styles from the scale that are most appropriate"*. O defeito do lastro não era o número 10, era `t-1/t-2/t-3` serem números sem função: sem papel, cada tela escolhe por gosto. Piso de 14px respeitado |
| D3 | **Dois padrões, decididos pelo que a linha É**: navega → recipiente macio + chevron; dado → sem recipiente, em grade | 9 variações de "como desenhar uma lista" | Eu estava errando a pergunta. Oura e Gentler Streak (Apple Design Award 2024) não escolhem um tratamento para tudo — escolhem dois. **Medido a 360px:** 6 anilhas em grade = 88px, contra 372px em linhas |
| D4 | Ação usa o **mesmo recipiente, sem chevron** | pílula/chip (minha recomendação) | **Decisão do dono contra a minha recomendação.** Risco que levantei e ele aceitou: seta ausente é pista fraca. Mitigação combinada: segundo canal por classe gramatical — **navegação usa substantivo, ação usa verbo** |
| D5 | **Sem barra de topo**; o título é conteúdo e rola junto | barra de 1 linha; barra que encolhe ao rolar | Dos 5 apps olhados, **nenhum** usa barra de 2 linhas, e os dois premiados (Structured, finalista ADA 2026; Gentler Streak, ADA 2024) não usam barra nenhuma. Devolve os 88px inteiros de `--lastro-clearance-topo`, não os ~36 da versão compacta |
| D6 | **Folha** nas tarefas curtas | tudo continuar rota | HIG define folha para "tarefa curta e delimitada sem perder o contexto". Reforça a D5: sem barra fixa, folha dispensa botão de voltar. **Muda rota e histórico — não é CSS** |
| D7 | **Conjunto contido do M3, sem container transform** | container transform, mesmo em um lugar só | Pedido do dono: "não pode ser algo até demais". O M3 define o padrão por lugar — pílula (top-level) **só esmaece**, sem deslize nem elemento persistente; sub-tela desliza; folha sobe. Container transform é, pelo próprio M3, "o mais expressivo" — descartado. Custo caiu: **Next 16 traz `ViewTransition` do React nativo** (conferido na doc instalada) |
| D8 | **Modo de edição** | deslizar; menu de excesso; toque longo | Único que serve à grade **e** às listas — deslizar é gesto de linha, não existe em grade. Consequência forçada pela D3: sem recipiente por anilha, não há onde pendurar a lixeira. HIG registra o padrão para iOS. Confirmação em duas etapas permanece |
| D9 | **Não fazer háptico** | fazer só onde funciona; contorno não oficial | **Verificado, e derrubou minha própria sugestão:** iOS não expõe Vibration API a web/PWA, e continua assim em 2026 (~77% de suporte global, tudo Android/Chrome). O dono usa iPhone — seria trabalho para um efeito que ele nunca sentiria |
| D10 | **`/login` prova a direção primeiro** | `/ajustes/anilhas`; `/analise` | Escolha do dono, motivada por suspeita dele de "2 caminhos quando abre o link". A suspeita procede — ver entrada seguinte |

**Como reverter:** cada decisão é independente das outras exceto D8, que é consequência forçada da D3. D1 a D4 e D7 são reversíveis por token. D5, D6 e D8 tocam estrutura e exigem reversão por PR.

---

## 2026-08-15 (2) — Três defeitos reais no fluxo de entrada, achados ao investigar suspeita do dono

O dono disse: *"a tela de login, os caminhos dela, até parece que existe 2 caminhos quando abre o link, um antes e um depois"*. Investigado, e **procede** — são três coisas distintas, nenhuma delas conhecida antes:

1. **Duas telas de entrada de verdade.** `/` sem sessão (`src/app/page.tsx:56`) renderiza tela própria (marca + subtítulo + botão "Entrar") que leva a `/login`, o formulário real. Duas telas para uma coisa. Fundir ou manter é **decisão do dono**, porque "home como porta de entrada única" foi decisão dele em 2026-08-06.

2. **Parâmetro de retorno morto nas duas pontas** (verificado por busca em todo `src/`): `src/proxy.ts:49` escreve `?proximo=` e ninguém lê; `src/app/auth/callback/route.ts:18` lê `?next=` e ninguém escreve. Efeito: abrir `/analise` sem sessão → login → cair em `/` depois de entrar, não em `/analise`.

3. **`ForcarInicioNoLancamento` pisca.** `window.location.replace("/")` dentro de `useEffect` roda **depois** da pintura; no PWA instalado a tela errada aparece antes do salto. A regra (pedida pelo dono em 2026-08-07) continua certa; a execução é que pisca.

**Suspeita adicional, NÃO confirmada:** durante os testes, `/login` carregou com o título "lastro — sem conexão" (`public/offline.html`, servido pelo `sw.js` em falha de navegação). Observado em `npm run dev`, pode ser artefato do ambiente. Registrado como A4 no backlog para reproduzir em produção antes de tratar como defeito.

**Impacto:** vira a **Trilha A** do `docs/BACKLOG-REDESENHO.md`, separada do redesenho a pedido do dono — são defeitos, valem por si mesmo que o redesenho não aconteça.

---

## 2026-08-16 — Correção: D7 ("custo caiu") estava errado. `ViewTransition` exige React canary, não a versão instalada

Ao começar H3 (pílula/sub-tela), a nota de D7 ("Custo caiu: Next 16 traz `ViewTransition` do React nativo — conferido na doc instalada") foi verificada por execução, não só por leitura de doc — e a premissa **não procede**.

**O que a verificação anterior confundiu.** O arquivo `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md` existir no pacote do Next **não significa** que a versão de `react`/`react-dom` deste projeto exporta a API. Testado direto: `node -e "console.log(require('react').ViewTransition)"` → `undefined`. `react`/`react-dom` estão em `19.2.8` (`package.json`), o canal **estável**. `ViewTransition` só existe em `react@canary` (`19.3.0-canary-...`, confirmado via `npm view react@canary version`) ou `react@experimental` — canais que mudam sem aviso semver, sem garantia de compatibilidade entre atualizações.

**Decisão do dono, apresentada com 3 caminhos:** não trocar o canal do React por uma peça de transição visual — risco desproporcional pra um app pessoal já em produção. Escolhido **crossfade implementado à mão** (CSS puro, sem `ViewTransition`) em vez de (a) trocar pra `react@canary` ou (b) deixar H3 pendente sem entregar nada.

**Custo real do caminho escolhido, honesto:** sem a API nativa, não há como coordenar a saída (fade-out) do conteúdo antigo — o Next troca a árvore de rota instantaneamente antes de qualquer animação de saída poder rodar sem um mecanismo próprio de "segurar o conteúdo antigo por X ms", que é exatamente a complexidade que o `ViewTransition` existiria pra evitar (ver a doc do Next, seção de motivação). Por isso a implementação cobre só a **entrada** (fade-in) da tela nova — não é um crossfade simétrico. Registrado como escopo reduzido explícito, não escondido — ver `docs/BACKLOG-REDESENHO.md` (H3).

**D7 original não é revertida** (o "conjunto contido do M3, sem container transform" continua valendo) — só a frase "custo caiu" está desatualizada. Esta entrada é o registro append-only da correção, HD (log cronológico, nunca reescrever entrada antiga).

---

## 2026-08-17 — E2E com Playwright adotado; reversão de `CLAUDE.md:100` sobre verificação visual por subagente

**O que muda.** Duas decisões do dono, ligadas:

1. **E2E com Playwright, registrado como "candidato à Fase 6, não urgência" em `DECISIONS.md` 2026-08-06, agora é adotado.** MCP oficial (`@playwright/mcp`) instalado via `claude mcp add playwright -s user -- npx -y @playwright/mcp@latest` (escopo de usuário, não fica preso a este projeto). `ADR-004` continua não reescrito (append-only) — esta entrada é a atualização do fato, como já foi feito para Serwist/SW.

2. **`CLAUDE.md:100` ("Verificação visual é do controller — subagente não tem essa ferramenta de forma confiável") é revertida por instrução explícita do dono.** O dono pediu um protocolo de QA de 5 fases (test-plan → implementação → execução por subagente isolado com Playwright, sem editar código → correção → PR) em que o subagente **é** quem prova o item, com print + console cru + rede crua colados — não relatório de agente sem prova, que já era proibido e continua proibido. A regra antiga vira a exceção: eu (controller) ainda faço a verificação visual das minhas próprias mudanças de código (regra inalterada para esse caso), mas quando o objetivo é uma auditoria QA independente de quem implementou, o subagente dirige o navegador e anexa a prova crua — é o mecanismo, não uma degradação da régua.

**Por quê registrar agora, antes de rodar qualquer subagente.** Mesmo motivo do padrão D7/H1: se eu não corrigir `CLAUDE.md` agora, a próxima sessão lê a linha 100 e reverte a decisão sem saber que já foi tomada. `CLAUDE.md` §"Verificação" corrigido nesta mesma sessão.

**Limitação técnica encontrada, registrada por transparência.** O MCP do Playwright foi instalado *durante* a sessão em que foi decidido usá-lo — o registro de ferramentas desta conversa já estava montado antes da instalação, então `mcp__playwright__*` não carregou (confirmado por `ToolSearch` com múltiplas queries, nenhuma retornou). A auditoria desta sessão usa o painel Browser interno (`mcp__Claude_Browser__*`) em vez do Playwright — mesmo princípio (navegador real, print + console + rede crua), ferramenta diferente por causa dessa limitação de sessão. Sessões futuras devem ter `mcp__playwright__*` disponível desde o início.

**Fixture de auditoria.** Usuário de teste isolado criado no Supabase real via `scripts/qa-treino-helper.sh` (mesmo mecanismo do `qa-treino`), seedado com 15 treinos / 5 semanas via SQL direto (mesma técnica autorizada em `DECISIONS.md` 2026-08-06, porque a UI não permite data retroativa) — nunca dado do dono. Limpo ao final da auditoria.

**Como reverter.** Reverter esta entrada e a edição de `CLAUDE.md` §"Verificação" restaura a regra antiga. Não remove o MCP do Playwright instalado (isso é reversível separadamente, `claude mcp remove playwright`).

---

## 2026-08-17 (2) — Correção: a auditoria usou Claude in Chrome, não o painel Browser interno; achado de "3 vs 4 semanas" fechado como não-bug

**Correção de fato, sobre a entrada anterior.** "A auditoria desta sessão usa o painel Browser interno" **não procede** — testado por execução: o painel interno (`mcp__Claude_Browser__*`) não registra clique/digitação quando quem dirige é um subagente (confirmado no piloto da área 1 — `computer{action:"screenshot"}` retornava "Browser pane is not displayed"). A auditoria inteira (Fase 3, 143 itens) rodou de fato com a **extensão Claude in Chrome** (`mcp__claude-in-chrome__*`), que funcionou de ponta a ponta pra subagente. Mesmo padrão de honestidade de D7/H1: a entrada anterior fica, esta é o registro append-only da correção.

**Achado "divergência 3 vs 4 semanas de platô" (Fase 3, área 6) — investigado e fechado como não-bug.** `/api/progressao` (gráfico) usa `PLATO_GRAFICO_SEMANAS=3`, regra descritiva/visual; `/api/analise` (parecer da IA) usa `SEMANAS_ESTAGNACAO=4`, o limiar clínico. São dois cálculos DIFERENTES de propósito — já documentado no comentário de `src/lib/analise/limiares.ts:19` ("DIFERENTE de SEMANAS_ESTAGNACAO acima") e na decisão original de `DECISIONS.md` 2026-08-07 ("regra de platô do gráfico é descritiva, separada do limiar clínico do PRD §10"). O subagente de QA, sem esse contexto, reportou a divergência numérica como achado — correto reportar, mas não é bug. Dono confirmou não mexer: as duas telas continuam mostrando números diferentes de propósito, cada um respondendo uma pergunta diferente.

**Como reverter.** Não há o que reverter — registro de fato, não mudança de código.

---

## 2026-08-21 — Contraste de `--lastro-txt-3` corrigido; `DESIGN.md` §3.0–3.2/§4.2 marcado como stale contra o Apex Pro (escopo travado pelo dono)

**O que mudou.** `src/app/tokens.css`: `--lastro-txt-3` foi de `#64748B` para `#7C8DA6`. Remedido ao vivo em `/login` e `/catalogo`: 4,74:1 (`sup-3`, pior caso) · 5,18:1 (`sup-2`) · 5,56:1 (`sup-1`) · 5,90:1 (`fundo`) — todos acima do piso AA 4,5. Antes: 3,36 / 4,19 / 3,95 — reprovava nos três. Zero elemento reprovando no DOM real onde antes 104 reprovavam só no `/catalogo` e 14 na Home (medido antes/depois com o mesmo script, mesma tela, mesma sessão).

**Por quê.** Achado A05 da auditoria `docs/AUDITORIA-APEX-PRO.md` (2026-08-21): `--lastro-txt-3` reprovava contraste AA em toda superfície do Apex Pro, usado em 40 seletores de `sistema.css` (metadados, unidades, "Sem dica registrada", dias da semana). Não era só dívida documental — o `DESIGN.md` §3.2 linha C3 certificava esse mesmo par como **4,85, aprovado**, número calculado para a paleta areia (substituída em `8d30cf0`). O gate de contraste estava aprovando com medida de uma paleta que não existe mais.

**Escopo, decisão explícita do dono (opção 2 de duas apresentadas):** corrigir o contraste **só do tema padrão** (`:root`, "Obsidian Ouro") e reconciliar os documentos **só contra ele**. As outras 6 paletas do card de Tema (`docs/BACKLOG-PROXIMA-FASE.md` T1, **já mergeado, já no ar**) foram então medidas para saber o tamanho real da pendência.

**Achado ao medir — 3 das 6 paletas reprovavam o mesmo bug, ao vivo, hoje, não em teoria.** `petroleo` (4,20:1, pior caso), `moka` (4,39:1) e `branco-ouro` (3,86:1, e essa nem herdava a correção — tem `--lastro-txt-3` próprio) reprovavam o piso 4,5. `areia` (4,80), `clean` (4,51, margem apertada) e `oliva` (4,59) já passavam por herdarem `#7C8DA6` do `:root` sem redefinir superfícies escuras o bastante para derrubar a razão. Apresentado ao dono com números reais — **corrigir os 3 agora, na mesma leva, ele escolheu.**

**Os 3 corrigidos, mesma técnica, remedida ao vivo por tema** (`document.documentElement.setAttribute('data-tema', ...)`, sem precisar de UI):

| Tema | Antes (pior caso) | Depois | Valor |
|---|---|---|---|
| `petroleo` | 4,20 | **4,71** | `#8596AD` (override novo — antes herdava do `:root`) |
| `moka` | 4,39 | **4,74** | `#8293AB` (override novo) |
| `branco-ouro` | 3,86 | **4,89** | `#556478` (token próprio corrigido — tema claro, direção inversa: mais escuro aumenta contraste, não mais claro) |

**Achado novo, fora de escopo, registrado e NÃO corrigido agora.** Medindo `branco-ouro` por inteiro, apareceram **33 elementos reprovando por outros 3 tokens** — `--lastro-ouro` (#B8860B, pior caso 3,04), `--lastro-esmeralda-claro` (#34D399, **1,79**) e `--lastro-ciano` (#06B6D4, **2,43**) — nenhum relacionado a `txt-3`. Esses acentos foram calibrados para fundo escuro e nunca ajustados para o único tema claro; `branco-ouro` não os sobrescreve. É bug real, maior que o T3 (mexe em cor de marca, não em cinza neutro, e provavelmente afeta outros temas além do claro). Vira item novo no backlog — não é "os 6 temas ficam pra depois" genérico, é um achado específico e caracterizado.

**O que foi reconciliado em `DESIGN.md`:** banner datado no topo de §3 apontando o pivô Apex Pro; a linha `txt-3` de §3.1 e §3.2 corrigida com os números medidos hoje, mantendo o valor antigo riscado (não apagado — histórico); a linha C3 de §4.2 corrigida do mesmo jeito. **O que NÃO foi reconciliado, e fica marcado como tal:** as outras 16 linhas de §3.2 e as outras 13 linhas de C1–C14 continuam com número da paleta areia — não foram remedidas, e o documento agora diz isso explicitamente em vez de deixar implícito.

**Por que não reescrevi a tabela inteira.** Eu não tenho medição real dos outros 16 pares contra o Apex Pro nesta sessão — inventar número "aproximado" pelos tokens.css sem medir em navegador violaria a própria regra do documento (D8: "contraste AA medido, não estimado") e o E3 do projeto (nunca inventar dado). Marcar como stale e explicar o que falta é mais honesto que preencher com número não verificado.

**Alternativa descartada.** Reescrever `DESIGN.md` §3 inteiro para descrever o Apex Pro do zero — rejeitada porque exigiria inventar a razão de decisão por trás de cada token que outra sessão escolheu (ouro, esmeralda, obsidiana), e eu não estava naquela sessão. Isso seria fabricar histórico, não documentar. A reconciliação completa (remedir os 14 pares × 7 paletas, e escrever a razão de cada cor do Apex Pro com quem decidiu) é tarefa própria, maior, e pertence a quem tem esse contexto — ou a uma sessão dedicada.

**Impacto.** `sistema.css` usa `--lastro-txt-3` em 40 seletores; todos herdam a correção do `:root` automaticamente. `petroleo` e `moka` ganharam override próprio (antes não tinham); `branco-ouro` teve o próprio token corrigido. Nenhuma mudança de layout, espaçamento ou estrutura — só cor.

**Como reverter.** `git revert` do commit desta entrada restaura `#64748B` no `:root`, remove os overrides de `petroleo`/`moka`, restaura `#64748B` em `branco-ouro`, e desfaz as edições em `DESIGN.md`. Reintroduz os 104+14 elementos reprovando AA no tema padrão, e os bugs equivalentes em `petroleo`/`moka`/`branco-ouro`.

---

## 2026-08-21 (2) — T3b (acentos de cor): 8 tokens corrigidos no branco-ouro; achado de metodologia registrado

**O que mudou.** `src/app/tokens.css`, bloco `[data-tema="branco-ouro"]`: 8 tokens de acento receberam override próprio (nenhum era redefinido por tema nenhum antes, todos herdavam o valor calibrado para fundo escuro do `:root`):

| Token | Uso real medido | Antes → depois | Fundo composto |
|---|---|---|---|
| `--lastro-ouro` | `.chip-filtro--ativo` ("Todos") | 3,25 (contra branco) → **4,94** | pílula tingida, não branco puro |
| `--lastro-esmeralda-claro` | `.tag-grupo` ("X exercícios") | 1,79 → **4,99** | pílula tingida |
| `--lastro-esmeralda` | `.disciplina-card__streak`, `.metrica-switcher__delta`, `.disciplina-dia--feito` | não medido antes → **4,91** | pílula tingida |
| `--lastro-ciano` | `.tag-unilateral` | 2,43 → **4,94** | pílula tingida |
| `--lastro-erro` | `.botao-textual--destrutivo` ("Excluir conta") | 3,51 → **4,93** | fundo liso |
| `--lastro-acao-tinta` | `.acao-fantasma`/`.botao-confirmar` ("+ Adicionar") | 2,10 → **4,92** | fundo liso |
| `--lastro-sync` | `.sync` ("salvo no aparelho", D7) | 2,26 → **4,94** | fundo liso |
| `--lastro-aquecimento` (**token novo**) | `.chip-serie--aquecimento` | 1,21 → **4,93** | pílula tingida — pior número da rodada |

Mais dois hex cravados corrigidos (P7, não específicos de tema): `.pergunta--primaria` e `.topo-avatar` tinham `color: #FFF` literal — funcionavam por acidente nos temas escuros (onde `--lastro-txt` também é branco) e reprovavam 1,11:1 e 1,10:1 no branco-ouro. Trocados por `var(--lastro-txt)`, o token correto que já existe por tema.

**Por quê.** Pedido do dono: começar o T3b pelos acentos de cor, com explicação prévia e aprovação explícita antes de executar. Medição inicial (3 tokens: ouro, esmeralda-claro, ciano) encontrou só o `branco-ouro` reprovando entre os 6 temas — os 5 escuros passam com folga (7,17 a 11,12) por terem sido calibrados originalmente para fundo escuro. Ao corrigir e reverificar a tela inteira (não só os 3 pontos originais), apareceram mais 5 tokens quebrados pelo mesmo motivo — nenhum tinha sido medido antes porque não estavam no escopo inicial de 3 itens.

**Achado de metodologia, registrado por transparência — quase me levou a números errados duas vezes:**

1. **Trocar tema via `setAttribute('data-tema', ...)` sem recarregar a página mede a cor EM TRANSIÇÃO, não a final**, em qualquer elemento cujo ancestral tenha `transition: all` (ex.: `.cartao-exercicio-pro`). A primeira leitura do `.tag-unilateral` deu ratio 7,73 idêntico nos 6 temas — parecia que ciano nunca mudava. Era artefato: o fundo lido era sempre o valor por padrão do `:root`, porque `getComputedStyle` foi chamado antes da transição resolver. Refeito com `localStorage.setItem('lastro_tema', ...)` + navegação real, os números mudaram de verdade por tema.

2. **Medir contraste contra o fundo do elemento-pai, e não do próprio elemento, subestima o problema quando o elemento tem fundo translúcido próprio** (ex.: `.tag-grupo { background: var(--lastro-esmeralda-fundo); color: var(--lastro-esmeralda-claro); }` — a pílula tem AS DUAS propriedades no mesmo seletor). Minha primeira leitura de precisão (`corEfetiva(el.parentElement)`) pulava essa camada e dava 4,92/5,02 "passando"; a leitura correta (`corEfetiva(el)`, incluindo o próprio fundo do elemento) deu 4,42/4,50 — abaixo ou na borda do piso. Os valores finais desta entrada vêm todos da versão correta.

**Alternativa descartada.** Corrigir só o `--lastro-txt-3` e parar (escopo original da conversa) — descartada porque o dono pediu explicitamente para seguir pelos acentos depois de ver a explicação, e cada achado novo era o mesmo padrão raiz (acento calibrado só para escuro), não um problema disperso — parar no meio deixaria o tema claro parcialmente quebrado.

**O que NÃO foi corrigido, registrado para não virar suposição depois:**
- `--lastro-ouro-claro` (usado em `.chip-serie--pr`, badge de recorde pessoal) não foi medido — apareceu na varredura de `/treino/[id]` como zero reprovações, mas esse card específico só aparece quando o exercício tem PR; pode não ter sido exercitado na sessão de teste.
- A reconciliação completa do `DESIGN.md` (os 14 pares C1–C14 contra as 6 paletas, e a razão de cada cor do Apex Pro) continua não feita — este item corrigiu bug real, não documentou a tese de design.

**Verificado:** varredura completa (mesmo script, incluindo o próprio fundo do elemento na composição) em 10 telas do `branco-ouro` — `/login`, `/`, `/treino`, `/treino/[id]`, `/analise`, `/catalogo`, `/catalogo/[id]`, `/ajustes`, `/ajustes/anilhas`, `/ajustes/modelos` — zero reprovações reais em todas. Um falso positivo descartado ("Solicitar Análise", ratio 1 — botão `aria-disabled` com `opacity: 0.55`, decisão já documentada em B1, artefato do meu script não ler `opacity`). Confirmado que os 5 temas escuros e o padrão não regrediram (os overrides só existem dentro do bloco `branco-ouro`; as duas trocas de `#FFF` usam `var(--lastro-txt)`, que já é branco em todo tema escuro). `tsc`/test (173)/lint/build verdes a cada passo.

**Como reverter.** `git revert` do commit desta entrada remove os 8 overrides do bloco `branco-ouro`, remove o token `--lastro-aquecimento` de `:root`, e restaura `color: #FFF` nos dois seletores. Reintroduz os 8 padrões de contraste quebrados no tema claro.

---

## 2026-08-21 (3) — T4: meta semanal de treinos vira preferência real, NULL como estado honesto

**O que mudou.** A fração "2/4 Treinos (50%)" e a barra de progresso do card "Análise Semanal" na Home, removidas no fix do A00/A13 porque o denominador era `const metaTreinos = 4` (número que ninguém escolheu), voltam como preferência de verdade: migração `0009_meta_semanal.sql` adiciona `usuario.meta_treinos_semana` (`smallint`, nullable, `check` 1–7); campo em `/ajustes` grava via server action; a Home só mostra fração/barra quando o valor existe.

**Decisão de produto, perguntada ao dono antes de implementar.** Duas opções apresentadas: (1) sem meta definida, mostrar só a contagem, sem fração nem "padrão sugerido"; (2) fração com 4 como valor inicial editável. **Escolhida a opção 1.** Justificativa do dono implícita na escolha, e minha leitura registrada aqui: um "padrão de 4" pré-preenchido seria o mesmo problema do A13 um nível abaixo — trocaria "número inventado no código" por "número inventado no banco, mas com aparência de escolha do usuário".

**Por que a coluna é NULL e não tem default.** Reforça a decisão acima na camada de dado: se a coluna tivesse `default 4`, todo usuário novo nasceria com uma meta que não escolheu, e a Home mostraria fração pra ele sem ele nunca ter tocado em `/ajustes`. NULL é o único valor que representa honestamente "ainda não escolhido".

**Por que a server action mora em arquivo próprio (`meta-semanal.ts`), não em `perfil.ts`.** Mesma restrição já documentada em `atualizar-avatar.ts`: `"use server"` no Next.js/Turbopack deste projeto é diretiva de ARQUIVO INTEIRO — um Client Component que importa qualquer coisa de um arquivo arrasta os imports de topo desse arquivo inteiro pro bundle do cliente. `perfil.ts` tem `obterPerfil`/`sincronizarAvatarGoogle`, que não são Server Actions e usam `next/headers` fora desse contrato — misturar quebraria o build, confirmado por essa mesma lição já registrada quando o avatar foi implementado.

**Achado durante a verificação visual, corrigido na mesma leva.** O "/ N" recém-adicionado ao `.ai-coach-card__meta` alargou o lado direito do cabeçalho do card o suficiente pra empurrar "Análise Semanal (AI Coach)" a quebrar no meio do parêntese — "(AI" numa linha, "Coach)" sozinho na linha de baixo. `.ai-coach-card__badge` ganhou `min-width: 0` + `overflow: hidden` e o `span` interno `white-space: nowrap` + `text-overflow: ellipsis` — trunca com reticências em vez de quebrar feio. Confirmado por medição de altura do elemento (20px = 1 linha, contra ~44px antes da correção) e por screenshot do elemento isolado.

**Verificado ao vivo, ciclo completo:** login com o usuário QA (`qa-audit-2608@teste.lastro.invalid`, sem meta definida) → Home mostra "2 treinos" sem fração → `/ajustes`, define 4 → salva, mensagem "Meta salva." → Home mostra "2 treinos / 4" e barra em 50% de largura, badge truncado corretamente → validação testada com 9 (fora do intervalo 1–7), mensagem de erro certa, nada salvo → campo limpo, salva → mensagem "Meta removida." → Home volta a "2 treinos" sem fração, sem barra. Usuário QA devolvido ao estado `null` original ao final do teste — não fica com meta "4" grudada pra próxima sessão.

**Impacto.** `tsc`/`test` (173)/`lint`/`build` verdes em cada passo. Nenhuma migração de dado além da coluna nova (todo usuário existente nasce com `meta_treinos_semana = null`, comportamento idêntico ao estado atual da Home).

**Como reverter.** `git revert` do commit desta entrada remove o componente, a server action, e as edições de `page.tsx`/`sistema.css`. A coluna `meta_treinos_semana` fica no banco (reverter migração de banco é ação separada, deliberadamente — não se reverte schema junto com código sem decisão explícita); se precisar remover de fato, `alter table public.usuario drop column meta_treinos_semana;`.

---

## 2026-08-24 — `pesoPorLado` substitui `peso_corporal_incluso`; volume de halter bilateral corrigido

**O que mudou.** Achado do dono: o card de registro de série (exercício, tipo, série valendo/aquecimento, peso, reps) só sabia dobrar volume por `exercicio.unilateral` (reps contadas por lado). Halter bilateral (ex.: "Supino reto com halteres") tem `unilateral=false` **corretamente** — as reps não dobram — mas o peso digitado é de **um** halter, não do par: o volume estava subestimado pela metade nesses exercícios. Migração `0010_peso_por_lado.sql` adiciona `exercicio.peso_por_lado` (mesma forma de `unilateral`: atributo do exercício, não da série) e marca os 9 exercícios de halter bilateral do catálogo (`unilateral=false` + "halteres" no plural — pull-over e agachamento sumô ficam de fora, são halter singular segurado com as duas mãos, peso já total). `src/lib/analise/volume.ts` passa a dobrar por `unilateral || pesoPorLado`, nunca os dois compostos.

**Peso corporal incluso removido de vez, na mesma migração.** Antes de decidir, consultei o banco real: **0 de 461 séries** tinham o campo marcado. Nunca foi usado — remover não muda nenhum dado histórico (volume, PR, estagnação ou parecer passado já calculado). Apresentei os dois números ao dono (0/461, e as duas opções — manter os dois campos vs. remover) antes de agir; decisão dele: remover. `serie.peso_corporal_incluso` sai do schema, do agregador, dos formulários e do rodapé do parecer.

**Onde a marcação mora — pergunta que travava a implementação.** Duas opções: campo no formulário (marca-se a cada série) ou atributo do catálogo (marca-se uma vez por exercício, como `unilateral`). Escolhida a segunda — consistente com a decisão já registrada de que `unilateral` é atributo do exercício, não da série (`SDD.md` §D3.5), e evita o dono re-declarar "é halter" a cada série do mesmo exercício.

**Alternativa descartada.** Detectar "peso por lado" automaticamente pelo nome do exercício em tempo de leitura (regex sobre `nome`) — descartada por ser frágil (nome livre, sem contrato) e por esconder a decisão dentro de uma função em vez de deixá-la visível como dado no catálogo, auditável e editável.

**Impacto.** Volume histórico dos 9 exercícios de halter bilateral (Supino reto/inclinado/declinado com halteres, Crucifixo reto/inclinado com halteres, Levantamento terra romeno com halteres, Desenvolvimento/Elevação frontal/Encolhimento com halteres) **muda retroativamente** — dobra a partir de agora, sem reprocessar séries já gravadas (o volume é calculado em tempo de leitura, não persistido). PRs, tendência de e1RM e volume por exercício desses 9 exercícios NÃO mudam — e1RM/PR usam peso e reps crus, nunca o multiplicador de volume (D3.5). `tsc`/`test` (173)/`lint`/`build` verdes.

**Como reverter.** Código: `git revert` do commit desta entrada. Banco: `alter table public.exercicio drop column peso_por_lado; alter table public.serie add column peso_corporal_incluso boolean not null default false;` — reintroduzir a coluna não recupera os valores antigos (todos eram `false`, então não há perda real).

---

## 2026-08-24 (2) — `peso_por_lado` vira campo da SÉRIE, não só do catálogo (reversão parcial da entrada acima)

**O que mudou.** A entrada anterior (mesma data) tinha decidido que "peso por lado" morava só no catálogo (`exercicio.peso_por_lado`), com uma lista fixa de 9 exercícios de halter marcada na migração. O dono testou ao vivo e apontou o problema: a lista fixa não cobre uso real — qualquer exercício fora dela, ou halter usado de um jeito que a lista não previu, ficava sem forma de corrigir o volume, e a tag na tela era só texto, sem controle algum. Pediu um interruptor de verdade, no mesmo lugar onde "peso corporal incluso" existia antes.

Migração `0011_peso_por_lado_na_serie.sql` adiciona `serie.peso_por_lado` (boolean, default `false`). `exercicio.peso_por_lado` **continua existindo** — não foi removido — mas muda de papel: era a fonte do cálculo de volume, agora é só o **valor-padrão que pré-marca o interruptor** quando a pessoa escolhe um exercício de halter conhecido. Quem decide o volume, série a série, é `serie.peso_por_lado`.

**Backfill, para não reverter a correção de ontem em silêncio.** As 26 séries já gravadas dos 9 exercícios de halter bilateral (marcados na migração 0010) ganharam `peso_por_lado = true` nesta migração — conferido antes (26 séries encontradas) e depois (26 marcadas) de aplicar. Sem isso, o deploy desta migração devolveria essas 26 séries ao volume subestimado que a correção de ontem tinha acabado de resolver.

**Por que não substituir o catálogo por completo.** O valor-padrão do catálogo continua valendo a pena: sem ele, a pessoa teria que lembrar de ligar o interruptor toda vez que registra "Supino reto com halteres" — exatamente a fricção que `unilateral` já evita para reps por lado. O catálogo pré-marca; o interruptor decide.

**Formulário e edição.** `formulario-serie.tsx` ganhou um checkbox controlado (`campo-caixa`, mesmo componente visual do antigo "peso corporal incluso") que reseta para o padrão do catálogo quando o exercício muda (ajuste de estado durante a renderização, não em `useEffect` — evita o novo lint `react-hooks/set-state-in-effect`) e que a pessoa liga/desliga por série. `editar-serie.tsx` ganhou o mesmo controle, inicializado com o valor real já gravado da série (não o padrão do catálogo). "Usar valores" (repetir última série no formulário) e "repetir última série" (no treino) carregam o `pesoPorLado` real da série anterior, não o padrão do catálogo.

**Achado paralelo, corrigido no caminho:** `treino.ts:listarTreinos` tinha uma SEGUNDA cópia do cálculo de multiplicador (inline, fora de `src/lib/analise/`) que ainda lia `exercicio.peso_por_lado` — se não fosse trocada para `serie.peso_por_lado`, a lista de treinos mostraria um volume diferente do que a Análise mostra para o mesmo treino. Corrigida junto.

**Impacto.** `SerieBruta`/`SerieValendo` (`src/lib/analise/tipos.ts`) ganham `pesoPorLado` como campo obrigatório da série (era do exercício). Cinco caminhos de leitura trocaram a fonte: `dados/treino.ts` (`listarTreinos` e `buscarTreino`), `dados/resumo-home.ts`, `dados/progressao.ts`, `api/analise/route.ts`. Dois testes novos em `agregar.test.ts` (T-V8) provam que é a série que decide, não o catálogo — inclusive o caso em que o catálogo diz `false` mas a série diz `true`. `tsc`/`test` (175)/`lint`/`build` verdes.

**Como reverter.** Código: `git revert` do commit desta entrada. Banco: `alter table public.serie drop column peso_por_lado;` — volta ao estado da entrada anterior (catálogo decide sozinho). Perda real: as 26 séries que tinham `peso_por_lado=true` diferente do padrão do catálogo (se a pessoa tiver usado o interruptor para divergir do padrão) voltariam a depender só do catálogo.

---

## 2026-08-24 (3) — Módulo de idiomas: reverte a posição da ADR contra tradução automática do catálogo

**O que mudou.** Dono pediu módulo de idiomas (inglês e espanhol, além do PT-BR) exposto em `/ajustes`, cobrindo "tudo — não precisa de curadoria humana, é só olhar no meaning". `ADR.md`/`KNOWLEDGE.md` §3.3 tinham rejeitado tradução automática do catálogo de exercícios, citando risco de tradução ruim ("Bent Over Row" → "Fileira Curvada" como exemplo de tradução reversa capenga). Esta entrada registra a reversão explícita dessa posição, por decisão do dono — não é um esquecimento da ADR anterior.

Isto também é Scope Change contra `PRD.md` A9 ("nome em PT-BR de academia") — registrado aqui, não bloqueando o trabalho, porque o dono já decidiu.

**Migração 0012.** Duas tabelas de tradução — `exercicio_traducao` e `grupo_muscular_traducao` (`exercicio_id`/`grupo_muscular_id`, `idioma` em `('en','es')`, `nome`) — em vez de colunas `nome_en`/`nome_es`: um terceiro idioma no futuro é uma linha, não uma migração. `exercicio.nome`/`grupo_muscular.nome` continuam o PT-BR, fonte única, sem nenhum lookup para quem usa o app em português. `usuario.idioma` (nullable, mesmo raciocínio honesto do `meta_treinos_semana` da migração 0009 — sem default `'pt-BR'` que ninguém escolheu).

Os 102 exercícios e 10 grupos musculares foram traduzidos (eu mesmo, terminologia padrão de academia por idioma — ex.: "Rosca direta" → "Barbell Curl"/"Curl con barra", não tradução literal palavra-por-palavra) e inseridos na mesma migração. Conferido: 204 linhas em `exercicio_traducao` (102 × 2 idiomas, cobrindo os 102 exercícios existentes), 20 em `grupo_muscular_traducao`.

**Por que catálogo primeiro, antes de qualquer string de UI.** O parecer semanal (Gemini, `api/analise/route.ts`) recebe o resumo compacto com nome de exercício. Decisão tomada com o dono: o nome já traduzido entra no resumo (não uma instrução solta tipo "responda em inglês" deixando o modelo inventar nome de exercício a cada chamada) — assim o parecer sai consistente entre execuções. Por isso o catálogo é a fundação; UI, prompt e validador dependem dele, não o contrário.

**Sequência combinada com o dono, uma etapa por vez com aprovação entre elas:** (1) esta migração; (2) leitura por idioma + seletor em `/ajustes`; (3) parecer da Gemini (prompt + validador + fallback determinístico) por idioma; (4) ~200 strings fixas de UI, `aria-label`s e `<html lang>`.

**Alternativas descartadas.** Colunas `nome_en`/`nome_es` no lugar de tabela de tradução — mais simples agora, mas um terceiro idioma vira migração em vez de `insert`. Rota com prefixo de idioma (`/en/treino`) — descartada: toda rota é autenticada, nada é indexado por buscador, e mexeria em `src/proxy.ts` e todo `redirect()`/`<Link>` do app. Idioma em `localStorage` (padrão do `tema`) — descartado porque o catálogo e o parecer são resolvidos no servidor antes de qualquer render; precisa estar no banco, lido server-side.

**Impacto.** Nenhuma leitura em PT-BR muda de comportamento (tabelas novas, RLS `select` para `authenticated`, mesmo padrão de `exercicio`/`grupo_muscular`). Nenhum código de leitura/escrita existente foi alterado nesta etapa — só schema. `tsc`/`test`/`lint`/`build` ainda não reexecutados após esta migração pura de banco.

**Como reverter.** Banco: `drop table public.exercicio_traducao; drop table public.grupo_muscular_traducao; alter table public.usuario drop column idioma;`. Sem perda real — nenhum dado de usuário depende ainda destas tabelas.

---

## 2026-08-24 (4) — Módulo de idiomas, etapa 2/4: leitura por idioma + seletor em /ajustes

**O que mudou.** `src/lib/dados/idioma.ts` (novo): `obterIdioma()` lê `usuario.idioma`, resolve `null` para `"pt-BR"` (mesmo raciocínio do restante do app — a leitura decide o padrão de EXIBIÇÃO, a gravação continua honesta sobre "nunca escolheu"); `definirIdioma()` é a Server Action que grava a escolha. `src/lib/dados/traducao.ts` (novo): `mapaTraducaoExercicios`/`mapaTraducaoGrupos` leem as tabelas da migração 0012 e devolvem `Map<id, nome>` — vazio para pt-BR (sem round-trip ao banco pra idioma que não precisa de tradução).

Cinco caminhos de leitura em `dados/treino.ts` e `dados/resumo-home.ts` passaram a resolver nome de exercício/grupo pelo idioma da pessoa, com fallback pro nome PT-BR quando falta linha de tradução: `listarExercicios` (seletor do formulário), `buscarExercicio`/`listarCatalogo` (catálogo), `buscarTreino` (nome de exercício na tela de treino), `listarTreinos`/`carregarResumoHome` (tags de grupo muscular na lista de treinos e na Home). Exercícios/catálogo reordenam por nome traduzido fora do pt-BR — a ordem alfabética do banco é em português, misturar alfabetos ficaria estranho.

`formatarGrupoMuscular` (`src/lib/texto/grupo-muscular.ts`, usado só no cliente pela aba "Grupos" da Home) ganhou parâmetro `idioma` com mapas EN/ES estáticos — roda 100% client-side, não pode fazer round-trip ao banco só pra formatar rótulo. `Perfil` (`dados/perfil.ts`) ganhou o campo `idioma`, seguindo o padrão de já trazer `metaTreinosSemana` — evita fetch duplicado nas páginas que já chamam `obterPerfil()`.

`/ajustes` ganhou `IdiomaForm` (`src/components/idioma-form.tsx`), mesmo padrão de `MetaSemanalForm`: card `card-obsidian`, salva ao clicar. Controle é um segmentado de 3 opções (novo `.segmentado`/`.segmentado__opcao` em `sistema.css`, mesmos tokens do `.chip-filtro`), não um `<select>` — só 3 opções fixas, sem "em branco" possível na tela (a leitura já resolveu `null` antes de chegar aqui).

**Achado ao vivo, corrigido no caminho: RLS sem GRANT não basta.** Depois de aplicar a migração 0012, `/catalogo` quebrou com "permission denied for table exercicio_traducao" — a policy de leitura existia, mas o Postgres nega antes de avaliar RLS se o role não tem `GRANT SELECT` na tabela. `exercicio`/`grupo_muscular` já tinham esse grant desde a bootstrap (0001/0002); tabela nova não herda. Corrigido com uma migração adicional (`grant select on ... to authenticated`) já dobrada de volta pro arquivo `0012_idiomas.sql` local, pra manter o repo igual ao banco real.

**Verificado ao vivo** com usuário QA descartável (`qa-idiomas-2608@teste.lastro.invalid`, criado e removido via `scripts/qa-treino-helper.sh`, cascade confirmado em 0 linhas): login, troca pra inglês em `/ajustes` ("Idioma salvo."), `/catalogo` com 102 exercícios e 10 grupos em inglês, seletor do formulário de série filtrado por grupo ("Chest" → 15 exercícios em inglês, ordem alfabética), série registrada e exibida como "Barbell Bench Press" na tela do treino, tag "CHEST" na Home (Treinos Recentes) e na aba Grupos.

**Fora do escopo desta etapa (fica pra 3/4 e 4/4).** O parecer da Gemini ainda responde só em PT-BR — `api/analise/route.ts` (prompt, validador, fallback determinístico) não foi tocado nesta etapa, e continua lendo `exercicio.nome` direto do banco (PT-BR), não pelos novos caminhos traduzidos de `dados/treino.ts`. As ~200 strings fixas de UI (botões, rótulos, `aria-label`, `<html lang>`) continuam só em PT-BR.

**Impacto.** `tsc`/`test` (175)/`lint`/`build` verdes. Nenhuma leitura em pt-BR muda de resultado (idioma resolvido para `"pt-BR"` continua usando `exercicio.nome`/`grupo_muscular.nome` direto, sem tabela de tradução).

**Como reverter.** Código: `git revert` dos commits desta entrada. Banco: a migração de GRANT pode ficar (é inofensiva e necessária caso a 0012 permaneça); reverter a 0012 já cobre as tabelas.

---

## 2026-08-24 (5) — Módulo de idiomas, etapa 3/4: parecer da Gemini por idioma

**O que mudou.** O parecer semanal (prompt, validador, fallback determinístico) passa a responder no idioma escolhido pela pessoa, com nome de exercício/grupo já traduzido (fundação da migração 0012 + etapa 1/4).

- `carregarExercicios` (`api/analise/route.ts`) agora traduz `nome`/`grupoMuscularPrimario` via `mapaTraducaoExercicios`/`mapaTraducaoGrupos` ANTES de entrar no agregador — o `ResumoCompacto` que vai pro prompt já nasce no idioma certo, o modelo nunca precisa inventar nome de exercício traduzindo na hora (decisão tomada com o dono na etapa 1/4).
- `prompt.ts`: `SYSTEM_INSTRUCTION`, critério de qualidade e preâmbulo viram `Record<Idioma, string>`. Duas travas mudam de CONTEÚDO, não só de texto: (1) convenção numérica — PT-BR/ES usam vírgula decimal, EN usa ponto decimal, são convenções OPOSTAS; (2) uma trava nova explícita dizendo que as CHAVES do JSON (`"posicao_na_faixa": "abaixo"`) são códigos internos em português e o modelo deve traduzir o SENTIDO pra prosa, nunca citar a chave literal — nomes de campo continuam PT-BR em qualquer idioma (KNOWLEDGE.md §1, termos de contrato não traduzem).
- `validador.ts`: **achado real, exatamente o que o `advisor` tinha avisado antes de começar esta etapa** — `extrairTokens`/`normalizarToken` assumiam vírgula decimal incondicionalmente. Em inglês, "11.5%" é o número correto e "12,480" é separador de milhar (o OPOSTO de PT-BR/ES); sem a correção, todo parecer em inglês citando decimal seria rejeitado como intruso por engano, ou pior, aceito com o valor errado. `validarNumeros` ganhou parâmetro `idioma` (default `"pt-BR"`, não quebra os 9 testes/chamadas existentes) que troca a convenção de extração. 5 testes novos em `validador.test.ts` provam a convenção inglesa — incluindo um teste que passa o MESMO texto pela convenção errada de propósito, pra provar que a checagem realmente importa (não é teste decorativo).
- `perguntas.ts`: as 5 perguntas padrão viraram `perguntasDoIdioma(idioma)` — o texto entra literalmente no prompt (não é só rótulo de botão), então tradução mora aqui, não em string de UI solta (evita duas fontes divergindo). `analise-interativa.tsx`/`analise/page.tsx` passam a receber `idioma` de `obterPerfil()`, mesmo padrão da Home.
- `route.ts`: `fallbackDeterministico` (2ª falha, sem LLM) também ficou idioma-aware — inclusive o enum `posicao_na_faixa` (`abaixo/dentro/acima`), que aparece só nesse template determinístico, nunca na prosa do LLM. Instruções de retry (1ª falha) também traduzidas, porque voltam pro modelo no próximo prompt.

**Verificado ao vivo contra a API real da Gemini** (usuário QA descartável, cascade confirmado em 0 linhas ao final): parecer em inglês citando os 10 grupos musculares traduzidos ("Chest, Biceps, Quadriceps, Back, Shoulders, Glutes, Hamstrings, Calves, Triceps, Abs"), prosa e pontuação decimal corretas; parecer em espanhol citando os mesmos 10 grupos em espanhol ("Pecho, Bíceps, Cuádriceps, Espalda, Hombro, Glúteos, Isquiotibiales, Pantorrilla, Tríceps, Abdomen"), vírgula decimal correta. Ambos passaram o validador (não caíram no fallback).

**Fora do escopo desta etapa.** O "Coach IA" (`api/coach/*`) é uma feature Gemini separada (chat interativo, não a Análise Semanal) — não fazia parte do plano de 4 etapas combinado com o dono e não foi tocado. Fica como possível próximo passo, a confirmar com o dono antes de mexer. As ~200 strings fixas de UI continuam pra etapa 4/4.

**Impacto.** `tsc`/`test` (180, +5 desta etapa)/`lint`/`build` verdes. `validarNumeros` com 4º parâmetro opcional — chamada sem idioma continua pt-BR, sem quebrar nada existente.

**Como reverter.** `git revert` dos commits desta entrada. Sem impacto de banco (só leitura das tabelas já existentes da migração 0012).

---

## 2026-08-24 (6) — Módulo de idiomas, etapa 4/4 (final): as ~200 strings fixas de UI

**O que mudou.** Todo texto fixo da interface — botões, rótulos, mensagens de erro, `aria-label`, placeholders, cabeçalhos, rodapés — passou a resolver pelo idioma escolhido. `src/lib/texto/i18n.ts` (novo) é o dicionário: chave é o texto PT-BR ORIGINAL (não um id inventado), valor é `{ en, es }`. `t(chave, idioma)` devolve a própria chave em pt-BR e faz fallback honesto pra chave PT-BR se faltar entrada — nunca quebra a tela, só não traduz aquele texto específico.

Por que chave = texto PT-BR e não um id: mantém o diff mecânico (`"Salvar"` vira `t("Salvar", idioma)`, sem renomear nada) e deixa óbvio, olhando o dicionário, quando uma tradução ficou desatualizada em relação ao texto PT-BR que a originou.

**Escopo tocado:** 46 arquivos (todas as páginas em `src/app/`, todos os componentes com texto em `src/components/`), incluindo:
- `<html lang>` no layout raiz (`app/layout.tsx`) — vira `async`, lê `obterIdioma()`. Achado do `advisor` antes da etapa 3/4: leitor de tela depende deste atributo, não do texto visível.
- Nomes de dia da semana e mês, em três lugares que os tinham como array PT-BR fixo (`app/page.tsx`, `app/treino/[id]/page.tsx`).
- Convenção decimal (vírgula pt-BR/es, ponto en) também no gráfico de progressão e nos blocos de evidência da Análise (`formatar-delta.ts`, `grafico-progressao.tsx`) — mesmo raciocínio da etapa 3/4 no validador da Gemini, agora estendido aos números que a TELA formata (fora do parecer do LLM).
- As 7 temas de `/ajustes/temas` (nome, subtítulo, descrição) traduzidos com nome real por idioma, não tradução literal — "Café Moka & Caramelo" vira "Mocha Coffee & Caramel", não "Coffee Mocha & Caramel".
- Mensagens de erro de Server Actions (`meta-semanal.ts`, `idioma.ts`, `atualizar-avatar.ts`, `validar-avatar.ts`) resolvidas no idioma da pessoa via `obterIdioma()` — essas telas de erro nunca tinham idioma antes desta etapa.

**Decisões de escopo, deliberadas:**
- `/login` continua só em PT-BR. Antes da autenticação não existe `usuario.idioma` pra ler — o idioma é, por definição, uma preferência de conta. Detectar `navigator.language` do browser era uma feature nova não pedida, com risco de adivinhar errado; ficou de fora.
- As 3 sugestões de pergunta do Coach IA (`coach-interativo.tsx`) ficam em PT-BR de propósito — o texto do botão É a pergunta enviada ao backend (`/api/coach`, que continua respondendo só em PT-BR, fora do escopo desta etapa). Traduzir só o rótulo criaria um chat onde a pessoa lê a pergunta em inglês no botão e vê ela mesma em português no balão da conversa.
- `modelo.nome` (nome que a própria pessoa deu ao modelo de treino) nunca passa por `t()` — é conteúdo do usuário, não string de app.
- Mensagens de erro internas que nunca deveriam aparecer pra pessoa (ex.: `throw new Error("Exercício não encontrado no catálogo.")`, invariante que só quebra se o dropdown estiver dessincronizado do catálogo) ficaram em PT-BR — não são UI, são defesa de programador.

**Achado ao vivo, corrigido no caminho:** duas colisões de nome de variável `t` (loop `TEMAS.map((t) => ...)` em `seletor-temas.tsx`, `for (const t of treinos)` em `lista-treinos.tsx`) com a nova função `t()` do dicionário — renomeadas pra `tema`/`treino` antes de importar. Também dois `useMemo` com `.localeCompare(..., idioma)` sem `idioma` no array de dependências (`treino-detalhe.tsx`, `modelo-treino-form.tsx`), pego pelo `react-hooks/exhaustive-deps` — corrigido.

**Verificado ao vivo** com usuário QA descartável (cascade confirmado em 0 linhas): `<html lang="en">` confirmado via DOM; `/ajustes` inteira em inglês incluindo os 7 temas com nomes reais; Home com data/semana/dias formatados em inglês; fluxo completo de registro de série (seletor de grupo → catálogo filtrado → formulário → interruptor "peso por lado" → botão) em inglês, do início ao fim.

**Impacto.** `tsc`/`test` (180)/`lint` (mesmos 4 avisos pré-existentes, nenhum novo)/`build` verdes. `npm run build` deixou de pré-renderizar `/login`, `/ajustes/temas` e `/_not-found` como estático — consequência esperada de `<html lang>` agora depender de uma leitura de sessão por requisição no layout raiz; sem efeito prático, o app já era majoritariamente autenticado/dinâmico.

**Como reverter.** `git revert` do commit desta entrada. Sem impacto de banco — etapa é só leitura/apresentação.

---

## Módulo de idiomas — resumo das 4 etapas (2026-08-24)

Pedido do dono: "adicionar o módulo de idiomas" (inglês e espanhol, além do PT-BR existente), "quero tudo, não precisa de curadoria humana". Executado em 4 etapas, uma por vez com aprovação do dono entre elas (preferência dele, ver entrada "etapa 3/4"):

1. Migração 0012 — catálogo de exercícios e grupos musculares traduzidos (tabela de tradução, não colunas).
2. Leitura por idioma nos dados + seletor em `/ajustes`.
3. Parecer da Gemini responde no idioma escolhido (prompt, validador, fallback determinístico) — nomes já traduzidos alimentam o resumo, convenção decimal corrigida por idioma.
4. As ~200 strings fixas de UI, incluindo `<html lang>`.

Reverte explicitamente a posição da ADR anterior contra tradução automática do catálogo (registrado na entrada da etapa 1) — por decisão do dono, não por esquecimento. Fora do escopo em todas as 4 etapas: o Coach IA (`api/coach/*`, feature separada da Análise Semanal) e a tela de `/login` (pré-autenticação, sem `usuario.idioma` pra ler).

---

---

## 2026-08-27 — Scope Change: compartilhamento de imagem e cronômetro de descanso entram no escopo

**O que mudou.** Duas funcionalidades que estavam no escopo NEGATIVO do `PRD.md` §5 passam a fazer parte do produto, com o texto do §5 emendado (notas A e B). Nenhuma linha de código muda nesta entrada — o código já existia; o que faltava era o registro, e o protocolo do próprio PRD exige um.

**Por quê agora.** A auditoria de 2026-08-26 (`docs/RELATORIO-ESTADO-PROJETO.md`, achado D1) levantou as duas como divergência entre o que estava no ar e o que o documento dizia, e apresentou a pergunta ao dono. Ele respondeu **agindo**: pediu a correção dos botões de compartilhar e do relatório pós-treino em 2026-08-27, e havia dirigido pessoalmente o desenho do cronômetro em 2026-08-26. Pedir para consertar é decidir manter. A decisão estava tomada; só não estava escrita.

**Compartilhar — o que entra e o que continua fora.** Entra **exportação de imagem gerada no próprio aparelho**: PNG 1080×1080 desenhado em `<canvas>` no cliente (`relatorio-pos-treino.tsx`), entregue por clipboard, download ou `navigator.share`. Não há servidor, não há feed, não há seguir, comparar, ranking nem perfil público; nada sai do aparelho sem o dono mandar. A proibição do §5 era contra o app **virar rede social**, e essa continua de pé — a linha passa a ler "sem feed, seguir, comparar ou ranking". Exportar o próprio dado tem a mesma natureza de salvar um print da tela.

**Cronômetro — a distinção que importa.** O §5 o excluía "**na v1**", com a ressalva explícita de que não era descarte permanente; esta entrada exerce essa ressalva. O que entrou é **manual**, disparado por toque. O "cronômetro de descanso **automático**" registrado como não aprovado em `DECISIONS.md` 2026-08-13 **continua fora** — aquela linha nunca proibiu o manual, e é por isso que ela não precisa ser revista.

**Alternativa descartada.** Remover as duas funcionalidades para o código voltar a bater com o documento. Descartada porque o dono as quer: o documento é que estava desatualizado, não o produto. A alternativa oposta — deixar como estava, sem registrar — é a que o protocolo de Scope Change existe para impedir, e é o que já tinha acontecido duas vezes.

**Classificação.** **ADIÇÃO** nas duas. Não mudam a tese (a Análise Semanal continua a peça-assinatura, o produto continua sendo a leitura); acrescentam ao redor dela.

**Impacto.** `PRD.md` §5 (notas A e B). Nenhum arquivo de `src/` tocado por esta decisão.

**Como reverter.** Apagar `relatorio-pos-treino.tsx` e o bloco `.pos-treino-*` de `sistema.css` (compartilhar); apagar `timer-topo.tsx` e o bloco `.timer-topo-*` (cronômetro). As duas são aditivas e isoladas — nenhuma outra tela depende delas.

---

## 2026-08-27 (2) — Scope Change: modelo de treino guarda `reps`/`peso`

**O que mudou.** `modelo_treino_exercicio` ganhou as colunas `reps` e `peso` (migração `0015`), revertendo a frase da ADR-009 que as proibia. Detalhe completo do raciocínio em **`ADR-010`** — esta entrada registra a decisão e o pedido que a originou.

**O pedido, literal.** O dono: *"no cadastrar já deveria ter quantas repetições e séries são feitas (…) ele só apertaria em cima do exercício em um + aí ele conseguiria editar a repetição e o peso. Mas isso somente se a pessoa estiver em um treino já montando; se for em um treino normal, não aparecer."* E, quando perguntado de onde viria o número: *"quem vai pelo exercício novo, ele tem total liberdade; agora quem vai pelo treino que montou, ele deve cadastrar lá quando montou os exercícios, mas quando ele tá treinando e ele apertar no mais e decidir alterar carga ou reps, muda também no banco."*

**Por que houve pergunta antes de implementar.** O pedido reverte uma decisão que o próprio dono tomou e registrou em três lugares (PRD §9, critério A14, ADR-009). Havia duas leituras possíveis — preencher do histórico real (não reverteria nada, e era a recomendação levada a ele) ou cadastrar no modelo (reverte). Ele escolheu a segunda, com conhecimento do custo. Registrado porque decisão revertida em silêncio é o que o protocolo de Scope Change existe para impedir.

**Classificação.** **ADIÇÃO** que reabre decisão fechada — mesma categoria da revisão de 2026-08-13 que criou a tela. Não muda a tese: a Análise Semanal continua a peça-assinatura e continua medindo só o que foi executado.

**A barreira que continua de pé.** `src/lib/analise/` segue proibido de enxergar `modelo_treino`. Era essa restrição — não a ausência de colunas — que carregava a razão da ADR-008 (impedir a Análise de comparar executado contra planejado). Como guardar carga torna a violação tentadora, a proibição saiu da prosa e virou teste: `src/lib/analise/sem-modelo-treino.test.ts`, varrendo os 15 arquivos do agregador.

**Achado colateral, registrado e NÃO corrigido.** O `supabase db push` recusou aplicar a `0015`: o histórico remoto tem `0001`–`0009` numeradas e as cinco seguintes com **timestamp** (`20260824132220`…), enquanto o repositório tem `0010`–`0014`. São as mesmas migrações, com convenção de versão diferente — alguma sessão rodou por um caminho que gera timestamp. A `0015` foi aplicada via `db query` e registrada à mão em `supabase_migrations.schema_migrations`. **Não rodei `migration repair`**: mexer em histórico de migração de produção é risco próprio e não era o pedido. Fica como dívida — enquanto durar, `db push` continua recusando.

**Impacto.** Migração `0015`; `ADR.md` (ADR-010); `PRD.md` §9 nota C e critério A14 reescrito; teste novo em `src/lib/analise/`. Nenhuma tela nesta leva — a UI vem em PR própria.

**Como reverter.** `drop column reps, peso` e `revoke update (reps, peso)`. Aditivo e nullable: o caminho do histórico continua existindo como fallback, então nada para de funcionar.

---

## 2026-08-31 — PDF da Análise Semanal: `@react-pdf/renderer`, não Puppeteer nem `window.print()`

**O que mudou.** Nada no código ainda — esta entrada registra a escolha de biblioteca pra `SDD.md` §10 (histórico de pareceres + PDF), item 5 do backlog do dono, pedido depois de uso real do app.

**As 3 alternativas pesquisadas e por que as 2 primeiras caem:**

1. **`window.print()` / CSS de impressão nativa.** Zero dependência, mas `window.print()` **não funciona em navegador mobile** — e o lastro inteiro é "Modo Bancada", pensado pro celular. Eliminatório, não é questão de preferência.
2. **`jsPDF` + `html2canvas`.** Funciona no celular, mas o resultado é uma **imagem** dentro do PDF, não texto — borra no zoom, arquivo maior, sem texto selecionável/pesquisável. Um app que já trata o sticker do Instagram como pixel-perfect regrediria em qualidade adotando isso pro documento mais formal do produto.
3. **Puppeteer/headless browser no servidor.** Resultado de melhor qualidade (renderiza HTML/CSS real), mas exige binário de Chromium na function, cold start maior, custo de infraestrutura real — desproporcional pra um app pessoal de 1 usuário. Mesma lógica de custo/benefício que já levou a tratar a cota da Gemini como recurso escasso (`KNOWLEDGE.md` §3.2).

**Escolhida: `@react-pdf/renderer`.** Motor de layout em JS puro (sem navegador headless), compatível com Next.js App Router, gera PDF vetorial de verdade — texto selecionável, arquivo pequeno, roda dentro do limite de uma function serverless da Vercel sem binário extra. Trade-off aceito: não clona pixel a pixel o CSS da tela (usa um modelo de layout flexbox reduzido, próprio da biblioteca) — aceitável porque o PDF é um documento de arquivo/exportação, não precisa ser idêntico à tela.

**Alternativa descartada.** Gerar e guardar um PDF pré-renderizado no Supabase Storage no momento do save. Descartada porque o PDF é idempotente a partir do `texto`/`evidencia` já salvos (`SDD.md` §10.1) — guardar um binário redundante toda vez que salva é custo sem benefício.

**Impacto.** `SDD.md` §10 (nova seção). `package.json` ganha `@react-pdf/renderer` como dependência nova. Nenhum código ainda — é a spec, a implementação vem em PR própria.

**Como reverter.** Não há o que reverter — nenhum código foi escrito ainda. Se a biblioteca decepcionar na implementação, a decisão é revisitável sem custo afundado.

---

## 2026-09-01 — Geração assíncrona da Análise Semanal: `after()`, não fila nem polling

**O que mudou.** Nada no código ainda — esta entrada registra a escolha de mecanismo pra `SDD.md` §11, desenho debatido com o dono ao vivo numa sessão anterior e formalizado nesta.

**O pedido, a partir do achado do dono.** O botão "Solicitar Análise" (`analise-interativa.tsx`) é síncrono: a pessoa fica 30-50s+ numa tela de esqueleto sem saber se travou, porque a chamada à Gemini (com retry, §6.4) roda dentro do próprio ciclo de requisição HTTP.

**As alternativas pesquisadas e por que as outras caem:**

1. **Fila gerenciada (Redis/BullMQ, QStash, etc.).** Resolve, mas é infraestrutura nova pra um app pessoal de 1 usuário — mesma classe de custo/benefício que já descartou Puppeteer em §10 e levou a tratar a cota da Gemini como recurso escasso (`KNOWLEDGE.md` §3.2). Eliminatória por desproporção, não por incapacidade técnica.
2. **Polling do cliente** (a tela continua aberta, consultando periodicamente se terminou). Resolve o problema técnico mas não o de produto: a pessoa continua presa na tela esperando, só que agora com uma barra de "carregando" em vez de esqueleto estático — não é isso que o dono pediu. Ele quer devolver o controle, não só a sensação de progresso.
3. **`after()` (Next.js/Vercel)** — escolhida. A function continua viva depois da resposta HTTP até o callback terminar (dentro do teto de duração da plataforma), sem fila, sem infra nova, sem o cliente ficar esperando. Pesquisado e confirmado numa sessão anterior que a geração cabe no teto de duração mesmo no plano Hobby.

**O resto do desenho** (rascunho não confirmado no topo de "Pareceres salvos", expira em 24h, trava de geração em andamento persistida no banco) está detalhado em `SDD.md` §11 — esta entrada cobre só a escolha de mecanismo, que é a parte que tinha alternativa de peso.

**Classificação.** **ADIÇÃO** — não muda a tese da Análise Semanal, muda só onde e quando a chamada à Gemini roda.

**Impacto.** `SDD.md` §11 (nova seção). Nenhum código ainda — a implementação vem em PR própria.

**Como reverter.** Não há o que reverter — nenhum código foi escrito ainda.

---

## 2026-09-03 — Correção documental: PRD §1/§2 passam a descrever o uso real (contas de terceiros existiram)

**O que mudou.** `PRD.md` §1 ganhou uma nota depois do parágrafo de Posicionamento, e §2 ganhou uma referência cruzada de uma linha. Nenhum código muda nesta entrada — o produto já era assim; o que faltava era o documento parar de afirmar algo que os dados do próprio banco contradiziam.

**Por quê agora.** A limpeza de banco de 2026-09-02 (a pedido do dono, ver `PROGRESS.md`) apagou todas as contas exceto a dele e confirmou, ao apagar, que existiam **6 contas de pessoas reais** (amigos/família) além das de QA — cada uma com a própria conta Supabase, criada sem convite nem tela dedicada, simplesmente porque a autenticação nunca impediu. Isso reabriu a pergunta que `PROGRESS.md` já vinha registrando: o §1 do PRD diz "app pessoal" e o §2 diz "não existe segunda persona", e por um tempo isso não bateu com o banco. Perguntado, o dono concordou em emendar a frase para refletir a realidade, **sem** reabrir o debate maior do módulo "Personal" (que ele decidiu deliberadamente adiar — ver `PROGRESS.md`, "Combinado com o dono, não iniciar ainda").

**A distinção que a nota faz.** "Pessoal" no PRD sempre foi sobre **critério de decisão** — não justificar feature por "outros usuários poderiam querer" (§2) — não sobre uma garantia técnica de que só uma conta existe. A arquitetura (Supabase Auth + RLS por usuário, ADR-002) sempre suportou múltiplas contas isoladas; "app pessoal" nunca foi implementado como trava, só como intenção de design. A nota registra isso e é explícita sobre o que **não** muda: a persona única, o veto a decisão por "outros usuários", e a proibição de virar rede social (feed, seguir, comparar, ranking, perfil público) — nenhuma conta vê ou troca dado com outra.

**Alternativa descartada.** Reescrever §1/§2 para admitir multiusuário como objetivo de produto. Descartada porque não é o que o dono decidiu — ele confirmou a persona única e adiou deliberadamente a conversa sobre o módulo "Personal"; mudar o texto além do fato já observado seria inventar escopo que ele não pediu.

**Classificação.** Não é ADIÇÃO nem REMOÇÃO — nenhuma linha de comportamento do produto muda. É **correção factual do documento**, categoria que o protocolo de Scope Change não previu explicitamente (as entradas anteriores neste arquivo são todas ADIÇÃO); registrado aqui porque a alternativa — deixar o documento errado, sem nota — é o que o protocolo existe para impedir.

**Impacto.** `PRD.md` §1 (nota nova após a linha de Posicionamento) e §2 (uma linha de referência cruzada). Nenhum arquivo de `src/` tocado.

**Como reverter.** Remover as duas notas; o PRD volta a afirmar unicidade sem qualificação — e volta a estar factualmente incorreto sobre o período 2026-08–2026-09.

---

## 2026-09-03 (2) — Scope Change: módulo "Personal" — o guarda-chuva aluno↔personal

**Status: DECIDIDO PELO DONO, NÃO VALIDADO NO MERCADO.** Esta entrada registra a decisão de produto e seus limites. **Nenhuma linha de código deve ser escrita antes da validação descrita em "Portão de saída" abaixo.** É o portão que `PROGRESS.md` já previa ("módulo Personal — parar e debater antes quando chegar a hora"); esta entrada é esse portão tendo disparado.

**O que muda.** O `PRD.md` ganha uma **seção nova numerada** (§11, "O modo Personal") — não uma nota emendada no §2. Motivo de forma, não de estilo: o texto do §2 é "Não existe segunda persona" e a cláusula de veto ("nenhuma decisão se justifica por 'outros usuários poderiam querer'") é **estrutural** — sustenta decisões espalhadas por todo o documento. Emendar o §2 desarmaria o veto em silêncio, em todo lugar, sem ninguém ter decidido isso. A seção nova declara a exceção e redeclara o que o veto continua cobrindo.

**A decisão, em uma frase.** Uma conta pode estar vinculada a um **personal**. Enquanto o vínculo existe, a **prescrição** sai do produto e vai para o humano; o **diagnóstico** continua inteiro com o aluno.

**O corte exato — o que o aluno vinculado mantém e o que perde:**

| | Aluno sem vínculo (hoje) | Aluno vinculado |
|---|---|---|
| Log, histórico, edição de série | mantém | **mantém** |
| Gráficos: e1RM, volume, volume por grupo muscular | mantém | **mantém** |
| Sinais de diagnóstico (empaque, grupo sem estímulo, queda de frequência) | mantém | **mantém** |
| Coach 24h | mantém | **mantém, com trava** (ver "Buracos" #1) |
| Seção de prescrição — "o que mudar na próxima semana" (`PRD.md` §3, pergunta 5) | mantém | **não vê** — vai para o personal |
| Alerta dos sinais de diagnóstico | — | **roteado ao personal**, em formato de chat, onde ele fala com o aluno |

**Por quê essa linha, e não outra.** O corte diagnóstico/prescrição **é a linha que o `PRD.md` §5 já tinha desenhado**: "O app **analisa** o que foi feito; não prescreve programa." Hoje a pergunta 5 do §3 na prática prescreve, o que sempre foi uma tensão interna do documento. Sob vínculo, quem prescreve é o humano contratado para isso — o produto fica **mais** consistente com o §5, não menos. Isso encolhe o Scope Change: não é "segunda persona que quebra o contrato", é "quem ocupa o papel de prescritor quando ele existe".

**Alternativas descartadas.**

1. **O aluno vinculado perde a Análise Semanal inteira** (proposta inicial do dono, debatida e abandonada nesta mesma sessão). Descartada porque entrar num guarda-chuva viraria **rebaixamento de produto**: o plano de graça teria mais que o pago, e o incentivo do aluno seria sair do vínculo. Pior, invertia o dado que sustenta a tese comercial — a pesquisa de churn diz que o aluno abandona porque **ele** não entende o próprio progresso; tirar o diagnóstico do aluno removeria exatamente o mecanismo de retenção que se pretendia vender ao personal.
2. **O personal vê primeiro e libera o parecer inteiro ao aluno** (o parecer existente, com portão de repasse). Descartada pelo dono: mantém a IA como autora da prescrição, o que não resolve a pergunta que ele quer resolver — "se a IA lê os números pro aluno, pra que serve o personal?".
3. **Painel de triagem cruzada** (o personal vê um dashboard de N alunos: quem empacou, quem sumiu). Não descartada, **adiada** — é para onde isso vai depois. O alerta escolhido é o mesmo produto chegando como notificação em vez de painel: custa menos e não depende de o personal lembrar de abrir alguma coisa.
4. **O personal cadastra o e-mail do aluno e passa a ver os dados** (mecânica descrita no pedido original). Descartada por duas razões independentes: quem concederia o acesso seria o personal, não o aluno (não passa em LGPD); e permitiria digitar qualquer e-mail e ler o treino de qualquer pessoa. Substituída por convite → aceite → revogação (ver "Buracos" #3).

**Os quatro buracos que esta decisão abre, e que o desenho tem obrigação de fechar.** Registrados aqui porque nenhum deles é detalhe de implementação — cada um pode invalidar a decisão se ficar em aberto.

1. **O Coach 24h é a porta dos fundos.** Fechar a seção de prescrição e deixar o chat de IA aberto no mesmo app não fecha nada: o aluno pergunta "o que eu mudo essa semana?" e o Coach responde. Sob vínculo, o Coach precisa de trava explícita — responde dúvida de execução e conceito (`PRD.md` §4.4/§4.5), **não** monta a próxima semana, e empurra o pedido ao personal. Sem isso, a decisão inteira é decorativa.
2. **O buraco visual no lugar da seção de prescrição.** Se a seção sumir, lê como app quebrado. Precisa de estado próprio, que comunique "este espaço é do seu personal" — não ausência. Item de gate visual (`AGENTS.md`), não de implementação silenciosa.
3. **Consentimento é decisão de schema, não de tela de cobrança.** No instante em que um personal lê os números de um aluno, o dado deixa de ser privado de uma pessoa. No Brasil isso é LGPD. Desenho mínimo: o personal **convida**, o aluno **aceita**, o aluno **revoga** quando quiser com corte imediato de acesso. Vínculo permanente e concessão revogável/auditável são **tabelas diferentes** — errar isso com uma linha no banco é barato, com mil não é. As 6 contas reais que já existem (ver entrada de 2026-09-03 acima) só entram num guarda-chuva se **elas** aceitarem; nunca por ação unilateral do personal. E quando o vínculo termina, a seção de prescrição volta para o aluno.
4. **O gatilho do alerta é determinístico, não julgamento de LLM.** Mesma regra inegociável do `PRD.md` §3: o sinal sai do código de métricas já testado (`src/lib/analise/`) — empaque de N semanas, grupo sem estímulo, queda de frequência. O alerta **roteia** um sinal que já é calculado hoje; não cria julgamento novo, e o LLM segue sem ver linha crua de série.

**A exceção ao veto anti-social, nomeada de propósito.** O chat personal↔aluno é o **primeiro canal pessoa-a-pessoa** do produto. Não fere o `PRD.md` §5 ao pé da letra (não é feed, seguir, comparar nem ranking), mas é a primeira vez que duas contas se falam num app cuja identidade declarada é "não é rede social". A exceção é **delimitada e fechada**: canal 1:1, apenas dentro de vínculo aceito, sem descoberta de perfil, sem visibilidade entre alunos, sem grupo. Se ficar implícita, "grupo de alunos" aparece daqui a seis meses como extensão natural e o veto terá sido desarmado sem ninguém decidir. **Feed, seguir, comparar, ranking e perfil público continuam mortos.**

**Portão de saída — o que precisa acontecer antes de qualquer código.** A validação mais barata que existe, e ela ainda não foi feita:

1. Ter **um parecer bom de verdade** para mostrar. O banco hoje tem 1 parecer salvo, em fallback determinístico — mostrar isso subvende o produto. Precisa de uma geração real da Gemini, ou um render da bancada (`scripts/preview/`) assumido como demo.
2. Conversar com **2-3 personal trainers reais**, com três perguntas de resposta falsificável:
   - "O que você faz hoje quando um aluno pergunta se está progredindo?" — revela se o buraco existe ou se a planilha dele já resolve.
   - "Se eu te avisar toda segunda que o peito do seu aluno está sem estímulo há 3 semanas, você abre e fala com ele, ou vira mais uma notificação que você ignora?" — **a pergunta que decide se isto tem produto.** O risco central do desenho é o personal virar gargalo obrigatório: sem o vínculo o diagnóstico chegava sozinho; com ele, a retenção do aluno passa a depender da disciplina do personal.
   - "Quantos alunos você tem, e quantos você perdeu nos últimos 6 meses?" — transforma retenção de discurso em número deles.

**A cunha, quando passar o portão.** Não é o login com dois modos, nem a aba ALUNOS, nem cobrança — isso é o produto completo. A menor coisa testável é: **um personal recebe um alerta real sobre um aluno real e responde ao aluno por ali.** Um convite, um aceite, uma revogação, um sinal roteado, uma mensagem. Esconder a seção de prescrição é barato (condicional sobre o vínculo); o caro e incerto é o alerta+chat, e é isso que a cunha tem que testar.

**Contexto de mercado que motivou a decisão** (pesquisa de sessão anterior, `WebSearch` — não verificada independentemente nesta): software para personal trainer projetado em ~US$ 1,85 bi até 2033; concorrência brasileira densa (MFIT, PersonalGO, Trainer Connect, Mobitrainer, R$ 10,90–200/mês) e global cara (Trainerize, Everfit, TrueCoach). **O gap que sustenta a tese:** nenhum concorrente pesquisado usa IA para **interpretar o log depois de registrado** — usam para gerar treino, para chat/anamnese, para estimar gordura por foto. Ler os números e dizer o que significam continua sendo o território do lastro.

**Classificação.** **ADIÇÃO** — e a de maior alcance registrada neste arquivo até aqui. Não remove nada do produto atual: nenhuma conta existente muda de comportamento sem aceitar um convite.

**Impacto.** `PRD.md` §11 (seção nova, ainda não escrita — companheira desta entrada). `PROGRESS.md` (o item "Combinado com o dono, não iniciar ainda" sai do limbo e vira portão com critério de saída explícito). Nenhum arquivo de `src/` tocado, nenhuma migração, nenhum teste — por decisão, não por falta de tempo.

**Como reverter.** Apagar a seção §11 do PRD e esta entrada perde efeito prático — nada foi construído. Depois que houver código, a reversão deixa de ser documental: o vínculo aluno↔personal é dado de terceiros e a remoção passa a ter obrigação de exclusão, não só de desligamento. **A janela barata de reverter fecha no primeiro vínculo real criado em produção.**

**Observação de processo.** O protocolo de Scope Change citado no cabeçalho do `PRD.md` aponta para `.claude/skills/padrao-documentos/SKILL.md`, que **não existe neste repositório** (existem `portao-visual/`, `projeto-retomada/`, `qa-registro/`). Esta entrada seguiu o formato das entradas anteriores deste arquivo — o que mudou · por quê · alternativa descartada · classificação · impacto · como reverter. O ponteiro quebrado no PRD é dívida documental separada, não corrigida aqui.

---

## 2026-09-03 (3) — Correção factual: o "gap de IA interpretativa" é mais estreito do que a entrada anterior afirma

**Por que esta entrada existe separada.** Este arquivo é append-only ("nunca reescrever entrada antiga"). A entrada `2026-09-03 (2)` continua válida na decisão que registra; o que envelheceu em poucas horas foi **um parágrafo dela** — o de "Contexto de mercado", que dizia: *"nenhum concorrente pesquisado usa IA para interpretar o log depois de registrado"*. Esta entrada corrige esse parágrafo sem tocá-lo. Mesmo espírito da correção documental de `2026-09-03` (PRD §1/§2): o documento parou de bater com o que se sabe, e a alternativa — deixar errado — é o que o protocolo existe para impedir.

**O que motivou.** A pedido do dono, um levantamento de desk research foi feito **nesta mesma sessão**, depois da entrada anterior: 26 fontes distintas (Reclame Aqui, Trustpilot, Capterra, Google Play, análises independentes e blogs de fornecedor), das quais 6 são vozes de usuário real, somando ~55 depoimentos individuais. Dossiê completo: <https://claude.ai/code/artifact/b79d711e-4e4a-43ca-9b14-4da8c0f85cc7>.

**A correção, com a precisão que importa.** O gap **não morreu**, e a versão simplificada ("alguém já faz, acabou") seria tão errada quanto a afirmação original.

- **Continua verdade:** nenhum produto encontrado vende *"eu leio seu log e digo o que os números significam"* como o produto. A IA nativa da **Trainerize**, pela documentação da própria empresa, **gera** programa a partir dos dados armazenados do cliente — não interpreta a execução registrada. Buscas diretas por um recurso de alerta/interpretação no **TrainHeroic** não acharam nada.
- **Deixou de ser verdade:** a categoria está entrando nesse espaço com **linguagem idêntica** à do lastro. O **Habby AI** (Coach Catalyst) é vendido como quem *"traduz dados do cliente em ações significativas — identificando tendências, sugerindo ajustes de programa e sinalizando riscos de engajamento"*. Na página do próprio produto isso se resolve como gerador de conteúdo e assistente de decisão, não como leitor do log — mas **o comprador não lê a página do produto, lê a frase**.
- **Elo mais fraco da corrente, declarado como tal:** um artigo editorial (Coach360) afirma que TrainHeroic, TrueCoach e Trainerize já fazem "interpretação de dados de treino já registrados". Isso é **contradito pelo material da própria Trainerize** e não sustentado para o TrainHeroic. Não foi tratado como fato; está registrado como sinal de direção da categoria.

**A consequência real, e ela não é técnica.** O diferencial do lastro ficou **difícil de dizer**, não difícil de construir. Abrir uma conversa com "IA que analisa os dados do aluno" é competir com uma frase já gasta por pelo menos três concorrentes — o personal responderá "a Trainerize já faz", estará factualmente errado, e a objeção mata a conversa do mesmo jeito. **Consequência prática para o portão de saída da entrada anterior:** a abordagem com os personais não deve abrir pela IA, e sim pelo resultado — *"toda segunda eu te digo qual aluno ligar"*.

**Segunda correção, sobre a base de churn.** A entrada anterior cita como motivação um conjunto de números de retenção ("~50% dos alunos saem por ano", "a causa nº1 é progresso pouco claro", "60% dos que atingiram a meta saem por falta de próximo passo"). O levantamento mostrou que **esses números vêm quase todos de blogs de empresas que vendem software de retenção para personal trainer** (Trainerize, My PT Hub, Virtuagym, Trainero, TrainingPro, Gymkee, Coach Catalyst). Não são necessariamente falsos; a única atribuição nomeada aponta para o PTDC, também da indústria. **Nenhuma fonte neutra os confirmou.** Ficam registrados como indício de direção, não como dado. O substituto barato já está no portão de saída: a terceira pergunta aos personais ("quantos alunos você tem, e quantos perdeu nos últimos 6 meses?") troca o número do fornecedor pelo número da pessoa.

**Terceiro achado, que NÃO é correção — é evidência nova a favor de uma restrição já escrita.** O `PRD.md` §11.4 nº 3 (consentimento revogável; quando o vínculo acaba, o dado volta ao aluno) foi escrito **antes** deste levantamento. O levantamento achou o cenário exato acontecendo em público: reclamação de 14/08/2026 no Reclame Aqui (ID 256482665) de um aluno da **MFIT Personal** bloqueado do próprio histórico ao encerrar o vínculo com o personal — *"o app exibe 'Acesso não autorizado, por favor entre em contato com o seu professor' e não me permite mais visualizar o MEU próprio histórico"* —, invocando LGPD art. 18 (acesso e portabilidade). **A MFIT respondeu por escrito que não fornece os dados**, alegando que o conteúdo pertence ao profissional. Reclamação encerrada como não resolvida. A restrição §11.4 nº 3 deixa de ser só obrigação legal e passa a ser diferencial dizível — **com a ressalva de que dizer isso a um personal é dizer que ele não controla o dado do aluno, o que para alguns é o oposto de um argumento de venda.** Testar como pergunta antes de virar pitch.

**Quarto achado, que enfraquece a cunha e precisa ficar registrado.** A cunha da entrada anterior é um alerta roteado ao personal. Duas fontes independentes mostram que, nesta categoria exata, canal de notificação degrada para ruído: análise independente da Trainerize relata que clientes recebem tanta notificação por padrão que **desativam todas no primeiro mês**; e um contra listado no Capterra sobre a **Everfit** diz que, se o cliente ignora as notificações do personal, elas são **desligadas automaticamente** pela plataforma. Isso não invalida a cunha — valida a pergunta de risco que já estava no portão de saída ("você abre e fala com ele, ou vira mais uma notificação que você ignora?"), que passa a ter evidência atrás, não só intuição.

**Quinto achado, o mais desconfortável, registrado sem suavizar.** Em 254 reclamações ativas da MFIT no Reclame Aqui, a distribuição por problema é: cobrança indevida (72), qualidade do produto (44), não consigo cancelar (22), mau atendimento (18), cancelamento (10), alteração de dados (8). No Trustpilot da Trainerize e no Capterra de TrueCoach/Everfit, o padrão se repete: bug, cobrança, cancelamento, suporte, preço que pune crescimento. **Nenhuma reclamação encontrada é "o app não interpreta meus dados".** O que chega mais perto são três pedidos estreitos e todos de **agregação, não de interpretação**: falta de média semanal de pesagem/macros (Capterra/Trainerize), impossibilidade de extrair dado agregado de retenção sem exportar CSV (análise independente/Trainerize), ausência de gráfico de progresso de hábito (Capterra/Everfit). Duas leituras possíveis, ambas plausíveis, e **esta entrada não as resolve**: (a) necessidade latente — ninguém reclama da ausência de uma categoria que nunca viu; (b) não é dor sentida. As 3 conversas do portão de saída resolvem; desk research não resolve mais.

**Alternativa descartada.** Reescrever ou apagar o parágrafo de "Contexto de mercado" da entrada `2026-09-03 (2)`. Descartada porque este arquivo é append-only por contrato, e porque apagar o erro apagaria também o registro de que a decisão foi tomada com uma leitura de mercado que não se sustentou inteira — informação que o próximo agente precisa ter.

**Classificação.** **Correção factual do documento** — mesma categoria aberta na entrada de `2026-09-03`. Nenhuma linha de comportamento do produto muda. **A decisão da entrada `2026-09-03 (2)` continua de pé, e o `PRD.md` §11 não é alterado por esta entrada.**

**Impacto.** Nenhum arquivo além deste e de `PROGRESS.md`. Nada em `src/`. O portão de saída da entrada anterior ganha duas instruções novas, sem mudar de natureza: **não abrir a conversa pela IA** (abrir pelo resultado), e **levar a hipótese de que a dor não existe** a sério na conversa, em vez de ir provar a hipótese contrária.

**Buracos do levantamento, declarados.** (1) Nenhum personal trainer **brasileiro** em voz própria sobre análise de dados — as avaliações de loja legíveis eram de alunos; a única voz de personal BR encontrada foi uma reclamação sobre falta de verificação de CREF na MFIT. É o buraco mais relevante, porque é exatamente o público-alvo. (2) Reddit descartado como fonte: as buscas caíram em conteúdo de marketing que afirma resumir o r/personaltraining sem citar um post sequer. (3) Das 254 reclamações da MFIT, 2 foram lidas na íntegra — a distribuição por categoria é dado completo, o conteúdo detalhado não.

**Como reverter.** Apagar esta entrada faz o `DECISIONS.md` voltar a afirmar um gap de mercado mais largo do que as fontes sustentam. Não há código a reverter.

---

## 2026-09-03 (4) — PDF do parecer: direção "papel timbrado", escolhida em portão visual

**O que mudou.** `src/lib/pdf/documento-parecer.tsx` redesenhado. Antes: Helvetica embutida, tamanhos e cinzas arbitrários (`#8a8a8a`, `#e0e0e0`), nenhuma relação com a identidade do app — o PDF era o único renderizador do projeto que nunca passou por decisão de design. Agora é um documento emitido, com as três famílias reais e as cores de `tokens.css`.

**Como a decisão foi tomada.** Pelo protocolo do `portao-visual`: briefing → direções **renderizadas** → o dono escolhe uma. Três direções foram geradas de verdade pelo `@react-pdf`, com as fontes do app e o parecer real da conta do dono (`4dc6bcbf…`), não descritas em prosa:

| Direção | O que era | Por que caiu / venceu |
|---|---|---|
| **A — Negativo** | O PDF é a tela: fundo obsidiana, ouro, esmeralda, Fraunces em branco | Bonito, e **ninguém imprime**: página inteira preta, ouro e esmeralda viram lama em impressora comum, Fraunces em negativo fica frágil |
| **B — Papel timbrado** | Tinta obsidiana sobre papel, fio de ouro na assinatura, Fraunces no veredito | **ESCOLHIDA.** Único que se comporta como documento emitido (`PRD.md` §7.1): imprime, arquiva, anexa |
| **C — Cabeçalho selado** | Faixa obsidiana no topo, miolo em papel, faixa no rodapé | Melhor primeira dobra das três, mas duas tarjas pretas puxam pra cara de certificado/template — e a de baixo ainda imprime como tarja |

**A restrição que decidiu, e que não tinha saída neutra.** O sistema do app é **escuro** (`tokens.css`, Apex Pro — `--lastro-fundo: #07090D`) e este artefato é **impresso**. Ou o PDF vira uma página preta que ninguém imprime, ou inverte pra papel e a identidade passa a ser carregada por Fraunces + fio de ouro + cores de sinal, sem o fundo que a carrega na tela. Um PDF que dói imprimir é meio PDF — e quem quer o visual da tela já tem a tela, não precisa exportar nada.

**Três achados técnicos do portão, que valem mais que a escolha estética.**

1. **O `@react-pdf` não interpola eixo de fonte variável.** As três famílias do app (Bricolage, Archivo, Fraunces) são variáveis; a biblioteca abre a **instância padrão** do arquivo e pronto. Na Fraunces isso é desastroso: o eixo `wght` dela tem `default 900` e o `opsz` tem `default 9` — registrar o `.ttf` variável direto renderiza **Black em óptica de texto miúdo**, nada parecido com a tela. Foi medido, não suposto (primeiro probe do portão renderizou "peso 400" e "peso 700" idênticos e pesados demais; a inspeção do `fvar` explicou por quê). Solução: `scripts/fontes-pdf/instanciar.py` corta 4 instâncias estáticas com `fontTools`, fiéis aos eixos declarados em `layout.tsx` e ao `--lastro-peso-forte` (600) que `sistema.css` usa no veredito.
2. **As fontes entram como data URI, não como arquivo em disco.** Caminho local seria mais leve, mas obrigaria o arquivo a ser rastreado pro bundle serverless (`outputFileTracingIncludes`) — e este projeto **não roda o app localmente** (não existe `.env.local` nesta máquina). Uma falha de rastreamento só apareceria **em produção, na peça-assinatura**, que é exatamente o modo de falha que já mordeu este mesmo PDF (bug do veredito corrigido na tela pela PR #177 e invisível aqui por dois dias, até a #181). Custo aceito e declarado: ~190 KB num módulo TS carregado só pela rota do PDF.
3. **`formatarDelta` não podia ser encurtado, e isso mudou o layout.** O primeiro render espremeu o delta numa coluna de 54pt e a frase "sem mudança há 4 semanas" quebrou em 4 linhas, destruindo a grade. A saída óbvia — cortar pra "0%" — **reprovaria o `DESIGN.md` §3.6.6** ("o delta é o canal de texto obrigatório: cada sinal traz a palavra e o número que o identificam; dois blocos distinguidos só pela cor reprovam o gate"), e no papel isso é ainda mais crítico que na tela, porque uma impressão em preto e branco não tem a cor do sinal. O texto ganhou a largura inteira numa segunda linha em vez de perder conteúdo. Coberto por teste novo.

**A linha de procedência — como o vazio da página foi resolvido.** As três direções tinham o mesmo defeito de composição: com 6 blocos de evidência sobrava ~35% de página morta. Resolvido com **dado que já existia e a tela descarta**: `evidencia.ts` carrega `grupo_muscular`, `series_valendo`, `peso_referencia`, `reps_referencia` e `semanas_sem_progresso` por contrato (Regra da Presença), e o PDF antigo jogava tudo fora. Agora cada evidência tem uma segunda linha com esses campos. Num documento de arquivo é o que responde "de onde saiu esse número?" seis meses depois — enfeite não faria isso.

**Alternativas descartadas.**

- **Mudar `formatarPeso` para agrupar milhar** (`7.280 kg` em vez de `7280 kg`). Descartada **por ora**: é o formatador compartilhado com a tela e com o fallback determinístico (reuso deliberado da PR #184) — mudar pra embelezar um renderizador mexeria nos três em silêncio. Registrado em `SDD.md` §10.4.1 como pergunta aberta pro dono, não como correção pendente.
- **Manter Helvetica e só ajustar tamanhos.** Descartada porque o pedido era estrutural ("PDF bonito", item 5 do backlog) e o `portao-visual` é explícito: pedido estrutural não vira retoque.
- **Rasterizar a tela e embutir como imagem.** Nunca esteve em jogo — mataria texto selecionável, que é a razão de `@react-pdf` ter vencido Puppeteer e `jsPDF+html2canvas` na entrada de 2026-08-31.

**Inconsistência documental achada no caminho, NÃO corrigida aqui.** O `DESIGN.md` §3.0 ainda descreve como tese visual aprovada *"Areia & Azul Petróleo"* (areia é a superfície, azul petróleo é a tinta), mas `src/app/tokens.css` — que o próprio §3.1 declara como **fonte única** — é *"Apex Pro: Obsidiana, Dourado Champagne & Esmeralda"*, um tema escuro. Segui os tokens, conforme §3.1. A §3.0 provavelmente é resíduo do redesign Apex Pro (mesma família do achado de seletores duplicados em `sistema.css`, `PROGRESS.md`). Fica registrado como dívida documental separada — corrigir por dentro desta tarefa seria decidir por baixo uma coisa que ninguém debateu.

**Classificação.** **ADIÇÃO** — nenhum contrato muda. `PRD.md`, `ADR.md` e as fitness functions ficam intactos; `SDD.md` §10.4 ganha a subseção 10.4.1 com a direção e o porquê.

**Impacto.** `src/lib/pdf/documento-parecer.tsx` (redesenho), `src/lib/pdf/fontes.ts` (novo, gerado), `scripts/fontes-pdf/{instanciar.py,embutir.mjs}` (novos), `src/lib/pdf/documento-parecer.test.ts` (+4 testes), `src/lib/texto/i18n.ts` (+5 chaves en/es), `.gitignore`, `SDD.md` §10.4/§10.4.1. Nenhuma migração. 252 testes verdes, `tsc` e `next lint` limpos.

**Estado de QA: `ALEGADO`, não `PASSOU`** (`AGENTS.md` §5). Verificado por quem implementou, na bancada, contra o parecer real da conta do dono, nos dois caminhos (prosa e fallback de 2 páginas, com rodapé fixo e paginação). **Falta:** a passada de outro agente, e o dono ver o PDF baixado do app de verdade — a rota `/api/parecer/[id]/pdf` exige sessão e não roda nesta máquina. E vale a ressalva de origem: o único parecer salvo em produção está **em fallback determinístico**; o caminho de prosa foi validado com o `textoProsaExemplo` sintético da bancada.

**Como reverter.** `git revert` do commit de implementação devolve o PDF Helvetica. `src/lib/pdf/fontes.ts` e `scripts/fontes-pdf/` ficam órfãos e podem ser apagados — nada mais no projeto os importa.

---

## 2026-09-03 (5) — "Finalizar Treino" encerra a sessão e pode ser desfeito (semântica decidida a partir de relato de uso real)

**Por que esta entrada existe.** Não é bugfix puro. O dono escolheu **o que "finalizar" significa** — e sem registro o próximo agente pode "consertar" de volta pro híbrido acidental que existia antes, achando que a restrição nova é excesso de zelo.

**A origem.** Relato de uso real do dono, usando o app: apertou "Finalizar Treino" sem querer, o cronômetro congelou, ele **conseguia seguir adicionando exercícios**, mas o timer de descanso não acionava mais.

**O que o código fazia — três defeitos encadeados, não um.**

1. **"Finalizar" não pedia confirmação nenhuma.** Um toque em `treino-detalhe.tsx` gravava `lastro_fim_treino_<id>` e acabou. Contrariava o padrão do próprio projeto: o `PRD.md` §4.1 exige confirmação inline onde a ação tem custo real, e a PR #181 aplicou a mesma regra ao "Descartar" rascunho pelo mesmo raciocínio. Num app que o `DESIGN.md` D4 descreve como usado **suado, com uma mão, entre séries**, toque acidental não é hipótese.
2. **Era irreversível.** A chave era **escrita por DOIS componentes** — `timer-topo.tsx` (`garantirMarcosTreino`) e `treino-detalhe.tsx` (no `onClick`), cada um com sua própria cópia do nome — e **apagada por nenhum**. `calcularSegundosTreino` congela em `fim - início` quando a chave existe, então o cronômetro daquele treino ficava travado **para sempre**, sem caminho na UI.
3. **O botão de descanso virava um no-op silencioso** — e é o que o dono sentiu. Com o treino finalizado, `descansoAtivo = ativo && !treinoFinalizado` já nascia `false`, mas a condição de render do botão era `!descansoAtivo && !descansoFinalizado`, que dava **`true`**. O botão continuava visível e clicável, `iniciarTimer` rodava, a cápsula nunca aparecia, e nada avisava. Um botão desabilitado teria dito a verdade; esse mentiu, e o dono clicou várias vezes achando que era ele.

**O estado incoerente por trás dos três.** Nada na área de ações observava `treinoConcluido` — só o rótulo do botão mudava. Ou seja, o app **congelava o tempo como se a sessão tivesse acabado, mas deixava registrar como se não tivesse**. Um híbrido acidental de duas semânticas.

**A decisão do dono.** Perguntado entre três leituras, escolheu: **finalizar encerra a sessão de verdade, com desfazer.**

- Finalizar **pede confirmação inline**, com o custo dito na frase.
- Enquanto finalizado: o cronômetro para, **o descanso some** (não fica de enfeite clicável) e **o registro fecha**.
- Existe **"Reabrir treino"**, que devolve tudo.

**Alternativas descartadas.**

1. **"Finalizar" é só um marco; o treino segue editável e registrar uma série reabre sozinho.** Menos atrito e sem botão de desfazer, mas o treino nunca fica realmente fechado — e o relatório pós-treino poderia mudar depois de emitido, o que colide com a ideia de documento emitido que o produto já usa no parecer (§7.1).
2. **Só consertar o botão morto.** Corrigiria o sintoma e deixaria o dono sem saída no próximo toque acidental — que é a parte do relato que mais custou.

**A armadilha do "desfazer", registrada porque quase passou.** Reabrir **não pode** só apagar a marca de fim. O decorrido é `agora − início`, então um treino de 1h finalizado às 10h e reaberto às 14h passaria a marcar **5 horas** — o desfazer mentiria pior que o bug original. `inicioAoReabrir` (`src/lib/treino/marcos-treino.ts`) desloca o início para preservar o que já correu. Tem teste dedicado.

**Consequência estrutural: as duas chaves ganharam um dono só.** `src/lib/treino/marcos-treino.ts` passa a ser o único lugar que lê e escreve `lastro_inicio_treino_` e `lastro_fim_treino_`. `timer-topo.tsx` só garante o **início**; `treino-detalhe.tsx` é quem finaliza e reabre. **A duplicação era a causa-raiz** — cada lado sabia gravar e nenhum sabia apagar.

**Achado de brinde, corrigido no caminho.** O `useSyncExternalStore` que deriva "concluído" em `treino-detalhe.tsx` tinha **assinatura vazia**: o próprio comentário do arquivo dizia que dependia de algum outro `setState` do mesmo handler forçar o render. Funcionava por sorte — e "Reabrir" não teria essa sorte, porque o clique dele mexe **só** no `localStorage`. `marcarFim`/`reabrir` agora notificam de verdade (`assinarMarcos`), então a releitura é consequência da escrita, não coincidência.

**Classificação.** **ADIÇÃO** de comportamento (confirmação + reabrir) e **correção** de três defeitos. Nenhum contrato de documento muda: `PRD.md`, `ADR.md` e as fitness functions ficam intactos — a confirmação inline, aliás, passa a **cumprir** o §4.1 onde antes não cumpria.

**Impacto.** `src/lib/treino/marcos-treino.ts` + teste (novos), `src/components/treino-detalhe.tsx`, `src/components/timer-topo.tsx`, `src/lib/texto/i18n.ts` (+2 chaves en/es). 13 testes novos, 265 no total; `tsc`, lint e build de produção limpos. PR #193, squash `3d2a76d`.

**Estado de QA: `ALEGADO`, não `PASSOU`** (`AGENTS.md` §5). Não há como rodar o app nesta máquina (sem `.env.local`) e a bancada visual não monta `treino-detalhe`. **Falta o dono repetir o percurso no aparelho dele:** finalizar → confirmar → ver o descanso sumir → reabrir → **conferir que o cronômetro voltou de onde parou**, não do zero nem inflado. Esse último passo é o único que os testes não substituem, porque depende do relógio real entre duas sessões.

**Pergunta que este achado abre e ninguém respondeu.** `descansoAtivo` foi um caso de **condição de render e condição de efeito discordando** — o botão aparecia por uma regra e funcionava por outra. Não foi feita varredura atrás de outros lugares com o mesmo padrão. Se existirem, há mais botão mentindo no app.

**Como reverter.** `git revert` do commit devolve os três defeitos juntos — inclusive a irreversibilidade. `src/lib/treino/` fica órfão e pode ser apagado.

---

## 2026-09-04 — Correção de diagnóstico: os pareceres em fallback eram ERRO DE API, não rejeição do validador

**O que estava sendo dito, e está errado.** Desde 2026-09-02 o `PROGRESS.md` registra que "a Gemini seguiu rejeitando as duas tentativas de gerar um veredito real", e nesta sessão eu mesmo apresentei ao dono uma leitura de código concluindo que a culpa era do `validarNumeros` (`api/analise/route.ts` rejeita, tenta de novo, cai no fallback determinístico). **A leitura de código estava certa sobre o mecanismo e errada sobre o que aconteceu.**

**A evidência, medida no console do Google AI Studio** (projeto `claudeAcademia`, chave `academia`, nível gratuito, janela de 28 dias — consultada em 2026-09-04):

| Dia | Requisições | Taxa de sucesso | Erros |
|---|---|---|---|
| A | 14 | **35,7%** | 5× `404 NotFound` + 4× `429 TooManyRequests` |
| B | 15 | **26,7%** | 11× `503 ServiceUnavailable` |

Ou seja: **a API falhou em 64% e 73% das chamadas nesses dois dias.** Quando a chamada inicial lança, `respostaUm` fica `null`, o retry nem acontece e o código vai direto pro fallback determinístico. O validador **nunca chegou a rodar** nesses casos.

**Limites do nível gratuito, medidos na mesma consulta** (`gemini-3.6-flash`): pico de **3/5 RPM**, 3,35K/250K TPM, **16/20 RPD**. Confirma o valor de 20 req/dia que `KNOWLEDGE.md` §3.2 já registrava e acrescenta o dado novo que faltava: **o teto de 5 requisições por MINUTO**. O fluxo do parecer consome até 2 chamadas em segundos (tentativa + retry de validação), então duas perguntas seguidas encostam no teto por minuto — o que explica os 429.

**Por que isso passou dias sem diagnóstico, e é a lição que importa.** Três causas com sintomas idênticos:

1. O código funila `404`, `429`, `503` e "validador rejeitou" no **mesmo** caminho: fallback determinístico + `avisoFalhaInterpretativa = true`.
2. O aviso mostrado ao dono diz literalmente *"a interpretação por IA falhou desta vez (duas tentativas rejeitadas)"* — que é **factualmente falso** quando a causa foi 503: a API não respondeu, ninguém rejeitou nada. O produto conta uma história errada sobre o próprio defeito.
3. O `console.error` existe, mas a Vercel no plano **Hobby retém runtime log por 1 hora**. Quando o dono percebe o problema, a evidência já evaporou. Confirmado nesta sessão: busca por `[analise]` em 7 dias devolveu vazio por retenção.

**O que a chave NÃO é.** Não está revogada, não é problema de faturamento, não é modelo inexistente no geral — `Gemini 3.6 Flash` aparece com uso bem-sucedido na mesma janela. Os 5× `404` de um único dia continuam sem explicação e ficam como pergunta aberta.

**Classificação.** **Correção factual** de um diagnóstico registrado no `PROGRESS.md` e repetido por mim nesta sessão. Nenhum comportamento de produto muda nesta entrada.

**Impacto.** Muda a prioridade do backlog: "consertar o `validarNumeros`" **sai** da lista como estava formulado. O que entra no lugar está em `PROGRESS.md`.

**Como reverter.** Nada a reverter — é registro de medição.

**Método, pra quem repetir.** O console do AI Studio (`/usage`, `/rate-limit`) renderiza tudo em canvas; extração de texto devolve só as legendas de acessibilidade. Os números saem clicando nos botões "Preencher os dados da tabela …" (que ativam as grades acessíveis) e lendo o `<table>` resultante pelo DOM. Screenshot pela extensão do Chrome falhou com timeout de CDP nesta máquina — ler o DOM foi mais confiável e mais barato.

---

## 2026-09-04 (2) — O tempo do treino ganha âncora no banco (`iniciado_em`), e os relatórios param de divergir

**Origem: dois relatos de uso real do dono, no mesmo dia, com a mesma causa-raiz.** (1) Abrir um treino de ontem começava o cronômetro do zero, contando ao vivo. (2) O relatório gerado na tela de treino dava número diferente do gerado em `/ajustes/relatorios` para o **mesmo** treino.

**A causa-raiz, e ela é constrangedora.** `treino.iniciado_em` existe no banco **desde a migration 0001** (`timestamptz not null default now()`) e **nunca foi lido** — `buscarTreino` selecionava só `id, data`. Sem âncora no banco, cada tela inventava a sua medida de tempo.

**Bug 1 — cronômetro contando do zero.** `garantirInicio` gravava `agora` no `localStorage` ao montar o `TimerTopo`, **para qualquer treino**. Abrir um treino antigo criava um início falso e o relógio saía correndo, num treino já encerrado; o botão de descanso aparecia junto, porque o app achava que a sessão estava em andamento.

**Regra adotada, declarada como decisão de produto (e trivialmente reversível):**

> **Um cronômetro que não sabe quando a sessão terminou não deve fingir que está correndo.**

Na prática: a marca de início local só é gravada quando a sessão **começa aqui** (treino recém-criado, sem série nenhuma) — `iniciarSessaoLocal`, nome novo que carrega essa intenção. Sem marca local, o cronômetro mostra a **duração reconstruída do banco, parada**, e o botão de descanso não aparece. `reabrir` também deixou de gravar um início novo quando não há um local para preservar — recriaria o mesmo defeito por outro caminho, e tem teste.

**Bug 2 — relatórios divergentes.** Eram duas definições de duração para o mesmo treino:

| Onde | Fonte | O que contava |
|---|---|---|
| Tela de treino | cronômetro ao vivo (`localStorage`) | desde que o treino foi **aberto** no aparelho |
| `/ajustes/relatorios` | `última série − primeira série` | só o intervalo entre séries |

A segunda sempre dava **menos**: descartava o aquecimento antes da 1ª série e tudo depois da última. Diferença **sistemática**, não arredondamento — e como a duração alimenta métricas derivadas, elas divergiam junto.

Agora existe `duracaoSessaoSegundos()` em `metricas-treino.ts`: **definição única** usada pelos dois, ancorada em `iniciado_em` + `criado_em` da última série. Não depende de `localStorage`, então não muda de aparelho para aparelho.

**Isto já tinha sido reportado uma vez.** O comentário em `ajustes/relatorios/page.tsx` registra o mesmo sintoma em **2026-08-27**; a correção da época trocou um fallback fixo de 45 minutos por essa reconstrução. Trocou um erro grande por um menor **sem atacar a causa** — as duas telas continuaram medindo coisas diferentes. É o segundo caso nesta semana em que uma correção anterior tratou sintoma: o mesmo aconteceu com o veredito do PDF (#177 → #181).

**Alternativas descartadas.**

1. **Manter o cronômetro ao vivo como fonte do relatório e fazer o servidor imitá-lo.** Impossível sem `localStorage` no servidor — e amarraria a métrica de um documento a um aparelho.
2. **Congelar o cronômetro por regra de data ("treino não é de hoje").** Descartada: introduz regra de fuso horário para resolver o que a ausência de marca local já responde, sem número mágico.
3. **Adicionar `finalizado_em` agora.** É a solução **completa** (faria a duração ser exata e o cronômetro sobreviver a troca de aparelho), mas é migration, e o histórico está divergente. Adiada por decisão do dono.

**Limite conhecido e aceito, documentado no código:** o tempo **depois da última série** (desmontar, alongar) não entra na duração. Sem `finalizado_em`, ninguém sabe quando a sessão acabou.

**Limpeza que caiu junto.** `duracaoSegundos` (estado) e `onTempoTreinoAtualizado` (prop + `useEffect`) existiam só para levar o cronômetro até o relatório. Sem consumidor, saíram.

**Classificação.** **Correção**, com uma ADIÇÃO de contrato de dados (`Treino.iniciadoEm`). Nenhum documento de contrato muda.

**Impacto.** `src/lib/dados/treino.ts` (tipo + 2 selects), `src/lib/dados/metricas-treino.ts` (2 funções novas), `src/components/{timer-topo,treino-detalhe}.tsx`, `src/app/treino/[id]/page.tsx`, `src/app/ajustes/relatorios/page.tsx`. 10 testes novos. PR #195, squash `3773d80`.

**Estado de QA: `ALEGADO`.** Falta o dono: abrir um treino **antigo** e confirmar que o tempo aparece **parado** (não 00:00 correndo), e gerar o relatório **nos dois lugares** conferindo que o número bate.

**Como reverter.** `git revert` do commit. `iniciado_em` volta a não ser lido e as duas telas voltam a divergir.

---

## 2026-09-04 (3) — Retry em falha transitória da Gemini, e o aviso para de mentir

**Origem: a medição de `2026-09-04`** (entrada acima nesta mesma data), não suposição. **11 das 15 chamadas voltaram `503`** — 26,7% de sucesso.

**Refinamento da medição, e ele CORRIGE a granularidade da entrada anterior.** Aquela entrada apresentou os números como "Dia A" e "Dia B"; na janela de 28 dias o console do AI Studio agrega em **períodos**, não em dias. Reconsultado com janela de **7 dias**, que dá resolução diária:

| Dia | `503` |
|---|---|
| 1 set | 2 |
| 3 set | **11** |
| **4 set** (o próprio dia desta entrada) | **1** |

Duas consequências. **(1) O `503` é recorrente, não um episódio isolado** — aconteceu em três dias distintos, incluindo o dia em que o retry foi escrito. É validação direta da decisão, não justificativa retroativa. **(2) `404` e `429` não aparecem na janela de 7 dias:** ficaram entre 27 e 29 de agosto e **não voltaram desde**. Isso enfraquece ainda mais a hipótese de o `404` vir do lastro (que tem um único modelo, usado com sucesso o tempo todo) e reforça o combinado de só investigar se reaparecer.

**O que 503 custava.** A chamada lançava, `respostaUm` ficava `null`, o retry de validação nem acontecia e a rota ia direto pro fallback determinístico — perdendo o parecer inteiro **e** queimando a trava de 10 minutos (`SDD.md` §11.2). `503` é sobrecarga do lado do Google: passa sozinha.

**A política, e ela NÃO é simétrica de propósito.**

| Erro | Repete? | Por quê |
|---|---|---|
| `503`, `500`, `502`, `504` | **sim, uma vez** | Transitório |
| `429` | **não** | Teto de cota (5 RPM / 20 RPD, `KNOWLEDGE.md` §3.2). Repetir queima cota e falha de novo |
| `404` e demais 4xx | **não** | Determinístico; retry só esconderia o defeito |
| erro sem status legível | **não** | O padrão seguro é **não** repetir |

Uma repetição só, não um laço: o teto de duração da function é curto, e duas falhas seguidas indicam indisponibilidade real, não soluço.

**Onde mora, e por quê.** `src/app/api/analise/retry-transitorio.ts`, **separado do SDK**. É o que torna a política inteira testável sem rede e sem chave — 14 testes, incluindo os dois que travam o comportamento de **não** repetir 429 e 404, e o que garante que não vira laço.

**Correção de uma afirmação registrada nesta sessão.** Eu havia dito que este retry "precisava de um jeito de exercer antes" e o parkei como bloqueado. **Estava errado:** eu confundia *testar a lógica* com *testar a API*. `ApiError` do `@google/genai` expõe `status: number`, e `ClienteParecer` sempre foi uma interface. A lógica era testável desde o começo.

**O aviso que mentia.** O texto dizia *"a interpretação por IA falhou desta vez (duas tentativas rejeitadas)"* — **falso** quando a causa era 503: a API não respondeu, ninguém rejeitou nada. O produto contava uma história errada sobre o próprio defeito, nos três lugares que o renderizam (tela, PDF e dicionário en/es).

A frase nova — *"Não foi possível gerar a interpretação por IA desta vez"* — é verdadeira nos quatro casos (503, 429, 404 e rejeição do validador) e **não precisou de migration**. A separação que faltava: **parar de mentir** é copy; **dizer qual foi a causa** é persistência.

**Alternativa descartada.** Persistir a causa (`falha_motivo`) agora. É migration numa base com histórico divergente (`db push` recusa, a `0015` foi aplicada à mão), e o valor é de **diagnóstico**, não de leitura — o dono aprovou adiar para junto da limpeza do histórico.

**Decisão de custo do dono, registrada:** **continuar no nível gratuito** por ora. É o que torna a assimetria da política acima obrigatória — com 5 RPM, repetir um `429` seria contraproducente.

**Classificação.** **Correção** (aviso) + **ADIÇÃO** (política de retry). Nenhum contrato muda.

**Impacto.** `retry-transitorio.ts` + teste (novos), `gemini.ts`, `parecer.tsx`, `documento-parecer.tsx`, `i18n.ts`. PR #196, squash `004a37b`.

**Estado de QA: `ALEGADO`.** A lógica está coberta por teste; a forma exata do erro do SDK em runtime é a única suposição, mitigada por ler `status` se existir, cair para a mensagem se não, e **não repetir** quando não dá pra saber. Só um 503 real em produção confirma.

**Como reverter.** `git revert` do commit; `retry-transitorio.ts` fica órfão e pode ser apagado.

---

## 2026-09-04 (4) — Número no NOME do exercício deixava de ser nome e virava intruso

**Flagrado em produção**, no runtime log de uma geração real do dono às 09:12 (12:12 UTC) — não por leitura de código, não em teste:

```
[analise] tentativa 1 { resultado: { ok: false, motivo: 'intrusos', intrusos: [ 45 ] } }
[analise] tentativa 2 { resultado: { ok: true, ... } }
```

**O `45` vinha de "Leg press 45 graus"** — o **nome** do exercício, que o PRÓPRIO RESUMO entregou ao modelo. O parecer estava correto; o validador é que **punia o modelo por usar o vocabulário que nós demos**.

`extrairTokens` não tinha como saber sozinho: o lookbehind negativo de letra existe para proteger `e1RM` (dígito **colado** a letra, correção de 2026-08-05), e ali o `45` vem depois de um **espaço** — sintaticamente, um número solto como qualquer outro.

**A correção, e a distinção que a torna segura.** Os números extraídos dos nomes de exercício e de grupo muscular entram no conjunto **CONTEXTO**, nunca no **DADOS**:

- escrever "Leg press 45 graus" **deixa de ser motivo de rejeição**;
- mas **não passa a provar** que o parecer é sobre este dono — a prova continua tendo que vir de um número de verdade.

Três testes fixam isso: não rejeita mais; não conta como especificidade; e intruso real continua sendo pego mesmo quando o nome tem número.

**Alcance, consultado no catálogo real:** **um** exercício com número solto no nome ("Leg press 45 graus"). Baixa incidência no catálogo, **alta na prática** — é um que o dono treina toda semana e que aparece na evidência dele.

**Isto corrige a entrada `2026-09-04` desta mesma data.** Lá eu registrei que "não era o validador, era a API". **Estava meio certo:** são **duas causas independentes com o mesmo sintoma**, e as duas são reais — a API deu 503 recorrente entre 1 e 4 de setembro, **e** o validador rejeita por conta própria. Naquele dia, os dois pareceres em fallback vieram de erro de API; hoje, a rejeição veio do validador.

**Custo concreto do defeito:** a geração de hoje passou só na 2ª tentativa, gastando **uma chamada a mais** de uma cota de 20/dia.

**Classificação.** **Correção.** Nenhum contrato muda.

**Impacto.** `src/app/api/analise/validador.ts` + 4 testes. PR #198, squash `8e2648b`.

**Como reverter.** `git revert`. O validador volta a rejeitar todo parecer que cite o Leg press pelo nome.

---

## 2026-09-05 — Causa da falha persistida (migration 0019) e teto diário de gerações

> Duas mudanças aprovadas pelo dono depois do diagnóstico de `2026-09-04`.

### Parte 1 — `parecer.falha_motivo`

**O problema.** `aviso_falha_interpretativa` era um **booleano**. Quatro causas completamente diferentes viravam o mesmo `true`, e o app contava a mesma história para todas: 503 (API não respondeu), 429 (teto de cota), 404 (modelo ausente) e rejeição do validador. Ninguém conseguia responder, **depois do fato**, por que um parecer saiu sem prosa — o runtime log da Vercel no plano **Hobby retém 1 hora**. O diagnóstico de 2026-09-04 só foi possível porque o dono gerou e avisou dentro de 3 minutos. **Isso é sorte, não processo.**

**A migration.** `0019_parecer_falha_motivo` adiciona `falha_motivo text` anulável, com domínio fechado (`api_indisponivel`, `cota_excedida`, `modelo_ausente`, `api_erro`, `validador_rejeitou`), um check de coerência com o booleano e o `grant update` de coluna (mesmo padrão da `0018`). **Nula para todo parecer anterior**, de propósito: não dá pra inventar retroativamente a causa de uma falha que já passou.

**O aviso deixou de ser uma frase só.** Cada causa recebe um texto verdadeiro **e** acionável, porque a ação é diferente em cada caso: indisponibilidade pede minutos; cota explica que renova; modelo ausente **assume a culpa** ("é falha nossa, não sua"); e a rejeição do validador — **o único caso em que o sistema funcionou como devia** — explica a proteção em vez de pedir paciência. `null` cai numa frase genérica que continua verdadeira, para os pareceres antigos.

**Alternativa descartada.** Guardar a causa dentro do `evidencia` jsonb para fugir da migration. Descartada: `evidencia` é um contrato tipado (`EvidenciaParaTela`), e enfiar campo alheio ali é exatamente o puxadinho que este projeto documenta contra.

### Parte 2 — teto de 5 gerações por dia, por usuário

**O dado que ninguém tinha somado:** a cota de **20 requisições/dia** é **compartilhada com o Coach 24h** — mesmo cliente, mesma chave (`api/coach/route.ts` importa `ClienteParecerGemini`). Sem teto, uma tarde de curiosidade consome tudo e **o chat para junto**.

**Escolhido teto diário, NÃO o intervalo entre gerações que o dono sugeriu.** O `PRD.md` §3 define **5 perguntas padrão**: sentar e fazer duas ou três numa sessão é o uso pretendido, e um cooldown de horas puniria exatamente isso. 5 é o número que permite fazer todas as cinco no mesmo dia. Custo por geração: 1 chamada quando o validador aprova de primeira, 2 quando rejeita, 3 no pior caso (retry de 503) — com 5, o pior caso é 15 e sobram 5 para o Coach.

O corte é o **dia LOCAL do Brasil**, não UTC: às 22h de Brasília já é o dia seguinte em UTC, e a cota renovaria três horas antes da meia-noite do dono.

**Limite conhecido, documentado no código:** a contagem é de linhas em `parecer` criadas hoje, e **descartar um rascunho apaga a linha** — quem descartar recupera a vaga sem recuperar a cota já gasta na Gemini. Aceito num app de um usuário; fechar exigiria tabela de log de consumo, peso demais para o problema. **Revisitar quando o módulo Personal (`PRD` §11) puser mais gente na MESMA chave** — aí o teto por usuário deixa de proteger o teto global.

### Achado sobre a dívida de migrations — ela é menor do que o `PROGRESS` dizia

Consultando `supabase_migrations.schema_migrations`: **nada está faltando no banco.** As mesmas migrações existem sob **dois esquemas de versão** — o repo usa numérico (`0010_peso_por_lado`), o remoto gravou seis delas com timestamp (`20260824132220 peso_por_lado`, `20260824133544`, `20260824150037` + `20260824151727`, `20260825180357`, `20260825181416`, `20260831211511`). É por isso que `db push` acha que `0010`–`0014` e `0017` nunca rodaram.

**Não é dado perdido, é nomenclatura** — reparável com `supabase migration repair --status applied`, que exige a senha do banco e é decisão do dono. A `0019` foi aplicada e registrada com **versão numérica**, seguindo a convenção do repo, para não aumentar a divergência.

**Classificação.** **ADIÇÃO.** `PRD`, `ADR` e fitness functions intactos.

**Impacto.** Migration `0019` (aplicada e conferida em produção: coluna, 2 checks, grant, registro), `src/lib/dados/parecer.ts`, `src/lib/texto/aviso-falha.ts` (novo) + teste, `src/app/api/analise/{route,retry-transitorio}.ts`, `parecer.tsx`, `documento-parecer.tsx`, `analise-interativa.tsx`, `i18n.ts`. PR #199, squash `1e68836`.

**Estado de QA: `ALEGADO`.** Nem o caminho do teto nem o de cada causa foram exercidos em produção — a prova vem na próxima falha real, que agora vai dizer qual foi.

**Erro de processo desta PR, registrado.** A CI reprovou na primeira tentativa porque usei `git add -A src supabase` e **dois arquivos modificados em `scripts/preview/` ficaram de fora do commit**. Passava local (corrigidos no disco) e quebrava no ambiente limpo. **Lição:** `git add` com caminhos silenciosamente exclui o que está fora deles; conferir `git status --short` **depois** de estagiar, não antes.

**Como reverter.** `git revert` do commit devolve o comportamento antigo. A coluna pode ficar no banco sem dano (é anulável e ninguém a lê); removê-la exige migration própria.

---

## 2026-09-05 (2) — O fallback determinístico deixa de ser extrato e passa a ser leitura

**O problema, e ele era de identidade do produto.** Quando a IA não respondia, o dono via um despejo de fatos, uma linha por número:

```
Volume total em 2026-08-24: 60751.
Costas: 23 séries valendo, volume 15685 (349,4% vs. semana anterior) — acima da faixa.
```

Honesto, e o **pior rosto possível** para a peça-assinatura de um produto cuja tese é *"o log e o gráfico são infraestrutura; o produto é a **leitura**"* (`PRD.md` §1). Quando a IA falhava, o app entregava um extrato bancário.

**E não é caminho de exceção:** `503` em três dias distintos (medição de `2026-09-04`), mais a rejeição do validador flagrada ao vivo.

**O que passa a sair, com os números reais da conta do dono:**

> Semana de 24 ago, com 4 de 4 semanas da janela com dados. 3 dos 7 exercícios acompanhados subiram, e o Tríceps pulley (corda) liderou com +66,7% de e1RM. Em queda real: Supino fechado (-29,8%) e Cadeira extensora (-9,3%). Parados sem novo máximo: Leg press 45 graus (há 4 semanas) e Rosca concentrada (há 4 semanas).
>
> Acima da faixa de referência de séries: Costas (23). Abaixo da faixa: Ombro (9), Posterior de coxa (7), Panturrilha (3) e Abdômen (4).
>
> Foram 5 treinos na semana, contra média de 3,7 nas anteriores.

**Nenhuma conta nova.** É ordenação e comparação sobre métricas que `agregar.ts` já calcula. **Sem LLM, então nunca falha** — é o único caminho que funciona com o Google inteiro fora do ar.

**O que NÃO faz, e a razão é de contrato.** Cobre o **diagnóstico** (perguntas 1 a 4 do §3). **Não** cobre a pergunta 5 ("o que mudar na próxima semana"): prescrição por regra viraria o **plano gerado automaticamente que o `PRD` §5 proíbe**, e é a mesma linha que o §11 traça entre o que fica com o aluno e o que vai para o personal. Há teste procurando verbo de comando no texto ("aumente", "reduza", "troque"…).

**A fronteira com o parecer real continua intacta.** O aviso de falha fica em cima, e o texto **não tem veredito destacado** — o guard de `avisoFalhaInterpretativa` impede que `separarVeredito` promova a primeira frase (PR #177/#181). **Ler melhor não pode virar passar-se por.**

**Regra da Presença.** Nenhuma frase aparece sem o dado que a sustenta: nada de "0 exercícios em queda". Coberto por teste.

**Achado que veio de OLHAR, não de escrever.** As quedas saíam ordenadas por delta decrescente — a mesma ordem que serve para achar o líder de alta —, listando `-9,3%` **antes** de `-29,8%`. Numa lista de quedas, isso lê ao contrário do que importa. Só apareceu ao renderizar a saída com dado real; ganhou teste próprio.

**Alternativas descartadas.**

1. **Modelo alternativo quando o principal falha** (tentar `gemini-2.5-flash` no 503). Não descartada, **adiada**: é complemento barato, mas ataca só uma das causas e depende da mesma infraestrutura.
2. **Segunda chave/projeto.** O dono tem 5 projetos no AI Studio, cada um com cota própria — atacaria o `429`. Descartada por ora: mexe em cota de projetos que servem outras coisas, e o `429` não é a causa dominante (sumiu desde 29/ago).
3. **Manter o extrato e só formatar melhor.** Descartada: o problema não era formatação, era o texto não ser uma leitura.

**Classificação.** **ADIÇÃO.** O `SDD` §6.4 continua descrevendo o mesmo fluxo (2ª falha → fallback determinístico); o que mudou é o texto que ele produz.

**Impacto.** `src/lib/analise/leitura-deterministica.ts` + teste (novos, 15 testes), `src/app/api/analise/route.ts` (delega e perde o template antigo + código morto que ele deixava). PR #200, squash `de80a53`.

**Estado de QA: `ALEGADO`.** A saída foi verificada com os números reais do dono, fora do app. A prova em produção vem na próxima falha real da IA.

**Como reverter.** `git revert`. O extrato volta, e `leitura-deterministica.ts` fica órfão.

---

## 2026-09-05 (3) — Troca de modelo quando o primário está congestionado

**A medição que decidiu, e ela contradiz a recomendação anterior deste mesmo agente.** O dono gerou em produção e o log deu:

| Hora (Brasília) | Espera desde a falha anterior | Resultado |
|---|---|---|
| 10:11:19 | — | `503` |
| 10:11:48 | **+29s** | `503` |
| 10:13:49 | +2min | ✅ |

Eu havia recomendado **aumentar o backoff** (de 1,2s para 10-15s). Com esse intervalo na mão a recomendação **não se sustenta**: a segunda tentativa do dono foi 29 segundos depois e falhou igual. Um backoff que caiba dentro da function ficaria bem dentro do pico; atravessá-lo exigiria segurar a função ociosa por ~2 minutos, o que não cabe no teto de duração nem faz sentido com alguém esperando na tela.

**Onde a fila estava, segundo o próprio Google:** `"This model is currently experiencing high demand. Spikes in demand are usually temporary."` Não é a API fora do ar — é o pool **daquele modelo**. Outro modelo tem pool próprio, e responde em segundos, não em minutos.

**O fluxo agora:** primário → repetição curta → **modelo alternativo** → fallback determinístico.

**Só troca em erro TRANSITÓRIO, e a assimetria é o ponto.** `429` é teto de cota do **projeto**: trocar de modelo não cria cota nova, só gasta mais uma chamada para falhar igual. `404` é determinístico. Ambos sobem sem tentar o alternativo, e há teste para cada um.

**O nome do modelo foi CONFERIDO, não lembrado.** `gemini-3.5-flash`, verificado na lista oficial de modelos do Gemini em 2026-09-05: mesma família, endpoint **estável** (não é `-preview`, ao contrário do `gemini-3-flash-preview`) e **sem** a data de aposentadoria que o `2.5-flash` já tem (16/out/2026, registrada na entrada de 2026-08-05 deste arquivo). Chutar nome de modelo aqui produziria exatamente os `404 NotFound` que apareceram entre 27 e 29/ago e ninguém explicou.

**A troca vai para o log** porque muda a **procedência** do parecer: dois pareceres do mesmo dono podem ter vindo de modelos diferentes. **Persistir qual modelo respondeu** exigiria mais uma coluna (mesma receita da `0019`) — não feito, fica como pergunta aberta; só passa a importar quando o alternativo entrar em uso de verdade.

**Orçamento de chamadas — o caso que parece pior do que é.** `gerar` pode agora fazer até 3 chamadas, e a rota chama `gerar` duas vezes (tentativa + retry de validação). Mas os caminhos são quase excludentes: se a API está em `503`, `respostaUm` fica nulo e **não existe** retry de validação. Pior caso realista: 3-4 chamadas, não 6.

**`maxDuration = 60`, explícito.** A geração roda dentro de `after()` (a function segue viva depois da resposta HTTP, `SDD` §11) e agora pode fazer até 3 chamadas. Depender de um default de plataforma não verificado significa que, se ele for menor do que supomos, **a geração é cortada no meio e o parecer some sem erro nenhum** — mesmo raciocínio do `runtime = "nodejs"` fixado em `/api/parecer/[id]/pdf`. **Risco declarado antes do merge** (se o plano não aceitasse 60s, o deploy falharia) e **verificado depois**: deploy `READY`.

**Alternativas descartadas.**

1. **Backoff maior.** Descartada pela medição acima — é a correção da minha própria recomendação.
2. **Segunda chave/projeto.** O dono tem 5 projetos no AI Studio, cada um com cota própria; atacaria o `429`. Descartada por ora: mexe em cota de projetos que servem outras coisas, e o `429` não é a causa dominante (sumiu desde 29/ago).
3. **Não fazer nada e confiar no fallback.** Legítima e de graça — o fallback agora lê. Descartada porque o dono prefere o parecer real quando ele for possível.

**Classificação.** **ADIÇÃO.** Nenhum contrato muda.

**Impacto.** `retry-transitorio.ts` (+`comModeloAlternativo`), `gemini.ts`, `route.ts` (`maxDuration`). 6 testes novos. PR #202, squash `ab6f16a`.

**Estado de QA: `ALEGADO`.** A troca só se prova no próximo pico real de `503`.

**Como reverter.** `git revert`. Volta a repetir só no mesmo modelo.

---

## 2026-09-05 (4) — O clamp do veredito chega ao PDF (a mesma decisão, o segundo renderizador)

**Achado ao olhar o PDF REAL baixado do app pelo dono**, não em teste nem por leitura de código: um veredito de **151 caracteres** saiu em 27pt fixo, ocupou **cinco linhas**, comeu metade da primeira página e jogou cinco evidências para uma segunda página quase vazia.

**É exatamente o problema que o gate visual de `2026-09-03` descreveu para a tela** — *"frase de julgamento longa vira 3+ linhas em Fraunces 48px e empurra o resto do documento"*. Resolvemos lá com `clamp()` e **passou reto aqui**.

**Segunda vez que uma decisão visual é aplicada num renderizador e não no outro.** A primeira foi o guard do fallback: a PR #177 corrigiu o veredito gigante na tela e o PDF ficou dois dias errado, até a #181. **É o mesmo padrão**, e por isso a fórmula aqui é **derivada** da da tela, não inventada:

```
tela: clamp(30px, 48px − (n − 20) × 0,72px, 48px)
PDF:  clamp(20pt, 27pt − (n − 20) × 0,405pt, 27pt)
```

Mesma proporção, escalada da base de 48px para a de 27pt. O piso de 20pt mantém a mesma relação com o corpo que a tela mantém (≈1,9× o texto de leitura), então o veredito segue dominante sem dominar a página — e há teste conferindo essa proporção, não só o valor.

**Truncar continua descartado** pelo motivo original de 03/set: corta a frase de julgamento no meio, e ela **É** o documento.

**Resultado medido com o parecer real (não estimado):**

| | Antes | Depois |
|---|---|---|
| Linhas do veredito | 5 | **4** |
| Evidências na página 1 | 1 | **2** |
| Páginas | 2 | 2 |

**Continua em 2 páginas, e isso está certo.** Três parágrafos de prosa (~1.370 caracteres) mais 6 evidências são duas páginas de conteúdo; espremer mais seria maquiar. **O defeito era o veredito DOMINAR, não o número de páginas** — registrado assim para ninguém "corrigir" a paginação depois achando que ficou pela metade.

**A bancada deixou de mentir.** `scripts/preview/dados.ts` marcava `textoProsaExemplo` como **sintético**, porque nenhuma geração da Gemini tinha dado certo. Agora existe prosa real — parecer `a7f5fe7c`, gerado e salvo pelo dono em 2026-09-04 — e é justamente o veredito de 151 caracteres dela que revelou esta falta. Substituído, com nota para não inventar texto ali de novo.

**Lição de processo, e é a mesma que aparece em quase todos os achados desta leva:** o defeito não estava em nenhum teste, em nenhuma revisão de código e em nenhuma leitura estática. Apareceu quando o **artefato real** foi aberto. Suíte verde não é evidência sobre a aparência de um documento.

**Classificação.** **Correção.** Nenhum contrato muda; `SDD` §10.4.1 continua válido e ganha esta regra.

**Impacto.** `src/lib/pdf/documento-parecer.tsx` (+`tamanhoVeredito` exportada e testada), teste (+6), `scripts/preview/dados.ts`. PR #203, squash `65bdfe8`.

**Estado de QA: `PASSOU` na renderização** — o antes/depois foi produzido com o texto real, não com fixture. Falta só o dono baixar o PDF novo do app depois do deploy.

**Como reverter.** `git revert`. O veredito volta a 27pt fixo e o problema volta com ele.

---

## 2026-09-05 (5) — O clamp do veredito era cego para a largura da tela

**Achado pelo dono usando o app no celular**, com a primeira prosa real que a Gemini produziu. Print: o veredito ocupando a tela inteira, sem uma linha de evidência visível sem rolar.

**A causa, e ela é uma limitação da decisão de 03/set, não um bug de implementação.** O `clamp()` do `.doc__veredito` foi calibrado por **contagem de caracteres** — encolhe conforme o texto cresce — mas o **piso era fixo** em `--lastro-papel-titulo-tela` (30px), e a calibragem foi feita sem olhar largura de celular. Medido na bancada a 375px: um veredito de **151 caracteres batia o piso e AINDA assim ocupava 11 linhas, 413px, 51% da altura da tela**.

Vale registrar por que passou: em 03/set não existia prosa real (a Gemini vinha falhando), então o caso de estresse foi um texto **sintético** de 188 caracteres, verificado com `getComputedStyle` — mas a verificação olhou o **tamanho da fonte**, não a **altura resultante em viewport estreito**. A medição estava certa; a pergunta é que estava incompleta.

**A correção.** O piso vira **mobile-first**: `--lastro-papel-secao` (20px), degrau que **já existe** na escala — não é número novo —, com `titulo-tela` voltando a partir de **640px**, o mesmo corte que `.evidencia` já usa. Um degrau basta porque **a altura cresce com o quadrado do tamanho da fonte** (fonte menor = mais caracteres por linha E linha mais baixa).

**Medido depois, nos três casos:**

| Caso | Antes | Depois |
|---|---|---|
| Longo (151) em 375px | 30px · 11 linhas · **51% da tela** | **20px · 6 linhas · 18%** |
| Longo em 1024px | 30px · 3 linhas | inalterado |
| Curto (13) em 375px | 48px | inalterado |

**Alternativa descartada:** encurtar o veredito no prompt (pedir frase mais curta ao modelo). Continua sendo uma alavanca legítima e complementar, mas é a **alavanca fraca** (`SDD` §6.4 usa esse mesmo vocabulário para instrução de prompt vs. validador): o layout não pode depender de o modelo obedecer. Fica anotada, não feita.

**Classificação.** **Correção.** Nenhum contrato muda; o `DESIGN` §3.6.2 continua valendo.

**Impacto.** `src/app/sistema.css`. PR #205, squash `e846e7f`.

---

## 2026-09-05 (6) — A quebra do PDF passa a cair na fronteira da seção

**Achado pelo dono ao abrir o PDF real:** *"olha o vão em branco que tá ficando"*.

**A causa.** A quebra de página caía **entre a 2ª e a 3ª linha da evidência**: a página 1 terminava com duas linhas órfãs e a 2 começava no meio da tabela, deixando ~70% de vão. A quebra **parecia acidente**.

**A correção.** `wrap={false}` no bloco de evidência inteiro. A quebra passa a cair na **fronteira da seção**: página 1 é o documento (cabeçalho, veredito, prosa), página 2 é a **tabela completa**.

**O que NÃO foi feito, e está escrito no código para ninguém "terminar" depois:** o documento **continua em 2 páginas com espaço em branco**. O conteúdo é de ~1,3 página (3 parágrafos de prosa + 6 evidências); medi o que seria preciso economizar para caber em uma — cerca de 380pt — contra o máximo que densificação agressiva renderia (~136pt). **Não cabe.** Espremer seria maquiar. O defeito era a quebra parecer acidental, e isso acabou.

**Limite documentado:** com muitos exercícios a tabela pode passar de uma página inteira; aí o `@react-pdf` volta a quebrá-la, que é o comportamento certo.

**Classificação.** **Correção.** Impacto: `src/lib/pdf/documento-parecer.tsx`. PR #205, squash `e846e7f`.

---

## 2026-09-05 (7) — QA: "finalizar e reabrir" saiu de ALEGADO para PASSOU

**Confirmado pelo dono no aparelho dele**, que é a única prova que valia: finalizar → confirmar → reabrir devolve o cronômetro **de onde parou**, e finalizar volta a congelá-lo. É o percurso que a entrada `2026-09-03 (5)` deixou explicitamente pendente porque nenhum teste substitui — depende do relógio real entre duas sessões.

**Observação registrada para não virar bug report depois.** Depois de reabrir, o relógio volta a correr **ao vivo** — o print do dono mostrava um treino de 1h42 marcando 2h30 e subindo. Isso é **o comportamento desenhado** ("reabrir = a sessão está ativa de novo"), foi conferido com o dono, e **não contamina métrica nenhuma**: os dois relatórios usam `duracaoSessaoSegundos()` (banco: `iniciado_em` → última série), nunca o relógio. Se um dia incomodar, a saída é reabrir destravar o registro sem religar o relógio até a próxima série registrada — não feito, porque o dono confirmou que o comportamento atual é o esperado.

**Continua `ALEGADO`:** abrir um treino antigo **em aparelho que nunca o treinou** e ver o tempo reconstruído e parado. Coberto por teste unitário (`marcos-treino.test.ts`) e por construção — `iniciarSessaoLocal` só grava marca em treino sem série —, mas não exercido a mão, porque exige um aparelho sem o `localStorage` daquele treino.

---

## 2026-09-05 (8) — Histórico de migrations reparado: o repo e o banco voltam a falar a mesma língua

**A dívida, e o que ela era de fato.** Desde 2026-08-24 o `PROGRESS.md` registrava que "o histórico de migração divergiu — remoto tem `0001`–`0009` numeradas e cinco com timestamp; o repo tem `0010`–`0014`. São as mesmas migrações. `db push` recusa enquanto isso durar". Consultado o `supabase_migrations.schema_migrations` em 2026-09-05, o diagnóstico se confirmou e **encolheu**: não faltava dado nenhum no banco. Seis migrações do repo estavam aplicadas sob **versão com timestamp** em vez do número:

| Repo | Estava no remoto como |
|---|---|
| `0010_peso_por_lado` | `20260824132220 peso_por_lado` |
| `0011_peso_por_lado_na_serie` | `20260824133544 peso_por_lado_na_serie` |
| `0012_idiomas` | `20260824150037 idiomas` **+** `20260824151727 idiomas_grants` |
| `0013_indices_fk_faltantes` | `20260825180357 indices_fk_faltantes` |
| `0014_revoga_execucao_publica_triggers` | `20260825181416 revoga_execucao_publica_triggers` |
| `0017_parecer_checks_dominio` | `20260831211511 parecer_checks_dominio` |

Note o `0012`: **um arquivo do repo consolidou DUAS migrações remotas.** Era o caso que faria um reparo mecânico errar.

**Como foi reparado, e por que não pela CLI.** `supabase migration repair` exige a senha do banco, que o agente não tem e não deve pedir. O reparo foi feito por SQL — mesmo caminho que o projeto já tinha usado para registrar a `0015` à mão —, com três cuidados:

1. **Backup completo antes**, dentro do próprio banco: `supabase_migrations.backup_20260905_antes_repair` (20 linhas). Reversível com um `insert ... select`.
2. **Os `statements` de cada migração foram PRESERVADOS** na renumeração, não descartados — inclusive concatenando os dois do `0012`. Um `repair --status applied` da CLI teria criado linhas vazias.
3. **Tudo numa transação**: as 6 inserções e as 7 remoções, ou tudo ou nada. Meia renumeração seria pior que a divergência — o `db push` tentaria re-rodar uma migração já aplicada.

**Cosmético, feito junto:** `0016`, `0018` e `0019` tinham o prefixo do arquivo dentro do campo `name` (`0016_tabela_parecer`), diferente das demais. Normalizado. O `db push` casa por `version`, não por `name` — é só uniformidade de `migration list`.

**Verificação.** Repo e remoto comparados **programaticamente** (versão + nome, par a par): 19 e 19, idênticos.

**O que continua `ALEGADO`.** A prova definitiva é `supabase migration list` mostrando `Local` e `Remote` alinhados, e ela exige a senha do banco — é do dono. O que foi provado aqui é que a **tabela de histórico** agora corresponde exatamente aos arquivos do repo, que é a condição que o `db push` checa.

**Consequência prática:** as próximas migrações voltam a ser `supabase db push` normal, sem aplicar à mão e registrar depois — que foi como a `0015` e a `0019` precisaram entrar.

**Como reverter.**

```sql
begin;
delete from supabase_migrations.schema_migrations;
insert into supabase_migrations.schema_migrations
  select * from supabase_migrations.backup_20260905_antes_repair;
commit;
```

A tabela de backup fica no banco de propósito. Apagar só depois de o dono confirmar o `migration list` alinhado — antes disso ela é a única rede.

---

## 2026-09-05 (9) — Teto diário do Coach e tabela `uso_ia`

**Contexto.** A cota gratuita da Gemini é de 20 requisições/dia
(`KNOWLEDGE.md` §3.2) e é **compartilhada**: Análise Semanal e Coach 24h
usam o mesmo `ClienteParecerGemini`, a mesma chave, o mesmo projeto. Em
2026-09-05 o parecer ganhou teto de 5/dia e o Coach ficou sem teto
nenhum — ele só limitava o **tamanho** da pergunta, nunca a quantidade
de chamadas. Uma conversa longa no chat esvaziava a cota e jogava a
peça-assinatura no fallback: exatamente a falha que o dia inteiro foi
gasto consertando. A assimetria foi criada por nós.

**Decisão.** Teto de **10 perguntas/dia** no Coach (número decidido pelo
dono), somando 15 dos 20 com o parecer. A folga de 5 é deliberada:
cobre o retry de 503 (que gasta chamada), a troca de modelo e chamadas
de desenvolvimento.

**Onde o consumo passa a ser contado.** Numa tabela nova, `uso_ia`
(migration 0020), e não mais em linhas de `parecer`. Isso fecha um furo
já documentado: o teto do parecer contava linhas criadas hoje, e
descartar um rascunho **apagava a linha** — quem descartava recuperava a
vaga sem recuperar a cota já gasta na Gemini. A tabela não tem `update`
nem `delete` no grant, de propósito: poder apagar reabriria o furo que
ela existe para fechar.

**Registra tentativa, não sucesso.** A cota do Google é consumida pela
chamada mesmo quando ela volta 503. Contar só sucesso deixaria o teto
mentindo justamente no dia ruim.

**Duas regras de "deixar passar", ambas com teste.** Se a *contagem*
falha, o uso é liberado — negar por causa de um erro nosso é pior do que
gastar uma chamada a mais. Se o *registro* falha, a chamada segue mesmo
assim — perder o parecer porque o log de consumo caiu seria trocar um
problema de cota por um pior.

**Recorte do dia é Brasília, não UTC.** Às 22h daqui já é o dia seguinte
em UTC; a cota renovaria três horas antes da meia-noite do dono.

**Alternativa descartada:** intervalo mínimo entre chamadas (o "libera
outra depois de 3 horas" cogitado pelo dono). Protege a cota do mesmo
jeito, mas pune o uso legítimo — as perguntas de um treino vêm em
sequência, não espaçadas. Teto diário permite a rajada e ainda assim
garante o teto.

---

## 2026-09-05 (10) — Descanso deixa de depender da marca local de início

**Achado da varredura "render vs efeito"** (a única tarefa do backlog que
podia achar bug vivo — e achou um). Varridos os 33 componentes cliente,
comparando cada gate de JSX com a guarda do handler ou efeito
correspondente. O resultado é majoritariamente negativo, e isso é a
notícia: o defeito de 2026-09-03 foi caso isolado, não padrão. Limpos:
`timer-topo` deriva os três booleanos do mesmo `treinoFinalizado`;
`analise-interativa` usa `aria-disabled` com CSS que o acompanha (não é
botão que mente); `pareceres-salvos` cobre os dois únicos status que
existem; `temBarras` é fonte única para as duas abas; `folha` mantém ref
e estado em sincronia. Um ponteiro morto de comentário corrigido.

**O achado.** O botão de descanso era renderizado sob `cronometroAoVivo
= segundosLocais !== null && !treinoFinalizado`, que exige a **marca
local de início**. Mas o timer de descanso é estado local puro (`ativo`,
`fimTimestampRef`) e nunca lê `lastro_inicio_treino_*` — a exigência
estava errada.

O nome enganava: `cronometroAoVivo` sugeria governar o mostrador do
tempo de treino, e **não governava**. O mostrador exibe `segundosTreino`
direto, que já cai sozinho na duração reconstruída quando não há marca.
O booleano tinha um consumidor só, este botão. Por isso ele foi
**removido**, não desmembrado: separar em dois deixaria um morto no
arquivo.

**O sintoma.** A marca de início só é gravada em treino recém-criado
(`sessaoComecaAqui`, único ponto de escrita no repo — confirmado por
varredura). Quem recarregou com o storage limpo, ou continuou o treino
em outro navegador, seguia registrando série normalmente e **o botão de
descanso sumia**. Mesma família do defeito de 2026-09-03 — o gate do
render discordando do que a ação de fato exige —, sintoma invertido: lá
o botão mentia dizendo que funcionava, aqui ele desaparecia sem dizer
nada.

**Efeito colateral aceito pelo dono.** Um treino deixado em aberto
semanas atrás passa a mostrar botão de descanso ao ser reaberto. É
coerente: ele *é* um treino em aberto. Quem finaliza continua sem
descanso, que é a regra de 2026-09-03.

**Estado de QA: PASSOU.** Verificado em produção
(`lastro-pi.vercel.app`), na conta real do dono, depois do merge do #210.
O dev local não serviu — não há `.env.local` no repo e o servidor morre
no boot sem as chaves do Supabase —, então a checagem foi no app de
verdade.

O cenário não precisou ser fabricado: dos quatro treinos do histórico,
três já não tinham marca local nenhuma no `localStorage` (só
`07ab890d` tinha, e com marca de fim). Nada foi apagado do aparelho do
dono para montar o teste.

Evidência, no treino de 2 de setembro (sem marca local, com séries):

  · cronômetro em **53:01** e **parado** — reconferido 4s depois, mesmo
    valor. Confirma `segundosLocais === null`, que é a condição exata em
    que o botão sumia antes.
  · botão **"Descanso 01:30" presente** na mesma tela. Essa combinação
    era impossível no código anterior.
  · clicado: a cápsula abriu e contou (01:27 três segundos depois), com
    +30s, Pausar e fechar. Não é botão que mente — a lição de
    2026-09-03 exige provar o clique, não só a presença.
  · o cronômetro do treino seguiu em 53:01 durante o descanso, como
    deve.

Contraprova, no treino finalizado `07ab890d` (com marca de fim):
**nenhum botão de descanso**, só o cronômetro parado em 151:07 — a
regra de 2026-09-03 continua valendo.

Console limpo depois de um load completo (sem erro de hidratação, que
já foi risco real neste componente). O `localStorage` do dono ficou
idêntico ao de antes: o clique no descanso é estado de React, não
grava marca.

---

## 2026-09-09 (2) — As 102 dicas de execução, e a revogação da FF7

**A restrição, e como ela caiu.** `ADR-007`/`FF7` proibiam dica de execução gerada por LLM: instrução de forma é assunto de saúde e o erro machuca. A alternativa descartada na própria ADR era literalmente *"gerar as dicas com a Gemini — barato, escalável e irresponsável"*, e `DECISIONS.md` 2026-08-07 fechou até a saída de "pesquisar fontes reais", que contava como gerado do mesmo jeito.

Quando o dono pediu as dicas, a restrição foi **apresentada a ele com a citação da ADR**, junto do aviso de que ele podia revogá-la mas que a decisão devia ser tomada de olho aberto. Ele reafirmou o pedido. As dicas foram escritas.

**O que ficou obrigatório mesmo com a regra revogada.** Revogar a regra não apaga o motivo dela:

1. `exercicio.dica_execucao_origem` (`'claude'` | `'humano'`) registra a procedência **na linha**. Sem isso, daqui a um ano ninguém sabe o que foi revisado.
2. A tela do exercício diz, junto ao aviso de saúde: *"Esta dica foi escrita por IA e ainda não passou por revisão de um profissional."* Some sozinho quando a origem virar `'humano'`.
3. O aviso de saúde do `PRD.md` §4.5 não foi afrouxado em nada.

**Critério de escrita.** Uma dica por exercício, apontando o erro de forma mais comum **daquele** movimento. Nenhuma prescreve carga, séries ou progressão — isso é treino, não execução. Um script conferiu antes de gerar a migration: os 102 nomes casam exatamente com o banco, nenhuma frase se repete entre exercícios, e a migration tem trava que falha se sobrar linha sem dica.

**A frase genérica que saiu junto — achado do dono.** Ele perguntou *"hoje no app já tem as dicas, você vai removê-las ou reutilizar?"*, e essa pergunta descobriu um defeito que eu não tinha visto. O que ele via era duas coisas: (a) os dados anatômicos do Gym Visual (músculo alvo, sinergistas, mecânica articular), 102/102 preenchidos e reais; e (b) uma frase fixa no código — *"Execute o movimento com controle articular completo..."* — exibida **idêntica nos 102 exercícios** no lugar exato da dica curada, com a mesma tipografia. Quem lia achava que era instrução daquele movimento.

É o mesmo defeito do botão de descanso que aparecia sem funcionar: **a tela afirmando mais do que o dado sustenta**. A tela da lista já era honesta ("aguardando curadoria"); a de detalhe preenchia o buraco. Substituída pelo estado honesto, em texto secundário e itálico para ausência não ter o peso visual de conselho.

**Alternativa descartada.** Reaproveitar os dados anatômicos como dica de execução. Anatomia **descreve**, dica **prescreve** — seria trocar um tipo de conteúdo por outro só para dizer que a coluna foi preenchida, pior que o vazio honesto anterior.

**Caminho de volta, sem nova decisão arquitetural.** Trocar uma dica por texto revisado por profissional é um `update` com `dica_execucao_origem = 'humano'`; o aviso de IA some naquele exercício. Exercício a exercício, no ritmo que der.

**Documentos alinhados junto, para o repositório não se contradizer:** `ADR.md` (FF7 reescrita + seção de revogação parcial), `CLAUDE.md` §4, `ARCHITECTURE.md`, `SDD.md` (schema e escopo da Fase 5) e `.claude/agents/inspetor-qa.md` item 8. O `SDD.md` §768 **não** mudou de propósito: o Coach 24h continua proibido de improvisar técnica no chat — dica é texto fixo, revisável e com origem; resposta de chat não é.

---

## 2026-09-10 — Varredura de navegação, e o vazamento que só um usuário novo revelou

**Pedido do dono:** tirar o aviso de procedência de IA e o card "Referência de execução, não prescrição" da tela do exercício; depois passar o Playwright pelo sistema inteiro, com **usuário novo, não a conta dele**, olhando experiência e responsividade.

**As remoções.** Feitas. Saíram junto as entradas de i18n e o CSS órfãos — e a **segunda definição duplicada** de `.exercicio-hero-card__aviso`, que já estava no backlog como dívida de `sistema.css`.

**Divergência aberta, deixada para o dono decidir.** `PRD.md` §4.5 exige, com estas palavras, *"mais aviso de que não substitui acompanhamento profissional"*. Com a remoção, o app deixa de cumprir essa linha. **Não editei o PRD**: mudar o spec é decisão dele, não consequência automática de uma mudança de tela. Fica registrado como divergência conhecida até ele dizer se emenda ou reverte.

**A varredura (`e2e/j4-varredura.spec.ts`).** Anda pelas 14 telas com usuário criado na hora e apagado no fim, em 390/768/1440px. Reprova em erro de console, exceção, resposta 4xx/5xx, vazamento horizontal ou tela vazia, e imprime a lista antes do assert.

**Um achado, e é exatamente o tipo que só o usuário novo revela.** `/ajustes` a 390px vazava **48–56px** na horizontal, com a seta de navegação cortada na borda. Causa: `.card-perfil-bento__esquerda` é item de flex sem `min-width: 0` — item de flex nasce com `min-width: auto` e não encolhe abaixo do próprio conteúdo. Quando o perfil não tem nome, esse bloco exibe o **e-mail**, que é string sem espaço para quebrar.

**Por que nunca apareceu antes:** o e-mail do dono é curto o bastante para caber. O da conta de teste não é. A conta dele deixou de ser instrumento de medida justamente por já estar "arrumada" — foi ele quem pediu usuário novo, e o pedido pagou.

Corrigido com `min-width: 0` nos dois níveis do flex, `overflow-wrap: anywhere` no nome e `flex-shrink: 0` na seta (encolher um ponto de toque para caber texto seria trocar um problema visível por um de uso).

**As outras 13 telas passaram limpas nas três larguras** — sem erro de console, sem requisição quebrada, sem vazamento. Resultado negativo que vale ser dito.

**Duas observações de experiência, sem correção ainda, aguardando o dono:**

1. **Catálogo no celular tem 11.552px de altura** — cerca de 30 telas de rolagem. É consequência de as 102 dicas aparecerem também nos cards da lista. Para quem procura um exercício em pé na academia, a busca no topo salva, mas a varredura visual piorou muito. A dica pode fazer mais sentido só na tela de detalhe.
2. **`/analise` com conta zerada mistura dois números**: *"Ainda não há pelo menos **2** semanas do mesmo exercício... São necessárias **3** para calcular a análise semanal."* São dois requisitos diferentes na mesma frase, e lidos juntos parecem contradição.

---

## 2026-09-10 (2) — A dica sai da lista do catálogo e fica só no detalhe

**Decisão do dono**, tomada depois de ver o número medido pela varredura j4: com as 102 dicas aparecendo também nos cards da lista, o catálogo no celular passou a ter **11.552px de altura** — cerca de 30 telas de rolagem.

**O raciocínio.** Lista e detalhe respondem a perguntas diferentes. Na lista a pergunta é *"onde está a cadeira extensora?"* — e quem está em pé na academia passa o olho. Duas linhas de texto por item multiplicam o caminho até o nome sem ajudar a encontrá-lo; o nome, única informação que serve ali, fica com metade da densidade. No detalhe a pergunta é *"como se faz este movimento?"*, e é lá que a dica é procurada de propósito.

Isso é o mesmo diagnóstico que `docs/BACKLOG-PROXIMA-FASE.md` já tinha feito sobre a versão anterior deste card, quando a linha repetida dizia "ainda não escrita": **ruído de varredura**. A frase mudou de conteúdo, o problema de densidade não.

**Sai junto** `.cartao-exercicio-pro__sem-dica`, que já era CSS morto — resquício da linha antiga, sem uso em lugar nenhum do `src/`.

**O que NÃO sai:** o aviso de curadoria no topo da lista (`semDicaCount > 0`). Hoje ele não aparece porque os 102 têm dica, mas se alguém adicionar exercício novo sem dica ele volta sozinho — continua sendo o lugar certo para comunicar a ausência **uma vez**, em vez de item a item.

---

## 2026-09-10 (3) — O texto de "sem dados" da Análise separa os dois requisitos

**O sintoma**, achado na varredura j4 com conta zerada: sob o título "Análise semanal", um parágrafo só dizia *"Ainda não há pelo menos **2** semanas do mesmo exercício pra desenhar progressão. Você tem 0 semanas fechadas. São necessárias **3** para calcular a análise semanal."*

Dois números diferentes, colados, sem dizer que falavam de coisas diferentes — lê como contradição. E era a primeira coisa que alguém novo via naquela tela.

**Um erro de unidade em cima disso.** O "2" nunca foi de semanas: `agregar.ts` (T-E6) conta **sessões** do mesmo exercício — dois treinos na mesma semana já satisfazem o piso. A frase estava errada, não só confusa.

**A correção.** Duas frases, cada uma nomeando o próprio assunto e a própria unidade:

> O gráfico de progressão precisa de 2 treinos do mesmo exercício.
> A análise semanal precisa de 3 semanas fechadas — você tem 0.

**O número virou constante.** `MINIMO_SESSOES_TENDENCIA = 2` em `limiares.ts`, usada tanto pelo agregador quanto pela tela. Antes o `2` estava escrito à mão nos dois lugares — texto e regra podiam divergir sem ninguém notar, que é exatamente como a frase errou a unidade e sobreviveu.

**Limpeza junto:** quatro entradas de i18n ficaram órfãs (`"Você tem"`, `"semana fechada"`, `"semanas fechadas"`, `"para calcular a análise semanal."`) e foram removidas. Fragmento de frase no dicionário é dívida: traduz pedaço solto, que só faz sentido montado na ordem do português.

---

## 2026-09-10 (4) — T3b: o que a medição real encontrou, e três medições que estavam erradas

**Achado que vale a tarefa inteira:** os rótulos **inativos da barra de navegação** dão **3,55:1** no tema `branco-ouro` — piso AA é 4,5, e o texto é 14px/600, longe de "texto grande". É a navegação principal, em **toda tela**, no tema que o dono usa. Corrigido para **4,64:1** escurecendo a mesma cor em HSL (matiz e saturação preservados): `rgba(100,116,139,0.85)` → `rgba(80,93,112,0.85)`. Não é cor nova, é a mesma corrigida.

Os seis temas escuros usam o valor do `:root` e já passam em **5,70:1** — não foram tocados.

**Três medições erradas no caminho, registradas porque o erro é o aprendizado.**

1. **Varredura token contra token (minha).** Cruzou cada acento contra as quatro superfícies e acusou 4 reprovas — `--lastro-erro`, `--lastro-esmeralda`, `--lastro-ciano`. Todas **fantasma**: esses acentos nunca são desenhados sobre `--lastro-sup-3`. O esmeralda fica sobre `--lastro-esmeralda-fundo`, o ciano sobre `rgba(6,182,212,0.12)` — camadas tingidas. Os comentários do próprio `tokens.css` já diziam isso ("fundo composto real 226,247,240"), e eu li depois de medir.

2. **Varredura no navegador trocando `data-tema` por JS (minha).** Acusou 31 reprovas nos temas escuros, incluindo "branco sobre branco" a 1,05:1. Também fantasma: **trocar o atributo não re-tematiza o app inteiro** — os tokens viravam escuros enquanto o card mantinha o branco do tema claro, e a varredura media uma combinação que não existe na tela. Só o tema efetivamente aplicado dá número confiável.

3. **O número no `DESIGN.md` (herdado).** A seção diz "33 elementos reprovando, pior caso **1,79:1**". Esse número é de 2026-08-20 e **antecede** a correção que o `docs/BACKLOG-PROXIMA-FASE.md` marca como resolvida em 2026-08-21. Medindo hoje, o pior caso real é 3,55:1 e são 4 elementos — todos o mesmo componente.

**A lição, que o `DESIGN.md` já tentava ensinar em §4.2:** medir contra token é estimar. O que vale é o pixel renderizado, no tema que está de fato aplicado, com as camadas translúcidas compostas. Duas das três medições erradas acima aconteceram por pular exatamente esse passo.

**Escopo não coberto, dito sem maquiagem.** Os seis temas escuros só foram medidos por composição de token, não no app renderizado — trocar de tema exigiria mexer na configuração da conta do dono. O botão de ação primária usa gradiente e **não é medível** por composição de cor: ficou de fora, marcado como tal pela varredura em vez de receber um número inventado.

---

## 2026-09-10 (5) — `formatarPeso` agrupa milhar

**Decisão do dono**, que estava no backlog aguardando ele desde 04/set. `7280` saía como `"7280 kg"`; num bloco de evidência ao lado de `"102,5"` isso obriga a contar dígito. O volume semanal passa de 10.000 kg com facilidade — é justamente o número grande que precisa ser lido rápido.

**O risco que o backlog apontava ("mexe nos três") foi verificado, não presumido.**

O medo real era o **validador do parecer**: em PT-BR o milhar é ponto, e um parser ingênuo lê `12.480` como `12,48`, rejeitando parecer correto como intruso. Fui olhar: `api/analise/validador.ts` **já desmonta milhar nos dois sentidos** (PT-BR/ES com ponto, EN com vírgula), desde um achado de 2026-08-05. E nenhum dos três consumidores de `formatarPeso` alimenta o validador — ele valida a resposta do LLM, não o texto que nós montamos. Risco inexistente.

**`Intl.NumberFormat` foi descartado de propósito.** Resolveria em uma linha, mas depende do ICU do runtime: num Node com `small-icu` toda localidade que não seja inglês cai para en-US **sem erro** — `"7.280"` viraria `"7,280"` em português, calado. Agrupar à mão é determinístico e roda igual em qualquer runtime, inclusive dentro do renderizador de PDF.

**A largura da coluna do PDF foi MEDIDA, não estimada.** `L_VOLUME` são 78pt fixos, e essa mesma tabela já foi quebrada antes ao espremer `formatarDelta` numa coluna de 54pt. Estimar largura de fonte é chute. Criei `scripts/preview/pdf.milhar.render.tsx`, que gera o PDF com volumes crescentes até `999.999` (mil toneladas numa semana, muito além de qualquer valor real) e renderizei: cabe em **uma linha**, com folga visível até o nome do exercício. O arquivo fica no repo — a próxima mudança de largura pode reconferir do mesmo jeito.

**Os outros dois consumidores não têm restrição de largura:** na tela `formatarPeso` formata o **peso da série** (102,5 kg), que nunca chega ao milhar, e em `leitura-deterministica.ts` é prosa corrida.

**Nove testes novos**, incluindo um que trava a convenção: milhar e decimal são sempre caracteres **opostos**, em todo idioma. Se alguém inverter, o validador volta a ler `12.480` como `12,48` — o teste cai antes disso chegar em produção.

---

## 2026-09-10 (6) — Scope Change: a §11 revisada pelas entrevistas com personais

**O portão do `PRD.md` §11.6 abriu.** Condição (a) — parecer bom para mostrar — cumprida desde 05/set. Condição (b) — 2–3 personais reais — cumprida hoje: **dois personais responderam**, por escrito, às perguntas do roteiro.

O resultado **não confirmou o desenho; corrigiu ele.** Esta entrada registra o que mudou e por quê.

### O que as entrevistas provaram

**A dor existe, e não é falta de dado — é custo de processar dado.** Nenhum dos dois respondeu "eu sei de cabeça". Os dois descreveram comparação contra registro passado, e o segundo foi explícito: *"memória engana muito: às vezes a pessoa acha que não mudou nada, mas os números mostram uma evolução enorme."* O primeiro deu a frase que resume o produto: *"personal não tem preguiça de cuidar do aluno; personal tem pouco tempo para processar excesso de dados em texto longo."*

**Os dois desenharam a MESMA condição de fracasso, sem combinar.**

- **P1:** push genérico no meio do salão → *"a chance de eu arrastar pra o lado no meio da correria é de 80%"*. Funciona se for flag no painel **na segunda de planejamento**, com **ação de 1 clique** — ele chegou a desenhar a interface: `[Mandar mensagem padrão no WhatsApp]` ou `[Ajustar ficha de treino]`.
- **P2:** *"eu não ignoraria — mas também não abriria toda notificação automaticamente."* Abre se o sinal for **tendência** (3 semanas), não oscilação de uma sessão. Ignora se toda segunda chegar *"Peito: atenção / Bíceps: atenção / Costas: atenção / Tríceps: atenção"*.

**O critério de sucesso do produto, dito por P2:** *"não é conseguir detectar um problema. É conseguir fazer o profissional querer abrir o problema."*

### O que isso REFUTA no desenho anterior

**1. O alerta em chat 1:1 está morto.** A §11.2 original roteava o sinal *"ao personal, em chat 1:1 com o aluno"*. Os dois acabaram de descrever exatamente esse formato como o que ignoram. O container certo é **fila de trabalho priorizada, lida no momento do planejamento** — não mensagem que chega.

**2. Ação de um clique deixa de ser enfeite e vira requisito.** P1 foi literal: o valor *"não tá só em gerar o relatório do aluno — tá em economizar o cérebro do personal pra ele parecer um profissional extremamente atencioso sem gastar 20 minutos analisando planilha"*. Relatório que exige leitura para achar o problema é o modo de falha, não o produto.

**3. Seletividade vira restrição inegociável.** Um alerta que dispara para todo grupo muscular toda semana não é um produto ruidoso — é um produto morto. P2 nomeou o número de mortes: algumas semanas.

**4. A transferência da prescrição perdeu apoio empírico.** Nenhum dos dois pediu para ser dono da prescrição. Os dois falaram em querer saber **com quem falar**. A transferência sobrevive pela lógica interna do `PRD.md` §5 ("o app analisa; não prescreve"), que continua válida — mas fica registrado que ela é agora a **metade menos validada** desta seção, e não deve ser tratada como se as entrevistas a tivessem confirmado.

### O limite do lastro, que as duas respostas expuseram

Para julgar progresso, eles usam: técnica e amplitude, RPE, fita métrica, fotos comparativas em mesma iluminação, sono, disposição, composição corporal, força relativa, consistência.

**O lastro tem carga, repetição, volume, frequência e RIR.** Não tem técnica, foto, medida, sono nem composição corporal, e não deve fingir que tem.

Isso não invalida o módulo — delimita a promessa. O lastro responde **uma fatia** da pergunta, justamente a fatia cara de calcular na mão e onde a memória falha. Foto e técnica eles já resolvem no olho. Vender como "responde se o aluno está progredindo" é prometer o que o dado não sustenta.

### Alternativa que as entrevistas ABRIRAM, e que não estava no desenho

P1 propôs, sem ser perguntado, que a ação de um clique fosse **`[Mandar mensagem padrão no WhatsApp]`**. Se a ação sai para o WhatsApp, o lastro **não precisa de canal pessoa-a-pessoa nenhum** — o `PRD.md` §5 fica intacto sem exceção, e a parte mais cara e incerta de construir (chat) desaparece.

**O custo dessa alternativa, e é real:** a conversa sai do produto. Sem registro, sem auditoria, e — o que mais importa — **o lastro perde a única medida que provaria que o módulo funciona**: o alerta virou ação? Fica **em aberto**, decisão do dono, e está escrito na §11.7 revisada.

### O que estas entrevistas NÃO provaram

- **Tamanho da dor em dinheiro.** A terceira pergunta do roteiro (*"quantos alunos você tem, e quantos perdeu nos últimos 6 meses?"*) não foi respondida por nenhum dos dois. A dor é reconhecida; não se sabe se é cara.
- **Disposição a pagar.** Não foi perguntada a nenhum dos dois.
- **Comportamento, só preferência declarada.** Os dois responderam por escrito, com tempo para compor. O próprio P2 se protegeu: *"se for só mais uma notificação semanal, depois de algumas semanas eu vou ignorar."* A prova é ele abrir na terceira segunda-feira, não dizer que abriria.

**Amostra: n=2**, ambos articulados e engajados o bastante para escrever respostas longas — provavelmente acima da mediana do ofício. Convergência entre os dois é sinal forte; representatividade não está estabelecida.

### Alternativa descartada

**Ir direto ao código com o §11 original**, já que o portão formalmente abriu (2–3 personais). Descartada: o portão pedia entrevistas para *aprender*, e o que se aprendeu contradiz o desenho. Construir agora seria construir a coisa errada **com validação na mão** — o pior dos dois mundos, porque a evidência daria falsa confiança.

### Impacto

`PRD.md` §11.2, §11.4, §11.5 e §11.6 revisados; §11.7 nova (a decisão em aberto sobre WhatsApp vs. canal interno). Nenhuma linha de código — o portão de implementação **segue fechado**, agora por outro motivo: falta decidir o container da ação.

### Como reverter

Esta entrada é revisão de contrato, não de código. Reverter = restaurar a §11 anterior a partir do histórico do `PRD.md` e registrar nova entrada dizendo por quê. As entrevistas continuam tendo acontecido.

---

## 2026-09-10 (7) — Contraste medido nos sete temas, e a correção da minha própria medição

**`e2e/j5-contraste.spec.ts`**: troca o tema **clicando o card** em `/ajustes/temas`, confirma pelo `localStorage` que o app aplicou, e só então mede — 7 temas × 5 telas, com as camadas translúcidas compostas.

**Resultado: zero reprovas.** Nenhum texto abaixo do piso AA em nenhum tema.

**Isso fecha o laço de um erro meu, registrado na entrada `2026-09-10 (4)`.** Lá eu tinha acusado 31 falhas nos temas escuros — inclusive "branco sobre branco" a 1,05:1 — trocando `data-tema` por JS de fora do app. Suspeitei na hora que fossem fantasmas, porque a tela renderizada estava certa, mas **suspeitar não é medir**. Agora está medido: eram fantasmas mesmo. O app não re-tematiza por atributo setado de fora, e a varredura comparava token novo com fundo antigo.

**Por que virou teste em vez de conferência manual.** Medir contraste é fácil de fazer errado e o erro é **silencioso** — sai um número plausível. Naquele dia três medições saíram erradas antes de a certa aparecer (token contra token, atributo trocado por fora, e o número herdado do `DESIGN.md` que antecede uma correção de agosto). Regra que não é executável volta a ser violada; o `DESIGN.md` §4.2 já mandava medir no navegador desde sempre e isso não impediu nenhum dos três erros.

**O que segue sem cobertura, e está dito no log de cada execução:** 21 elementos ficam **sobre gradiente**, onde compor cor não resolve — precisaria amostrar pixel. O teste os devolve como "não medidos" em vez de atribuir um número. O principal é o botão de ação primária.

---

## 2026-09-10 (8) — A ação de um clique termina no WhatsApp

**Decisão do dono**, tomada depois de pesquisa de concorrência. Desbloqueia o código do módulo Personal, que estava parado na `PRD.md` §11.7 desde a revisão pelas entrevistas.

**O que muda:** o alerta traz um botão que abre o **WhatsApp do próprio personal**, com a mensagem escrita e o aluno selecionado — link `wa.me` com texto pré-preenchido. O personal lê, ajusta e envia.

### Por que esta, e não o canal interno

**Chat interno não é diferencial — é o padrão da categoria.** Trainerize tem o seu. A Vedius vende, na própria página, *"comunicação centralizada na plataforma"* em oposição explícita a *"comunicação desorganizada com alunos"* — que é o WhatsApp. O argumento de venda dos concorrentes é justamente *tire seus alunos do WhatsApp e traga para cá*.

Construir chat seria brigar de frente com o recurso mais maduro e mais investido deles, sendo dev solo: **empatar onde eles são fortes**, gastando o orçamento de construção que deveria ir para o único lugar onde eles não estão — a leitura do dado. A Vedius tem 12.000 vídeos de exercício; o lastro não ganha ali, nem em builder de treino, nem em gestão financeira. Ninguém tem *"toda segunda eu te digo qual aluno ligar"*.

### Correção de um argumento meu, que estava superdimensionado

Na revisão anterior (`2026-09-10 (6)`) eu escrevi que o WhatsApp faria *"o lastro perder a única medida que provaria que o módulo funciona"*. **Isso estava errado, ou pelo menos muito exagerado**, e chegou a pesar na apresentação da decisão ao dono:

- O **clique acontece dentro do lastro** e é registrável.
- A métrica que decide se o módulo funciona nunca foi "conversaram?" — é **"o grupo muscular alertado recebeu estímulo na semana seguinte?"**. Esse dado está no lastro de qualquer jeito, porque quem registra o treino é o aluno.

O que de fato se perde é o conteúdo da conversa e a resposta do aluno. É bem menos do que "a única medida".

### Correção de fato, sobre custo

Ao apresentar a opção eu não tinha separado **link `wa.me`** de **API do WhatsApp Business**. São coisas diferentes e a confusão poderia ter matado a opção por um custo que ela não tem:

- **Link `wa.me`**: grátis, sem aprovação, sem número dedicado. É o que se constrói.
- **API oficial**: cobra por mensagem (R$ 0,21–0,35 no Brasil em 2026), exige template aprovado e número dedicado. **Não é usada.**

### Restrições que a decisão cria

1. **Envio automático não existe.** O lastro compõe e entrega; quem aperta enviar é a pessoa. Não é limitação técnica — é regra: o app nunca fala com o aluno se passando pelo personal.
2. **O telefone do aluno é dado pessoal** e cai na §11.4.3: vem do aluno, com consentimento, e some quando ele revoga. Nunca cadastrado pelo personal. Decisão de **schema**, não de tela.
3. **O §5 fica sem exceção nenhuma.** A §11.5 deixou de precisar delimitar um canal pessoa-a-pessoa, porque ele não existe. "Só um chatzinho 1:1" volta como **Scope Change novo**, não como extensão natural do botão.

### Alternativa descartada

**Canal interno 1:1** (a §11.5 original). Mantém registro e auditoria da conversa; custa construir chat, reabre a exceção ao §5 e coloca o produto para competir na feature mais forte do concorrente. Descartada pelos três motivos juntos, não por um só.

### Risco aceito

WhatsApp é exatamente aquilo contra o que os concorrentes se posicionam. Um personal pode ler a escolha como "menos profissional". A mitigação é de **enquadramento**: o lastro não é onde se gerencia aluno — é o que diz com quem falar e entrega a mensagem pronta.

### O que NÃO foi confirmado

*"Mensagem padrão"* é **interpretação** do que P1 escreveu (`[Mandar mensagem padrão no WhatsApp]`). Ele não detalhou se imaginava link com texto pronto ou algo automático. A decisão assume a leitura conservadora — a que não envia nada sozinha. Confirmar com ele antes da primeira tela.

### Como reverter

Decisão de contrato, não de código — nada foi construído. Reverter = restaurar a §11.5 anterior (canal interno delimitado) e reescrever a §11.7, registrando por quê. Se a reversão vier depois de o botão existir, o custo é maior: passa a haver telefone de aluno no banco, e a revogação precisa apagá-lo.

---

## 2026-09-11 (1) — O schema do vínculo: telefone no ALUNO, leitura cruzada só de SELECT

**Primeira fatia do módulo Personal construída** (`PRD.md` §11, migrações 0022 e 0023). Três decisões de schema que não estavam na §11 e precisam ficar registradas, porque duas delas divergem do que a §11.7 tinha escrito.

### 1. O telefone mora no aluno, não no vínculo — decisão do dono

A §11.7 escreveu *"o número vem do aluno, com consentimento, e **some** quando ele revoga"*, assumindo o número guardado na concessão. A pergunta foi levada ao dono com essa leitura e a recomendação de gravar na linha do vínculo (revogar apagaria uma linha, e o número ia junto, por construção).

**O dono decidiu diferente:** o contato é **obrigatório no cadastro zero**, para toda conta, com ou sem personal — é dado do próprio usuário.

**Isso muda o significado de "some", e é melhor assim.** O que desaparece na revogação é o **acesso do personal ao número**, não o número. Apagar o telefone do aluno porque ele demitiu o personal seria apagar dado dele. A garantia de consentimento continua **por construção**, só que pela RLS (`usuario_visivel_ao_personal` exige vínculo aceito) em vez do `delete`.

**Verificado no banco em 11/set**, com duas contas descartáveis: vínculo aceito → o personal lê nome e telefone; revogado → a mesma consulta volta vazia, e o telefone continua na linha do aluno.

**A coluna é `nullable` de propósito.** `not null` abortaria a criação de conta por Google, que não entrega telefone: o trigger `usuario_cria_perfil` roda **dentro** do insert em `auth.users`, e exceção ali mata o signup inteiro — o comentário da 0004 já avisava disso sobre o nome. O trigger foi estendido para ler `telefone_whatsapp` do metadado e **descarta em silêncio** o que não bate com o formato, justamente para nunca lançar. Como o trigger não pode reclamar, a validação de verdade acontece na Server Action; sem isso a pessoa cadastraria achando que informou o contato e ele não estaria lá. **Testado**: metadado `"(83) 9 oi"` → conta nasce, telefone `null`.

### 2. A leitura cruzada é `for select`, em policies separadas

As policies de 0001 (`treino_proprio`, `serie_propria`) são `for all`. O caminho óbvio — acrescentar a cláusula do vínculo com `or` dentro delas — daria ao personal **insert, update e delete** nas séries do aluno, em silêncio, porque `for all` cobre tudo. As policies do vínculo são novas e `for select`; as de 0001 ficaram intactas.

**Provado no banco, com vínculo aceito e válido:** `insert` de série no treino do aluno barrado com `42501`; `update` e `delete` não alcançam linha nenhuma.

Consequência registrada na migração: o trigger `serie_herda_usuario` (0001) é **sem** `security definer` justamente para que a RLS de `treino` esconda o treino alheio e o insert falhe ali. Agora que o personal enxerga o treino do aluno, essa premissa mudou — o insert dele passa do trigger e morre no `with check`. Continua barrado, um passo depois. **Isso só permanece verdade enquanto a concessão for SELECT-only.**

### 3. Aceitar e revogar são funções, não policies de update

Não existe policy de `update` em `vinculo_personal`, para ninguém. O motivo é que `with check` valida a **linha final**, não o que mudou: dava para revogar e trocar o `personal_id` no mesmo statement. As duas transições vivem em funções `security definer` com as guardas no corpo — o aluno vem de `auth.uid()` e nunca de parâmetro, o convite precisa estar pendente, e o aluno não pode ter outro personal aceito.

**Provado:** o personal tentando criar o vínculo já `aceito` apontando para a aluna → barrado pela policy de insert; tentando revogar ou apagar vínculo aceito → barrado; código já usado → *"código inválido"*; segundo personal com vínculo vivo → *"já existe vínculo aceito"*.

### Um personal por aluno, ao mesmo tempo

Índice parcial único em `aluno_id where estado = 'aceito'`. A §11.2 fala de "aluno vinculado" no singular e o produto assume isso — a prescrição vai para **um** humano. Convite novo com vínculo vivo é recusado com mensagem, não em silêncio.

### O convite é código, não e-mail — decisão do dono

Com e-mail o app precisaria consultar `auth.users` para saber se aquela pessoa tem conta, e a tela viraria um oráculo de *"este e-mail está cadastrado no lastro?"* — enumeração de usuários de graça, e ainda exigiria o cliente admin. O código não revela nada sobre ninguém, e o canal para entregá-lo já existe: o WhatsApp da §11.7. Alfabeto sem caractere ambíguo (sem I, L, O, 0, 1), 10 caracteres, `crypto.getRandomValues`.

### Alternativa descartada

**Montar a fila com o `cliente-admin.ts`.** Era o atalho óbvio para ler as séries dos alunos e teria funcionado na primeira tentativa — anulando em silêncio toda a RLS desta migração e a `FF5` junto. Descartada: a fila lê sob o JWT do personal, então se as policies estiverem erradas a fila vem **vazia**, que é a falha que se percebe.

### Como reverter

Migração nova que derruba `alerta_personal` e `vinculo_personal`, as quatro policies de leitura cruzada e as funções. `usuario.telefone_whatsapp` fica: o dono o quis independente do módulo. O código das telas sai junto; os filtros explícitos de `usuario_id` da entrada (2) abaixo **ficam**, porque estão certos com ou sem vínculo.

---

## 2026-09-11 (2) — A RLS deixou de significar "só o meu", e 12 consultas não sabiam disso

**O achado mais caro desta sessão**, e ele não apareceu em review nenhum: apareceu na primeira tela aberta no navegador com dado real.

**O sintoma.** A Home do personal listava, em "Treinos Recentes", os treinos **da aluna**. Ele nunca tinha treinado. O gráfico de volume da semana trazia as datas dela.

**A causa é estrutural, não um descuido localizado.** Toda consulta deste app foi escrita confiando que a RLS significava "só o meu" — e era verdade, até a migração 0022. No instante em que o personal passou a enxergar `treino` e `serie` do aluno, **toda leitura sem filtro explícito passou a devolver as duas pessoas**, sem erro, sem log, sem nada.

**Doze pontos, e o que cada um faria:**

| Onde | O que aconteceria |
|---|---|
| `api/analise/route.ts` | **A peça-assinatura.** O parecer do personal somaria o treino do aluno ao dele e citaria exercício que ele nunca fez |
| `exportar.ts` | O CSV de backup levaria as séries do aluno **para fora do app**, num arquivo |
| `treino.ts` "treino de hoje" (×2) | Com o aluno tendo treinado no mesmo dia, o `maybeSingle()` ou estoura com duas linhas ou devolve o treino **dele** — e o personal é redirecionado para dentro da sessão do aluno |
| `resumo-home.ts`, `treino.ts` (listar) | Treino do aluno na Home e na lista |
| `treino.ts` (buscar por id) | O personal abriria a tela de **edição** do treino do aluno por URL |
| `treino.ts` (séries, histórico do exercício), `progressao.ts`, `recencia-grupos.ts`, `alerta-deload.ts` | Mistura no gráfico, no histórico e nos sinais |

**Escrita nunca esteve exposta** — as policies `for all` de 0001 seguem com `auth.uid()`, e a concessão de 0022 é só `for select`. Confirmado no banco.

**A lição, que vale além deste módulo.** "A RLS filtra" era um comentário literal em `carregarTreinosDoUsuario`, e virou mentira por causa de uma migração escrita em outro arquivo, no mesmo dia. Regra que vive só em comentário não sobrevive a mudança de premissa. A `FF5` foi emendada no `ADR.md` para carregar a consequência: **filtro de dono explícito em toda leitura**, com ou sem vínculo.

**Por que review não pegou.** As 12 consultas continuaram corretas isoladamente; o que mudou foi o significado de uma camada abaixo delas. Só a execução com **duas contas reais** expõe isso — e é o mesmo formato do achado de 10/set, em que o vazamento de `/ajustes` só apareceu com usuário novo em vez da conta do dono.

---

## 2026-09-11 (3) — O app chamou uma aluna de "dele"

Três linhas do texto do alerta cravavam pronome masculino: *"o histórico dele"*, *"a rotina dele"*, *"a ficha dele"*. Passaram por escrita e revisão sem ninguém notar, porque todo teste usava "João". **Apareceram na primeira execução real, quando o nome na tela era "Alice".**

**A regra que passa a valer:** o app não sabe o gênero de ninguém, não tem campo para isso e não deve ter. Todo texto gerado usa **o nome da pessoa ou construção impessoal**. Se a frase precisa de um pronome para fechar, a frase está errada.

Vale para os textos do alerta, para o rascunho do WhatsApp e para as quatro telas do módulo — inclusive nas linhas sobre o personal, que tinham o mesmo problema ao contrário (*"ele vê seus treinos"*).

**Travado por teste**, com fronteira de palavra: sem ela, "janela" e "paralela" contêm "ela" e o teste reprovaria texto correto.

---

## 2026-09-11 (4) — Seletividade: três tipos de sinal, e a ausência do quarto

A §11.4.6 diz que seletividade **é** o produto. Isso virou função pura e testada (`fila-personal.ts`), não regra de UI — regra que não é executável volta a ser violada.

**Três tipos, todos tendência POR CONSTRUÇÃO:** grupo parado há 21+ dias (a régua de 3 semanas do P2), exercício sem progresso há 4+ semanas (`SEMANAS_ESTAGNACAO`, que já existia), e volume em queda nas 3 transições seguidas da janela.

**O quarto foi cortado, e o corte é a decisão.** *"Grupo abaixo da faixa de referência"* dispararia para quase todo grupo de quase todo aluno, toda semana — que é literalmente o modo de morte que o P2 descreveu (*"Peito: atenção / Bíceps: atenção / Costas: atenção / Tríceps: atenção"*). Existe um teste com esse nome: aluno com **todos** os grupos parados devolve **dois** alertas, e os dois piores, na ordem.

**"Queda de frequência" virou "queda de volume", e isso é uma troca declarada.** A §11.2 lista queda de frequência entre os sinais roteados. O resumo traz `treinos_semana_atual` contra a média das anteriores — isso é **uma** semana contra uma média, e uma semana é oscilação: uma viagem dispararia. `volume_semanal` já traz as quatro semanas da janela, e exigir queda nas três transições é tendência literal. A queda de frequência continua inteira na Análise do próprio aluno. **Se o dono quiser frequência ao pé da letra, precisa de contagem semanal de treinos e de uma régua própria** — não está feito.

**Teto de 2 por aluno/semana, decidido pelo dono.** E um segundo mecanismo que o teto sozinho não cobre: **supressão de 3 semanas por (tipo, alvo)**. Sem ela, um exercício empacado há seis semanas gera os mesmos dois alertas em seis segundas seguidas — repetido no eixo do **tempo**, mata igual a repetido no eixo do grupo. A semana corrente não conta na supressão, senão a fila recalculada suprimiria a si mesma e o personal que voltasse à tela à tarde encontraria a tela vazia.

**O texto do alerta é determinístico, sem LLM**, por duas razões independentes: a cota da Gemini é de 20/dia compartilhada com a peça-assinatura, e a §11.4.4 exige **rotear** sinal já calculado em vez de criar julgamento novo — texto de alerta escrito por LLM seria julgamento novo.

### A tabela `alerta_personal` não é histórico por higiene

Ela existe por dois motivos que nenhuma outra parte do sistema cobre: (a) a **medida** da §11.7 — *"o grupo alertado recebeu estímulo na semana seguinte?"* não tem como ser respondida sem registrar qual grupo, de qual aluno, em que semana; e (b) a supressão acima. O clique no botão grava `acionado_em` (§11.7: *"o clique acontece dentro do lastro e é registrável"*), e um trigger impede que qualquer outra coluna mude depois — senão a medida seria reescrevível por quem é medido.

### O que NÃO foi confirmado, e continua em aberto

O **P1 ainda não confirmou** o que quis dizer com "mensagem padrão". Construído na leitura conservadora da §11.7: link `wa.me` com texto pronto, que **não envia nada sozinho**. Se ele quis dizer envio automático, a decisão não muda — envio automático está proibido pela §11.7 —, mas a conversa com ele muda de assunto: passa a ser sobre expectativa, não sobre feature.

---

## 2026-09-11 (5) — A trava da prescrição mora no servidor, e o Coach já estava meio fechado

**Contexto:** segunda fatia do módulo Personal (PRD §11.4.1 e §11.4.2) — esconder a prescrição sob vínculo.

**Decidido: a recusa é do route handler; a tela é a metade decorativa.** `/api/analise` aceita `{ pergunta: 5 }` de qualquer cliente autenticado. Esconder o card não fecha aba aberta antes do vínculo, HTML em cache do service worker nem `curl`. A linha da §11.2 ("aluno vinculado **não vê**") só é verdade se o servidor recusar.

**Posição da recusa é parte da decisão.** Ela entra antes de `limparRascunhosExpirados`, antes do teto e antes de `registrarUso`. O consumo de cota é imutável por decisão de 2026-09-05: recusar depois cobraria do aluno uma pergunta que o app nunca responde, e o rascunho inserido com status "gerando" ficaria órfão, preso no teto de geração em andamento. Falha ao LER o vínculo recusa (503); liberar em erro transformaria instabilidade de rede em vazamento de escopo.

**`PERGUNTA_PRESCRICAO` entra separada de `PERGUNTA_PRIMARIA`.** Hoje as duas valem 5, e é de propósito que sejam duas constantes: uma é papel de LAYOUT (qual card fica em destaque), a outra é de ESCOPO (qual pergunta pertence ao humano contratado). Unificar esconderia que só uma delas muda quando o destaque mudar.

### A premissa da §11.4.1 estava PARCIALMENTE satisfeita antes de a fatia começar

A restrição foi escrita supondo o Coach aberto — *"fechar a prescrição e deixar o chat de IA aberto no mesmo app não fecha nada"*. Mas a regra 2 do `SISTEMA_COACH` já proibia prescrever programa, periodização, série/repetição e carga desde que o arquivo existe. **O que faltava não era a proibição: era o DESTINO.** Sem vínculo o coach responde "o app analisa; não manda o que fazer", e quem pergunta fica sem para onde ir — correto para quem treina sozinho. Sob vínculo existe alguém contratado exatamente para isso, e encaminhar é diferente de recusar.

A linha `QUEM PERGUNTA` tinha de mudar pelo mesmo motivo: ela **afirma** "sem personal". Sob vínculo isso é um fato falso entregue ao modelo, e é dele que o modelo tira o tom. As duas variações saem do mesmo template (`sistema(temPersonal)`) para não divergirem quando uma for editada.

Isto fica registrado porque é correção ao RACIOCÍNIO do PRD, não detalhe de implementação: quem ler a §11.4.1 depois vai procurar uma trava que já existia pela metade.

### Achado de passagem: a regra 5 do prompt assumia masculino

`"Você não tem acesso aos dados DELE"` — nos dois prompts, desde que o arquivo existe. Mesma classe do bug corrigido no texto dos alertas no dia anterior, e a mesma correção: texto neutro, travado por teste com borda `` (sem a borda, "janela" casa com "ela").

### O buraco que a §11.2 não cobre, e que NÃO foi fechado por decisão

`listarPareceres()` não filtra por pergunta. Um aluno que salvou pareceres da pergunta 5 **antes** de vincular continua vendo esses pareceres inteiros em `/ajustes/relatorios`, com a prescrição dentro. **Mantidos de propósito:** é dado dele, gerado quando o app era o prescritor legítimo. Apagar ou esconder histórico de ninguém por conta de uma mudança de escopo seria decisão do dono, não de implementação — e apagar registro de parecer não é reversível. Fica escrito para ninguém ler "o aluno vinculado não vê a prescrição" como afirmação sobre o passado.

---

## 2026-09-11 (6) — A medida da §11.7 é uma consulta, não uma tela

**O que é:** `scripts/medida-alerta-estimulo.sql` responde a pergunta que o PRD §11.7 nomeia como a que decide se o módulo Personal funciona — *"o grupo muscular alertado recebeu estímulo na semana seguinte?"*.

**Por que SQL, e não tela.** A medida é uma pergunta sobre HISTÓRICO, feita de vez em quando por uma pessoa: o dono. Tela exigiria decidir quem vê, com que frequência, e o que o número significa para quem está sendo medido — três decisões de produto que ninguém pediu. Segue o precedente do `ff5-rls.sql`: instrumento executável, rodado à mão, versionado junto do código que ele mede.

**Por que NÃO existe uma versão em TypeScript.** Seria a mesma regra em dois lugares, e a aritmética de semana é exatamente onde duas cópias divergem em silêncio. A consulta usa `semana_inicio + 7 dias` até `+ 14 dias`, aritmética sobre a data que o app JÁ gravou — nunca um `date_trunc('week')` recalculado, que arriscaria discordar da fronteira de semana do próprio app. Medida que discorda do que ela mede é pior que medida nenhuma.

**O corte que evita a medida piorar sozinha.** O agregado só conta alerta cuja semana seguinte já terminou. Sem isso, todo alerta da semana corrente entra como "não recebeu estímulo" só porque a semana não acabou, e o número cai toda segunda-feira sem nada ter acontecido.

### O que ela NÃO prova, e está escrito dentro do arquivo

É **correlação de amostra auto-selecionada**. O personal escolhe quais alertas aciona, e provavelmente aciona os dos alunos que cobraria de qualquer jeito; a coluna "acionado" não é braço de experimento, é escolha de quem está sendo medido. Com n≈1 personal e sem randomização, a consulta descreve o que aconteceu — não estabelece causa. Isso fica no cabeçalho do `.sql`, não só aqui: quem lê o número precisa ler a ressalva junto.

Também não cobre `estagnacao_exercicio` nem `queda_volume` — a §11.7 define sucesso só para o abandono de grupo, e inventar definição para os outros dois seria inventar dado de negócio.

### O estado honesto hoje

As duas partes foram **executadas contra o banco de produção** e devolveram **zero linhas**: sintaxe e joins válidos, nenhum uso real ainda. Consulta construída e devolvendo vazio **não é medida feita** — a primeira leitura que vale é daqui a três ou quatro semanas, na terceira segunda-feira que o P2 nomeou.

---

## 2026-09-11 (7) — Existe conta de personal, e ela exige CREF

**Decisão do dono**, tomada depois de ver o módulo montado. Ela **derruba a premissa** sobre a qual o §11 inteiro foi escrito — *"não existe conta de personal; o vínculo é o papel"* — e por isso entrou primeiro como emenda no `PRD.md`, antes de qualquer linha de código: contradição silenciosa entre código e PRD faz o próximo agente reverter para o desenho documentado, e ele estaria certo em fazer isso.

O que foi decidido, em quatro pontos: a escolha acontece no **cadastro**; conta de personal exige **CREF**; a casca do app **difere** (personal não tem "iniciar treino"); e quem é personal e também treina usa **duas contas**.

### As três perguntas que eu não podia decidir, e as respostas

**1. O que fazer com um CREF que o app não consegue verificar.** Verificar exigiria consultar o CONFEF, que não expõe API pública. **Decidido: guardar, validar a forma, e dizer na tela que foi informado e não verificado.** É a única opção que não mente nem tranca a porta. As outras duas eram pior: tratar como verificado seria o lastro emprestando confiança que não apurou — e alguém um dia escolheria um profissional com base nisso; campo livre sem validação faria o "obrigatório" virar decoração.

**2. O personal que também treina.** **Decidido: duas contas.** Conta de personal é de trabalho. O custo — trocar de conta para treinar — foi aceito com o trade-off na mão. A alternativa (uma conta com o lado de treino escondido) devolveria pela porta dos fundos exatamente a ambiguidade que a separação existe para acabar.

**3. Cadastro por Google, que não entrega CREF nem telefone.** **Decidido: entra, mas completa antes de abrir.** Cai numa tela obrigatória de CREF + WhatsApp; sem completar, a área de personal não abre. Mantém o login de um toque sem afrouxar a obrigatoriedade.

### A consequência que não é óbvia, e que decide o schema

`tipo_conta = 'personal'` com `cref` **nulo é estado legítimo** — é exatamente o Google recém-cadastrado. Por isso a migração 0024 **não** tem constraint "personal implica CREF": ela abortaria o cadastro dentro do insert em `auth.users`, o mesmo modo de falha que a 0022 já documentou com o telefone. A obrigatoriedade é do **app**, onde a mensagem de erro é visível e acionável.

Pelo mesmo raciocínio, a validação é **estrita no formulário e frouxa no banco**: `src/lib/texto/cref.ts` exige os seis dígitos e uma das 27 UFs; a check do banco só barra lixo evidente. Regra apertada no banco vira porta trancada sem mensagem.

### O que quase passou despercebido

A policy nova (`só conta personal convida`) **quebraria as quatro specs que montam vínculo de uma vez** — j4, j5, j6 e j7 —, no passo "Gerar código de convite", longe da causa. `criarUsuarioDescartavel` passou a receber o tipo e mandá-lo pelo `user_metadata`, no MESMO commit da policy.

E `contaEPersonal()`, que era código morto, virou **errada** em vez de inútil: "tem aluno" e "é conta de personal" deixaram de ser a mesma pergunta no instante em que a conta passou a existir. Um personal recém-cadastrado, com zero alunos, continua sendo personal — e precisa alcançar a própria fila vazia. Reescrita para ler a coluna.

---

## 2026-09-12 (1) — A casca do personal, e o teste que mentia verde e depois mentia vermelho

**A casca (#234), direção B do gate, escolhida pelo dono em 2026-09-11:** Fila · Alunos · Catálogo · Ajustes. O catálogo fica porque é o único acervo do produto que serve ao profissional sem adaptação — execução curada por pessoa (PRD §4.5). Início, Treinos e Análise não existem nessa casca: as três pressupõem quem treina.

**A barra é pista; a porta é o guarda de rota.** `src/lib/dados/casca.ts`, chamado nas páginas. Sem ele, `/treino` continuaria respondendo por URL digitada, link velho e HTML em cache do service worker, e "conta de personal não treina" seria decorativa — o mesmo raciocínio que pôs a trava da prescrição no route handler.

**Nas páginas, não no `proxy.ts`.** O middleware roda em toda requisição e só chama `getUser()`; ler o perfil ali cobraria uma consulta por request para uma regra de meia dúzia de telas. O tipo da conta entrou no `obterPerfil()`, que toda tela já chama — zero consulta nova. Pelo mesmo motivo `contaEPersonal()` foi removida em seguida: nunca teve chamador, e duas funções respondendo a mesma pergunta é onde uma fica para trás.

### O verde falso que quase entrou

A `j4` e a `j5` varriam como conta de personal desde a cobertura do PE-04. Com o guarda de rota, `/`, `/treino` e `/analise` passariam a redirecionar — e as duas specs **mediriam três redirecionamentos achando que mediram três telas**, e passariam. Conta errada numa varredura não falha alto: devolve verde medindo outra coisa. Reestruturadas para duas contas, com asserção explícita de que a rota alcançada é a pedida. Na `j5`, a segunda sessão troca de tema também: tema mora no `localStorage`, que é por contexto.

### O vermelho falso que veio depois

O primeiro CI da casca (run `34621890356`) falhou na `j7` com a fila vazia. **O app estava certo.** O fixture `criarVinculoAceito` esperava `getByText(/Seu personal/i)` como sinal de aceite concluído, com um comentário dizendo que o texto só existia depois do aceite. Era falso: a tela antes do aceite já diz *"É por aqui que o seu personal te chama"*. A espera casava na hora, o helper voltava com o server action no ar — o screenshot mostra o aluno congelado em "Aceitando…" —, e a `j7` fechava a sessão do aluno em seguida, matando o aceite.

A corrida existia desde a extração do helper e vinha sendo vencida por sorte; com o CI mais carregado, perdeu duas vezes seguidas. O sinal passou a ser o botão "Revogar o vínculo", que só existe com vínculo aceito.

**A regra que fica:** sinal de "terminou" tem de ser algo que **não pode existir antes**. Texto que por acaso aparece nos dois estados não é sinal, é coincidência com timeout.

**E um segundo defeito, achado no mesmo diagnóstico:** a `j6` abria um contexto de aluno à mão e nunca o fechava. O navegador é compartilhado entre specs do worker; a aba vazada sobreviveu até a `j7` e virou o *page snapshot* do erro dela — uma `/analise` que não era tela nenhuma da `j7` e desviou a primeira leitura da falha. Diagnóstico contaminado custa mais que o bug.


---

## 2026-09-12 (2) — Uma conta, dois modos: o personal que treina não troca de conta

**Decisão do dono**, que **derruba a resposta à pergunta 2 de "2026-09-11 (7)"** (*"duas contas"*). Entrou primeiro como emenda no `PRD.md` §11, pelo mesmo motivo daquela: código que contradiz o PRD em silêncio é revertido pelo próximo agente, e ele estaria certo.

### Como a decisão foi tomada

O dono perguntou o que acontece quando um usuário comum vira personal. A resposta honesta era "cria outra conta, com outro e-mail" — e quem entra pelo Google não consegue nem isso com o mesmo endereço. Antes de decidir, pediu o estudo de pelo menos quatro apps. Foram seis:

| App | Modelo |
|---|---|
| ABC Trainerize | contas separadas; segundo e-mail obrigatório; ocupa vaga paga; recomenda um SEGUNDO app para não sair e entrar |
| FITR | contas separadas; recomenda o truque do `+` no e-mail; sair e entrar; dois apps |
| MFIT Personal | "Sou aluno" na entrada; usuário pergunta no FAQ como alternar e fica sem resposta |
| TrueCoach | mesmo login, "Switch to Client / Switch to Coach" |
| Hevy + Hevy Coach | quem usa o Hevy entra no Coach com o MESMO login |
| Everfit | fluxo "Invite Myself" |

**Nenhum converte a conta** (sumir com o treino ao virar personal). Os que separam contas vivem com o atrito que foi previsto. O caso mais parecido com o lastro — o Hevy, app de quem treina sozinho que ganhou a área de coach depois — escolheu o mesmo login.

**O que pesou o momento:** nenhum personal real existe ainda. Migrar depois exigiria juntar contas com histórico, vínculos e alertas.

### O desenho

- `tipo_conta` continua existindo e muda de sentido: deixa de ser "que tipo de pessoa é esta" e passa a ser **"esta conta tem área de trabalho"**. Mantê-lo custa menos que trocá-lo: a policy de convite (`e_conta_personal()`), o trigger e as specs já leem essa coluna.
- `modo_ativo` (`treino` | `trabalho`) é **o que a casca renderiza**. No banco, e não em cookie: toda tela já chama `obterPerfil()`, e cookie seria uma segunda fonte de verdade que os guardas de rota e o banco poderiam contradizer. Uma check garante que `trabalho` só existe em conta com área de trabalho.
- **Ganhar a área de trabalho tem uma porta só:** a função `ativar_area_de_trabalho`, que valida o CREF com a MESMA régua estrita de `src/lib/texto/cref.ts`. O update direto em `tipo_conta` e `cref` foi fechado por GRANT de coluna. Isso fecha dois achados da `j9` de uma vez: o aluno que se promovia a personal com um update na própria linha, e o CREF `1-G/ZZ` gravado pela API.
- **Personal pode ter personal.** A recusa "conta de personal não aceita convite" (0024) existia porque conta de personal não tinha tela de treino. Agora tem. O aceite do próprio convite continua barrado por `personal_id <> v_aluno`.

### O que a `j8` dizia e deixa de dizer

A `j8` afirmava, como comportamento correto, que *"a própria conta pode declarar o tipo — RLS de dono"*. **Isso era o furo registrado como regra.** Ela é reescrita junto: o que ela protege passa a ser "o modo trabalho não alcança as telas de treino", e a conta sem CREF nasce pelo trigger, não por um update que agora é recusado.

---

## 2026-09-13 (1) — Conta de usuário não vira personal: os dois modos são de quem nasceu personal

**Decisão do dono**, que **estreita "2026-09-12 (2)"**. Veio quando ele perguntou como a própria conta, que é de usuário, trocaria para personal — e a resposta honesta foi que trocava: Ajustes mostrava TRABALHO com cadeado e o aviso "É personal? Informe seu CREF", e `ativar_area_de_trabalho` (0025) aceitava qualquer conta.

**O erro foi de leitura, não de código.** Quando o dono escolheu a opção C ("uma conta, dois modos"), a pergunta em jogo era o personal que também treina. Eu estendi a resposta para "qualquer conta pode ganhar a área de trabalho", e isso nunca foi decidido. A regra do dono, nas palavras dele: *"usuário cadastrado não deve aparecer a opção de virar personal, mas deixe quem criou como personal ter acesso, isso é a grande diferença."*

### O que vale agora

- **O tipo nasce com a conta e não muda.** Os únicos caminhos até `tipo_conta = 'personal'` são os do nascimento: o trigger do cadastro por e-mail e `escolher_tipo_conta`, que roda uma vez na conta criada pelo Google. Update direto já estava fechado pelo GRANT de coluna (0025); a 0026 fecha a função de CREF para conta de usuário.
- **`ativar_area_de_trabalho` continua existindo**, só para personal com `cref` nulo — estado legítimo, porque o trigger anula CREF fora da régua.
- **Cápsula TREINO / TRABALHO só para conta de personal.** Usuário não vê cápsula nem aviso (decisão do dono: o aviso "some de vez").
- **Personal nasce pelo e-mail OU pelo Google.** O Google não passa pela cápsula, então a conta nasce com `tipo_escolhido = false` e cai em `/boas-vindas` antes de qualquer tela: escolhe USUÁRIO, ou escolhe PERSONAL e preenche CREF e WhatsApp ali mesmo. `escolher_tipo_conta` roda uma vez só, e `tipo_escolhido` está fora do GRANT de update. **Eu primeiro li a resposta do dono como "Google nasce usuário" e escondi o botão do Google com PERSONAL selecionado; ele corrigiu** — essa leitura errada não chegou a sair do branch.
- **Por que a escolha pendente não é a promoção proibida:** a conta pendente não abre nenhuma tela do app antes de escolher (guarda em `casca.ts` e desvio no `/auth/callback`). Ela nunca foi usuário; está nascendo.

### Ninguém atravessou a porta

Conferido no banco de produção em 2026-09-13: 5 contas de usuário e 2 de personal, e as 2 de personal são contas de teste do CI que **nasceram** personal no cadastro (`raw_user_meta_data.tipo_conta = 'personal'`). Nenhuma conta foi promovida pelo caminho da 0025.

### Os testes que mudam de lado pela segunda vez

A `j9` tinha *"aluno em /personal/completar vê a porta da área de trabalho"* — escrito como comportamento correto no #239. Volta a ser redirecionamento para a Home. É o mesmo padrão da `j8` que afirmava a autopromoção como regra: **teste que descreve uma decisão errada protege a decisão errada**, e precisa ser invertido junto com ela.

## 2026-09-13 (2) — Recusa do banco volta como valor, não como exceção

**Pedido do dono:** corrigir primeiro os achados A1 e A2 do QA do caminho triste (`qa/relatorio-caminho-triste-2026-09-13.md`).

**O defeito tinha duas metades.** (1) Os formulários de série validavam só "positivo" e "finito", e o banco recusa reps acima de 200 ou fracionado, peso acima de 1000 e RIR fracionado. A série aparecia registrada (D6 confirma na tela antes da rede), nunca subia e sumia ao recarregar; a edição para reps 999 mostrava 999 com o banco guardando o valor antigo. (2) A rede de segurança do OF-02 não funcionava em produção: o servidor lançava o erro com o prefixo `[erro-permanente]`, mas o build de produção do Next entrega ao cliente só um `digest`, sem a mensagem. A fila tratava a recusa como falha de rede e parava nela para sempre — e a série válida registrada depois também nunca sincronizava (OF-08, medido na run `34785642721`). No `next dev` a mensagem atravessa, por isso nem os testes de unidade nem o desenvolvimento local viram.

### O que vale agora

- **Os limites da tabela `serie` moram em `src/lib/dados/limites-serie.ts`** (`validarNumerosDaSerie`), e os dois formulários — registrar e editar — usam a mesma função. Mudou a constraint, muda ali.
- **`criarSerieRemoto` e `atualizarSerieRemoto` devolvem `ResultadoGravacaoSerie`.** Recusa do banco (classes `22` e `23` do Postgres) volta como `{ ok: false, permanente: true, mensagem }`; falha transitória continua lançando. Valor de retorno atravessa a fronteira de "use server" intacto em qualquer build.
- **Quem marca o erro como permanente é o cliente**, em `sincronizar-pendentes.ts`. `outbox.ts` não mudou.
- **Regra para o resto do app:** lógica de cliente que decide algo pela MENSAGEM de um erro lançado numa Server Function funciona no dev e quebra em produção. Informação que o cliente precisa ler volta como valor.

### O que NÃO foi feito, de propósito

- **Peso em branco segue gravando 0 kg** (achado B1): é decisão separada do dono.
- **Item descartado para `db.falhas` continua sem aviso na tela.** Com a validação na tela, nenhum caminho do app chega lá hoje; se chegar, é outro achado.
- **Quem implementou não audita:** os casos da `j10` que ficam verdes com esta correção foram escritos ANTES dela, pelo QA, mas pelo mesmo agente. A confirmação independente fica para outra sessão.

## 2026-09-13 (3) — Botão que chama o servidor não pode derrubar a tela nem gravar duas vezes

**Pedido do dono:** corrigir os achados M2 e M3 do QA do caminho triste, depois de A1 e A2.

**M2 — duplo clique em "Registrar série" gravava duas séries.** O `aoEnviar` do formulário não tinha trava: o segundo submit entrava antes de o primeiro limpar o formulário, e cada um enfileirava uma série com `id` próprio. Agora uma ref barra o toque que chega no mesmo quadro, e o botão fica desabilitado até a série estar na fila.

**M3 — "Iniciar treino de hoje" sem rede trocava a tela inteira pela página de erro do Next**, em inglês. O botão era `<form action={criarTreino}>` direto: a falha de rede da Server Function subia sem ninguém para pegar. Agora os três pontos que criam treino (Home, `/treino` e o passo "Como começar?" com modelo) usam `FormIniciarTreino`: sem rede, mostra um aviso e não chama o servidor; com rede que falha, pega o erro e mostra o aviso; o `redirect()` segue para o Next por `unstable_rethrow`.

### O que vale agora

- **Botão que chama Server Function por `<form action>` direto não é mais aceito em tela de uso no treino.** A falha de rede tem de virar aviso, não página de erro.
- **Criar treino continua exigindo rede.** A fila offline cobre séries, não treino; mudar isso é outra decisão.
- **Trava de duplo toque é ref + estado**, não só estado: dois toques no mesmo quadro chegam antes de o React desabilitar o botão.

### O que NÃO foi feito, de propósito

- "Repetir série" não ganhou trava: o caso de dois toques passou nas duas rodadas do QA.
- **Quem implementou não audita:** os casos da `j10` que ficam verdes foram escritos antes, pelo mesmo agente. `QA.md` mantém TR-08 e OF-05 como REPROVOU até confirmação independente.

## 2026-09-13 (4) — Modelo não fica órfão, e só um pedido de Análise por vez gasta cota

**Pedido do dono:** corrigir os achados M4 e M5 do QA do caminho triste, depois de A1/A2 e M2/M3.

**M4 — modelo com plano fora do limite deixava um modelo vazio no banco a cada tentativa.** Duas metades: (1) o formulário convertia o plano com "positivo e finito" e mandava reps 150, reps 2,5 ou peso 1000,5, que `modelo_treino_exercicio` recusa (0015: reps inteiro até 100, peso até 1000); (2) `criarModelo` grava o cabeçalho e depois os itens, sem transação — falhando os itens, o cabeçalho ficava. Agora `lerPlanoDoModelo` (`src/lib/dados/limites-modelo.ts`) recusa na tela apontando o campo, e `criarModelo` apaga o cabeçalho quando os itens falham.

**M5 — dois POST simultâneos à Análise criavam dois rascunhos e gastavam duas vagas da cota de 5/dia.** A checagem de "geração em andamento" e o insert não eram atômicos. Agora cada pedido grava o próprio rascunho, olha o mais antigo em `gerando` (por `criado_em`, depois `id`) e só o vencedor segue; o perdedor apaga o que criou e responde o mesmo 409. `registrarUso` foi para depois do desempate: só quem chama a Gemini gasta cota.

### O que vale agora

- **Limites do plano do modelo moram em `limites-modelo.ts`**, separados dos da série (plano até 100 reps, série até 200).
- **Escrita em duas tabelas sem transação desfaz a primeira quando a segunda falha.**
- **Cota da Análise é registrada depois do desempate, não antes do insert.** O teto diário continua sendo checado antes (sem escrita no 429).

### Decisão que fica com o dono

- **O desempate do M5 não é à prova de tudo.** Sem transação, um pedido pode ler antes de o outro gravar (janela de milissegundos). A garantia total é um índice único parcial, `create unique index ... on parecer (usuario_id) where status = 'gerando'` — **é migração no banco de produção, e não foi aplicada nem escrita**. Com o índice, o insert perdedor falharia com `23505` e o desempate por leitura viraria redundante.

### O que NÃO foi feito, de propósito

- O coach não mudou: o caso de pedidos simultâneos ao coach passou nas duas rodadas do QA.
- **Quem implementou não audita:** `QA.md` mantém AJ-03 e AN-02 como REPROVOU até confirmação independente.

## 2026-09-13 (5) — A fila offline é do navegador, mas cada item é de uma conta

**Pedido do dono:** corrigir o achado M1 do QA do caminho triste, depois de A1/A2, M2/M3 e M4/M5.

**O defeito.** A fila Dexie é uma só por navegador, e o item não guardava de quem era. Num aparelho compartilhado, a conta A registrava sem rede e saía; a conta B entrava, e a sincronização mandava a série de A com a sessão de B. O trigger `serie_herda_usuario` não enxerga o treino de A (RLS) e responde `treino_id ... inexistente` — erro sem código `22`/`23`, tratado como transitório. A fila parava nele, e a série de B ficava atrás, sem subir. Intermitente no E2E (1 falha em 3 execuções) só porque dependia de a série de A ainda estar na fila quando B registrava.

### O que vale agora

- **Cada item da fila grava `usuarioId`**, a conta dona. Vem de `obterPerfil().id`, lido da sessão do SERVIDOR no render de `/treino/[id]` — vale mesmo que o token do navegador expire no meio de um treino longo sem rede.
- **A sincronização só envia os itens da conta logada** (`contaDaSessao()`, da sessão local do navegador) e os itens antigos sem dono. Item de outra conta fica na fila, intocado, sem contar tentativa nem falha, e sobe quando aquela conta entrar de novo.
- **Sem sessão, nada é enviado.**
- **`Perfil` ganhou `id`.**

### O que NÃO foi feito, de propósito

- **Itens gravados antes desta versão não têm dono** e seguem a regra antiga (qualquer sessão os envia). Somem da fila na primeira sincronização de quem os registrou; o caso de aparelho compartilhado com item antigo pendente continua possível até lá.
- **Nenhuma tela mostra "há séries de outra conta neste aparelho".** A série de A não se perde, mas A só descobre que ela subiu quando voltar.
- **Quem implementou não audita:** `QA.md` mantém OF-04 como REPROVOU até confirmação independente. O E2E desse caso era intermitente; verde numa execução não prova sozinho — a prova de lógica são os testes de unidade de `outbox.test.ts` e `sincronizar-pendentes.test.ts`.

## 2026-09-13 (6) — Peso em branco não vira 0 kg, e id digitado errado é "não encontrado"

**Pedido do dono:** corrigir os achados B1 e B2 do QA do caminho triste, depois de A1/A2, M1 a M5.

**B1 — peso em branco gravava a série com 0 kg, sem aviso** (severidade BAIXA, decidida pelo dono). `validarNumerosDaSerie` convertia o texto com `Number("")`, que é `0`. Agora peso vazio (ou só espaços) é recusado com "Informe o peso. Use 0 para exercício sem carga." — o zero continua válido, desde que digitado. Vale para registrar e para editar série, que usam a mesma função.

**B2 — id que não é UUID respondia 500**, em `/treino/abc`, `/catalogo/abc`, `/ajustes/relatorios/parecer/abc` e `/api/parecer/abc/pdf`. O texto ia direto ao Postgres, que recusa com erro (`invalid input syntax for type uuid`) em vez de "nenhuma linha". Agora `buscarTreino`, `buscarExercicio`, `historicoDoExercicio` e `buscarParecer` checam o formato com `ehUuid` (`src/lib/dados/id-valido.ts`) e respondem "não encontrado" — as telas já davam `notFound()` e o PDF já dava 404 para `null`.

### O que vale agora

- **Busca por id vindo de URL checa o formato antes de ir ao banco.** A checagem fica DEPOIS da sessão: sem login continua 401, não 404.
- **`ehUuid` mora num módulo sem "use server"**: arquivo de Server Functions só exporta função assíncrona.

### O que NÃO foi feito, de propósito

- **B3 (PDF de parecer ainda em geração responde 500) não mudou**: é outro achado.
- **Outras buscas por id** que não aparecem numa rota digitável (ex.: `buscarModelo`, lido por `?modelo=`) não foram tocadas; `?modelo=abc` fica para quando alguém medir.
- **Quem implementou não audita:** `QA.md` mantém TR-09, TR-10, CT-02 e AN-06 como REPROVOU até confirmação independente.

## 2026-09-13 (7) — PDF de rascunho é "não encontrado", e pergunta invisível não gasta cota

**Pedido do dono:** corrigir os achados B3 e B4 do QA do caminho triste.

**B3 — PDF de um parecer ainda em geração respondia 500.** O rascunho em `gerando` não tem texto nem evidência, e o `@react-pdf` estourava ao renderizar. A rota do PDF agora responde 404 nesse caso — a tela do parecer já tratava o mesmo rascunho como `notFound()`.

**B4 — o coach aceitava pergunta feita só de caractere invisível e gastava cota.** `trim()` não remove o espaço de largura zero (U+200B). Agora `limparPergunta` (`src/app/api/coach/prompt.ts`) tira a formatação Unicode (categoria Cf) e os separadores U+2028/U+2029 antes de medir; pergunta que fica vazia é 400, antes do teto e do registro de uso. O modelo recebe o texto limpo, e a tela do coach usa a mesma função.

### O que vale agora

- **Texto livre que vai para a IA é medido depois de limpar o invisível**, não com `trim()`.
- **Escape de caractere invisível em código se escreve como sequência em texto**, nunca como o caractere: a primeira escrita desta correção pôs U+2028/U+2029 literais dentro da regex, o arquivo não compilava, e o resumo do runner de testes mostrou tudo verde com um arquivo inteiro sem carregar. A contagem de arquivos de teste (`Test Files`) é o que denuncia isso.

### O que NÃO foi feito, de propósito

- A Análise não recebe texto livre (só o número da pergunta), então não precisou da mesma limpeza.
- **Quem implementou não audita:** `QA.md` mantém AN-03 e AN-04 como REPROVOU até confirmação independente.

## 2026-09-13 (8) — Peso de anilha é validado como o banco guarda, e texto sem espaço quebra na linha

**Pedido do dono:** corrigir os achados B5 e B6 do QA do caminho triste.

**B5 — anilha de 0,001 kg era salva como 0 kg.** `peso_barra` e `anilhas_disponiveis` são `numeric(6,2)` (0008): o banco arredonda para duas casas DEPOIS de a tela e o servidor terem checado `> 0` no número cru. Barra de 0,001 kg tinha o mesmo defeito. Agora `normalizarPesoKg` (`src/lib/anilhas.ts`) arredonda para duas casas e só então exige a faixa de 0,01 a 9999,99 kg (o máximo da coluna). A tela usa o valor já arredondado, e `salvarConfigAnilhas` repete a regra e deduplica depois de arredondar.

**B6 — texto sem espaço estourava a largura no celular:** nome de modelo de 10 mil caracteres (lista de modelos, 109.706 px a 375 px) e nome de conta gigante (`/perfil`, 43.337 px). Na lista, o nome é texto solto dentro de `.item__estatico` (flex): o `min-width: 0` vale para a caixa, não para o texto, cuja largura mínima é a palavra inteira. Agora `.item__estatico` e o novo `.perfil-nome` têm `overflow-wrap: anywhere`, que só quebra no meio da palavra quando ela não cabe.

### O que vale agora

- **Número que vai para coluna `numeric` com casas fixas é arredondado antes de validar.**
- **Texto digitado por pessoa, exibido em linha estreita, leva `overflow-wrap: anywhere`** — só na classe de quem exibe o texto, não em regra global.

### O que NÃO foi feito, de propósito

- **Sem regra global de quebra.** Home e `/personal/alunos` já aguentavam o nome gigante; outros lugares com texto livre ficam para quando alguém medir.
- **Sem conferência visual local** (a máquina não tem `.env.local`). A prova visual são os prints do E2E (`lista-com-nome-gigante`, `nome-gigante_perfil`) nos artefatos do CI.
- **Quem implementou não audita:** `QA.md` mantém AJ-04 e VS-06 como REPROVOU até confirmação independente.

## 2026-09-13 (9) — A fila drena ao trocar de tela, e a 404 é do app

**Pedido do dono:** corrigir os achados B7 e B8 do QA do caminho triste.

**B7 — depois de logar de novo, a fila offline não drenava sozinha.** O `SincronizadorGlobal` mora no layout raiz e só drenava ao montar, quando a rede voltava ou quando o service worker avisava. O login entra com `router.push` (navegação dentro do app), então o componente não remonta: a série que ficou na fila com a sessão expirada esperava até alguém recarregar o app ou abrir o treino. Agora ele drena a cada troca de rota (`usePathname`). Barato: `sincronizarPendentes` tem mutex, e fila vazia não chama a rede.

**B8 — a página 404 era a padrão do Next**: branca, em inglês, sem marca e sem caminho de volta, medida em produção. Agora `src/app/not-found.tsx` usa o cabeçalho do app, texto em PT-BR (ou no idioma da conta) e "Voltar ao início" para `/`, que já manda cada conta ao lugar certo. Vale com e sem sessão; falha ao ler o perfil não derruba a própria 404.

### O que NÃO foi feito, de propósito

- **Sem teste E2E novo para a 404.** O caso de id inválido (`j12`) já mede o status 404; a aparência só foi conferida se houver prévia da Vercel desta branch.
- **Quem implementou não audita:** `QA.md` mantém OF-06 e o item da 404 de produção (TR-PUB-01) como estavam até confirmação independente.

## 2026-09-13 (10) — Uma geração de parecer por conta, garantida pelo banco

**Pedido do dono:** "aplique o índice único do M5". Aplicado em produção pelo MCP do Supabase como migração `0027_parecer_uma_geracao_por_usuario`, depois de conferir que nenhuma conta tinha mais de um parecer em `gerando` (havia 0 em `gerando` no total).

**O que muda.** `create unique index parecer_uma_geracao_por_usuario on public.parecer (usuario_id) where status = 'gerando'`. O segundo insert em `gerando` da mesma conta falha com `23505`. `POST /api/analise` trata esse código como o mesmo 409 de "geração em andamento", sem rascunho e sem cota. O desempate por leitura da decisão (4) saiu: era a mitigação enquanto o índice não existia.

### Efeito nas versões que ainda não têm esta rota

- **`main` (produção):** checa, registra uso e só então insere. Com o índice, o pedido simultâneo perdedor recebe 500 (não 202) e não cria o segundo rascunho; a vaga de cota dele continua gasta até a pilha do QA chegar à `main`.
- **Branches da pilha #248 a #253:** inserem antes de registrar uso; o perdedor cai no 500 do insert antes de gastar cota. O E2E de concorrência continua verde nelas.

### Achado novo, fora deste pedido

- **O coach tem a mesma corrida do M5 com a cota.** CI do #251 (run `34797779114`), nas duas tentativas: três pedidos simultâneos com 9 usos terminaram com 12 usos (teto 10), status 502, 502, 502. A rota checa o teto e registra o uso sem atomicidade. O `QA.md` registra AN-05 ("pedidos simultâneos ao coach não furam o teto de 10") como PASSOU — passou por tempo, não por garantia. **Não corrigido: decisão do dono.**

## 2026-09-13 (11) — A cota do coach é reservada numa transação só

**Pedido do dono:** "corrija o coach concorrente agora". O achado veio do CI do #251 (run `34797779114`, nas duas tentativas): três pedidos simultâneos ao coach numa conta com 9 usos terminaram com 12 usos, acima do teto de 10.

**A causa.** `POST /api/coach` fazia `tetoAtingido` (conta os usos de hoje), lia o vínculo e só então `registrarUso`. Contar e gravar eram duas idas ao banco sem nada entre elas, e os três pedidos contavam "9" ao mesmo tempo. É a mesma corrida do M5, mas um índice único não serve: aqui cabem até 10 linhas por dia.

**A correção.** Migração `0028_consumir_uso_ia`, **aplicada em produção pelo MCP do Supabase**: a função `consumir_uso_ia(p_origem, p_teto)` trava a conta e a origem com `pg_advisory_xact_lock`, conta os usos desde a meia-noite de Brasília e só grava se houver vaga, devolvendo `true`/`false`. `security invoker` (a RLS de `uso_ia` continua valendo), `search_path` fixo, execução revogada de `anon` e concedida a `authenticated` — conferido em `pg_proc` depois de aplicar. No app, `consumirUso` chama a função, e a rota do coach lê o vínculo e depois reserva: sem vaga, 429 sem nada gravado.

### O que vale agora

- **Teto de cota se reserva com `consumirUso`, não com `tetoAtingido` seguido de `registrarUso`.** O par antigo segue exportado porque a Análise ainda o usa: lá o índice único da 0027 já impede duas gerações simultâneas da mesma conta, então a corrida não se forma.
- **Falha ao chamar a função deixa passar**, mesma regra de produto de `tetoAtingido`; o uso fica sem registro nesse caso.

### O que NÃO foi feito, de propósito

- **A Análise não migrou para `consumirUso`**: coberta pelo índice da 0027. Trocar agora seria mudança sem defeito medido.
- **`QA.md` AN-05** ("pedidos simultâneos ao coach não furam o teto de 10") segue como estava; o registro precisa ir para REPROVOU com a evidência do #251 e depois ser reauditado. Fica para a auditoria independente.
