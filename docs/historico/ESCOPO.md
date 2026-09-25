# ESCOPO.md — `lastro`

> **Documento único e autocontido.** Descreve o produto, a stack e cada tela: o que ela faz, o que ela tem e em que estados ela aparece.
>
> **Para que serve:** levar a uma IA geradora de imagem para trazer referências visuais. A **§9** traz os prompts prontos, um por tela — é de lá que se copia.
>
> **O que este documento NÃO decide:** paleta, tipografia e personalidade visual. Isso está em aberto de propósito (§8). Se você fixar cor aqui, a IA só devolve variação do que já existe.
>
> Atualizado em 2026-08-06. Absorve e amplia o `BRIEFING-VISUAL.md`.

---

## 1. O que o produto é

Um app de treino **pessoal** que registra cada série executada e, uma vez por semana, entrega um **parecer em português sobre o que aqueles números significam** — usando IA sobre métricas já calculadas.

**Tese em uma frase:** o log e o gráfico são infraestrutura; **o produto é a leitura**.

**Posicionamento:** ferramenta séria de dados para uma pessoa que treina sozinha e quer saber se está progredindo de verdade. Não é app social, não é rede de fitness, não é plataforma.

**Anti-referência:** apps que entregam o gráfico bonito e param ali, deixando a interpretação por conta de quem não sabe interpretar. Hevy e Strong já fazem log de graça e melhor — se o parecer for genérico, o projeto não tem razão de existir.

**Uma persona só: o dono.** Nenhuma decisão se justifica por "outros usuários poderiam querer". Não há segunda persona, não há onboarding para estranhos, não há plano pago.

---

## 2. A cena de uso (é ela que decide o layout)

**Registro:** uma pessoa **em pé, suada, segurando o celular com uma mão, entre séries, com pressa, em luz baixa de academia, com o sinal ruim do subsolo.**

**Leitura do parecer:** domingo à noite, sentada, com calma, às vezes no PC.

São duas cenas opostas. Tratar as duas igual prejudica as duas — daí os dois regimes de densidade:

| | **Modo Bancada** (registro) | **Modo Leitura** (parecer, gráfico, histórico) |
|---|---|---|
| Layout | um alvo por linha, largura total | coluna de leitura, medida confortável |
| Números | enormes | dentro de prosa |
| Espaço | generoso entre poucos elementos | ritmo de documento |
| Ação primária | largura total, metade inferior da tela | botão normal |
| Elementos por tela | poucos, grandes, redundância zero | densidade maior é aceitável |
| Movimento | quase nenhum | transição suave de entrada |

---

## 3. Restrições visuais duras (decididas, não negociáveis)

Derivam do contexto de uso, não de gosto. Valem para qualquer proposta visual.

| # | Restrição | Por quê |
|---|---|---|
| D1 | **Alvo de toque mínimo 48×48px**, com folga generosa entre alvos | Dedo suado, pessoa em pé, sem precisão fina |
| D2 | **Ações primárias na metade inferior da tela**, ao alcance do polegar | Uma mão só. Botão no topo obriga a reposicionar o aparelho |
| D3 | **"Repetir última série" é o botão mais proeminente do app** | É a ação mais frequente. Se custar mais de um toque, o log é abandonado |
| D4 | **Legível a um braço de distância** — corpo nunca abaixo de 16px | O celular fica apoiado no banco, não na mão |
| D5 | **Tema escuro como padrão** | Academia com luz baixa; tela clara à noite cansa |
| D6 | **Nenhuma ação de registro espera resposta de rede** | A UI confirma na hora, offline |
| D7 | **Estado de sincronização sempre visível, nunca alarmante** | Precisa saber que salvou, sem que pareça erro |
| D8 | **Contraste AA medido, não estimado** | Gate de acessibilidade, não fase posterior |
| D9 | **Foco visível e navegação por teclado** no PC | O PC é onde os gráficos são lidos com calma |

**Viewports:** 360×640 (piso realista), 390×844 (alvo principal), 1280×800 (desktop).

---

## 4. Ferramentas e stack

### 4.1 Aplicação

