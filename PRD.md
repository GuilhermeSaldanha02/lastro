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

- ❌ Qualquer coisa social: feed, seguir, comparar, ranking. ~~compartilhar~~ → **REVISTO em 2026-08-27, ver nota A abaixo.** Feed, seguir, comparar, ranking **e chat** seguem **mortos** também sob o modo Personal — **sem brecha nenhuma.** ~~a única brecha é o chat 1:1 dentro de vínculo aceito, delimitada em §11.5~~ → **CORRIGIDO em 2026-09-11.** Esta linha passou um dia contradizendo a própria §11.5: a §11.5 foi reescrita em 10/set justamente para registrar que a exceção **deixou de existir** (a ação de um clique sai para o WhatsApp, §11.7), e esta continuava anunciando uma brecha que o documento já havia fechado. O que o vínculo concede é **leitura consentida**, e só.
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

> **ADIÇÃO ao PRD congelado, 2026-09-03. REVISADA em 2026-09-10 pelas entrevistas com dois personais** — Scope Change em `DECISIONS.md` "2026-09-10 (6)". A dor foi **confirmada**; o desenho do alerta foi **refutado e reescrito**. O que mudou está marcado em cada subseção. Implementação segue bloqueada — §11.6.
>
> Esta seção existe **separada** de propósito. O §2 diz "não existe segunda persona" e o veto que vem junto ("nenhuma decisão se justifica por 'outros usuários poderiam querer'") é estrutural: sustenta decisões espalhadas por todo este documento. Emendar o §2 para acomodar isto desarmaria o veto em silêncio, em todo lugar, sem ninguém ter decidido isso. A exceção fica declarada aqui, com fronteira explícita.

### 11.1 O que muda, em uma frase

Uma conta pode estar **vinculada a um personal**. Enquanto o vínculo existe, a **prescrição** sai do produto e vai para o humano; o **diagnóstico** continua inteiro com o aluno.

> **EMENDA em 2026-09-11 (2) — existe CONTA de personal. Decisão do dono.**
>
> A frase acima e a §11.4 inteira foram escritas sobre uma premissa: *"não existe conta de personal; o vínculo é o papel"*. **O dono decidiu o contrário**, e está escrito aqui porque contradição silenciosa entre código e PRD faz o próximo agente reverter para o desenho documentado.
>
> O que muda:
>
> 1. **A escolha acontece no cadastro**, não no uso. Duas contas na origem — `usuario.tipo_conta` é `aluno` ou `personal`.
> 2. **Conta de personal exige CREF.** É a credencial profissional (Resolução CONFEF 053/2003, formato `000000-G/UF`, categoria `G` graduado ou `P` provisionado, sufixo `-S` para registro secundário).
> 3. **A casca do app difere.** Conta de personal **não tem "iniciar treino"** — não é uma tela escondida, é ausência.
> 4. **Quem é personal e também treina usa DUAS contas.** Decidido pelo dono: conta de personal é de trabalho. O custo — trocar de conta para treinar — foi aceito com o trade-off na mão.
>
> **O que o app NÃO faz com o CREF, e precisa estar escrito.** Ele valida o formato e guarda; **não verifica se o registro existe**. Verificar exigiria consultar o CONFEF, que não expõe API pública. Toda tela que mostrar o CREF diz *"informado pelo profissional, não verificado pelo lastro"*. Exibir credencial não checada como se fosse checada seria o lastro emprestando confiança que ele não apurou — e um dia alguém escolheria um profissional com base nisso.
>
> **Consequência que não é óbvia:** `tipo_conta = 'personal'` com `cref` nulo é estado **legítimo**, não corrompido. O cadastro por Google não entrega CREF (nem telefone), e a decisão foi deixar entrar e **exigir a complementação antes de abrir a área de personal**. Por isso o banco não tem constraint "personal implica CREF": a regra é do app, no lugar onde a mensagem de erro é visível e acionável.
>
> **O que NÃO muda:** o §11.2 abaixo continua valendo inteiro para o lado do aluno — ele mantém tudo e perde só a prescrição sob vínculo. E o §5 segue sem exceção: nenhuma conta fala com outra dentro do lastro.

