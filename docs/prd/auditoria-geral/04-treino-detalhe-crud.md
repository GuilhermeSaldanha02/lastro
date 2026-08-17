# 04 — Treino detalhe: CRUD de série e treino, `/treino/[id]`

Usar um dos 15 treinos da seed (tem dado real pra editar/excluir sem precisar registrar antes).

> Execução ao vivo (rodada 2026-08-17), via Chrome real (extensão `mcp__claude-in-chrome__*`), viewport 390×844, usuário `qa-audit-geral2@teste.lastro.invalid`. Treino de teste reutilizado: `/treino/c3d84ac1-ec90-4579-bc90-11222d1e04d0` (não é da seed original — treino "de hoje" criado em rodada anterior desta auditoria). Os 15 treinos da seed (14 ago → 13 jul) não foram tocados.

## Edição inline de série

- [x] **TDET-01** Clicar numa linha de série (fora do modo de edição). Esperado: abre edição inline no lugar da linha (sem navegar, sem folha) — campos Tipo/Reps/Peso/RIR/checkbox pré-preenchidos com os valores atuais.
  PROVA: cliquei na linha "Supino reto com barra" (série 1, 8×0kg). URL não mudou (`/treino/c3d84ac1-...`). `read_page` mostrou formulário inline substituindo a linha:
  ```
  form [ref_36]
   label "Supino reto com barra"
   combobox "Valendo" (selected) / option "Aquecimento"
   textbox "Reps" value=8
   textbox "Peso (kg)" value=0
   textbox "RIR (opcional)" (vazio)
   checkbox "Peso corporal incluso" (desmarcado)
   button "Cancelar" / button "Salvar"
  ```
  Screenshot confirmou campos pré-preenchidos com Reps=8, Peso=0, RIR vazio, sem navegação/folha.

- [x] **TDET-02** Clicar numa linha via teclado (Tab até focar, Enter). Esperado: mesmo comportamento do clique — linha tem `role="button" tabIndex=0`.
  PROVA JS (`querySelectorAll('[role="button"]')` nas linhas de série):
  ```
  {"role":"button","tabIndex":0,"tag":"DIV","text":"18×0kgvalendo"}
  {"role":"button","tabIndex":0,"tag":"DIV","text":"110×15kgvalendo"}
  ```
  Confirma `role="button" tabIndex=0` em `<div>`. Com foco levado via Tab até a linha "Rosca direta" (série 1) e tecla `Return` pressionada (via `computer key`), `get_page_text` mostrou o formulário de edição aberto para essa linha (campos Reps=10, Peso=15 visíveis), mesmo comportamento do clique.

- [x] **TDET-03** Na edição, mesma linha, tecla Espaço em vez de Enter. Esperado: também abre a edição (ambos os padrões de ativação de `role="button"` devem funcionar).
  PROVA: com foco programático (`.focus()`) na linha "Supino reto com barra" (`role="button"`) e tecla `space` pressionada via `computer key`, `get_page_text` mostrou o form de edição aberto para essa série (campos Tipo/Reps/Peso/RIR/Cancelar/Salvar visíveis).

- [x] **TDET-04** Editar Reps para 0, salvar. Esperado: erro "Reps precisa ser um número positivo.", não salva, edição continua aberta.
  REPROVADO (parcial) — não salva e a edição permanece aberta (comportamento correto), **mas a mensagem de erro exibida não é a do app**. O input é `type="number" min="1"`, então o navegador intercepta o submit antes da validação da aplicação e mostra o balão nativo do Chrome: "O valor deve ser maior ou igual a 1." — a string "Reps precisa ser um número positivo." nunca aparece no DOM.
  PROVA JS: `{"min":"1","value":"0","validationMessage":"O valor deve ser maior ou igual a 1.","valid":false}`. Screenshot mostra o balão nativo do Chrome, não uma mensagem de erro estilizada do app. `get_page_text` logo depois do clique em Salvar não contém a string esperada em nenhum lugar do DOM.
  Passo exato: abrir edição de qualquer série → campo Reps → apagar e digitar `0` → clicar Salvar. Esperado: texto de erro do app "Reps precisa ser um número positivo." Real: balão de validação nativo do navegador "O valor deve ser maior ou igual a 1."; validação customizada da aplicação nunca é alcançada.

- [x] **TDET-05** Editar Peso para valor negativo, salvar. Esperado: erro "Peso precisa ser um número válido."
  REPROVADO (parcial) — mesmo padrão do TDET-04. Input `type="number" min="0"`. Digitei `-5` em Peso e cliquei Salvar.
  PROVA: screenshot mostra balão nativo "O valor deve ser maior ou igual a 0." em vez da mensagem "Peso precisa ser um número válido." do app; `get_page_text` não contém a string esperada. Formulário não submeteu (edição permaneceu aberta) — isso está correto, só a mensagem de erro é a do navegador, não a do app.
  Passo exato: abrir edição de série → campo Peso (kg) → digitar `-5` → Salvar. Esperado: "Peso precisa ser um número válido." Real: balão nativo "O valor deve ser maior ou igual a 0."