| Camada | Ferramenta | Versão | Papel |
|---|---|---|---|
| Framework | **Next.js** (App Router) | 16.3 | Telas, rotas e route handlers no mesmo projeto |
| UI | **React** | 19.2 | Componentes |
| Linguagem | **TypeScript** | 5.x | Tipagem em todo o projeto |
| Banco e autenticação | **Supabase** (Postgres + Auth + RLS) | — | Dados do dono, isolados por `auth.uid()` |
| Persistência local | **Dexie** (IndexedDB) | 4.4 | Fila offline: grava local antes de qualquer rede |
| IA | **Google Gemini** (`@google/genai`) | 2.15 | Escreve o parecer — só no servidor |
| Hospedagem | **Vercel** | — | Deploy |
| Testes | **Vitest** + `fake-indexeddb` | 4.1 | 66 testes, agregador em TDD estrito |
| Lint | **ESLint** | 9 | — |
| Gráficos | **Recharts** | previsto | Ainda não construído |
| Formato | **PWA instalável** | — | Service worker, manifest, ícones. Não é app de loja |

### 4.2 Três restrições de arquitetura que não se rediscutem

1. **A chave da Gemini nunca toca o cliente.** Só o route handler `/api/analise` a enxerga.
2. **O agregador calcula, o LLM só interpreta.** O modelo **nunca** recebe linhas cruas de série — recebe um resumo já calculado por código determinístico e testado. Se ele tiver que fazer conta, ele erra a conta, e um parecer confiante com número errado é pior que nenhum parecer.
3. **Dica de execução de exercício é curada por humano, nunca gerada.** É assunto de saúde.

### 4.3 O caminho da peça-assinatura

```
séries registradas
   ↓
agregador determinístico (TypeScript, TDD estrito)
   ↓  volume · e1RM · séries difíceis · frequência · estagnação · recordes
resumo compacto  ← o LLM vê SÓ isto
   ↓
route handler monta o prompt e chama a Gemini
   ↓
parecer citando exercícios e números reais do dono
```

### 4.4 O caminho do registro offline

```
usuário registra série
   ↓
grava no IndexedDB e a UI já confirma  ← nunca espera a rede
   ↓
entra na fila outbox
   ↓
service worker drena quando há rede
   ↓
Supabase
```

**A função crítica — anotar a série no meio do treino — não depende de Supabase, Gemini nem Vercel.**

---

## 5. As telas

Rotas reais em `src/app/`. Todas funcionam hoje; **nenhuma tem estilo** — é HTML cru. É isso que falta construir.

### 5.1 `/login` — Entrada

**O que faz:** rota pública. Cria conta ou entra, por e-mail/senha ou com Google. Quem tenta acessar qualquer outra rota sem sessão é mandado para cá.

**O que tem:**
- Nome do app.
- Campo de e-mail e campo de senha.
- Botão "Entrar".
- Botão "Criar conta".
- Botão "Entrar com Google".
- Área de mensagem de erro.

**O que precisa comunicar:** que isso é ferramenta séria e pessoal, não rede social. Sem tour, sem promessa de marketing, sem depoimento — o dono já sabe o que é. **É a primeira e única chance de estabelecer a personalidade antes de existir qualquer dado na tela.**

**Estados:** normal · erro de credencial · erro vindo do retorno do Google.

---

### 5.2 `/` — Redirecionamento

Não é tela. Manda direto para `/treino`, ou para `/login` se não houver sessão.

---

### 5.3 `/treino` — Lista de treinos (a casa)

**O que faz:** a tela que abre ao entrar. Lista os treinos já registrados e permite começar o treino de hoje.

**O que tem:**
- Título.
- **Botão "Iniciar treino de hoje"** — ação primária.
- Histórico de treinos por data, cada um clicável.
- Acesso à Análise Semanal.
- Sair.

**O que precisa comunicar:** continuidade. O histórico **é** o patrimônio — é o lastro que dá nome ao app. Ao mesmo tempo, chegando na academia, o treino precisa começar em um toque.

**Estados:** com histórico · vazio ("Nenhum treino registrado ainda").

**Regime:** Modo Bancada.

---

### 5.4 `/treino/[id]` — Treino em andamento (a tela mais usada)

**O que faz:** o coração do uso diário. Mostra as séries já registradas neste treino e permite adicionar mais uma.

