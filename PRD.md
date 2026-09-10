# PRD.md — `lastro`

> **Contrato de produto.** Congela após aprovação do dono. Mudança depois disso = **Scope Change registrado em `DECISIONS.md`**, no formato que as entradas de lá já seguem: o que mudou · por quê · alternativa descartada · classificação · impacto · como reverter.
>
> *(Até 2026-09-10 esta linha apontava para `.claude/skills/padrao-documentos/SKILL.md`, que nunca existiu neste repositório — as skills presentes são `portao-visual/`, `projeto-retomada/` e `qa-registro/`. O protocolo real sempre foi o formato do próprio `DECISIONS.md`; o ponteiro só nomeava um arquivo que não estava lá.)*
>
> **Status: APROVADO pelo dono em 2026-08-04.** Congelado. Mudança daqui em diante = Scope Change registrado em `DECISIONS.md`.

---

## 1. O que é

Um app de treino **pessoal** que registra cada série executada e, uma vez por semana, entrega um **parecer em português sobre o que aqueles números significam** — usando IA sobre métricas já calculadas.

**Tese em uma frase:** o log e o gráfico são infraestrutura; o produto é a leitura.

**Posicionamento (âncora de toda decisão):** ferramenta séria de dados para uma pessoa que treina sozinho e quer saber se está progredindo de verdade. Não é app social, não é rede de fitness, não é plataforma.

**Nota — "pessoal" é alvo de design, não trava técnica (correção documental, 2026-09-03).** Entre 2026-08 e 2026-09, 6 pessoas (amigos/família do dono) criaram a própria conta e usaram o app sem qualquer convite, tela ou recurso multiusuário construído para isso — a autenticação (Supabase Auth + RLS por usuário, ADR-002) sempre suportou múltiplas contas isoladas; nada foi desenhado para impedir. O documento dizia algo que não era verdade sobre o uso real. **O que não muda:** a persona única do §2, a proibição de decidir por "outros usuários poderiam querer", e o veto a feed/seguir/comparar/ranking/perfil público — a arquitetura permanece single-user por design, e essas contas não trocam dado nem se veem entre si. Detalhe em `DECISIONS.md` 2026-09-03.

**Anti-referência:** apps que entregam o gráfico bonito e param ali, deixando a interpretação por conta de quem não sabe interpretar.

---

## 2. Persona (uma, e só uma)

**O dono.** Treina sozinho, sem personal. Usa o celular **dentro da academia, entre séries, com o sinal ruim do subsolo**. Quer três coisas, nesta ordem de importância:

1. Saber se está progredindo — e onde não está.
2. Anotar a série sem atrapalhar o treino.
3. Tirar dúvida de execução sem se machucar.

**Não existe segunda persona.** Nenhuma decisão deste produto se justifica por "outros usuários poderiam querer". Isso não é limitação: é o que permite profundidade. (Sobre outras contas reais existirem sem essa persona mudar: nota em §1.)

**Exceção única e declarada — §11 (2026-09-03).** O modo Personal adiciona um papel (o personal do aluno) sem revogar nada desta seção: o veto a decidir por "outros usuários poderiam querer" continua valendo para todo o resto deste documento. A exceção mora inteira no §11, de propósito — não leia esta seção sem ler aquela.

---

## 3. Peça-assinatura: a Análise Semanal

**A 1 coisa pela qual o projeto existe.** É o que `PROGRESS.md` valida **primeiro**, como fatia vertical de ponta a ponta — antes de qualquer polimento de UI, antes do catálogo completo de exercícios, antes do coach 24h.

**A fatia vertical mínima:** registrar séries reais → agregador calcula → botão Análise → escolher pergunta → ler um parecer que cita **os números do dono**.

**Regra inegociável de arquitetura:** o LLM **nunca** recebe linhas cruas de série. Recebe um resumo já calculado por código determinístico e testado. Se o modelo tiver que fazer conta, ele erra a conta, e um parecer confiante com número errado é pior que nenhum parecer.

**As cinco perguntas padrão:**

| # | Pergunta | Do que o parecer se alimenta |
|---|---|---|
| 1 | Estou progredindo? | Tendência de e1RM e volume nas últimas 4 semanas |
| 2 | Onde eu empaquei? | Exercícios sem melhora de e1RM nem volume por N semanas |
| 3 | Meu volume está equilibrado? | Séries valendo por grupo muscular vs faixa de referência |
| 4 | Estou treinando demais ou de menos? | Frequência e volume semanal vs semanas anteriores |
| 5 | O que mudar na próxima semana? | Tudo acima, com recomendação acionável |