> **EMENDA em 2026-09-12 (2) — UMA conta, dois modos. Decisão do dono. Derruba o ponto 4 da emenda acima.**
>
> O ponto 4 (*"quem é personal e também treina usa DUAS contas"*) **não vale mais.** O dono pediu o estudo de como os apps da categoria resolvem isso antes de decidir, e decidiu depois de ver o resultado (`DECISIONS.md` "2026-09-12 (2)"). Os pontos 1, 2 e 3 continuam, com o ajuste abaixo.
>
> 1. **Toda conta treina.** A área de trabalho é uma capacidade que a conta GANHA ao informar o CREF — no cadastro (cápsula PERSONAL) ou depois, em Ajustes. Ninguém perde a própria tela de treino por virar personal.
> 2. **A conta com área de trabalho alterna entre dois modos:** `treino` (Início, Treinos, Análise) e `trabalho` (Fila, Alunos). O modo ativo decide a casca e é guardado no banco, não no navegador. O ponto 3 acima passa a ler: **o modo trabalho** não tem "iniciar treino".
> 3. **Ganhar a área de trabalho só acontece por uma porta**, a que valida o CREF. A própria conta não escreve `tipo_conta` nem `cref` por update direto — se escrevesse, a exigência do CREF seria decoração (achado da `j9`, 2026-09-12).
> 4. **Personal pode ter personal.** Quem treina alunos e também é acompanhado por outro profissional aceita convite normalmente, no modo treino. Continua impossível aceitar o próprio convite.
>
> **Por que a mudança agora, e não depois:** nenhum personal real existe ainda no lastro. Com contas duplas em uso, migrar para este modelo exigiria **juntar contas** — histórico, vínculos e alertas. Hoje custa código.

### 11.2 O corte exato

| | Aluno sem vínculo | Aluno vinculado |
|---|---|---|
| Registro, histórico, editar/excluir série (§4.1) | mantém | **mantém** |
| Gráficos: e1RM, volume, volume por grupo muscular (§4.2) | mantém | **mantém** |
| Sinais de diagnóstico: empaque, grupo sem estímulo, queda de frequência (§3, perguntas 1–4) | mantém | **mantém** |
| Coach 24h (§4.4) | mantém | **mantém, com trava** — §11.4 |
| Demonstração de execução (§4.5) | mantém | **mantém** |
| **Prescrição — "o que mudar na próxima semana" (§3, pergunta 5)** | mantém | **não vê** — vai para o personal |
| **Alerta dos sinais de diagnóstico** | — | **entra na fila de trabalho do personal** — §11.4.5 |

**O aluno vinculado não perde diagnóstico nenhum.** Perde a prescrição — que é exatamente o que ele contratou um humano para fazer.

> **Revisto em 2026-09-10.** Esta linha dizia *"roteado ao personal, em chat 1:1 com o aluno"*. Os dois personais entrevistados descreveram **exatamente esse formato** como o que ignoram: *"a chance de eu arrastar pra o lado no meio da correria é de 80%"* (P1) e *"depois de algumas semanas eu vou ignorar"* (P2). Alerta que **chega** compete com 500 notificações por dia. Alerta que **espera na fila** é lido no momento em que a pessoa já está decidindo.
>
> **Nota sobre a prescrição, para ninguém ler esta tabela com confiança maior que a evidência.** Nenhum dos dois personais pediu para ser dono da prescrição — os dois falaram em querer saber **com quem falar**. A transferência continua no contrato porque a lógica do §5 a sustenta ("o app analisa; não prescreve"), **não porque as entrevistas a confirmaram**. É a metade menos validada desta seção.

### 11.3 Por que esta linha, e não outra

O §5 deste documento já dizia: *"O app **analisa** o que foi feito; não prescreve programa."* A pergunta 5 do §3 sempre esteve em tensão com essa frase — na prática, ela prescreve. Sob vínculo, quem prescreve é o profissional contratado para isso, e o produto fica **mais** consistente com o §5, não menos.