**O que tem:**
- Data do treino no topo.
- Lista das séries já registradas, **agrupadas por exercício**: número da série, reps × peso, e a marca de **aquecimento** ou **valendo**.
- Marca de **recorde** quando a série bate a melhor marca.
- Formulário de nova série: escolher exercício do catálogo, reps, peso, aquecimento/valendo.
- **Botão "Repetir última série"** — por D3, é o alvo mais proeminente da tela inteira, e mostra qual série vai repetir.
- Indicador de sincronização ("salvo no aparelho" / "sincronizado").

**Por que aquecimento vs valendo importa visualmente:** séries de aquecimento **não entram** em volume, e1RM nem contagem. A distinção precisa ser legível de relance, sem esforço.

**Estados:** treino vazio · com séries · registrando offline · sincronizando.

**Regime:** Modo Bancada — poucos elementos, grandes, redundância zero.

---

### 5.5 `/analise` — Análise Semanal · **A PEÇA-ASSINATURA**

**O que faz:** a tela pela qual o projeto existe. O dono escolhe uma das cinco perguntas e recebe um parecer sobre os dados reais dele.

**As cinco perguntas, exatamente como estão no código:**
1. Estou progredindo?
2. Onde eu empaquei?
3. Meu volume está equilibrado?
4. Estou treinando demais ou de menos?
5. O que mudar na próxima semana?

**A semana fecha na segunda** (segunda a domingo, ISO-8601). O botão fica sempre disponível; clicar antes da semana fechar mostra a última semana **completa**, nunca a que está em andamento.

**Duas sub-telas:** a **escolha da pergunta** (cinco alvos grandes) e o **parecer**.

**Regime:** Modo Leitura.

#### O risco que define o desenho inteiro

**Se o parecer parecer um balão de chat, o produto vira "chatbot com gráfico colado" e a tese morre.**

**Reprova na hora — nada disso pode aparecer:**
- ❌ Balão arredondado alinhado à esquerda, com ou sem rabicho.
- ❌ Avatar, iniciais, ícone de robô, nome de assistente.
- ❌ Reticências pulsantes, cursor piscando, texto aparecendo letra a letra.
- ❌ Voz de interlocutor: "Claro!", "Vamos lá", "Espero ter ajudado".
- ❌ Caixa de digitação abaixo do parecer, ou qualquer convite a responder. **Perguntar é outra tela.** Aqui não se conversa: aqui se lê.
- ❌ Selo de "gerado por IA" como enfeite. Procedência se mostra com número, não com adesivo.

#### O que ele é: um documento datado

Peça **emitida**, não mensagem recebida. De cima para baixo:

1. **Cabeçalho de emissão** — a pergunta escolhida como título; abaixo, o intervalo da semana fechada e a data de emissão. Alinhado à esquerda. É o que primeiro diz "documento" em vez de "mensagem".
2. **Veredito** — uma frase, forte, sem rodeio. A resposta à pergunta.
3. **Blocos de evidência** — o coração da tela.
4. **Prosa de leitura** — um a três parágrafos que *conectam* as evidências. Os números não moram aqui.
5. **O que fazer** — só na pergunta 5. Lista curta, cada item ancorado num bloco de evidência acima.

Nada centralizado. Nada de cartão flutuante com sombra pesada. É documento: margem esquerda estável, hierarquia por tamanho e peso, ar generoso entre seções.

#### O bloco de evidência — a decisão central

**Os números saem da prosa e viram dado tipografado.** Num chat o número fica enterrado no meio da frase, mesma fonte, mesmo tamanho. Aqui não.

Superfície própria e uma **barra vertical na borda esquerda, na cor do sinal**. Três linhas, sempre nesta ordem:

1. **O exercício, pelo nome de academia que o dono usa** — PT-BR real: "supino reto", "remada curvada", "agachamento livre".
2. **O número**, em fonte monoespaçada tabular, grande, com unidade. Havendo comparação, dois números com o delta entre eles.
3. **A procedência**, pequena: *janela · quantas séries valendo sustentam o número · origem do cálculo*. Exemplo de forma: `4 semanas · 14 séries valendo · calculado no aparelho`.

**Por que isso responde "é sobre ELE":** um bloco desses é impossível de escrever sem os dados dele. **Se o bloco pudesse ter sido escrito sem olhar os dados, ele falhou.**

Número no meio da prosa muda de família (mono) e ganha peso. **Proibido colorir número dentro de prosa** — cor ali confunde com sinal semântico.

#### Os quatro sinais