**Critério de qualidade que separa isto de conselho genérico:** o parecer precisa **citar exercício e número específicos do dono**. "Aumente a carga progressivamente" é falha. "Seu supino está em 60kg há 5 semanas enquanto o agachamento subiu 12% no mesmo período" é o produto.

**Liberação semanal — RESOLVIDO (2026-08-05):** a semana fecha na segunda (segunda-feira a domingo, ISO-8601). O botão fica **sempre disponível**, sem bloqueio — clicar antes da semana fechar mostra a última semana ISO **completa**, nunca a que está em andamento. Risco aceito conscientemente: quem clicar logo depois de treinar pode não ver o treino do dia refletido ainda, porque a semana em andamento nunca entra na Análise (honestidade sobre dado parcial > sensação de resposta imediata). Decisão registrada em `DECISIONS.md`.

---

## 4. Escopo do MVP

**4.1 Registro de treino** — o que precisa ser rápido de fazer suado, com uma mão.
- Iniciar treino, escolher exercício do catálogo, registrar série (reps + peso), marcar como aquecimento ou valendo.
- Repetir a última série com um toque (a ação mais frequente do app).
- Funciona **offline**: grava local primeiro, sincroniza quando a rede volta.
- **Corrigir e apagar** (ADIÇÃO de escopo, 2026-08-06 — ver DECISIONS.md): registrar sem poder corrigir depois não é MVP, é armadilha — um peso digitado errado fica contaminando a Análise Semanal até alguém reparar. Por isso:
  - **Editar uma série** (tipo, reps, peso, RIR, peso corporal). O exercício não é editável — trocar a que exercício uma série pertence é outra operação. Mesma fila offline da criação (D6): é a mesma cena, corrigir o erro no meio do treino, sem sinal.
  - **Excluir uma série.** Mesma fila offline, pelo mesmo motivo.
  - **Excluir um treino inteiro** (a partir da lista de treinos). Leva as séries dele junto (`on delete cascade`). É ação **online-only**, deliberadamente fora da fila offline: normalmente feita revendo o histórico com calma, não no meio do treino.
  - Toda exclusão pede **confirmação inline explícita** — nunca `window.confirm()` do navegador, que no celular é um alerta de sistema fácil de tocar sem ler.

**4.2 Registro e gráfico**
- Histórico de treinos.
- Por exercício: evolução de e1RM e de volume no tempo.
- Volume semanal por grupo muscular.

**4.3 Análise Semanal** — seção 3.

**4.4 Coach 24h** — chat de dúvidas sobre treino, alimentado pela mesma chave. **Não improvisa técnica de movimento** (seção 4.5).

**4.5 Demonstração de execução** — catálogo de 102 exercícios em PT-BR real, cada um com dica de execução, animação do movimento e dados de biomecânica (músculo alvo, sinergistas, mecânica articular).

> **Emendado em 2026-09-10, por decisão do dono.** Este parágrafo exigia duas coisas que o app deixou de fazer, e o documento foi alinhado à realidade em vez de ficar mentindo:
>
> · *"dicas escritas e revisadas"* e *"**não é conteúdo gerado por IA** — é assunto de saúde, cai no E3"*. As 102 dicas foram escritas por LLM em 2026-09-09, com a `FF7`/`ADR-007` revogada explicitamente pelo dono. A origem fica registrada em `exercicio.dica_execucao_origem` e vira `'humano'` quando alguém revisar.
> · *"mais aviso de que não substitui acompanhamento profissional"*. O aviso foi removido da tela em 2026-09-10, também a pedido do dono, junto com a declaração de procedência de IA.
>
> Ver `DECISIONS.md` 2026-09-09 (2) e 2026-09-10. A restrição foi apresentada com a citação da ADR antes de cada remoção; as duas decisões são dele, tomadas com a informação na mão.

**4.6 Conta e login** — criar conta com e-mail ou entrar com Google. Serve para backup e para usar no celular e no PC.

---

## 5. Escopo NEGATIVO (explícito — não entra, e não é esquecimento)

