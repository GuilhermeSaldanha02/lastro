# BRIEFING-VISUAL.md — `lastro`

> **Para que serve este documento:** material de referência para gerar **imagens-conceito** do app (Gemini Pro ou equivalente) e para debater a identidade visual antes de qualquer CSS.
>
> **Não é fonte de verdade do visual.** A fonte única continua sendo `DESIGN.md`. Este arquivo descreve *o que cada tela é e o que ela precisa comunicar* — deliberadamente sem paleta e sem tipografia, porque é justamente isso que está em aberto.
>
> **Estado (2026-08-06):** o dono reprovou a primeira prévia do parecer por dois motivos ao mesmo tempo — **acabamento** (ficou cru) e **personalidade** (o "instrumento sóbrio" do `DESIGN.md` §3.0 não convenceu). As 6 decisões do §5 seguem em aberto.

---

## 1. O que o app é, em uma frase

Um app de treino **pessoal** que registra cada série executada e, uma vez por semana, entrega um **parecer em português sobre o que aqueles números significam**.

**A tese que decide tudo:** o log e o gráfico são infraestrutura; **o produto é a leitura**. Hevy e Strong já fazem log de graça e melhor. Se o parecer for genérico, o projeto não existe.

**Anti-referência:** apps que entregam o gráfico bonito e param ali, deixando a interpretação por conta de quem não sabe interpretar.

---

## 2. A cena de uso (manda no layout inteiro)

Uma pessoa **em pé, suada, segurando o celular com uma mão, entre séries, com pressa, em luz baixa de academia**. Não é alguém sentado com as duas mãos livres.

Exceção: a leitura do parecer é domingo à noite, sentado, às vezes no PC.

**Duas cenas opostas, dois regimes de densidade** — mesma paleta, mesma escala, degraus diferentes:

| | **Modo Bancada** (registro) | **Modo Leitura** (parecer, gráfico, histórico) |
|---|---|---|
| Layout | um alvo por linha, largura total | coluna de leitura, medida confortável |
| Números | enormes | dentro de prosa |
| Espaço | generoso entre poucos elementos | ritmo de documento |
| Ação primária | largura total, metade inferior da tela | botão normal |
| Movimento | quase nenhum | transição suave de entrada |

---

## 3. Quem precisa se reconhecer nisso

O app tem **uma persona só** (o dono), mas a estética precisa funcionar para dois mundos que ele transita:

- **O mundo lifestyle** — Track&Field, Alo. Leveza, movimento, fotografia, sans arredondada e aberta, clareza. Convida.
- **O mundo do treino pesado** — Berzerk (marca brasileira de roupa fitness, a que popularizou o oversized em academia). Peso, atitude, oversized, contraste alto, cultura de sala de musculação. Impõe respeito.

**O alvo é a interseção: inovador sem ser espalhafatoso.** Nem app de bem-estar pastel, nem academia de porão com caveira e vermelho gritante.

---

## 4. Referências de mercado levantadas (2026-08-06)

| Referência | O que serve | O que **não** serve |
|---|---|---|
| **WHOOP** | Vocabulário de cor estreitíssimo — cada matiz *significa* algo (verde=progresso, âmbar=meio-termo, vermelho=risco), nunca decora. Métrica primária gigante (~72pt) contra texto de apoio deliberadamente pequeno. Fundo escuro como escolha funcional. Divulgação progressiva em telas distintas em vez de empilhar. | A estrutura: WHOOP comprime tudo num score 0–100 num dashboard de tiles. O lastro é o oposto — um documento para ler. **Não deixar o parecer virar um número grande.** |
| **Ultrahuman** | O caso mais próximo de "inovador sem ser espalhafatoso": o redesign de 2026 foi *tirar coisa da tela* e deixar como padrão o que importa naquele momento. | Ecossistema de anel/wearable — fora do escopo (o lastro não integra wearable). |
| **Oura** | Divulgação progressiva, linguagem semântica de cor unificada, framework de visualização que escala. | Idem: produto de recuperação, não de carga. |
| **Track&Field / Alo** | Identidade de marca: wordmark em sans arredondada e aberta, sem ícone nem mascote; fotografia de movimento com pontos de vista incomuns; a sensação do pós-treino. | É linguagem de **marca**, não de app. Não há UI de referência. |
| **Berzerk** | Cultura visual do treino pesado brasileiro: oversized, peso, presença. | Marca de vestuário, sem produto digital de referência. |
| **Hevy / Strong** | Os concorrentes diretos, ambos elogiados por log rápido e limpo. São o **piso de usabilidade** do registro. | São exatamente a anti-referência da tese: param no gráfico. |