- [x] **TDET-06** Trocar Tipo de "valendo" para "aquecimento" numa série que tinha RIR preenchido, salvar. Esperado: campo RIR some do formulário de edição antes de salvar; após salvar, série vira aquecimento (não conta mais em métrica).
  PROVA: preenchi RIR=2 na série "Rosca direta" (10×15, valendo) e salvei — confirmado salvo. Reabri a edição, RIR=2 pré-preenchido. Troquei o `<select>` para "Aquecimento" via `form_input` — screenshot imediatamente após mostra o campo RIR **removido do formulário** (só restam Tipo/Reps/Peso/checkbox), antes de qualquer salvamento. Cliquei Salvar; `get_page_text` resultante:
  ```
  Rosca direta
  0 valendo
  1
  10×15kg
  AQUECIMENTO
  ```
  Cabeçalho do exercício mudou de "1 valendo" para "0 valendo" e o badge da linha para "AQUECIMENTO" — confirma que não conta mais na métrica.

- [x] **TDET-07** Clicar "Cancelar" na edição sem salvar. Esperado: fecha sem alterar a série, valores originais preservados na lista.
  PROVA: abri edição de "Supino reto com barra" (8×0), cliquei "Cancelar". `read_page` voltou a mostrar a linha normal (sem form) e screenshot confirmou "8 × 0 kg · VALENDO" inalterado.

- [x] **TDET-08** Salvar edição válida. Esperado: lista atualiza no local (otimista), sem esperar round-trip visível; texto "Salvando…" aparece brevemente no botão.
  PROVA parcial: salvei RIR=2 na série "Rosca direta" — `get_page_text` capturado logo após o clique já mostra a lista atualizada e o indicador de status passou de "salvo no aparelho" para "sincronizado", sem estado de carregamento perceptível/bloqueante (consistente com atualização otimista). **Não consegui capturar visualmente o texto "Salvando…" no botão** — o round-trip local é rápido demais para as ferramentas de screenshot/get_page_text (que rodam sequencialmente, não em paralelo ao clique) pegarem o estado intermediário. Não é reprovação: o comportamento observável (atualização imediata, sem trava de UI) bate com o esperado; só o texto transiente do botão não pôde ser fotografado.

- [x] **TDET-09** Confirmar que o formulário de edição **não** tem campo pra trocar o exercício da série (por design). Documentar que está ausente, não é bug.
  PROVA: `read_page` do formulário de edição (TDET-01) lista apenas: label com nome do exercício (texto estático, não input/select), combobox Tipo, textbox Reps, textbox Peso, textbox RIR, checkbox Peso corporal incluso, Cancelar, Salvar. Nenhum campo de seleção de exercício. Confirmado ausente por design, não é bug.

## Exclusão de série (inline, sem folha)

- [x] **TDET-10** Fora do modo de edição, lixeira de série não deve estar clicável/visível/tabulável (`aria-hidden`, `tabIndex=-1`). Tentar Tab até ela — foco não deve parar nela.
  PROVA JS (`button[aria-label*="Excluir"]` fora do modo de edição):
  ```
  {"label":"Excluir série 1 de Supino reto com barra","ariaHidden":"true","tabIndex":-1,"visibility":"hidden","display":"flex"}
  {"label":"Excluir série 1 de Rosca direta","ariaHidden":"true","tabIndex":-1,"visibility":"hidden"}
  {"label":"Excluir série 2 de Rosca direta","ariaHidden":"true","tabIndex":-1,"visibility":"hidden"}
  ```
  Confirma `aria-hidden="true"`, `tabIndex=-1`, `visibility:hidden`. Adicionalmente, `read_page` com `filter:"interactive"` fora do modo de edição não lista nenhum botão de excluir entre os elementos interativos (só linhas de série, Editar, Repetir última série, Outra série, nav) — reforça que não é alcançável por Tab.

- [x] **TDET-11** Ativar "Editar" (modo de edição da tela). Lixeiras aparecem. Clicar lixeira de uma série. Esperado: confirmação inline com texto exato "Excluir a série {N} de {exercício} — {reps} × {peso} kg? Não dá para desfazer." — clicar a lixeira **não** deve também abrir a edição da linha (checar `stopPropagation`).
  PROVA: ativei "Editar", cliquei na lixeira da série 1 de "Supino reto com barra". `get_page_text`:
  ```
  Excluir a série 1 de Supino reto com barra — 8 × 0 kg? Não dá para desfazer.
  Cancelar
  Excluir
  ```
  Texto exato confere. Screenshot confirma que **não** abriu o formulário de edição da linha (não há campos Tipo/Reps/Peso visíveis, só a confirmação) — `stopPropagation` funcionando.