- ❌ Qualquer coisa social: feed, seguir, comparar, ranking. ~~compartilhar~~ → **REVISTO em 2026-08-27, ver nota A abaixo.** Feed, seguir, comparar e ranking seguem **mortos** também sob o modo Personal — a única brecha é o chat 1:1 dentro de vínculo aceito, delimitada em §11.5.
- ❌ Planos e periodizações gerados automaticamente. O app **analisa** o que foi feito; não prescreve programa.
- ❌ Integração com relógio, balança, wearable, Health/Google Fit.
- ❌ Contagem de calorias, macros, dieta.
- ❌ Múltiplos usuários, planos pagos, onboarding para estranhos, tela de billing, limite de uso. → **PARCIALMENTE REVISTO em 2026-09-03 pelo §11.** O vínculo aluno↔personal reabre "múltiplos usuários" de forma restrita (convite aceito, 1:1, revogável). **Planos pagos, tela de billing e limite de uso continuam fora** — a monetização é motivação declarada do §11, não escopo aprovado, e entra por Scope Change próprio quando for a hora.
- ❌ Catálogo gigante de exercícios. ~100 curados vencem 1500 auto-traduzidos.
- ❌ App nativo em loja.
- ~~❌ Cronômetro de descanso~~ → **REVISTO em 2026-08-27, ver nota B.** · ❌ vídeo próprio, importação de outros apps — **na v1**. Nenhum está descartado para sempre; estão fora do MVP.

**Nota A — exportar imagem do treino ENTRA; rede social continua fora (Scope Change, ADIÇÃO, 2026-08-27).** O dono aprovou o relatório pós-treino com botão de compartilhar (Instagram Story · copiar · salvar · folha nativa). O que entra é **exportação de uma imagem gerada no próprio aparelho**: PNG desenhado em `<canvas>` no cliente, entregue via clipboard, download ou `navigator.share`. **Nada sai do aparelho sem o dono mandar, não há servidor envolvido, nem feed, nem seguir, nem comparar, nem perfil público.** O que o §5 proíbe — o app virar rede social — segue valendo integralmente: a linha acima passa a ler "sem feed, seguir, comparar ou ranking". Exportar o próprio dado não é socializar; é a mesma natureza de salvar um print. Registrado em `DECISIONS.md` 2026-08-27.

**Nota B — cronômetro de descanso ENTRA (Scope Change, ADIÇÃO, 2026-08-27).** Estava fora "na v1", com a ressalva explícita de que não era descarte definitivo. Foi construído, o dono dirigiu o desenho pessoalmente e pediu o merge. É **manual** (disparado por toque), não automático — o "cronômetro de descanso **automático**" registrado como não aprovado em `DECISIONS.md` 2026-08-13 continua fora. Registrado em `DECISIONS.md` 2026-08-27.

---

## 6. Jornadas

**J1 — Treino (a jornada que precisa ser perfeita).** Chega na academia → abre o app pelo ícone da tela inicial → inicia treino → escolhe supino → registra 3 séries valendo → **o elevador do prédio derruba o sinal** → continua registrando normalmente → sai da academia → o treino aparece sincronizado no PC.

**J2 — Análise (a jornada que justifica o projeto).** Domingo à noite → abre o app → botão Análise disponível → escolhe "Onde eu empaquei?" → recebe um parecer citando exercícios e números reais dele.

**J3 — Dúvida.** No meio do treino → não lembra a execução do remada curvada → abre o exercício → lê as dicas curadas → se a dúvida persiste, pergunta ao coach.

---

## 7. Critérios de aceitação verificáveis

*Verificável = existe um comando, teste ou observação que dá um sim/não. Sem "deve ser rápido" ou "deve ser intuitivo".*