---

## 5. Inventário de telas — o que existe hoje

Rotas reais no código (`src/app/`). Todas funcionam; **nenhuma tem estilo** — é HTML cru. É isso que a Fase 3 vai vestir.

### 5.1 `/login` — Entrada
**O que é:** rota pública. Criar conta ou entrar por e-mail/senha, ou entrar com Google.
**Conteúdo:** título, campo de e-mail, campo de senha, botão de entrar, botão de criar conta, botão "entrar com Google", área de mensagem de erro.
**O que precisa comunicar:** que isso é uma ferramenta séria e pessoal, não uma rede social. Sem onboarding, sem tour, sem promessa de marketing — o dono já sabe o que é. **Primeira e única chance de estabelecer a personalidade antes de qualquer dado.**
**Estados:** normal · erro de credencial · erro vindo do callback do Google.

### 5.2 `/` — Redirecionamento
Não é tela. Manda direto para `/treino` (ou `/login` se não houver sessão).

### 5.3 `/treino` — Lista de treinos (a casa)
**O que é:** a tela que abre ao entrar. Lista os treinos do dono e permite iniciar o treino de hoje.
**Conteúdo:** título "Treinos" · botão **"Iniciar treino de hoje"** (ação primária) · histórico de treinos por data, cada um clicável · sair · acesso à Análise.
**Estado vazio:** "Nenhum treino registrado ainda."
**O que precisa comunicar:** continuidade. Esta é a tela do lastro acumulado — o histórico *é* o patrimônio. Ao mesmo tempo, chegando na academia, o dono precisa começar a treinar em um toque.
**Regime:** Modo Bancada.

### 5.4 `/treino/[id]` — Treino em andamento (a tela mais usada)
**O que é:** o coração do uso diário. Mostra as séries já registradas neste treino e o formulário para adicionar mais uma.
**Conteúdo:**
- Cabeçalho com a data do treino.
- Lista das séries já registradas, agrupadas por exercício: reps × peso, marcadas como **aquecimento** ou **valendo**.
- Formulário de nova série: escolher exercício do catálogo, reps, peso, aquecimento/valendo.
- **Botão "repetir última série"** — restrição D3: *é o alvo mais proeminente da tela inteira*. É a ação mais frequente do app; se custar mais de um toque, o log é abandonado.
- Indicador de sincronização.

**Restrições duras que a imagem-conceito precisa respeitar:**
- Alvo de toque mínimo **48×48px**, com folga generosa entre alvos (dedo suado, sem precisão fina).
- **Ações primárias na metade inferior da tela**, ao alcance do polegar. Botão no topo obriga a reposicionar o aparelho.
- Corpo de texto **nunca abaixo de 16px** — o celular fica apoiado no banco, lido a um braço de distância.
- **Tema escuro como padrão** (decisão funcional: luz baixa de academia).
- Nada espera resposta de rede. A UI confirma o registro na hora, offline.

**Estados:** treino vazio · com séries · registrando offline · sincronizando.
**Regime:** Modo Bancada — poucos elementos, grandes, redundância zero.

### 5.5 `/analise` — Análise Semanal (**A PEÇA-ASSINATURA**)
**O que é:** a tela pela qual o projeto existe. O dono escolhe uma das cinco perguntas padrão e recebe um parecer sobre os dados reais dele.

**As cinco perguntas:**
1. Estou progredindo?
2. Onde eu empaquei?
3. Meu volume está equilibrado?
4. Estou treinando demais ou de menos?
5. O que mudar na próxima semana?

**Duas sub-telas:** a **escolha da pergunta** (cinco alvos grandes) e o **parecer**.