Por isso esta seção não é uma segunda persona no sentido que o §2 veta. O §2 proíbe justificar decisão por *"outros usuários poderiam querer"* — decisão especulativa, sobre gente hipotética. Aqui não se está adicionando nada ao produto por hipótese: está se decidindo **quem ocupa o papel de prescritor** quando esse papel já é ocupado por um humano na vida real do aluno. **O veto do §2 continua valendo integralmente para todo o resto do documento.**

### 11.4 Restrições inegociáveis desta seção

**Sete desde 2026-09-10** (eram quatro; as três novas saíram direto das entrevistas). Nenhuma é detalhe de implementação — cada uma pode invalidar a decisão se ficar em aberto.

1. **O Coach 24h precisa de trava sob vínculo.** Fechar a prescrição e deixar o chat de IA aberto no mesmo app não fecha nada: o aluno pergunta *"o que eu mudo essa semana?"* e o Coach responde. Sob vínculo, o Coach responde dúvida de execução e conceito (§4.4/§4.5) e **não** monta a próxima semana — encaminha o pedido ao personal. Sem essa trava, esta seção inteira é decorativa.
2. **O lugar da prescrição não pode ficar vazio.** Se a seção simplesmente sumir, lê como app quebrado. Precisa de estado próprio, que comunique que aquele espaço é do personal — ausência não é resposta. **Gate visual** (`AGENTS.md`), não implementação silenciosa.
3. **Consentimento é do aluno, sempre, e é revogável.** O personal **convida**, o aluno **aceita**, o aluno **revoga** quando quiser, com corte imediato de acesso. Nunca por ação unilateral do personal — cadastrar o e-mail de alguém não concede acesso a nada. Isto é LGPD e é decisão de **schema**, não tela de cobrança: vínculo permanente e concessão revogável/auditável são coisas diferentes no banco. Quando o vínculo termina, a prescrição volta para o aluno.
4. **O gatilho do alerta é determinístico.** Mesma regra inegociável do §3: o sinal sai do código de métricas já calculado e testado — nunca de a IA "achar" que algo está errado. O alerta **roteia** um sinal que já existe; não cria julgamento novo. O LLM segue sem ver linha crua de série.
5. **O alerta ESPERA na fila; não chega como notificação.** O personal lê no momento em que já está decidindo — a segunda-feira de planejamento —, não no meio do salão entre dois atendimentos. P1: *"Se quando eu for montar ou revisar o treino da semana do aluno o sistema me der uma flag vermelha visual de prioridade com o resumo acionável, eu não só leio, como viro teu fã."* Push genérico é o modo de falha declarado, não uma variação aceitável.
6. **Seletividade é o produto, não um ajuste fino.** Se o alerta dispara para todo grupo muscular toda semana, ele morre — e leva o módulo junto. P2 nomeou o modo de morte com precisão: *"Peito: atenção / Bíceps: atenção / Costas: atenção / Tríceps: atenção — aí sim, vira notificação que eu começo a ignorar."* Consequências que isto impõe: o sinal precisa representar **tendência** (a régua citada foi 3 semanas), não oscilação de uma sessão; e precisa haver **teto de alertas por aluno por semana**, com priorização — mostrar o que mais importa, não tudo que é verdade.
7. **Cada alerta carrega uma AÇÃO de um clique.** Ler não é o objetivo; agir é. P1 desenhou a interface na própria resposta — `[Mandar mensagem padrão no WhatsApp]` ou `[Ajustar ficha de treino]` — e explicou o porquê: o valor *"não tá só em gerar o relatório do aluno — tá em economizar o cérebro do personal pra ele parecer um profissional extremamente atencioso sem gastar 20 minutos analisando planilha"*. **Relatório que exige leitura para achar o problema é o modo de falha.** O conteúdo do alerta segue a ordem que P2 pediu: *o que aconteceu → há quanto tempo → qual evidência → o que pode estar causando → o que investigar*.

### 11.5 A fronteira com o escopo negativo (§5) — SEM exceção

> **Resolvido em 2026-09-10 pela decisão da §11.7.** Esta subseção existia para delimitar uma exceção ao §5: o chat personal↔aluno seria o primeiro canal pessoa-a-pessoa do produto. **Com a ação saindo para o WhatsApp, esse canal não existe** — e a exceção deixou de ser necessária.

