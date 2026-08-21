# Auditoria visual — pós-redesign Apex Pro

> **Rodada 2026-08-21**, Playwright MCP (`mcp__playwright__*`), Chromium real, viewport **360×640**.
> App é **100% mobile** — desktop fora de escopo por decisão do dono.
> HEAD `73537b7` (+ `09b5b33` de `.gitignore`). Usuário de teste `qa-audit-2608@teste.lastro.invalid` (uuid `ab52bd53-3113-4272-8391-f56a33d01888`), **sem dados de treino**.
> Telas varridas: `/login`, `/`, `/treino`, `/analise`, `/catalogo`, `/coach`, `/perfil`, `/ajustes`, `/ajustes/anilhas`, `/ajustes/modelos`.

**Todo achado com origem em `8d30cf0` é regressão introduzida pelo redesign Apex Pro.**

## ✅ Validação em produção — 2026-08-21

Segunda passagem em **https://lastro-pi.vercel.app**, Chrome real (extensão), **conta pessoal do dono, com dados reais**. Somente leitura: nenhum treino criado, editado ou apagado.

| Achado | Bateu em produção? | Evidência com dado real |
|---|---|---|
| A00 gráficos fixos | ✅ **confirmado** | `path` idêntico ao do usuário de 0 kg, com **11,0 t** reais na tela |
| A01 "sessões seguidas" | ✅ **confirmado** | `diasMarcados: ["TER","QUI"]` + `streak: "2 sessões seguidas"` — quarta vazia no meio |
| A03 coach sob a nav | ✅ **confirmado** | sobreposição de **9px**, o mesmo número do local |
| A04 rotas desprotegidas | ✅ **confirmado** | `/ajustes/modelos` **500**, `/perfil` e `/ajustes` **200** sem redirect |
| A05 contraste `txt-3` | ✅ **confirmado** | 18 na Home, **104** no `/catalogo`, cor `rgb(100,116,139)`, ratio 3.95 |
| A07 alvos < 48px | ✅ **confirmado** | abas 38px, chips do catálogo 34px |
| A02 avatar "AT" | ⚠️ **rebaixado** | o dono tem foto de avatar; `perfil` carrega e o "AT" **não aparece** |
| A13 meta de treinos | 🆕 **novo, achado em produção** | "2/4 Treinos (50%)" com `metaTreinos` cravado no código |

Aferição do método de contraste rodada na própria página de produção: `#FFF/#000 = 21.00`. Zero overflow horizontal em todas as telas.

---

## Resumo

| ID | Achado | Severidade | Origem |
|---|---|---|---|
| A00 | Gráficos da Home são desenho fixo, sem ligação com dado | **CRÍTICA** | `8d30cf0` |
| A01 | "sessões seguidas" mostra número que não é sequência | ALTA | `8d30cf0` |
| A02 | Avatar "AT" hardcoded quando o perfil é nulo | ~~ALTA~~ → **BAIXA** | `8d30cf0` |
| A13 | Meta de "4 treinos/semana" cravada no código | MÉDIA | `8d30cf0` |
| A03 | Campo do coach fica sob a aba inferior fixa | ALTA | `8d30cf0` |
| A04 | `/perfil` e `/ajustes/**` fora da lista de rotas privadas; dois 500 | ALTA | anterior |
| A05 | `--lastro-txt-3` reprova AA em toda superfície — 104 ocorrências numa tela | ALTA | `8d30cf0` |
| A06 | `DESIGN.md` certifica contraste com número de outra paleta | ALTA | `8d30cf0` |
| A07 | Alvos de toque abaixo dos 48px do próprio token | MÉDIA | `8d30cf0` |
| A08 | Erro de cadastro volta cru, em inglês | MÉDIA | anterior |
| A09 | Mensagem de sucesso do cadastro usa estilo de erro | MÉDIA | anterior |
| A10 | "Inicie sua primeira sessão abaixo" — o botão está acima | BAIXA | `8d30cf0` |
| A11 | Descrição aparece 60px acima do título que descreve | BAIXA | `8d30cf0` |
| A12 | Texto do estado vazio da análise mistura 2 e 3 semanas | BAIXA | anterior |

---

## A00 — Os gráficos da Home são desenho fixo · **CRÍTICA**

`src/components/seletor-metricas-home.tsx` renderiza três SVGs com o `path` **literal no código**. O traço é idêntico para todo usuário, sempre:

```tsx
<path d="M 0,55 Q 50,60 100,45 T 200,50 T 290,15 T 350,8" ... />
```