| # | Critério | Como se verifica |
|---|---|---|
| A1 | Registrar uma série com o celular em modo avião salva o dado; ao voltar a rede, ele aparece no servidor sem ação do usuário | Modo avião no celular real, registrar 3 séries, reativar rede, recarregar no PC e conferir as 3 |
| A2 | Séries de aquecimento não entram em volume, e1RM nem contagem de séries | Teste unitário do agregador com fixture contendo aquecimento + valendo |
| A3 | O agregador calcula volume e e1RM corretamente | Teste unitário com valores conferidos à mão |
| A4 | Nenhum módulo do cliente importa o cliente da Gemini | Fitness function: busca por import no bundle do cliente |
| A5 | A chave da Gemini não aparece no bundle do cliente | Build **com a chave presente no ambiente** (build sem chave passa vazio e não prova nada), depois buscar a string da chave em `.next/` — Next.js App Router builda em `.next/`, não em `dist/` |
| A6 | Um parecer da Análise cita ao menos um nome de exercício e um número reais do dono | Leitura humana de 3 pareceres gerados sobre dados reais |
| A7 | O agregador não faz chamada de rede | Fitness function: sem import de `fetch`/cliente HTTP no módulo |
| A8 | Login com Google funciona em celular e PC, e o mesmo treino aparece nos dois | Teste manual nos dois dispositivos |
| A9 | Todo exercício do catálogo tem nome em PT-BR de academia e dica de execução revisada | Revisão do seed, contagem de campos vazios = 0 |
| A10 | O gate visual passa em viewport mobile real, com contraste AA **medido** e foco visível | Navegador real no celular + medição de contraste |
| A11 | Editar peso/reps de uma série muda o que a Análise Semanal calcula para ela | Editar uma série já usada num teste do agregador, recalcular, conferir que o número mudou |
| A12 | Excluir um treino leva as séries dele junto, e não aparece mais na lista nem entra em cálculo nenhum | Excluir um treino com séries, conferir que `select` por `treino_id` não retorna nada |
| A13 | Nenhuma exclusão acontece sem uma segunda confirmação explícita na tela | Tocar excluir uma vez não apaga nada; só o segundo toque, no botão de confirmação, apaga |
| A14 | **Revisto em 2026-08-27 (ADR-010).** Um treino salvo em `/ajustes` pode guardar reps/peso por exercício, e `src/lib/analise/` continua sem lê-lo; iniciar um treino sem escolher nenhum treino salvo funciona exatamente como hoje | Rodar `src/lib/analise/sem-modelo-treino.test.ts` (varre os arquivos do agregador atrás de referência a `modelo_treino`); criar um treino salvo, iniciar um treino "novo" sem selecioná-lo, e conferir que o fluxo de registro é idêntico ao anterior a esta feature — sem `+` preenchido, com liberdade total |

---

## 8. Benchmark nomeado

- **Registro de treino:** **Hevy.** É a régua — log rápido, repetir série num toque, gráficos limpos. Não precisa ser superado; precisa ser igualado no essencial e nunca ser pior no fluxo de registrar série.
- **Leitura dos dados:** **não há benchmark bom.** É exatamente o buraco que justifica o projeto. A régua aqui é interna: um parecer precisa passar no teste de A6 — se pudesse ter sido escrito sem olhar os dados do dono, falhou.

---

## 9. Decisões resolvidas no portão de aprovação (2026-08-04)

**Sem tela de configuração de rotina — decisão original de 2026-08-04, revista e ampliada em 2026-08-13 (ver abaixo).** O dono anota o que treinou; a Análise **deriva o padrão real dos dados registrados** em vez de comparar com uma divisão declarada. Consequência: a pergunta "meu volume está equilibrado?" não compara com um plano — ela detecta o padrão efetivo e aponta grupos musculares negligenciados. Isso mede o que foi feito, não o que foi prometido. **Esta consequência continua valendo integralmente após a revisão abaixo:** nenhuma métrica da Análise Semanal passa a ler treino salvo — o "porquê" de 2026-08-04 segue sendo o motivo pelo qual a Análise não muda.

**Revisão de 2026-08-13 — tela de Configuração de Treinos aprovada, com limites explícitos (Scope Change, ADIÇÃO — ver `DECISIONS.md` "2026-08-13 (2)" e "2026-08-13 (3)").** O dono pediu, e aprovou com estes limites de próprio punho, uma tela em **`/ajustes`** (Configurações) onde é possível pré-cadastrar treinos com antecedência:

- ~~A pré-configuração é **só a lista de exercícios** — **nunca série, peso ou reps**.~~ → **REVISTO em 2026-08-27, ver nota C abaixo.**
- É **opcional**. "Treino novo" continua existindo e é o caminho padrão para quem não montou nada — não é substituído, é complementado.
- A tela mora em **`/ajustes`**, não em rota nova solta na navegação principal.
- No dia do treino, a pessoa escolhe entre o(s) treino(s) já montado(s) (pré-popula os exercícios a registrar) ou começar do zero (fluxo atual, inalterado).

**Nota C — o modelo passa a guardar reps/peso (Scope Change, 2026-08-27; ver `ADR-010`).** O dono pediu que, ao montar um modelo, já se cadastre quantas repetições e qual carga ele costuma fazer, para que tocar no `+` de um exercício durante o treino abra o formulário já preenchido. Perguntado de onde deveria vir o número — histórico real ou cadastrado no modelo — escolheu **cadastrado no modelo**, e acrescentou que ajustar carga/reps durante o treino deve gravar de volta nele.

