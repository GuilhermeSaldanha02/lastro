# Backlog — teste geral no aparelho do dono (2026-08-17)

O teste que estava pendente desde o fim do redesenho finalmente aconteceu: o dono usou o app no iPhone dele, com dado real, e mandou 8 pontos com print de cada um. Este documento é a fonte única do que fazer com eles.

**Como ler.** Cada item tem: o que o dono disse (literal), o que foi investigado antes de aceitar o diagnóstico, e o estado. Nenhum item foi tratado como "só ajuste de cor" sem antes olhar o código.

**Separação que orienta tudo aqui:** *defeito* (o app faz algo que não devia — corrijo direto) vs. *decisão de design* (não há resposta única — passa pelo dono antes). Misturar os dois foi o que produziu o PR #80, que mediu a cor certo e mesmo assim não agradou no aparelho.

---

**Estado (2026-08-19): os 8 fechados.** 7 corrigidos e mergeados, um PR por item — #88 (coach), #89 (#6 e #7), #90 (#2 e #3), #91 (#5), #92 (#4), #94 (#1). Cada um com os 4 comandos verdes e verificação ao vivo em **Playwright** (viewport 390×844, usuário de teste isolado, criado e limpo em cada rodada). O **#1 saiu de "guardado" e foi resolvido** — ver a seção final. Fica aberto só o **kg/lbs**, que é feature própria, não ajuste de tela.

---

## ✅ Resolvidos nesta rodada

### #8 — Coach não funciona

> *"a tela coach não está funcionando."* — print mostra `Falha ao consultar o coach.`

**Investigado, não presumido.** A causa não é o app: `preview_logs` do dev server mostrou `ApiError 503 {"message":"This model is currently experiencing high demand..."}` vindo da Gemini. Testado direto contra a API (`gemini-3.6-flash`, chave real, fora do app) — **o modelo responde normal agora**. Era instabilidade transitória do provedor.

**Mas há defeito real do app por trás, e é o que se corrige:** `src/app/api/coach/route.ts:59` tem um `catch {}` que não loga nada e devolve sempre a mesma mensagem. Consequência dupla: (1) o dono lê "Falha ao consultar o coach" e não tem como saber que é temporário e que basta tentar de novo; (2) quando acontece, não fica rastro nenhum no servidor pra diagnosticar. A rota `/api/analise`, por contraste, deixou rastro — foi por ela que a causa foi encontrada.

### #6 — Nome do modelo "encurtado e estranho" na lista

**Causa raiz.** `ListaModelos` usa `.item` (moldura + sombra + fundo) **sem** `.item__link`. O padding da linha mora em `.item__link`, não em `.item` — sem ele o texto encosta na borda. E a moldura mente: por D3, moldura + seta é o que marca "isto navega", e essa linha não navega. Lido como campo de formulário justamente por isso.

### #7 — Cápsula branca ao escolher o modelo

> *"era para em vez da capsula ficar branca, ela seguir igual (iniciar treino)"*

**Causa raiz.** `IniciarTreino` usa `.pergunta` (o cartão claro dos cards de pergunta da Análise) para "Treino novo" e para cada modelo. Dentro do card escuro `.destaque` isso vira uma cápsula branca que não tem parentesco com o botão verde que estava ali um toque antes.

### #3 — Gráfico apertado

**Duas causas distintas, ambas reais:**
1. `RotuloExtremos` desenha o valor em kg com `textAnchor="middle"` na coordenada do ponto. No último ponto (o mais à direita) o texto estoura a margem `right: 12` e é cortado — é o `66.7 k` do print.
2. O eixo desenha as 12 semanas da janela mesmo quando só as 2 últimas têm dado, espremendo a linha inteira no canto direito. O gráfico existe pra responder "está subindo?" (DESIGN.md §3.7) — com a linha em 15% da largura, ele não responde.

### #2 — Tela da Análise abre com uma "aba em branco"

**Causa raiz.** `GraficoProgressao` busca `/api/progressao` no cliente; enquanto não resolve, renderiza `<div className="esqueleto" style={{height:200}} />` — um bloco chapado de 200px, sem título, sem moldura, sem nada que diga o que está vindo. Não é tela quebrada, é esqueleto de carregamento; o defeito é que ele não se parece com o que vai chegar.

### #5 — Campo "Nome do modelo" embaixo não faz sentido

> *"quando criamos modelo, essa aba em baixo ex: para colocar o nome, não vi muito sentido."*

**Decisão do dono (2026-08-17):** o nome passa a ser o **primeiro** passo, antes de escolher grupo muscular e exercícios — segue a ordem mental de quem monta (nomeia a intenção, depois preenche). Alternativas descartadas: campo no cabeçalho da folha (fica sempre visível mas compete com o título) e manter embaixo só separando visualmente (não resolve a estranheza apontada, só a acomoda).

### #4 — Tela de anilhas precisa ser remodelada

