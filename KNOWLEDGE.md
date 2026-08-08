# KNOWLEDGE.md — `lastro`

> **HD append-only.** Escreve-se, nunca se apaga nem se resume. Carregue **por seção**, nunca o arquivo inteiro.

## Índice

- [1. Glossário do domínio](#1-glossário-do-domínio) — definições travadas no grill; corrompem a matemática se mudarem
- [2. Pesquisa de mercado](#2-pesquisa-de-mercado) — o que os concorrentes fazem e onde está o buraco
- [3. Achados técnicos](#3-achados-técnicos) — Gemini, dados de exercício, offline
- [4. Perguntas em aberto](#4-perguntas-em-aberto) — o que ainda não sabemos e não pode ser inventado
- [5. Lições](#5-lições) — erros cometidos e o que aprendemos

---

## 1. Glossário do domínio

*Fonte: grill de domínio com o dono, 2026-08-04. Estas definições são contrato — mudá-las invalida dados já gravados.*

| Termo | Definição travada | Por que importa |
|---|---|---|
| **Série** (`set`) | **Uma** execução contínua de repetições. "3 séries de 10" = 3 registros separados no banco, cada um com suas próprias reps e peso. | Registrar 3×10 como uma linha só esconde a queda de reps na última série — que é o principal sinal de fadiga intra-treino. |
| **Série valendo** (`work set`) | Série executada com carga de trabalho real. **Só ela conta** para volume, e1RM e frequência. | Padrão de todo cálculo do app. |
| **Série de aquecimento** (`warmup`) | Série com carga leve, preparatória. É **registrada** mas **excluída de toda métrica**. | Se contasse como valendo, o volume semanal inflaria e a Análise diria "você está treinando demais" sem ser verdade. |
| **Peso** (`load`) | **O número que o dono lê no equipamento**: a placa selecionada na máquina, ou barra + anilhas já somadas. Unidade: **kg**. | Não é comparável entre academias/marcas de máquina. É comparável consigo mesmo ao longo do tempo — que é exatamente o uso. Assumir "peso real total" obrigaria cálculo mental entre séries. |
| **Treino** (`workout` / sessão) | Uma ida à academia. Contém N exercícios, cada um com N séries. | Unidade de frequência semanal. |
| **Exercício** | Um movimento do catálogo (ex.: "Supino reto com barra"). Tem grupo muscular primário e dicas de execução curadas. | Chave de agregação de e1RM e de volume por grupo. |
| **Volume** (`volume load`) | `Σ (reps × peso)` das séries **valendo**, no período. | Métrica central do gráfico e da Análise. |
| **e1RM** | Carga máxima estimada para 1 repetição, derivada de uma série valendo. | Mede força quando as reps variam — volume sozinho não distingue "mais peso" de "mais reps". |
| **Estagnação** | Exercício sem melhora em e1RM nem em volume por N semanas consecutivas. | É uma das cinco perguntas da Análise. **`N` ainda não definido — ver seção 4.** |
| **RIR** (`reps in reserve`) | Quantas repetições sobraram no tanque ao encerrar a série. RIR 0 = falha. Campo **opcional** por série valendo. | Mede esforço real. Volume alto com RIR 5 é estímulo fraco disfarçado de trabalho. |
| **Série difícil** (`hard set`) | Série valendo com **RIR ≤ 3**, o que **inclui RIR 0** (série levada à falha). Este é o **único lugar** onde o limiar é definido — nenhum outro documento o repete. | Indicador de estímulo melhor que volume bruto. Escrever o critério como "dentro de 1 a 3 reps da falha" **exclui a falha** e faz a Análise reportar estímulo fraco justamente nas semanas mais pesadas. Só existe quando o RIR foi preenchido: o agregador trata RIR ausente como ausência de informação, nunca como série fácil. |
| **e1RM — teto de reps confiável** (`E1RM_REPS_MAX = 12`) | Acima de 12 repetições a série mede resistência muscular, não força máxima; e1RM não é calculado para ela (fica ausente, nunca "suspeito"). **Convenção prática**, sem base em estudo controlado — mesmo rótulo de honestidade de §3.7. Fonte única em código: `src/lib/analise/limiares.ts` (decidido em `SDD.md` §D1, registrado aqui ao fechar a tarefa 1.3, P7). | Reportar e1RM de uma série de 30 reps como força máxima é mentira numérica. |
| **Cobertura mínima de RIR** (`COBERTURA_RIR_MINIMA = 0,60`) | Piso de 60% das séries valendo da semana com RIR preenchido, abaixo do qual `series_dificeis` inteiro fica ausente do resumo (Regra da Presença). **Convenção prática**, sem base em estudo controlado. Fonte única em código: `src/lib/analise/limiares.ts` (decidido em `SDD.md` §D3, registrado aqui ao fechar a tarefa 1.3, P7). | Com cobertura baixa o número existe mas não significa nada; melhor omitir que citar como se fosse medida confiável. |

**Decisão de unidade:** kg fixo, sem tela de configuração. O campo `unidade` existe no banco desde o início para não exigir migração se isso mudar.

---

## 2. Pesquisa de mercado

*Pesquisa web, 2026-08-04.*

**O que já é commodity (e de graça):** Hevy tem o tier gratuito mais generoso da categoria — log ilimitado, rotinas ilimitadas, gráficos de progresso, biblioteca de 400+ exercícios, volume por grupo muscular, histórico de e1RM desde o primeiro dia. Strong é equivalente. **Construir "mais um logger" é competir com software gratuito e maduro.**

**O que é diferenciado e pago:** Alpha Progression lê as séries registradas e prescreve a próxima carga (peso, reps, RIR) calibrada na força real, em vez de template genérico.

**Onde está o buraco que justifica `lastro`:** nenhum deles responde, em português e em linguagem direta, **"e daí? o que esses números significam pra mim esta semana?"**. Eles entregam o gráfico e param. A leitura fica por conta do usuário — que é exatamente quem não sabe fazer a leitura.

**Conclusão que orienta o produto:** o log e o gráfico são **infraestrutura para a Análise**, não o produto. Se a Análise for boa e o log for medíocre, o app tem razão de existir. Se o log for excelente e a Análise for genérica, é uma cópia pior do Hevy.

Fontes: [Hevy vs Strong 2026](https://setgraph.app/ai-blog/hevy-vs-strong-app-comparison-2026) · [Alpha Progression](https://alphaprogression.com/en) · [Melhores apps de hipertrofia 2026](https://mesostrength.com/blog/best-hypertrophy-training-apps)

### 2.1 Referências de DESENHO (não de feature) — pesquisa 2026-08-08

Levantada a pedido do dono, para evoluir o visual sem trocar a base "Areia & Azul Petróleo". Distinta de §2 acima: lá o assunto é o que os concorrentes *fazem*; aqui é como eles *desenham*.

**Hevy — capturas reais da App Store, olhadas (não só resenha).** Três achados estruturais transferíveis: (1) a faixa de resumo do treino (Tempo/Volume/Séries) **não usa cartão nenhum** — rótulo pequeno em cima, número embaixo, direto sobre o fundo; é por isso que sobra largura para o número; (2) a unidade fica **na mesma linha** do número (`6 800 kg`), nunca numa linha própria; (3) cartão só existe onde a coisa é objeto navegável (uma rotina), nunca para métrica. A linha de série ganha **fundo colorido na linha inteira** quando concluída — a cor preenche a linha, não um ícone. Estética geral: branca, fonte de sistema, azul — **genérica; copiar a estrutura, não o visual.**

**WHOOP — o padrão de leitura de dado.** "One big number": uma métrica dominante em ~72pt, legível a distância de braço, todo o resto pequeno e secundário. Divulgação progressiva em 3 camadas (visão geral → tendência → dado bruto), "cada camada só adiciona complexidade quando o usuário pede". Cor estritamente semântica, nenhum acento arbitrário. **Oura** foi redesenhado com a mesma tese: cortar o ruído e focar em uma coisa grande.

**Ergonomia (Steven Hoober, observação de 1.300 pessoas):** 49% seguram o celular com uma mão, 75% navegam com o polegar, zona natural = 25–40% inferiores da tela. Corrobora D2/D3 empiricamente.

**Material 3 Expressive (Google — 46 estudos, 18 mil participantes):** em layouts com hierarquia tipográfica ampliada as pessoas identificam o elemento-chave **até 4× mais rápido**. É o argumento empírico a favor de aumentar o contraste de tamanho.

**Botão "Sign in with Google" — guia oficial, requisito de verificação do app.** Variantes: Light (`#FFFFFF` + traço `#747775` 1px interno), Dark (`#131314` + `#8E918F`), Neutral (`#F2F2F2`, sem traço). Logo G colorido oficial obrigatório; **proibido** monocromático, proibido G sobre fundo não-padrão, proibido ícone sem botão com texto. Padding web 12/10/12px. Tipo especificado Google Sans Medium 14/20. Permite escalar preservando proporção.

**Achado sobre o processo, não sobre design:** a galeria de referência permanente que as diretrizes mandam consultar antes de decisão visual (`3dgallery-eqrvxb8t.manus.space`) foi carregada e inspecionada — são **179 referências de WebGL/3D e e-commerce de luxo** (Three.js, GSAP, Lenis, Rolex, Louis Vuitton, Herman Miller). **Nada ali calibra um PWA de academia de uma mão só**, e o próprio `DESIGN.md` §3.0 já havia registrado que esse ramo é incompatível com D4 e D8. Só aproveita a régua de acabamento e a faixa de UI premium não-3D (Stripe, Linear, Vercel). O mandato aponta para um lugar inútil nesta classe de tarefa — pendência de documento.

**Volume semanal por grupo muscular — fontes primárias localizadas (2026-08-08).** Complementam §3.6, que já resolveu a faixa 10–20 séries/semana. Candidatas para curadoria humana (FF7/ADR-007 proíbe gerar isto por LLM, e o que segue é **resumo de busca, não leitura do texto integral**): [The Resistance Training Dose Response — meta-regressões](https://pubmed.ncbi.nlm.nih.gov/41343037/) (PubMed) · [preprint aberto do mesmo estudo](https://sportrxiv.org/index.php/server/preprint/view/460) (SportRxiv) · [Quantificação de volume semanal por grupo muscular em atletas de físico](https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2025.1536360/full) (Frontiers). Marcos citados: ~4–8 séries/semana como mínimo efetivo, ~10–20 como faixa adaptativa, variação individual grande, retornos decrescentes. **Nada disso foi ligado no app.**

Fontes de desenho: [Google branding guidelines](https://developers.google.com/identity/branding-guidelines) · [WHOOP design breakdown, 925studios](https://www.925studios.co/blog/whoop-design-breakdown) · [Oura app redesign](https://ouraring.com/blog/new-app-design/) · [Hevy na App Store](https://apps.apple.com/us/app/hevy-workout-tracker-gym-log/id1458862350) · [Material 3](https://m3.material.io/) · [Thumb zone / Hoober](https://parachutedesign.ca/blog/thumb-zone-ux/)

---

## 3. Achados técnicos

### 3.1 Gemini — a chave nunca toca o cliente
Num app web, qualquer chave embarcada no bundle é lida no DevTools. Toda chamada obrigatoriamente passa por route handler no servidor. Isso é restrição de arquitetura, virou fitness function no ADR.

### 3.2 Gemini — quota: MEDIDA (não mais pendência)
As fontes públicas se contradizem sobre o free tier (500 RPD vs 1.500 RPD) e mencionam um corte de 50–80% nas quotas em dezembro/2025. O Google deixou de publicar tabela universal — a quota é **por projeto e por modelo**.

**Valor medido, com data (2026-08-05):** o projeto real, rodando `gemini-3.6-flash`, bateu em `RESOURCE_EXHAUSTED` (HTTP 429) durante testes do `qa-treino` — mensagem literal: `"Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: 20, model: gemini-3.6-flash"`. **Limite real: 20 requisições/dia**, não medido antecipadamente (a tarefa 1.0c ficou pendente até o limite ser batido em uso real, não em teste controlado).

**Isso invalida a premissa do ADR-001** ("o free tier cobre um usuário com folga") — 20 req/dia é **apertado**, não folgado: cada pergunta da Análise pode consumir até 2 chamadas (1ª tentativa + retry de validação), então na prática são **~10 perguntas/dia no máximo**, e isso conta junto com qualquer chamada de desenvolvimento/debug/teste. Decisão de como proceder (aguardar reset diário, trocar de modelo, considerar billing) registrada em `DECISIONS.md` — não é decisão que se toma sozinho, é trade-off de custo/produto do dono.

### 3.3 Dados de exercício — por que catálogo curado venceu API pronta
- `ExerciseDB`: 1500–11000 exercícios com GIF, mas a procedência das mídias é nebulosa (risco de licença) e os nomes são em inglês.
- `wger`: open source, sem GIF animado.
- `free-exercise-db`: domínio público, mas JSON estático auto-hospedado, com imagens paradas.

Tradução automática de nome de exercício produz lixo ("Bent Over Row" → "Fileira Curvada"). **Decisão: catálogo curado de ~100 exercícios em PT-BR real**, escrito e revisado, com nomenclatura de academia brasileira. Mais barato que corrigir 1500 traduções e coerente com "profundidade na fatia".

### 3.4 Conteúdo de execução é assunto de saúde (E3)
Dica de forma gerada por LLM é conteúdo inventado em domínio onde erro machuca. Dicas de execução vêm do catálogo curado, revisado, com aviso de que não substitui profissional. O coach 24h responde dúvidas, mas **não improvisa técnica de movimento**.

### 3.5 A Análise calcula ANTES de perguntar
Entregar linhas cruas de série ao LLM faz ele inventar aritmética. Fluxo obrigatório:
`séries → agregador determinístico (TypeScript, testado) → resumo compacto → prompt`
O LLM recebe métricas já calculadas e **apenas interpreta**. É a decisão de engenharia que decide se a peça-assinatura funciona.

---

### 3.6 Volume semanal por grupo muscular — o que a literatura sustenta (e o que não)

*Pesquisa 2026-08-04. Tarefa 1.0a. Fontes verificadas diretamente no PubMed pelo controller, não só relatadas por subagente.*

**O que está estabelecido:** a relação volume → hipertrofia é **crescente e contínua**, com **retorno decrescente**. O que **não** está estabelecido é um teto ou platô numérico.

| Fonte | Desenho | O que diz |
|---|---|---|
| [Schoenfeld, Ogborn & Krieger 2017](https://pubmed.ncbi.nlm.nih.gov/27433992/), *J Sports Sci* | Meta-análise, 15 estudos / 34 grupos | Cada série semanal adicional = **+0,37%** de massa muscular (efeito contínuo, p=0,002). ⚠️ A comparação por categorias (<5, 5–9, 10+) foi **apenas tendência, p=0,074 — não significante**. Não use essa quebra como se fosse achado |
| [Meta-regressão 2026](https://pubmed.ncbi.nlm.nih.gov/41343037/), *Sports Med* | 67 estudos, 2.058 participantes (79% homens, idade média 25) | Ganhos crescem com o volume, com **retorno decrescente** — mais pronunciado para força que para hipertrofia. **Sem platô fixo identificado** |
| [Baz-Valle et al. 2022](https://bazmanscience.com/wp-content/uploads/2024/02/Baz-Valleetal.-2022-ASystematicReviewoftheEffectsofDifferentResistanceTrainingVolumesonMuscleHypertrophy.pdf) | Revisão sistemática | 12–20 vs >20 séries/semana em homens treinados: tríceps ganhou mais com >20 (p=0,01); quadríceps e bíceps sem diferença. Sugere **12–20** como faixa-padrão |

**Decisão para o app:** usar **10–20 séries valendo por grupo por semana** como faixa de referência, e **rotulá-la na UI como convenção prática derivada de média de estudos, não como alvo individual**.

**Ressalvas que a UI precisa carregar, não esconder:**
- A base é majoritariamente **homem jovem treinado** (~25 anos). Pode não valer 1:1 para outro perfil.
- Não existe teto validado. "Acima de 20 é demais" **não** é achado da literatura — é simplificação.
- O ótimo varia **por músculo** (tríceps respondeu a volume maior; quadríceps e bíceps não).

### 3.7 Estagnação — não há critério científico

*Tarefa 1.0b.* **Não existe fonte primária** definindo quantas semanas sem progresso caracterizam estagnação real versus flutuação normal. O número que circula (**3–4 semanas sem PR**) é **convenção de mercado** — apps e treinadores convergem nele, sem estudo controlado por trás.

**Decisão para o app:** usar **3–4 semanas** como gatilho de alerta, e **dizer na tela que é convenção prática, não critério clínico validado**. Emprestar autoridade científica a um número que a literatura não sustenta é exatamente o E3 que este projeto se proibiu.

**Valor adotado no código: 4** (`SEMANAS_ESTAGNACAO`, `SDD.md` §4.2, decidido durante o QA da Fase 1). Motivo: alinha com `JANELA_SEMANAS = 4` — um único horizonte mental no produto, em vez de dois períodos arbitrários distintos — e é o extremo mais conservador da faixa acima, gerando menos alerta de estagnação em falso. **Fonte única do número em código:** `SDD.md` §4.2 / `src/lib/analise/limiares.ts`; esta seção permanece a fonte da faixa da literatura, não do valor adotado (P7).

---

## 4. Perguntas em aberto

*Nada aqui pode ser preenchido com invenção. Cada item vira pergunta ao dono ou medição.*

- **TODO** — Quota real da Gemini no console do AI Studio (§3.2). **Bloqueia a premissa do ADR-001** ("sem teto de gasto" assume folga que ninguém mediu).
- **TODO** — Regra de liberação semanal do botão Análise: a semana fecha na segunda? O botão bloqueia antes disso, ou fica sempre disponível com aviso de poucos dados?
- ~~`N` semanas de estagnação~~ → **RESOLVIDO (2026-08-04):** ver §3.7. Não há critério científico; 3–4 semanas é convenção de mercado, e a UI precisa dizer isso.
- ~~Faixa de referência de volume por grupo~~ → **RESOLVIDO (2026-08-04):** ver §3.6. 10–20 séries/semana, com ressalvas obrigatórias na UI.
- ~~Rotina/divisão de treino do dono~~ → **RESOLVIDO (2026-08-04):** não existe rotina declarada. O dono anota o que treinou e a Análise **deriva o padrão real dos dados**. Elimina a tela de configuração e mede o que foi feito, não o que foi prometido.
- ~~RIR/RPE aparece na UI?~~ → **RESOLVIDO (2026-08-04):** sim, campo opcional por série valendo.

---

## 5. Lições

**A fonte não tem a feature que o CSS estava pedindo — `slashed-zero` era um no-op (2026-08-08).** O dono reclamou duas vezes do zero pontuado do IBM Plex Mono. Antes de propor "desligar por CSS", abri os arquivos `.woff2` que o `next/font` já tinha baixado em `.next/dev/static/media/` com `fontTools` e conferi duas coisas: (1) o glifo `zero` tem **3 contornos** — externo, vazado, e um ponto centrado de 124×118 unidades — confirmando que é ponto, não barra; (2) o subset entregue **não tem a feature OpenType `zero`** nem nenhum stylistic set, só `ccmp/dnom/frac/numr`. Ou seja: `font-variant-numeric: slashed-zero` não faria absolutamente nada, e a única saída real é trocar a família. **Lição:** antes de propor uma propriedade tipográfica, inspecionar a tabela de features da fonte que o build realmente entrega — o subset do `next/font` é menor que a fonte completa, e a feature pode simplesmente não estar lá. Como efeito colateral: `font-variant-numeric: tabular-nums` em `tokens.css` também não tem `tnum` no subset (é inócuo em mono, onde todo glifo já tem a mesma largura, mas é declaração morta).

**Especificação em texto não pega aritmética de layout — o mockup renderizado pegou (2026-08-08).** A prescrição do `diretor-arte` para a faixa de métricas dizia "espaço fino como separador de milhar". Ao renderizar o mockup de verdade e **medir**, `14 200 kg` deu 108px numa coluna de 101px — não cabia, e as três colunas saíam com larguras diferentes (108/96/96) porque `1fr` é `minmax(auto, 1fr)` e conteúdo `nowrap` empurra o mínimo. A forma compacta `14,2k kg` deu 100px e coube. **Lição:** conta de largura feita em prosa erra por poucos px, e poucos px são exatamente a diferença entre alinhar e não alinhar — construir a peça e medir antes de mandar aplicar. Corrigido também o vão da faixa (`--lastro-e-4` → `--lastro-e-3`) para subir a folga de 1px para 3,67px.

**`cmd | tail` mascara o exit code real (2026-08-04).** Rodei `npx supabase start 2>&1 | tail -40` em background; a notificação de conclusão reportou "exit code 0", mas esse é o exit code do `tail`, não do comando piped. O `supabase start` tinha falhado de verdade (`LegacyHealthCheckTimeoutError`). Quase segui em frente achando que tinha dado certo. **Correção:** quando o exit code importa, gravar `echo "EXIT_CODE=$?" >> log` dentro do próprio arquivo de log, e ler essa linha — nunca confiar no status que a ferramenta de background reporta quando o comando passou por um pipe.

**Processo em background lançado *dentro* do turno de um subagente morre quando o turno termina.** Um subagente pediu para rodar `npx supabase start` como parte da tarefa 1.1; o download de imagens Docker parou de progredir assim que o turno dele encerrou — o processo não sobreviveu. Processo longo que precisa sobreviver entre turnos deve ser lançado pelo controller, no seu próprio `run_in_background`, não delegado a um subagente.

**Docker Desktop com pouca memória alocada (aqui, 3.8 GB) derruba o stack completo do Supabase.** `analytics` (Logflare) é o gatilho mais comum de `LegacyHealthCheckTimeoutError`, e arrasta `storage`/`pg_meta` junto por dependência em cadeia. Projeto que não usa analytics/edge functions deve desligá-los em `supabase/config.toml` antes mesmo de tentar — não é otimização, é pré-requisito em máquina com pouco Docker.

**O editor SQL de um dashboard web pode reescrever o que você digita, silenciosamente (2026-08-04).** Tentando aplicar a migração pelo SQL Editor do Supabase (via automação de navegador), o texto digitado saiu parafraseado — "text primary key" virou "chave primária de texto de identificação". Não era tradução simples (isso seria "texto" para "text"); parece algum assistente de IA reescrevendo em tempo real. Três tentativas, três corrupções diferentes. **Nunca cheguei a clicar em "Executar"**, então nada quebrado chegou ao banco — mas o tempo perdido foi real. **Correção:** para SQL ou código sensível a sintaxe, preferir a CLI (`supabase db query -f arquivo.sql`) a um editor de navegador sempre que a CLI estiver disponível — digitação simulada em editor web carrega esse risco, e a única forma de descobrir é conferir o que ficou escrito antes de confiar.

**Login de CLI não funciona em ambiente sem TTY — e não dá para contornar via automação de tela.** `supabase login` falha com `LegacyLoginMissingTokenError` fora de terminal interativo de verdade (testado com e sem `--no-browser`, mesmo erro). E não dá para digitar o comando num terminal real via computer-use: terminais ficam no nível de acesso "click" (clicável, mas digitação bloqueada — proteção do próprio Windows contra automação de terminal). **A única saída é o dono rodar o login uma vez, no terminal dele.** A credencial fica salva em disco no perfil da CLI e todas as chamadas seguintes já a encontram sozinhas — não precisa repetir.

**RLS sem GRANT de base não protege nada — nega tudo (2026-08-05).** A migração 0001 criou tabelas e policies de RLS corretas, mas nunca deu `GRANT` de privilégio ao role `authenticated`. RLS filtra **linha**; sem GRANT, o Postgres nega o **objeto inteiro** antes de a RLS sequer ser avaliada. Sintoma: `permission denied for table treino` com policy e sessão perfeitas. Só apareceu porque a tarefa 1.2 foi testada **de ponta a ponta com sessão real**, algo que a verificação de FF5 da tarefa 1.1 não cobria (ela testava RLS ligada + `auth.uid()` na policy, não GRANT de base). **Lição para o checklist de qualquer schema novo com RLS: `GRANT` explícito ao role de aplicação não é opcional nem implícito — testar com um usuário real, não só inspecionar `pg_policies`.**

**`ref` de elemento em automação de navegador pode ficar obsoleto entre chamadas, mesmo sem navegação explícita (2026-08-05).** Em formulários React controlados (Client Component), um `ref` obtido por `find` às vezes aponta pro elemento errado depois de um re-render (ex.: campo RIR sumiu da tela porque o tipo mudou, e o clique no `ref` antigo acabou caindo no checkbox que ficou na posição). **Correção:** para formulário dinâmico, tirar screenshot fresco e clicar por coordenada de pixel é mais confiável que reusar `ref` entre interações — ou re-`find` imediatamente antes de cada clique, nunca reaproveitar de uma chamada anterior.

**Automação de navegador nesta sessão teve travamentos de renderização recorrentes (tela preta, captura expirando) sem relação com o app sendo testado.** Aconteceu tanto no dashboard do Supabase quanto — uma vez — numa aba nova. Abrir uma aba nova geralmente resolve; quando não resolve, `get_page_text`/`fetch` via `javascript_tool` continuam funcionando mesmo com a captura de tela quebrada, e são a forma de continuar verificando sem depender do screenshot.

**"A semana atual sumiu do resumo" quase foi investigado como bug — era decisão documentada (2026-08-05).** Testando a tarefa 1.4 com dado de hoje (terça-feira), o treino do dia não apareceu em lugar nenhum do `ResumoCompacto`. Antes de mexer em código, li `src/lib/analise/semanas.ts`: é intencional — a semana só entra no resumo depois de **fechada** (a atual, em andamento, fica de fora de propósito, para não analisar dado parcial). **Lição:** "resultado inesperado" não é sinônimo de "bug". Ler o comentário/decisão registrada antes de suspeitar do código — a resposta pode já estar documentada, e mexer sem checar teria desfeito uma decisão consciente.

**Cache de bundler não é vazamento ao cliente — mas um grep ingênuo em `.next/` inteiro não sabe disso (2026-08-05).** A partir do Next.js 16, o Turbopack persiste cache de compilação em disco (`.next/cache/turbopack/`), que pode conter o valor resolvido de env vars **server-side** como artefato interno do bundler. Isso não é o mesmo que a chave aparecer no bundle que o navegador baixa. **Correção:** checar vazamento de segredo restringindo a `.next/static/` (o que o cliente recebe) e `.next/server/` (código do servidor compilado) — nunca `.next/` inteiro, que inclui cache que já está no `.gitignore` e nunca é servido a ninguém.

**Cookie de sessão "presente" não prova que é a sessão certa — checar só a existência mascarou um bug de clique (2026-08-05).** Depois de relogar com um usuário novo, o servidor continuou dizendo "sessão ausente". Quase virou caça a bug de servidor (reiniciei o processo de dev duas vezes) antes de descobrir a causa real: o clique via `ref` do `find` não estava disparando o `onClick`, e um cookie de sessão de um teste **anterior** (usuário já deletado) continuava no navegador — meu check `document.cookie.includes('auth-token')` dava "presente" mesmo sendo o token errado. **Correção:** depois de login em automação, decodificar o JWT do cookie (`atob` nas partes do token) e conferir que o `sub` bate com o ID esperado — presença de cookie não é prova de identidade da sessão.

**Cache de tipos do Next.js (`.next/dev/types/`) pode referenciar arquivo já apagado e quebrar o build por motivo que não é o código (2026-08-05).** Depois de apagar uma página temporária (`/dev-login`), `npm run build` falhou no type-check apontando para um módulo inexistente — o arquivo de tipos gerado (gitignored) não tinha sido invalidado. **Correção:** `rm -rf .next` antes de assumir que há regressão real, sempre que o erro de build referenciar um arquivo que você sabe que não existe mais.

**Fixture pequena esconde bug que só aparece com dado realista — o regex de extração de número tinha dois bugs reais (2026-08-05).** Todos os testes da tarefa 1.4 passavam com resumos pequenos e cuidadosamente construídos. Bastou o `qa-treino` gerar um histórico mais rico (16 treinos, 8 sessões por exercício) para a Gemini escrever naturalmente "2026-07-27" (data ISO) e "e1RM" (sigla com dígito) — e **100% dos pareceres reais caíram no fallback**, porque o regex de extração de número (`/-?\d+.../g`) lia o hífen da data como sinal de menos e o "1" de "e1RM" como número citado. Corrigido em `validador.ts`. **Lição:** teste de validação de texto livre precisa incluir os formatos que o próprio sistema instrui/induz o modelo a usar (o `DESIGN.md` exige data no cabeçalho; o domínio inteiro usa "e1RM") — fixture artificial que nunca produz esses formatos não prova nada sobre o caso real.

**Persona simulada gerando dado por conta própria pode produzir volume absurdo sem supervisão — 3 subagentes em paralelo geraram 180 a 2832 séries cada, quando o esperado era dezenas (2026-08-05).** Ao delegar "decida seu histórico de treino" para 3 subagentes em paralelo, sem exemplo numérico de referência, cada um interpretou "várias semanas de histórico" de forma completamente diferente — um gerou 2832 séries em 24 treinos (118 séries por treino, fisicamente impossível). **Correção:** ao pedir para um agente gerar dado sintético em volume, dar uma faixa explícita de ordem de grandeza (ex.: "10-20 séries por semana, não centenas") — "decida você mesmo" sem âncora numérica não é liberdade criativa, é ambiguidade que se resolve mal.