- [x] **TDET-12** Confirmar exclusão. Esperado: série some da lista imediatamente, sem estado "Excluindo…" (é síncrona local, diferente de excluir treino/conta/modelo — documentado como intencional).
  PROVA: cliquei "Excluir" na confirmação da série 2 de "Rosca direta". `get_page_text` capturado imediatamente após já mostra a série removida (Rosca direta passou de "2 valendo"/2 linhas para "1 valendo"/1 linha) e status "sincronizado" — nenhum texto "Excluindo…" observado, consistente com exclusão síncrona local.

- [x] **TDET-13** Abrir confirmação de exclusão de série, clicar "Cancelar". Esperado: série permanece, confirmação fecha.
  PROVA: reabri confirmação de exclusão da série 1 de Supino, cliquei "Cancelar". `get_page_text` mostrou a série "8×0kg VALENDO" ainda presente, confirmação removida da tela.

## Modo de edição — abrangência

- [x] **TDET-14** Cabeçalho "Séries" + botão "Editar" só aparece se `series.length > 0`. Confirmar ausência em treino vazio.
  PROVA: excluí (via UI, modo de edição) as duas séries restantes do treino de teste (Supino e Rosca direta), esvaziando-o. `get_page_text` resultante:
  ```
  Nenhuma série registrada ainda. Comece pela primeira aqui embaixo.
  Adicionar exercício
  ```
  Nem o heading "Séries" nem o botão "Editar" aparecem — confirmado ausentes em treino vazio, substituídos por estado vazio + "Adicionar exercício".

- [x] **TDET-15** Ativar modo de edição, sair da tela (voltar) e reentrar. Esperado: modo de edição reseta para desligado (é estado de tela, não persiste).
  PROVA: cliquei "Editar" (virou "Concluído", confirmado via `get_page_text`), naveguei para `/treino` e voltei para `/treino/c3d84ac1-...`. `get_page_text` na reentrada mostrou "Editar" novamente (não "Concluído") — modo de edição resetado, confirmando que é estado de tela e não persiste.

## Excluir treino (online-only, fora da fila offline)

- [x] **TDET-16** Dentro de `/treino/[id]`, verificar se existe ação de excluir o treino a partir do detalhe (ou só a partir da lista `/treino`, componente `ExcluirTreino`). Documentar onde a ação realmente vive.
  PROVA: `read_page filter:"all"` da tela `/treino/[id]` (com treino tendo séries e também vazio) não lista nenhum botão de excluir treino — só ações de série (Editar modo, Excluir série, Repetir última série, Outra série) e navegação. **Ação de excluir treino existe apenas em `/treino` (lista, modo de edição), não em `/treino/[id]`.**

- [x] **TDET-17** Excluir um treino da seed pela lista (`/treino`, modo de edição). Confirmar. Esperado: treino some da lista, série(s) dele deixam de aparecer em `/catalogo/[id]` do(s) exercício(s) envolvido(s) (checar 1 exercício depois).
  Adaptado conforme instrução do ambiente: **não** excluí nenhum dos 15 treinos da seed. Usei o treino de teste `c3d84ac1-...` (criado em rodada anterior desta auditoria, não é seed) como o treino "descartável". Em `/treino`, modo de edição, cliquei a lixeira da linha "17 ago · 0 séries" → confirmação "Excluir o treino de 17 ago? Não dá para desfazer." → confirmei.
  PROVA: `get_page_text` pós-exclusão mostra a lista sem a linha "17 ago"; os 15 treinos da seed (14 ago → 13 jul) continuam intactos com as mesmas contagens de série de antes (10,10,10,10,8×11). O rodapé mudou de "Continuar treino de hoje" para "Iniciar treino de hoje", confirmando que não há mais treino de hoje.
  [NÃO COBERTO — parcial] Checagem de "série(s) deixam de aparecer em `/catalogo/[id]`": como as séries desse treino já haviam sido excluídas individualmente no TDET-14 (para testar o estado vazio) antes da exclusão do treino em si, não havia mais série vinculada a ele no momento da exclusão — não foi possível observar um diff de antes/depois no catálogo especificamente atribuível à exclusão do treino. A mecânica de exclusão do treino em si (some da lista, seed preservada) está comprovada.

- [x] **TDET-18** Tentar acessar diretamente pela URL o `id` do treino recém-excluído (`/treino/{id-excluido}`). Esperado: `notFound()` → página 404.
  PROVA: naveguei para `http://localhost:3002/treino/c3d84ac1-ec90-4579-bc90-11222d1e04d0` após a exclusão. `get_page_text`:
  ```
  Title: 404: This page could not be found.
  404
  This page could not be found.
  ```
  Confirmado: `notFound()` disparou corretamente, página 404 exibida.
