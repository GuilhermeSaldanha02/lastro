# Matriz de linguagem

Esta matriz inventaria os caminhos normal e triste nas três línguas do app e registra se a informação explicativa aparece por `DicaInfo`.

## Estados permitidos

- `PENDENTE`: ainda não auditado.
- `PLANEJADO`: a cobertura foi desenhada, mas ainda não entrou num spec.
- `AUTOMATIZADO`: o cenário está no spec e foi listado localmente; aguarda a execução real do CI.
- `ALEGADO`: o implementador executou e anexou evidência; ainda aguarda auditoria independente.
- `PASSOU`: outro agente auditou em contexto limpo e confirmou a evidência.
- `REPROVOU`: a auditoria encontrou divergência; o caminho volta para correção e nova verificação.

O implementador só pode marcar um caminho como `ALEGADO` quando houver evidência. Apenas outro agente pode promover `ALEGADO` para `PASSOU`.

| ID | Modo | Superfície | Normal pt | Normal es | Normal en | Triste pt | Triste es | Triste en | DicaInfo | Check |
|---|---|---|---|---|---|---|---|---|---|---|
| LG-01 | aluno | `/` | ALEGADO (run 36078171673) | ALEGADO (run 36078171673) | ALEGADO (run 36078171673) | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j4 |
| LG-02 | aluno | `/treino` | PENDENTE | PENDENTE | PENDENTE | ALEGADO (run 36078171673) | ALEGADO (run 36078171673) | ALEGADO (run 36078171673) | AUDITAR | j4/j10 |
| LG-03 | aluno | `/treino/[id]` | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | PENDENTE | AUDITAR | j4/j10 |
| LG-04 | ambos | `/catalogo` e `/catalogo/[id]` | PENDENTE | PENDENTE | PENDENTE² (achado A1) | PENDENTE | PENDENTE | ALEGADO² (404 por id inválido, sem leak) | AUDITAR (ok) | j4/j11/j12 |
| LG-05 | personal | `/personal` | ALEGADO (run 36078171673) | ALEGADO (run 36078171673) | ALEGADO (run 36078171673) | PENDENTE¹ | PENDENTE¹ | PENDENTE¹ | AUDITAR | j7/j8 |
| LG-06 | personal | `/personal/alunos` | PENDENTE¹ | PENDENTE¹ | PENDENTE¹ | PENDENTE¹ | PENDENTE¹ | PENDENTE¹ | AUDITAR | j8 |
| LG-07 | personal | `/personal/completar` | PENDENTE¹ | PENDENTE¹ | PENDENTE¹ | PENDENTE¹ | PENDENTE¹ | PENDENTE¹ | AUDITAR | j8/j11 |
| LG-08 | ambos | `/ajustes/personal` | PENDENTE¹ | PENDENTE¹ | PENDENTE¹ | PENDENTE¹ | PENDENTE¹ | PENDENTE¹ | AUDITAR | j8/j11 |
| LG-09 | aluno | `/analise` e `/coach` | PENDENTE | PENDENTE | PENDENTE² (achado A2 na Progressão; `/coach` ok) | PENDENTE | PENDENTE | PENDENTE | AUDITAR (ok em `/coach`) | j6/j12 |
| LG-10 | ambos | ajustes, perfil, relatórios e temas | PENDENTE | PENDENTE | PENDENTE² (achado A3 no card Personal; resto ok) | PENDENTE | PENDENTE² (achado A3 no card Personal; resto ok) | PENDENTE | AUDITAR (ok) | j4/j11 |
| LG-11 | público | login, boas-vindas e 404 | PENDENTE | PENDENTE | PENDENTE | PENDENTE | ALEGADO² (404 genérico, sem leak) | ALEGADO² (404 genérico, sem leak) | AUDITAR (ok) | j9/j13 |

## Cobertura automatizada pendente de CI

Os cenários abaixo foram listados localmente com `npx playwright test --list`. Em
2026-09-25, o run manual (workflow_dispatch) `36078171673` do workflow `verificar`
(job "E2E (jornadas J1/J2/J3 do PRD §6 + varredura de navegação)") executou a suíte
inteira contra o Supabase hospedado, com usuários descartáveis criados/apagados
pelos próprios specs: **132 passed (15.1m), 0 failed**. O log (`gh run view
36078171673 --log`) confirma, teste a teste, que os cenários de idioma abaixo
efetivamente rodaram e passaram nesse run — não é mais listagem estática, é execução
real. Ainda assim o estado fica `ALEGADO`, não `PASSOU`: quem extraiu essa evidência
do log é o mesmo agente auditor, e a regra da matriz exige que a promoção para
`PASSOU` venha de um agente diferente de quem rodou/alegou.