Provado ao vivo: usuário com **zero treinos**, volume **"0 kg"**, selo **"Sem treinos"** — e a curva desenha uma subida acentuada com ponto dourado de destaque no fim.

Dois selos também são inventados — **os três estados provados ao vivo, com print, no usuário de zero treinos**:

| Aba | O que o app mostra com ZERO treinos | De onde vem |
|---|---|---|
| Volume | "0 kg" · selo "Sem treinos" · **curva subindo** | valor correto; `path` fixo |
| Cargas | "—" `1RM` · selo verde **"Progressão"** · **linha dourada subindo** | selo é string incondicional; `path` fixo |
| Séries | "0 séries" · selo verde **"Faixa Ideal"** · **curva ciano subindo** | selo é string incondicional; `path` fixo |

Os números escalares estão certos ("0 kg", "—", "0 séries"). O que mente é o **desenho** e o **selo**: zero séries é rotulado "Faixa Ideal", zero treinos é rotulado "Progressão", e as três curvas sobem.

**É regressão.** A Home anterior (`8d30cf0~1:src/app/page.tsx:111-131`) tinha três métricas honestas de texto — Treinos, Volume, Séries valendo — ligadas a `resumo.*`, **sem gráfico nenhum**. O redesign trocou dado real por decoração com aparência de dado.

Viola **E3 / P9** ("conteúdo nunca inventado"). Num app de treino o dano passa do estético: mostrar curva subindo e "Alta" para quem estagnou desinforma o dono sobre o próprio progresso — o oposto do que a peça-assinatura existe para fazer.

## A01 — "sessões seguidas" não é sequência · **ALTA**

`src/app/page.tsx:127` passa `streakDias={resumo.treinosNaSemana}`; `rastreador-disciplina.tsx:53-55` rotula esse número como **"sessões seguidas"**.

Quem treinou **segunda e sexta** tem 2 treinos e **nenhuma** sequência — e lê "2 sessões seguidas". O rótulo promete continuidade e entrega contagem.

O resto do `RastreadorDisciplina` está correto (marca os dias com `diasComTreino` real).

## A13 — Meta semanal de treinos é número cravado no código · **MÉDIA**

`src/app/page.tsx:77`:

```ts
const metaTreinos = 4;
```

A Home mostra **"2/4 Treinos (50%)"** e desenha uma barra de progresso proporcional. O dono nunca definiu meta de 4 treinos por semana — não há tela, campo ou preferência que produza esse número. A porcentagem é aritmética honesta sobre um denominador inventado.

Na mesma seção, `page.tsx:160-162` afirma **"Sua progressão semanal está ativa"** sempre que `treinosNaSemana > 0` — declara progressão sem calcular progressão. Mesma família do A00.

Achado na passagem de produção, com os dados reais do dono.

## A02 — Avatar com iniciais hardcoded · **BAIXA** (rebaixado após produção)

`src/components/cabecalho-pro.tsx:60`:

```tsx
{perfil ? <Avatar nome={perfil.nome} … /> : <div className="topo-avatar">AT</div>}
```

**Prova visual em `/perfil`:** na mesma tela, o avatar da barra de topo mostra **"AT"** e o avatar do corpo mostra **"Q"** — a inicial real de `qa-audit-2608`. Dois avatares do mesmo usuário, iniciais diferentes, um ao lado do outro.

**Rebaixado após a validação em produção.** Na conta real do dono o avatar tem foto, `perfil` carrega e o "AT" **não aparece em nenhuma tela**. O fallback só dispara quando `perfil` é nulo — ou seja, pelo mesmo caminho do A04 (sessão ausente).

Continua sendo defeito real — o app desenha um usuário inventado em vez de um estado vazio honesto — mas cai para BAIXA e se resolve junto com o A04. A severidade ALTA da primeira passagem estava inflada: eu tinha visto o "AT" só no usuário de teste, que não tem foto.

## A03 — Campo do coach fica sob a aba inferior · **ALTA**

Medido em 360×640, `/coach`:

| Elemento | Posição |
|---|---|
| Campo "Pergunte ao coach…" | top 523, bottom **572** |
| Aba inferior fixa | top **563** |

**Sobreposição de 9px.** O campo de entrada e o botão de enviar — os únicos controles da tela — ficam parcialmente cobertos pela navegação. Confirmado também pela varredura de elementos sob a nav: `["Pergunte ao coach…", ""]`.

## A04 — `/perfil` e `/ajustes/**` fora da lista de rotas privadas · **ALTA**

`src/proxy.ts:13`:

```ts
const PREFIXOS_PRIVADOS = ["/treino", "/analise", "/catalogo", "/coach"];
```

O comentário três linhas acima previu o defeito: *"Rota nova que esqueça esta lista fica pública por omissão — é o tipo de furo que só aparece em produção."*

Medido sem sessão, por navegação real:

| Rota | Sem sessão |
|---|---|
| `/treino` `/analise` `/catalogo` `/coach` `/` | ✅ redireciona → `/login?proximo=…` |
| `/perfil` `/ajustes` `/ajustes/anilhas` | ❌ **200**, shell completo, avatar "AT", estado vazio |
| `/ajustes/modelos` `/ajustes/modelos/novo` | ❌ **500** |

Stack do 500:

```
Error: Sessão ausente — usuário não autenticado.
    at usuarioAutenticadoOuErro (src/lib/dados/modelo-treino.ts:17:11)
    at async listarModelos       (src/lib/dados/modelo-treino.ts:34:24)
    at async PaginaModelos       (src/app/ajustes/modelos/page.tsx:10:19)
```

`usuarioAutenticadoOuErro` **lança** onde o middleware deveria ter redirecionado.

**Não é vazamento** — a RLS segura e as telas renderizam vazias. Mas quem cai nisso não é atacante: **é o dono com a sessão expirada**. Abrir `/ajustes` numa segunda-feira depois do token vencer entrega um shell com avatar falso "AT"; abrir `/ajustes/modelos` entrega um 500. É o caminho comum, não o exótico.

**Correção:** acrescentar `/perfil` e `/ajustes` a `PREFIXOS_PRIVADOS`. Uma linha.

## A05 — `--lastro-txt-3` reprova AA nas superfícies do Apex Pro · **ALTA**

Fórmula WCAG sobre as cores computadas no navegador. Aferição do método confirmada (`#FFF/#000 = 21.00`).