Quatro limites, todos em `ADR-010`: colunas **nullable** (modelo sem valor cai no histórico real, nada é inventado); `grant update` **por coluna**, só em `reps`/`peso` (reordenar segue impossível pelo banco); write-back **só pelo caminho do `+`**, não em toda alteração de carga; e o write-back **nunca bloqueia o registro da série** (D6 continua acima disso).

**O que NÃO muda:** `src/lib/analise/` continua sem enxergar `modelo_treino`, em nenhuma forma. É essa barreira — não a ausência de colunas — que impede a Análise de comparar executado contra planejado, que era a razão de 2026-08-04. Ela agora tem teste: `src/lib/analise/sem-modelo-treino.test.ts`.

Isto reabre conscientemente o "Sem tela de configuração de rotina" acima e o ADR-008 (que descartava por nome o "Configurador de divisão") — é reversão **aprovada e registrada**, não silenciosa. O limite que evita cruzar para o escopo negativo do §5 ("não prescreve programa") é o mesmo que o dono impôs sozinho: sem série/peso/reps na pré-configuração, e a Análise Semanal segue derivando o padrão dos dados reais, nunca do treino salvo.

**RIR entra na UI.** Campo opcional por série valendo. Habilita a métrica de **série difícil**, definida em `KNOWLEDGE.md` §1 — **fonte única, não repetir o limiar aqui.** Mede estímulo real melhor que volume bruto.

## 10. TODOs — dados que faltam e não podem ser inventados

- **TODO** — Faixa de referência de séries semanais por grupo muscular, com **fonte primária consultada**. Assunto de saúde: não usar número de memória. → tarefa de pesquisa no `PROGRESS.md`.
- **TODO** — `N` semanas que caracterizam estagnação. Mesma tarefa de pesquisa.
- ~~TODO — Regra de liberação semanal do botão Análise~~ **RESOLVIDO (2026-08-05).** Botão sempre disponível, sem bloqueio até a semana ISO fechar — ver §3 e `DECISIONS.md` "Tarefa 1.0d".
- ~~TODO — Quota real da Gemini~~ **RESOLVIDO (2026-08-05), medido em uso real.** 20 requisições/dia no free tier de `gemini-3.6-flash` — ver `KNOWLEDGE.md` §3.2 e `DECISIONS.md` "Quota da Gemini medida".

---

## 11. O modo Personal — exceção declarada à persona única

> **ADIÇÃO ao PRD congelado, 2026-09-03.** Scope Change aprovado pelo dono e registrado em `DECISIONS.md` (entrada "2026-09-03 (2) — Scope Change: módulo Personal"). **Decidido, não validado no mercado** — ver §11.6, o portão que precede qualquer código.
>
> Esta seção existe **separada** de propósito. O §2 diz "não existe segunda persona" e o veto que vem junto ("nenhuma decisão se justifica por 'outros usuários poderiam querer'") é estrutural: sustenta decisões espalhadas por todo este documento. Emendar o §2 para acomodar isto desarmaria o veto em silêncio, em todo lugar, sem ninguém ter decidido isso. A exceção fica declarada aqui, com fronteira explícita.

### 11.1 O que muda, em uma frase

Uma conta pode estar **vinculada a um personal**. Enquanto o vínculo existe, a **prescrição** sai do produto e vai para o humano; o **diagnóstico** continua inteiro com o aluno.

### 11.2 O corte exato

| | Aluno sem vínculo | Aluno vinculado |
|---|---|---|
| Registro, histórico, editar/excluir série (§4.1) | mantém | **mantém** |
| Gráficos: e1RM, volume, volume por grupo muscular (§4.2) | mantém | **mantém** |
| Sinais de diagnóstico: empaque, grupo sem estímulo, queda de frequência (§3, perguntas 1–4) | mantém | **mantém** |
| Coach 24h (§4.4) | mantém | **mantém, com trava** — §11.4 |
| Demonstração de execução (§4.5) | mantém | **mantém** |
| **Prescrição — "o que mudar na próxima semana" (§3, pergunta 5)** | mantém | **não vê** — vai para o personal |
| **Alerta dos sinais de diagnóstico** | — | **roteado ao personal**, em chat 1:1 com o aluno |

**O aluno vinculado não perde diagnóstico nenhum.** Perde a prescrição — que é exatamente o que ele contratou um humano para fazer.

### 11.3 Por que esta linha, e não outra