| Spec | Cenário determinístico | Estado |
|---|---|---|
| `j4` | Home vazia, ação inicial e catálogo em pt-BR, inglês e espanhol | ALEGADO — confirmado no run 36078171673 (`j4-varredura.spec.ts:376` × pt/en/es, testes 72–74/132) |
| `j5` | Troca de idioma pela UI preserva contraste AA renderizado | ALEGADO — confirmado no run 36078171673 (`j5-contraste.spec.ts:346`, teste 76/132) |
| `j8` | Título e navegação da fila do personal nos três idiomas | ALEGADO — confirmado no run 36078171673 (`j8-casca-do-personal.spec.ts:252` × pt/en/es, testes 84–86/132) |
| `j10` | Offline ao iniciar treino exibe o erro localizado nos três idiomas | ALEGADO — confirmado no run 36078171673 (`j10-serie-e-fila.spec.ts:500` × pt/en/es, testes 18–20/132) |
| `j11` | Meta inválida mantém ação e erro localizado nos três idiomas | ALEGADO — confirmado no run 36078171673 (`j11-formularios.spec.ts:202` × pt/en/es, testes 31–33/132) |
| `j12` | ID inválido exibe a página 404 localizada nos três idiomas | ALEGADO — confirmado no run 36078171673 (`j12-isolamento-e-apis.spec.ts:466` × pt/en/es, testes 49–51/132) |
| `j13` | Sessão expirada ao salvar meta exibe o erro localizado nos três idiomas | ALEGADO — confirmado no run 36078171673 (`j13-sessao-e-navegacao.spec.ts:281` × pt/en/es, testes 64–66/132) |

¹ Não executado nesta rodada (auditoria QA01, 2026-09-25): exige conta com área de
trabalho personal ativa, que a conta real do dono não tem, e ativar isso na conta
dele está fora do escopo autorizado — mesma trava documentada para OF-04/06. Cobre
os caminhos triste de LG-05 e todos os caminhos de LG-06, LG-07 e LG-08.

² Auditado por leitura em produção (https://lastro-pi.vercel.app), Playwright MCP,
375×812, já logado na conta real do dono, sem criar/gravar nada além de trocar o
idioma pela UI (revertido a pt-BR ao final). Evidência em
`qa/evidencias/LG-12/qa01-2026-09-25/`. Onde a célula diz "achado", a navegação e a
casca da tela estão traduzidas, mas foi encontrado texto em português cru vazando —
ver "Achados da auditoria visual (QA01)" abaixo. Onde não há achado citado e a
célula ficou ALEGADO ou "AUDITAR (ok)", a superfície foi conferida e não vazou
português.

## Achados da auditoria visual (QA01, 2026-09-25)

Estes são divergências, não confirmações — ficam registradas aqui e as células
acima citam o ID. Nenhuma delas foi corrigida nesta auditoria (auditor só audita).

- **A1 — `/catalogo/[id]`, dica de execução em pt-BR mesmo em en/es.** O texto
  "Role só até onde consegue sem a lombar ceder. Deixar o quadril cair é o sinal de
  que a amplitude passou do ponto." aparece cru em inglês (e a `DicaInfo` que abre
  ao lado, essa sim, está traduzida — "Learn more about Execution tip" →
  explicação em inglês). O texto do card em si é conteúdo gerado por IA por
  exercício, não uma string fixa do dicionário `i18n.ts`, e não parece ter
  variante por idioma. Evidência: `en-catalogo-id-leak-ptbr-content.png`.
- **A2 — `/analise`, nomes de exercício em pt-BR na seção Progressão, em inglês.**
  Títulos como "Puxada pegada supinada", "Rosca concentrada", "Tríceps pulley
  (corda)" e "Elevação lateral máquina" aparecem em português dentro de uma tela
  inteiramente traduzida (cabeçalhos, textos de e1RM, eixos do gráfico — tudo em
  inglês). O restante de `/analise` (Groups without recent stimulus, Weekly
  analysis, perguntas sugeridas) e toda a `/coach` estão corretamente traduzidos.
  Evidência: `en-analise-leak-exercicios-ptbr.png`.
- **A3 — `/ajustes`, descrição do card "Trainer"/"Entrenador" em pt-BR.** O título
  do card traduz corretamente ("Personal" → "Trainer" em en, "Entrenador" em es),
  mas a legenda abaixo fica presa em "Vínculo, convites e fila de alunos" nos três
  idiomas — falta a entrada no dicionário `i18n.ts`. Confirmado em en e es.
  Evidência: `en-ajustes-leak-personal-desc-ptbr.png` (o print em es foi bloqueado
  pelo classificador de permissões da sessão, mas o texto pt-BR vazando foi
  confirmado na leitura da página, snapshot registrado nesta sessão).
- **Observação menor (não bloqueante):** em `/treino/[id]`, o cabeçalho da data
  aparece em minúsculas em inglês ("thursday · 24 sep · Workbench"); e os cartões
  de treino em `/` e `/treino` mostram separador decimal com vírgula
  ("20,9t", "10,2 t") mesmo em inglês/espanhol, quando o padrão en/es costuma usar
  ponto. Não é vazamento de string fixa (não há palavra em português), mas é
  inconsistência de formatação worth revisiting — não check LG-12 propriamente,
  registrado aqui para o dono decidir se abre item novo.
