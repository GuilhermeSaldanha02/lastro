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