> *"anilhas está soltas os numeros dos kg, deveria ter algo pra selecionar, kg ou lbs, veja tambem que onde se adiciona o valor da anilhas esta coloda em salvar configurações, essa tela precisa ser remodelada."*

**Escopo decidido pelo dono (2026-08-17): remodelar o layout agora, kg/lbs vira item próprio.** O motivo é concreto, não preguiça: o schema já prevê `unidade in ('kg','lb')` (`0001_schema_inicial.sql:57`), mas **nenhuma tela do app usa** — tudo é kg fixo. Unidade aparece em série, volume, e1RM, gráfico e no prompt da Análise; mexer nisso só na tela de anilhas produziria duas unidades na mesma sessão e número errado no parecer da IA.

**Correção de premissa (PR #92).** "Números soltos" parecia ser a ausência de recipiente — ou seja, a peça M3 do redesenho estando errada. **Não era.** M3 (`DESIGN.md` §6.3, grade sem cartão) está preservada; a causa real era a lixeira ficar sempre no fluxo com `visibility:hidden`, reservando um alvo de toque inteiro embaixo de *cada* número. Essa regra veio do H2, pra evitar reflow ao alternar o modo de edição — revista aqui: reflow em resposta a um toque explícito é aceitável, espaço morto permanente não. `.serie` não mudou (lá a coluna é fixa na grade). Registrado porque é exatamente o tipo de coisa que teria virado uma reversão errada de decisão documentada se eu tivesse aceitado o diagnóstico aparente.

---

## ⏸ Guardados, com motivo

### ✅ #1 — RESOLVIDO em 2026-08-19 (PR #94): o chip sai, o realce de toque fica

O dono pediu a recomendação ("qual a melhor opção para o mobile?") e a resposta foi **remover o fundo, sem substituir por outra pista permanente**. Três razões, nenhuma de gosto:

1. **`ESCOPO.md` §2** — o Modo Bancada (registro) exige *"poucos, grandes, redundância zero"*. Pista repetida por linha vira 20 pistas numa tela de 20 séries: é redundância, na única tela que a proíbe por escrito.
2. **D3** (`DECISIONS.md` 2026-08-15) — *"dado → sem recipiente"*. O chip era um recipiente sobre dado; nasceu em tensão com a regra que o próprio redesenho tinha acabado de fixar. Isso explica o "não tem nada a ver com a proposta" melhor que qualquer argumento de cor.
3. **Convenção da plataforma** — no iOS (Health, Lembretes) toca-se o dado pra editar sem marca permanente; o realce ao pressionar é a affordance. É o que `.serie:active` faz, e foi **verificado por screenshot durante o toque**, não por leitura de estilo computado (que deu falso negativo — `getComputedStyle` via `evaluate` não reflete `:active`).

Também pesou o fato de o app ter **uma persona só** (`ESCOPO.md` §1): pista de descoberta serve a usuário novo, e não há. A função dela era ensinar uma vez — e ensinou.

**Alternativas descartadas, com o motivo:** sublinhado pontilhado (mesmo problema de repetição do chip, e sinal mais fraco segundo a pesquisa de campo de formulário) e pista no cabeçalho da coluna (é texto de instrução, forma que o dono já vetara antes).

### ✅ #1b — era o #7, já resolvido no PR #89

A queixa da "tela azul" tinha duas coisas dentro, e o dono separou: **o card petróleo de iniciar treino deve existir** (é a tese visual §3.0, "Areia & Azul Petróleo"). O problema era só as cápsulas ficarem brancas ao escolher um modelo — corrigido no PR #89, que as fez seguir o verde do "Iniciar treino de hoje".

### Contexto original do #1, preservado

> *"essa cor mas escura não ta agradavel, precisamos ver oque colocar."*

É o chip de `.serie__v` (fundo `--lastro-sup-2`, PR #80). **Segunda vez que o dono reprova a mesma peça no aparelho real** — e a terceira queixa da mesma família, contando o card "Pronto para treinar" (`.destaque`, gradiente petróleo), que ele leu como "tela azul".

**Por que continua guardado, por decisão dele:** as três queixas são a mesma pergunta de design ("que peso visual essas superfícies devem ter num app usado em pé, na academia, com luz ruim"), e responder uma de cada vez foi exatamente o que produziu o PR #80 — medido certo, reprovado no aparelho. Fica pra uma rodada de pesquisa de usabilidade própria, tratando chip + card juntos.

**O que NÃO fazer enquanto isso:** trocar o token por outro no olho. A cor do PR #80 foi medida e está correta contra AA; o problema não é contraste, é adequação — e isso não se resolve medindo.

### kg/lbs no app inteiro

Feature própria, não ajuste de tela — ver #4 acima. Atravessa registro, edição, exibição, agregador (volume/e1RM), gráfico e o prompt da Análise. Merece test-plan antes de código, como a auditoria.