O §5 deste documento já dizia: *"O app **analisa** o que foi feito; não prescreve programa."* A pergunta 5 do §3 sempre esteve em tensão com essa frase — na prática, ela prescreve. Sob vínculo, quem prescreve é o profissional contratado para isso, e o produto fica **mais** consistente com o §5, não menos.

Por isso esta seção não é uma segunda persona no sentido que o §2 veta. O §2 proíbe justificar decisão por *"outros usuários poderiam querer"* — decisão especulativa, sobre gente hipotética. Aqui não se está adicionando nada ao produto por hipótese: está se decidindo **quem ocupa o papel de prescritor** quando esse papel já é ocupado por um humano na vida real do aluno. **O veto do §2 continua valendo integralmente para todo o resto do documento.**

### 11.4 Restrições inegociáveis desta seção

Quatro, e nenhuma é detalhe de implementação — cada uma pode invalidar a decisão se ficar em aberto.

1. **O Coach 24h precisa de trava sob vínculo.** Fechar a prescrição e deixar o chat de IA aberto no mesmo app não fecha nada: o aluno pergunta *"o que eu mudo essa semana?"* e o Coach responde. Sob vínculo, o Coach responde dúvida de execução e conceito (§4.4/§4.5) e **não** monta a próxima semana — encaminha o pedido ao personal. Sem essa trava, esta seção inteira é decorativa.
2. **O lugar da prescrição não pode ficar vazio.** Se a seção simplesmente sumir, lê como app quebrado. Precisa de estado próprio, que comunique que aquele espaço é do personal — ausência não é resposta. **Gate visual** (`AGENTS.md`), não implementação silenciosa.
3. **Consentimento é do aluno, sempre, e é revogável.** O personal **convida**, o aluno **aceita**, o aluno **revoga** quando quiser, com corte imediato de acesso. Nunca por ação unilateral do personal — cadastrar o e-mail de alguém não concede acesso a nada. Isto é LGPD e é decisão de **schema**, não tela de cobrança: vínculo permanente e concessão revogável/auditável são coisas diferentes no banco. Quando o vínculo termina, a prescrição volta para o aluno.
4. **O gatilho do alerta é determinístico.** Mesma regra inegociável do §3: o sinal sai do código de métricas já calculado e testado — nunca de a IA "achar" que algo está errado. O alerta **roteia** um sinal que já existe; não cria julgamento novo. O LLM segue sem ver linha crua de série.

### 11.5 A fronteira com o escopo negativo (§5)

O chat personal↔aluno é o **primeiro canal pessoa-a-pessoa** deste produto. Não fere o §5 ao pé da letra — não é feed, seguir, comparar nem ranking —, mas é a primeira vez que duas contas se falam num app cuja identidade declarada é "não é rede social". A exceção é **delimitada e fechada**:

- ✅ Canal **1:1**, apenas dentro de vínculo aceito e vigente.
- ❌ Sem descoberta de perfil. Sem visibilidade entre alunos do mesmo personal. **Sem grupo.**
- ❌ **Feed, seguir, comparar, ranking e perfil público continuam mortos**, com ou sem vínculo.

Isto está escrito porque, se ficasse implícito, "grupo de alunos" apareceria como extensão natural e o veto do §5 teria sido desarmado sem ninguém decidir.

### 11.6 Portão — o que precede qualquer código

Esta seção está **aprovada como decisão e bloqueada como implementação**. Duas condições, ambas em aberto:

1. **Ter um parecer bom de verdade para mostrar.** Mostrar um fallback determinístico subvende o produto.
2. **Conversar com 2–3 personal trainers reais.** Três perguntas de resposta falsificável:
   - *"O que você faz hoje quando um aluno pergunta se está progredindo?"*
   - *"Se eu te avisar toda segunda que o peito do seu aluno está sem estímulo há 3 semanas, você abre e fala com ele, ou vira mais uma notificação que você ignora?"*
   - *"Quantos alunos você tem, e quantos você perdeu nos últimos 6 meses?"*

A segunda é a que decide se isto tem produto. **O risco central do desenho é o personal virar gargalo obrigatório:** sem vínculo, o diagnóstico chega sozinho; com vínculo, a continuidade do aluno passa a depender da disciplina de outra pessoa.

**A primeira coisa a construir, quando o portão abrir,** não é login com dois modos, nem aba de alunos, nem cobrança: é **um personal receber um alerta real sobre um aluno real e responder ao aluno por ali**. Convite, aceite, revogação, um sinal roteado, uma mensagem. Esconder a prescrição é barato; o alerta e o chat são a parte cara e incerta, e são o que precisa ser testado primeiro.