**Regime:** Modo Leitura.

#### O risco que define o desenho inteiro
**Se o parecer parecer um balão de chat, o produto vira "chatbot com gráfico colado" e a tese morre.**

**Reprova na hora (lista de reprovação):**
- ❌ Balão arredondado alinhado à esquerda, com ou sem rabicho.
- ❌ Avatar, iniciais, ícone de robô, nome de assistente.
- ❌ Reticências pulsantes, cursor piscando, texto letra a letra.
- ❌ Voz de interlocutor: "Claro!", "Vamos lá", "Espero ter ajudado".
- ❌ Caixa de digitação abaixo do parecer, ou qualquer convite a responder. **Perguntar é outra tela.** Aqui não se conversa: aqui se lê.
- ❌ Selo de "gerado por IA" como enfeite. Procedência se mostra com número, não com adesivo.

#### O que ele é: um documento datado
Peça **emitida**, não mensagem recebida. De cima para baixo:

1. **Cabeçalho de emissão** — a pergunta escolhida como título; abaixo, em meta, o intervalo da semana fechada e a data de emissão. Alinhado à esquerda, largura da coluna de leitura. É o que primeiro diz "documento" em vez de "mensagem".
2. **Veredito** — uma frase, forte, sem rodeio. É a resposta à pergunta.
3. **Blocos de evidência** — o coração da tela (abaixo).
4. **Prosa de leitura** — um a três parágrafos que *conectam* as evidências. Os números não moram aqui.
5. **O que fazer** — só na pergunta 5. Lista curta, cada item ancorado num bloco de evidência acima.

Nada centralizado. Nada de cartão flutuante com sombra. É documento: margem esquerda estável, hierarquia por tamanho e peso, ar generoso entre seções.

#### O bloco de evidência — a decisão central
**Os números saem da prosa e viram dado tipografado.** Num chat o número está enterrado no meio da frase, mesma fonte, mesmo tamanho. Aqui não.

Superfície própria, cantos suaves, e uma **barra vertical na borda esquerda na cor do sinal**. Três linhas, sempre nesta ordem:

- **Linha 1 — o exercício, pelo nome de academia que o dono usa** (PT-BR real: "supino reto", "remada curvada").
- **Linha 2 — o número**, em fonte monoespaçada tabular, grande, com unidade. Quando há comparação, dois números lado a lado com o delta entre eles. É a linha que se lê de relance.
- **Linha 3 — a procedência**, pequena: *janela · quantas séries valendo sustentam o número · origem do cálculo*. Forma ilustrativa: `4 semanas · 14 séries valendo · calculado no dispositivo`.

**Por que isso responde "é sobre ELE":** um bloco desses é impossível de escrever sem os dados dele. Se o bloco pudesse ter sido escrito sem olhar os dados, ele falhou.

Dentro da prosa, número no meio da frase muda de família (mono) e ganha peso — **proibido colorir número dentro de prosa**, cor ali confunde com sinal semântico.

#### Os quatro sinais
- **Alta** — progresso.
- **Platô** — âmbar. **Vermelho é proibido em estagnação:** vermelho diz "você errou"; um platô não é erro, é informação.
- **Queda** — regressão.
- **Erro** — falha técnica, e só isso.

Os quatro têm luminância equivalente de propósito. **Redundância obrigatória:** platô se identifica pela barra âmbar *e* pela palavra "sem mudança" com a contagem; queda, pela barra *e* pelo delta negativo. Distinguir dois blocos só por cor **reprova**.

**Tom:** observação de instrumento, nunca cobrança. Sem ícone de alerta — nada de triângulo, exclamação, cadeado. Constatação com número, sem verbo de julgamento.

**O bloco de platô nunca aparece sozinho:** vem ao lado de um bloco de alta sempre que houver um. O contraste entre o que anda e o que parou *é* o formato do parecer — literalmente: *"seu supino está em 60kg há 5 semanas enquanto o agachamento subiu 12% no mesmo período"*.