**O §5 continua valendo por inteiro, sem ressalva.** Nenhuma conta fala com outra dentro do lastro. Feed, seguir, comparar, ranking, perfil público e **chat** seguem mortos, com ou sem vínculo.

O que o vínculo concede é **leitura de dado consentida** (o personal vê os sinais do aluno) e **um botão que abre o WhatsApp do próprio personal** com a mensagem pronta. A conversa acontece onde ela já acontecia; o lastro não vira canal.

Isto fica escrito porque a tentação de "só um chatzinho 1:1" vai voltar — e, se voltar, é **Scope Change novo**, com o §5 sendo desarmado por decisão explícita, não por extensão natural de um botão.

### 11.6 Portão — CUMPRIDO em 2026-09-10, e o que ele revelou

As duas condições que bloqueavam esta seção **foram cumpridas**:

1. ~~**Ter um parecer bom de verdade para mostrar.**~~ **Feito** em 05/set — parecer de prosa real (`a7f5fe7c`), PDF redesenhado, proteções contra falha da IA.
2. ~~**Conversar com 2–3 personal trainers reais.**~~ **Feito** — dois responderam por escrito. Transcrição analisada em `DECISIONS.md` "2026-09-10 (6)".

**O que se aprendeu, em uma frase de cada um.** P1: *"personal não tem preguiça de cuidar do aluno; personal tem pouco tempo para processar excesso de dados em texto longo."* P2, que entregou o critério de sucesso do módulo: *"não é conseguir detectar um problema. É conseguir fazer o profissional querer abrir o problema."*

**O risco central mudou de lugar.** Era *"o personal vira gargalo obrigatório"*. Continua real, mas as entrevistas apontaram um risco anterior a ele: **o alerta nunca ser aberto.** Nenhum dos dois disse que ignoraria por não se importar — os dois disseram que ignorariam por **volume e formato**. É por isso que as restrições 5, 6 e 7 do §11.4 existem.

**O que as entrevistas NÃO estabeleceram, e precisa estar escrito para ninguém confundir dor reconhecida com mercado:**

- **Tamanho da dor em dinheiro.** A terceira pergunta do roteiro — *"quantos alunos você tem, e quantos perdeu nos últimos 6 meses?"* — **não foi respondida por nenhum dos dois**. Segue em aberto.
- **Disposição a pagar.** Não foi perguntada.
- **Comportamento.** Os dois responderam por escrito, com tempo para compor: é preferência declarada. O próprio P2 se protegeu — *"se for só mais uma notificação semanal, depois de algumas semanas eu vou ignorar."* A prova é ele abrir na **terceira** segunda-feira.
- **Representatividade.** n=2, ambos articulados o bastante para escrever respostas longas — provavelmente acima da mediana. A convergência entre eles é sinal forte; a amostra não sustenta generalização.

**O limite do produto, exposto pelas duas respostas.** Para julgar progresso eles usam técnica e amplitude, RPE, fita métrica, fotos em mesma iluminação, sono, disposição, composição corporal e força relativa. **O lastro tem carga, repetição, volume, frequência e RIR** — e não deve fingir que tem o resto. Ele responde a fatia que é cara de calcular na mão e onde a memória falha; foto e técnica o personal já resolve no olho. Prometer *"o app diz se o aluno está progredindo"* é prometer o que o dado não sustenta.

### 11.7 A ação de um clique termina no WhatsApp — DECIDIDO em 2026-09-10

**Decisão do dono**, tomada com pesquisa de concorrência na mão. Registro em `DECISIONS.md` "2026-09-10 (8)".

**O que se constrói:** o alerta traz um botão que abre o **WhatsApp do próprio personal**, com a mensagem já escrita e o aluno já selecionado. O personal lê, ajusta se quiser, e envia. Um link `wa.me` com texto pré-preenchido — **não** a API do WhatsApp Business.

**O que NÃO se constrói, e é a metade que importa:**

