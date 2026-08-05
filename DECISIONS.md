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