#### Os quatro estados do parecer
| Estado | Como se apresenta |
|---|---|
| **Gerando** | Cabeçalho e **blocos de evidência completos e legíveis**. Só a prosa está pendente: retângulos na altura das linhas que virão, com pulso suave. Rótulo: "escrevendo a leitura". *(O agregador roda local e termina antes do LLM começar — a ordem na tela conta a arquitetura.)* |
| **Sem dados suficientes** | **Diz o que falta e quanto falta, em número:** quantas semanas fechadas existem, quantas o cálculo exige. Estado neutro, sem cor de sinal, sem vermelho — não é erro, é começo. Ação primária vira "registrar treino". |
| **Erro da API** | **Os blocos de evidência permanecem íntegros na tela.** Só a prosa falta. Aviso de uma linha: a leitura não pôde ser escrita, os números abaixo são seus e estão corretos. Botão "tentar de novo". |
| **Parecer pronto** | Documento completo. |

### 5.6 Gráfico de progressão (existe no escopo, ainda não construído)
**A pergunta que o gráfico responde não é "quanto?", é "está subindo?".** O eixo é recurso de conferência, nunca via principal.

- **A conclusão em palavras, acima do desenho** — uma linha com o delta e o intervalo, em português. Quem lê só essa linha já sabe o resultado; o desenho é a prova.
- **Rotulagem direta:** primeiro e último ponto rotulados no próprio gráfico. Sem legenda lateral.
- **Platô é desenhado, não deduzido:** trecho sem mudança vira segmento **tracejado** em âmbar, com anotação dizendo há quantas semanas. Progressão é traço contínuo.
- Sem grade de fundo densa. No máximo uma linha de referência com propósito declarado (ex.: melhor marca), rotulada nela mesma.
- Ponto do gráfico com alvo de toque de 48px mesmo que o marcador desenhado seja pequeno.

### 5.7 Telas previstas no escopo, ainda sem rota
- **Catálogo de exercícios** — ~100 curados, nome de academia em PT-BR, com **dica de execução escrita e revisada por humano** (nunca gerada por IA: é assunto de saúde) e aviso de que não substitui acompanhamento profissional.
- **Coach 24h** — chat de dúvidas sobre treino. **Esta é a única tela do app onde conversa é permitida.** Não improvisa técnica de movimento.

---

## 6. Escopo negativo — o que nunca vai existir na tela

Importante para as imagens-conceito: nenhum desses elementos deve aparecer.

- ❌ Qualquer coisa social: feed, seguir, comparar, ranking, compartilhar, curtir.
- ❌ Gamificação: medalha, troféu, streak, confete, badge, nível, XP.
- ❌ Planos e periodizações gerados automaticamente. O app **analisa** o que foi feito; não prescreve programa.
- ❌ Integração com relógio, balança, wearable, Health/Google Fit.
- ❌ Calorias, macros, dieta, foto de refeição.
- ❌ Múltiplos usuários, plano pago, billing, limite de uso, paywall, onboarding para estranhos.
- ❌ Foto de modelo malhando, banco de imagem de academia, ilustração de halter.
- ❌ Cronômetro de descanso, vídeo próprio (fora da v1).

---

## 7. Viewports

- **360×640** — piso realista de celular. Se quebra aqui, quebra.
- **390×844** — o alvo principal.
- **1280×800** — desktop; é onde o gráfico é lido com calma no domingo.

---

## 8. O que ainda está em aberto (é isso que se quer decidir)

1. **A personalidade** — a proposta atual ("instrumento sóbrio": sem gradiente, sem vidro, sem 3D, ação primária quase branca em vez de colorida) foi reprovada pelo dono como crua demais. Em aberto.
2. **O par tipográfico** — proposta atual: IBM Plex Sans + IBM Plex Mono, auto-hospedados. Em aberto.
3. **Os dois regimes de densidade** — registro e parecer parecem telas diferentes de propósito, ou devem parecer iguais? Em aberto.
4. **O parecer como documento datado com blocos de evidência** — a estrutura descrita em §5.5. Em aberto.
5. **Âmbar em vez de vermelho para platô.** Em aberto.
6. **O tamanho da linha de procedência** — menor degrau, ou promovido a corpo? Em aberto.

**Nenhuma linha de CSS antes de o dono fechar esses seis pontos.**