- **Nenhum canal pessoa-a-pessoa dentro do lastro.** O §11.5 deixou de precisar de exceção ao §5.
- **A API paga do WhatsApp Business.** Ela cobra por mensagem (R$ 0,21–0,35 no Brasil em 2026) e traz aprovação de template, número dedicado e responsabilidade de envio. Nada disso é necessário para um link.
- **Envio automático.** O lastro **compõe e entrega**; quem aperta enviar é a pessoa. Isso não é limitação técnica — é a regra: o app nunca fala com o aluno se passando pelo personal.

**Por que esta, e não o canal interno.** Chat interno **não é diferencial — é o padrão da categoria**. Trainerize tem o seu; a Vedius vende literalmente *"comunicação centralizada na plataforma"* contra *"comunicação desorganizada"*, que é o WhatsApp. Construir chat seria brigar de frente com o recurso mais maduro e mais investido dos concorrentes, sendo um dev solo — empatar onde eles são fortes, gastando o orçamento de construção que deveria ir para o **único lugar onde eles não estão: a leitura do dado**. A Vedius tem 12.000 vídeos de exercício; ninguém tem *"toda segunda eu te digo qual aluno ligar"*.

**A medida não se perde, ao contrário do que se temia.** O clique acontece **dentro do lastro** e é registrável. E a métrica que decide se o módulo funciona nunca foi "conversaram?" — é **"o grupo muscular alertado recebeu estímulo na semana seguinte?"**, e esse dado está no lastro de qualquer jeito, porque é o aluno que registra o treino. A conversa sair do produto custa muito menos do que a versão anterior desta seção supunha.

**O risco aceito, escrito para não ser esquecido.** WhatsApp é exatamente aquilo contra o que os concorrentes se posicionam, e um personal pode ler a escolha como "menos profissional". A mitigação é de enquadramento, não de feature: **o lastro não é onde se gerencia aluno** — é o que diz com quem falar e entrega a mensagem pronta. Se essa leitura se provar errada em uso real, a reversão está descrita no `DECISIONS.md`.

**Consequência de schema, não de tela:** o link precisa do telefone do aluno. É dado pessoal e cai na restrição §11.4.3 — **o número vem do aluno, com consentimento, e some quando ele revoga**. Nunca cadastrado pelo personal. Um personal digitar o número de alguém não concede acesso a nada.

> **EMENDA em 2026-09-11 — o que "some" significa.** Decisão do dono: o contato é **obrigatório no cadastro de toda conta**, tenha ela personal ou não. O número passa a ser dado do próprio usuário (`usuario.telefone_whatsapp`, migração 0022), e o que desaparece na revogação é o **ACESSO do personal a ele** — a policy `usuario_visivel_ao_personal` exige vínculo aceito, então revogar fecha a leitura no mesmo instante. Apagar o telefone do aluno porque ele demitiu o personal seria apagar dado dele, não proteger consentimento.
>
> A garantia continua sendo **por construção**, só que pela RLS em vez do `delete`: verificado no banco em 11/set — com vínculo aceito o personal lê nome e telefone; um segundo depois da revogação, a mesma consulta volta vazia.
>
> A coluna é **nullable no banco de propósito**, e isto não afrouxa a regra: `not null` abortaria a criação de conta por Google (que não entrega telefone), porque o trigger de perfil roda dentro do insert em `auth.users`. A obrigatoriedade é do app — cadastro por e-mail, aceite do convite e Ajustes.

**Ponto ainda não confirmado com a fonte.** "Mensagem padrão" é interpretação do que P1 escreveu (`[Mandar mensagem padrão no WhatsApp]`); ele não detalhou se imaginava link com texto pronto ou algo automático. A decisão assume a leitura conservadora — a que não envia nada sozinha. Vale confirmar com ele antes da primeira tela.

**A primeira coisa a construir** não é login com dois modos, nem aba de alunos, nem cobrança: é **um personal receber um alerta real sobre um aluno real e agir a partir dele.** Convite, aceite, revogação, um sinal priorizado, o botão. Esconder a prescrição é barato; o alerta que alguém **quer abrir** é a parte cara e incerta, e é o que precisa ser testado primeiro.