- **Alta** — progressão.
- **Platô** — âmbar. **Vermelho é proibido em estagnação:** vermelho diz "você errou"; um platô não é erro, é informação.
- **Queda** — regressão.
- **Erro** — falha técnica, e só isso.

**Redundância obrigatória:** cada sinal se distingue por **dois canais além da cor**. Platô traz a palavra "sem mudança" e a contagem de semanas; queda traz o delta com sinal negativo e o intervalo; alta traz o delta positivo. Dois blocos distinguidos só por cor **reprovam**.

**Tom:** observação de instrumento, nunca cobrança. Sem ícone de alerta — nada de triângulo, exclamação ou cadeado. Constatação com número, sem verbo de julgamento.

**O bloco de platô nunca aparece sozinho:** vem ao lado de um bloco de alta sempre que houver um. O contraste entre o que anda e o que parou **é** o formato do parecer. A frase-modelo do produto: *"seu supino está em 60kg há 5 semanas enquanto o agachamento subiu 12% no mesmo período"*.

#### Os quatro estados do parecer

| Estado | Como se apresenta |
|---|---|
| **Gerando** | Cabeçalho e **blocos de evidência completos e legíveis**. Só a prosa está pendente: retângulos na altura das linhas que virão. Rótulo: "escrevendo a leitura". *O agregador roda local e termina antes do LLM começar — a ordem na tela conta a arquitetura.* |
| **Sem dados suficientes** | **Diz o que falta e quanto falta, em número:** quantas semanas fechadas existem, quantas o cálculo exige. Estado neutro, sem cor de sinal, sem vermelho — não é erro, é começo. Ação primária vira "registrar treino". |
| **Erro da API** | **Os blocos de evidência permanecem íntegros na tela.** Só a prosa falta. Aviso de uma linha: a leitura não pôde ser escrita, os números abaixo são seus e estão corretos. Botão "tentar de novo". |
| **Parecer pronto** | Documento completo. |

---

### 5.6 Gráfico de progressão *(no escopo, ainda não construído)*

**A pergunta que o gráfico responde não é "quanto?", é "está subindo?".** O eixo é recurso de conferência, nunca via principal.

**O que tem:**
- **A conclusão em palavras, acima do desenho** — uma linha com o delta e o intervalo, em português. Quem lê só essa linha já sabe o resultado; o desenho é a prova.
- **Rotulagem direta:** primeiro e último ponto rotulados no próprio gráfico. Sem legenda lateral.
- **Platô desenhado, não deduzido:** trecho sem mudança vira segmento **tracejado**, com anotação dizendo há quantas semanas. Progressão é traço contínuo.
- Sem grade de fundo densa. No máximo uma linha de referência com propósito declarado (ex.: melhor marca), rotulada nela mesma.
- Ponto do gráfico com alvo de toque de 48px mesmo que o marcador desenhado seja pequeno.

---

### 5.7 Catálogo de exercícios *(no escopo, sem rota ainda)*

**O que faz:** consulta de execução no meio do treino.

**O que tem:** ~100 exercícios curados, nome de academia em PT-BR, grupo muscular, e **dica de execução escrita e revisada por humano** — nunca gerada por IA, porque é assunto de saúde — mais aviso de que não substitui acompanhamento profissional.

**Por que ~100 e não 1500:** ~100 curados vencem 1500 auto-traduzidos.

---

### 5.8 Coach 24h *(no escopo, sem rota ainda)*

**O que faz:** chat de dúvidas sobre treino, alimentado pela mesma chave da Gemini.

**Esta é a única tela do app onde conversa é permitida.** Aqui balão, campo de digitação e histórico de mensagens são corretos — é o oposto da tela do parecer, e a separação entre as duas é proposital.

**Não improvisa técnica de movimento** — isso é do catálogo curado.

---

## 6. Escopo negativo — o que nunca vai existir na tela

Crítico para geração de imagem: modelo de imagem **adora** colocar troféu, halter e foto de modelo malhando. Nada disso entra.

- ❌ Qualquer coisa social: feed, seguir, comparar, ranking, compartilhar, curtir.
- ❌ Gamificação: medalha, troféu, streak, confete, badge, nível, XP.
- ❌ Planos e periodizações gerados automaticamente. O app **analisa** o que foi feito; não prescreve programa.
- ❌ Integração com relógio, balança, wearable, Health/Google Fit.
- ❌ Calorias, macros, dieta, foto de refeição.
- ❌ Múltiplos usuários, plano pago, billing, limite de uso, paywall, onboarding para estranhos.
- ❌ Foto de modelo malhando, banco de imagem de academia, ilustração de halter, silhueta de atleta.
- ❌ Catálogo gigante de exercícios.
- ❌ App nativo em loja.
- ❌ Cronômetro de descanso, vídeo próprio, importação de outros apps — na v1.

