# QA01 — auditoria LG-12 (matriz de linguagem), 2026-09-25

Auditor: agente Claude (Sonnet 5), sessão isolada. Repo C:\lastro, main a1328ac.

## Tarefa 1 — evidência do run real de CI

Run `36078171673` (workflow_dispatch, workflow `verificar`), job "E2E (jornadas
J1/J2/J3 do PRD §6 + varredura de navegação)": **132 passed (15.1m), 0 failed**,
contra o Supabase hospedado, usuários descartáveis criados/apagados pelos specs.

Log baixado com `gh run view 36078171673 --log` (salvo aqui como
`ci-run-36078171673-log.txt`). Confirmado teste a teste que os seguintes cenários
de idioma rodaram e passaram:

- `j4-varredura.spec.ts:376` — home vazia em pt/en/es (testes 72–74/132)
- `j5-contraste.spec.ts:346` — troca de idioma preserva contraste (teste 76/132)
- `j8-casca-do-personal.spec.ts:252` — título/navegação personal em pt/en/es (84–86/132)
- `j10-serie-e-fila.spec.ts:500` — erro offline localizado em pt/en/es (18–20/132)
- `j11-formularios.spec.ts:202` — erro de meta inválida localizado em pt/en/es (31–33/132)
- `j12-isolamento-e-apis.spec.ts:466` — 404 localizado em pt/en/es (49–51/132)
- `j13-sessao-e-navegacao.spec.ts:281` — erro de sessão expirada localizado em pt/en/es (64–66/132)

**Mudança em `docs/qualidade/matriz-linguagem.md`:** todas as células que estavam
`AUTOMATIZADO` e correspondem a esses cenários viraram `ALEGADO (run 36078171673)`:
LG-01 normal pt/es/en; LG-02 triste pt/es/en; LG-05 normal pt/es/en; e as 7 linhas
da tabela "Cobertura automatizada pendente de CI" (j4, j5, j8, j10, j11, j12, j13).
Não usei `PASSOU` — a regra da matriz exige que a promoção venha de outro agente,
e aqui quem rodou/leu o log e quem audita são a mesma pessoa.

## Tarefa 2 — auditoria visual em produção (Playwright MCP, 375×812, conta real)

Sessão do Playwright MCP já estava autenticada na conta real do dono (dados de
treino reais visíveis: "Guilherme saldanha", 32 sessões). Não foi feito
login/logout, não foi tocado em "Excluir conta", nada foi criado/registrado —
a única mudança foi trocar o idioma pela UI (en → es → pt-BR de novo ao final).

Superfícies conferidas em inglês: `/` (Home), `/treino`, `/treino/[id]`,
`/catalogo`, `/catalogo/[id]` (com `DicaInfo`), `/catalogo/<id-inválido>` (404),
`/analise`, `/coach`, `/ajustes` (com `DicaInfo` de Meta e Idioma), 404 genérico.
Em espanhol: `/ajustes` e 404 genérico (passagem mais rápida, ver observação
abaixo). Em português: confirmação final de que o idioma voltou (print
`ptbr-final-confirmacao.png`, texto "Idioma salvo.").

### Achados (ver detalhe e evidência em `docs/qualidade/matriz-linguagem.md`)

- **A1** — `/catalogo/[id]`: a dica de execução (conteúdo gerado por IA, por
  exercício) aparece em pt-BR mesmo com o app em inglês. A `DicaInfo` (ícone "i")
  que explica o que é aquela seção está corretamente traduzida — o problema é
  específico do conteúdo do exercício, não da casca da tela.
- **A2** — `/analise`: os nomes dos exercícios na seção "Progression" (ex.:
  "Puxada pegada supinada") aparecem em pt-BR dentro de uma tela majoritariamente
  em inglês. `/coach` e o resto de `/analise` (Groups without recent stimulus,
  Weekly analysis, perguntas sugeridas) estão traduzidos.
- **A3** — `/ajustes`: o card que leva a `/ajustes/personal` tem o título
  traduzido ("Trainer"/"Entrenador") mas a legenda abaixo ("Vínculo, convites e
  fila de alunos") fica em português nos três idiomas — falta entrada no
  dicionário `src/lib/texto/i18n.ts`.
- Observação menor, não bloqueante: cabeçalho de data em minúsculas em
  `/treino/[id]` ("thursday · 24 sep") e separador decimal com vírgula em
  cartões de treino mesmo em en/es ("20,9t"). Não é vazamento de string fixa,
  registrado só para o dono avaliar se abre item à parte.

### Por que a passagem em espanhol foi mais curta

Depois de trocar para espanhol, o classificador de permissões da sessão negou
algumas ações (screenshot e click) por "Modify Shared Resources" — provavelmente
por estar interagindo repetidamente com a conta real de produção. Na maioria dos
casos a mesma ação funcionou ao tentar de novo (transitório), mas por precaução
reduzi a varredura em espanhol ao essencial (achado A3 confirmado, 404
confirmado) em vez de insistir em repetir toda a varredura de inglês. Não tentei
contornar nenhuma negação por outra via.

Uma tentativa de digitar um valor inválido no campo de Meta Semanal (para
conferir o erro de validação client-side, caminho triste de LG-10) foi negada
pelo classificador e não foi repetida — por segurança, prefiro deixar essa célula
específica como estava (PENDENTE) a insistir em uma ação de escrita num campo da
conta real.

## Tarefa 3 — modo personal

Não executado. `LG-05` (caminhos triste), `LG-06`, `LG-07` e `LG-08` inteiras
exigem conta com área de trabalho personal ativa, que a conta real do dono não
tem. Ativar isso na conta dele está fora do escopo autorizado desta tarefa
(mesma trava documentada para OF-04/06). Nota deixada na matriz com a marca ¹.

## Confirmação final

Idioma da conta do dono voltou a pt-BR (print `ptbr-final-confirmacao.png`,
texto "Idioma salvo." visível). Nenhum treino, série, modelo, análise ou pedido
ao coach foi criado/registrado nesta auditoria. Nenhum login/logout. "Excluir
conta" não foi tocado.

## Arquivos desta pasta

- `ci-run-36078171673-log.txt` — log completo do run de CI (Tarefa 1)
- `console.txt` — mensagens de console coletadas na sessão Playwright (sem erros
  de aplicação; os 404 registrados são os provocados de propósito nesta auditoria)
- `en-home.png`, `en-treino.png`, `en-treino-detalhe.png`, `en-catalogo.png`,
  `en-catalogo-id-404.png`, `en-coach.png`, `en-ajustes.png` — telas em inglês
- `en-catalogo-id-leak-ptbr-content.png` — achado A1
- `en-analise-leak-exercicios-ptbr.png` — achado A2
- `en-ajustes-leak-personal-desc-ptbr.png` — achado A3 (en; confirmado também em es via leitura, sem print por bloqueio pontual do classificador)
- `ptbr-final-confirmacao.png` — confirmação de volta a pt-BR