| Par | Medido | Piso |
|---|---|---|
| `--lastro-txt-3` (#64748B) sobre `--lastro-sup-3` (#1B222C) | **3.36** | 4.5 ❌ |
| sobre `--lastro-sup-1` (#0E1218) | **3.95** | 4.5 ❌ |
| sobre `--lastro-fundo` (#07090D) | **4.19** | 4.5 ❌ |

**Confirmado ao vivo, por tela:**

| Tela | Elementos reprovando | Exemplos |
|---|---|---|
| `/catalogo` | **104** | "Sem dica registrada" ×102 (3.95), aviso de curadoria (4.19) |
| `/` | **14** | SEG…DOM e 17…23 do rastreador (3.95), "Volume acumulado na semana" |
| `/login` | 1 | divisor "OU" (3.95) |
| `/analise` | 1 | rótulo "ANÁLISE SEMANAL" (4.19) |

`--lastro-txt-3` é `color:` em **40 seletores** de `sistema.css`. Duas ressalvas antes de tratar todos igual: `.evidencia__de` / `.evidencia__seta` (`sistema.css:1449-1450`) são 19px **sem `font-weight` declarado** — se o peso herdado for ≥700 o piso cai para 3.0 e passam. Mesma checagem para `.marca--aquecimento` (`sistema.css:766`). Não medidos: dependem de tela com dado.

## A06 — `DESIGN.md` certifica contraste com número de outra paleta · **ALTA**

A tabela §3.2 foi calculada contra a paleta areia (`#F0EAE0` / `#FBF8F3`), substituída em `8d30cf0`. O item **C3** declara `--lastro-txt-3` sobre `--lastro-sup-3` = **4.85, aprovado**. O valor real é **3.36**.

O gate de contraste está aprovando com medida de uma paleta que não existe mais. Mesmo problema em **D1–D10** do `DECISIONS.md` (2026-08-15) e no banner **▶ PONTO DE RETOMADA** (`PROGRESS.md:246`, pré-pivô, apontando `docs/BACKLOG-REDESENHO.md` como "o trabalho seguinte").

## A07 — Alvos de toque abaixo do próprio token · **MÉDIA**

`--lastro-alvo-min` vale **48px** em `tokens.css`. Medido:

| Tela | Alvo | Altura |
|---|---|---|
| `/` | "Ver Todos" | **20px** |
| `/` | abas Volume / Cargas / Séries | 38px |
| `/catalogo` | os 11 chips de filtro | 34px |
| `/coach` `/ajustes/*` | "Voltar" | 36×36 |
| `/ajustes/*` | avatar do topo | 36×36 |
| `/login` | "Cadastre-se" | 36px |

## A08 — Erro de cadastro volta cru, em inglês · **MÉDIA**

```
Email address "qa-audit-2608@teste.lastro.invalid" is invalid
```

App 100% PT-BR exibindo texto do provedor, com aspas e sintaxe da API. Sem tradução nem normalização do erro do `signUp`.

## A09 — Sucesso do cadastro usa estilo de erro · **MÉDIA**

"Conta criada — confirme seu e-mail antes de entrar." é **sucesso**, renderizado no mesmo alerta vermelho de "E-mail ou senha inválidos". Quem cadastra lê como falha.

## A10 — "Inicie sua primeira sessão abaixo" · **BAIXA**

Em `/treino`, o estado vazio manda iniciar a sessão **abaixo** — o botão "Iniciar treino de hoje" está **acima**. Há também moldura dentro de moldura (card obsidian + borda tracejada), contra a regra de que só recebe moldura o que responde ao toque.

## A11 — Descrição acima do título que descreve · **BAIXA**

`/ajustes/modelos`: o parágrafo "Listas de exercícios pra reaproveitar…" está em `top: 72`; o `<h2>` "Modelos" em `top: 132`. A descrição vem **60px antes** do título.

## A12 — Estado vazio da análise mistura 2 e 3 semanas · **BAIXA**

"Ainda não há pelo menos **2** semanas … Você tem **0** semanas fechadas. São necessárias **3** para calcular a análise semanal."

Tecnicamente correto (2 = gráfico, 3 = parecer), mas lê como contradição numa frase só. `analise-interativa.tsx:117-128`.

---

## Verificado e aprovado

| Item | Resultado |
|---|---|
| Overflow horizontal em 360px | **Zero em todas as telas** |
| Elementos estourando a viewport | Nenhum |
| Foco por teclado (Tab real, `:focus-visible`) | Outline dourado 2px, ordem correta |
| Console | 0 erros, 0 warnings (fora o 500 de A04) |
| Middleware nas 4 rotas listadas | Redireciona com `?proximo=` correto |
| `RastreadorDisciplina` | Marca os dias com dado real |
| `/ajustes/anilhas` | Grade sem recipiente (M3) íntegra |

### Falsos positivos descartados — verificados antes de reportar

1. **Foco invisível em "Cadastre-se"** — artefato de `element.focus()` programático, que não dispara `:focus-visible`. Reteste com `Tab` real mostrou o outline.
2. **"Solicitar Análise" com `aria-disabled` mas clicável** — decisão deliberada e documentada (B1, 2026-08-13): `aria-disabled` em vez de `disabled` para não sair da ordem de tabulação. O handler guarda com `perguntarSeAtivo`.
3. **"Assistente de Treino 24h" seria promessa inventada** — "coach 24h" vem do `PRD.md` §4.4. Nome oficial do produto.

---

## Não coberto

- Telas **com dados** — o usuário de teste não tem treino. Desalinhamento com número de 4+ dígitos e nome longo de exercício (o bug histórico de M5/M8) **não foi exercitado**.
- `/treino/[id]`, `/catalogo/[id]`, `/ajustes/modelos/novo`, folhas de `@modal`.
- Offline / fila Dexie (REG-20, D6).
- Reverificação dos 4 bugs da Fase 4.

## Como corrigir A00 — é decisão, não conserto

Tirar os gráficos falsos remove a peça visual central da Home. Três caminhos:

| Opção | Custo | Viável? |
|---|---|---|
| **Reverter para as métricas honestas de texto** (`8d30cf0~1:src/app/page.tsx:111-131`) | 1 PR pequena | ✅ |
| Construir gráfico real a partir de `resumo` | Alto — exige série temporal que o `resumo` não tem | — |
| Reusar `GraficoProgressao` | — | ❌ **descartado por verificação**: ele busca os próprios dados (progressão multi-semana por exercício); `resumo-home.ts:26-32` só expõe 4 escalares da semana corrente |

**Recomendado:** reverter agora para as métricas honestas e registrar "gráfico real na Home" como item adiado, com gate próprio. Gráfico de verdade precisa de dado e do olho do dono — e isso não deve travar a remoção de dado fabricado da porta de entrada da peça-assinatura.

## Limpeza de fixture

| Usuário | Estado |
|---|---|
| `qa.audit.2608@gmail.com` | removido nesta sessão |
| `qa-audit-2608@teste.lastro.invalid` | **mantido vivo de propósito** — necessário para a passagem com dados semeados, que é a parte da auditoria ainda não feita. Remover com `limpar-usuario` quando ela fechar, confirmando cascade = 0 |