---

## 7. Referências de mercado levantadas

| Referência | O que serve | O que **não** serve |
|---|---|---|
| **WHOOP** | Vocabulário de cor estreitíssimo — cada matiz *significa* algo, nunca decora. Métrica primária gigante contra texto de apoio deliberadamente pequeno. Fundo escuro como escolha funcional. Divulgação progressiva em telas distintas. | A estrutura: comprime tudo num score 0–100 em tiles. O lastro é o oposto — um documento para ler. **Não deixar o parecer virar um número grande.** |
| **Ultrahuman** | O mais perto de "inovador sem ser espalhafatoso": o redesign foi *tirar coisa da tela* e deixar como padrão o que importa naquele momento. | Ecossistema de anel/wearable, fora do escopo. |
| **Oura** | Divulgação progressiva, linguagem semântica de cor unificada. | Produto de recuperação, não de carga. |
| **ISA-101 / High-Performance HMI** | A norma de painel de máquina: base neutra e quieta, **cor reservada para desvio**, e eliminação de gradiente, sombra, bevel, efeito 3D e imagem fotorrealista — porque consomem atenção sem acrescentar informação. Estado normal quieto, anormal alto. | É norma de controle de processo, para operador caçando falha. O lastro é instrumento de leitura para uma pessoa. **Onde conflitar, o PRD do projeto vence** — progressão aqui é o conteúdo principal, não o "estado normal". |
| **Track&Field / Alo** | Identidade de marca: sans arredondada e aberta, sem ícone nem mascote; fotografia de movimento; leveza. | É linguagem de **marca**, não de app. |
| **Berzerk** | Marca brasileira de roupa fitness, a do oversized. Cultura visual do treino pesado. | Vestuário, sem produto digital de referência. |
| **Hevy / Strong** | Piso de usabilidade do registro: log rápido e limpo. | São a anti-referência da tese: param no gráfico. |

**O alvo estético declarado:** a interseção entre o público lifestyle (Track&Field, Alo) e o do treino pesado (Berzerk). Inovador sem ser espalhafatoso — nem app de bem-estar pastel, nem academia de porão com caveira e vermelho gritante.

---

## 8. O que está em aberto — é isto que se quer decidir

Nada de CSS até isso fechar.

1. **A personalidade visual.** A proposta original ("instrumento sóbrio": sem gradiente, vidro ou 3D, ação primária quase branca) foi **reprovada**. Em aberto.
2. **O par tipográfico.** Proposta original IBM Plex Sans + Mono. Uma alternativa testada foi Newsreader (serifada editorial) + IBM Plex Mono. Em aberto.
3. **Os dois regimes de densidade** — registro e parecer parecem telas diferentes de propósito, ou devem parecer iguais? Em aberto.
4. **O formato do parecer** — documento datado com blocos de evidência (§5.5). Em aberto.
5. **Âmbar em vez de vermelho para platô.** Em aberto.
6. **O tamanho da linha de procedência.** Em aberto.

**Direção de cor apontada pelo dono, ainda não fechada:** bordô, azul petróleo e areia — como ponto de partida, não literalmente.

---

## 9. Prompts prontos para IA de imagem

> **Leia antes de copiar.** A tentativa anterior falhou porque o documento inteiro foi mandado de uma vez, e a IA devolveu um *quadro de overview* com várias telinhas e texto ilegível — bonito de longe, inútil de perto.
>
> **Peça UMA tela por vez, como uma tela de celular, em close.** Nunca peça "overview", "board", "mockup collection" ou várias telas juntas.
>
> **Sobre o texto:** modelo de imagem inventa letra. Não tente ler o que ele escreve — olhe só cor, ritmo, densidade e materialidade. Se quiser reduzir o problema, acrescente ao fim do prompt: *"use texto em português apenas onde indicado; prefira poucas palavras."*

### Bloco comum — cole no começo de todo prompt

```
App de treino pessoal chamado "lastro". Interface mobile em português do Brasil,
uma única tela de celular vista de frente, em close, ocupando todo o quadro.
Tema escuro. Estética de instrumento de medição: séria, contida, densa em dado.
Sem gradiente, sem vidro, sem efeito 3D, sem bevel, sem sombra pesada.
Sem foto de pessoa, sem halter, sem ícone de troféu, medalha, fogo ou raio.
Sem elemento de rede social. Sem gamificação.
Números grandes em fonte monoespaçada tabular. Alvos de toque generosos.
```

### 9.1 Parecer da Análise Semanal — a peça-assinatura

```
[bloco comum]

A tela mostra um PARECER SEMANAL apresentado como DOCUMENTO EMITIDO, nunca como
conversa de chat. De cima para baixo:
- um cabeçalho de emissão: uma pergunta como título ("Onde eu empaquei?"), e abaixo,
  em letra pequena, o intervalo da semana e a data de emissão;
- uma frase de veredito, grande e em destaque;
- TRÊS BLOCOS DE EVIDÊNCIA empilhados, cada um com uma barra vertical colorida na
  borda esquerda (um verde, um âmbar, um terracota). Dentro de cada bloco: o nome de
  um exercício em letra pequena, um número muito grande com unidade "kg" logo abaixo,
  e uma linha de metadado minúscula no rodapé do bloco;
- dois parágrafos de texto corrido;
- uma linha fina de rodapé.
Alinhado à esquerda, margem estável, muito espaço entre as seções.
PROIBIDO: balão de chat, avatar, ícone de robô, campo de digitação, botão de enviar.
```

### 9.2 Treino em andamento — a tela mais usada

```
[bloco comum]

A tela mostra um TREINO EM ANDAMENTO. De cima para baixo:
- cabeçalho com a data e o nome do treino, e um indicador discreto de sincronização;
- uma lista de séries agrupadas por exercício. Cada linha traz um número de índice
  pequeno à esquerda, depois o valor da série em números grandes no formato "8 × 60 kg",
  e à direita uma marca de texto discreta dizendo "valendo" ou "aquecimento";
- na METADE INFERIOR da tela, ocupando a largura toda, um BOTÃO PRIMÁRIO ALTO E
  DESTACADO escrito "Repetir última série", com uma segunda linha menor mostrando
  qual série será repetida;
- abaixo dele, um botão secundário discreto, apenas contorno.
O botão primário é o elemento mais proeminente da tela inteira.
```

### 9.3 Entrada

```
[bloco comum]

A tela mostra o LOGIN. Muito pouco na tela: o nome do app em cima, dois campos de
formulário (e-mail e senha), um botão primário de entrar ocupando a largura toda,
um botão secundário de criar conta e um botão de entrar com Google.
Muito espaço vazio. Nenhuma imagem, nenhuma ilustração, nenhum texto de marketing,
nenhum depoimento. Austero e confiante.
```

### 9.4 Lista de treinos

```
[bloco comum]

A tela mostra a LISTA DE TREINOS. Um botão primário largo escrito "Iniciar treino de
hoje", e abaixo um histórico de treinos anteriores em lista, cada item com uma data e
o nome do treino. Sensação de registro acumulado ao longo do tempo, como um caderno de
anotações. Sem gráfico decorativo, sem card colorido, sem foto.
```

### 9.5 Gráfico de progressão

```
[bloco comum]

A tela mostra um GRÁFICO DE PROGRESSÃO de um exercício. Acima do desenho, uma frase
curta em português dizendo a conclusão. Abaixo, um gráfico de linha simples onde o
primeiro e o último ponto têm o valor escrito ao lado deles, direto no desenho.
Um trecho da linha é TRACEJADO e de cor diferente, marcando um período sem evolução,
com uma pequena anotação de texto apontando para ele.
Sem grade de fundo densa, sem legenda lateral, sem área preenchida sob a curva.
```

### 9.6 Variação de exploração estética

Para trazer referência de *clima* em vez de layout, troque a última linha do bloco comum por uma destas e repita o mesmo prompt:

```
Paleta de bordô profundo, azul petróleo e areia quente.
```
```
Editorial e tipográfico, como uma página de revista impressa, com serifada.
```
```
Painel de instrumento industrial, mas plano: sem textura metálica e sem parafuso.
```
```
Quase monocromático, com uma única cor de destaque usada com muita parcimônia.
```
