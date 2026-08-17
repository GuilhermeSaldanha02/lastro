# 07 — Ajustes, Anilhas, Modelos (incl. folhas `@modal`)

> Execução ao vivo via extensão Chrome real (`mcp__claude-in-chrome__*`), viewport 390×844 (redimensionado depois para 500×715 pelo próprio app/tab — larguras testadas mantiveram-se no breakpoint mobile). Usuário de teste: `qa-audit-geral2@teste.lastro.invalid`. App em http://localhost:3002.

## `/ajustes`

- [x] **AJU-01** Acessar `/ajustes` logado. Esperado: atalho pro perfil (nome + "Editar perfil"), links "Coach"/"Modelos"/"Anilhas", botão "Sair", `ExcluirConta`.
  PROVA (read_page, filter all, em `/ajustes`):
  ```
  link [ref_4] href="/perfil"
    generic "qa-audit-geral2" [ref_5]
    generic "Editar perfil" [ref_6]
  list [ref_7]
    listitem: link href="/coach" -> "Coach" / "Tirar uma dúvida"
    listitem: link href="/ajustes/modelos" -> "Modelos" / "Montar listas"
    listitem: link href="/ajustes/anilhas" -> "Anilhas" / "Configurar e calcular"
  form: button "Sair" type="submit"
  button "Excluir conta" type="button"
  ```
  Todos os elementos esperados presentes. Aprovado.

- [x] **AJU-02** Clicar "Sair" (Server Action). Esperado: sessão encerra, redireciona pra fora de rota privada (checar pra onde exatamente).
  PROVA: clique no botão "Sair" (ref_23) → `tabs_context_mcp` confirmou navegação para `http://localhost:3002/login` (redirect direto pra tela de login, não apenas "fora de rota privada" genérica).
  Verificação extra: após o logout, naveguei direto para `http://localhost:3002/ajustes` de novo — a URL **não foi redirecionada** para `/login` (ficou em `/ajustes`), mas o conteúdo da página trocou para uma mensagem inline: `get_page_text` retornou `"Ajustes\n\nEntre para ver seus ajustes."` — ou seja, a proteção de rota privada é feita renderizando um estado "logado fora" na própria página, não por redirect HTTP/middleware. Documentando o comportamento real: **Sair → redirect explícito pra `/login`**; **acesso posterior a rota protegida sem sessão → fica na mesma URL mas mostra "Entre para ver seus ajustes." em vez do conteúdo.** Não é bug, é o comportamento observado — mas difere do que a redação do item sugeria ("redireciona pra fora de rota privada"), então documentado com detalhe.

- [x] **AJU-03** `ExcluirConta` — clicar "Excluir conta". Esperado: confirmação inline com o texto exato listando perfil/treinos/séries/modelos/anilhas, "Cancelar" funciona sem excluir nada.
  PROVA (`get_page_text` logo após clicar em "Excluir conta"):
  ```
  Excluir sua conta apaga o perfil, todos os treinos e séries registradas, os modelos de treino e a configuração de anilhas — tudo, sem exceção. Não dá para desfazer.

  Cancelar
  Excluir conta
  ```
  Cliquei "Cancelar" → `get_page_text` voltou ao estado normal da página (`Excluir conta` como botão único, sem o bloco de confirmação, usuário `qa-audit-geral2` ainda logado normalmente em `/ajustes`). Nenhuma exclusão ocorreu. Aprovado.

- [x] **AJU-04** Não executar a exclusão de conta de verdade no usuário de teste principal — feito: **NÃO** cliquei em excluir de fato no `qa-audit-geral2`. Para provar o caminho feliz, criei um 2º usuário isolado via `./scripts/qa-treino-helper.sh criar-usuario qa-audit-exclusao-conta@teste.lastro.invalid SenhaTeste123!` (uuid `9a95d125-03f4-403b-ae75-acc83bd98454`), logei nele pela UI, fui em `/ajustes` → "Excluir conta" → confirmei a exclusão de verdade. Resultado: redirecionado automaticamente para `/login` (mesmo padrão do AJU-02).
  PROVA de limpeza em cascata (`./scripts/qa-treino-helper.sh limpar-usuario qa-audit-exclusao-conta@teste.lastro.invalid`):
  ```
  { "rows": [ { "resultado": "removido" } ] }
  { "rows": [ { "sobrou": 0 } ] }
  ```
  Cascade confirmado por contagem (`sobrou: 0`). Usuário principal `qa-audit-geral2` não foi tocado — confirmado depois checando `/treino` do usuário principal, que segue com os 15 treinos seedados intactos (ver prova em AJU-22).

## `/ajustes/anilhas` (rota completa) e folha `(.)ajustes/anilhas`

- [x] **AJU-05** Navegar via `Link` (clique) a partir de `/ajustes` → "Anilhas". Esperado: abre como **folha** (`role="dialog"`), não navegação de página cheia.
  PROVA (`read_page` após clique no link "Anilhas" a partir de `/ajustes`, URL virou `/ajustes/anilhas` mas o `/ajustes` de fundo continuou renderizado):
  ```
  dialog "Anilhas" [ref_36]
    heading "Anilhas"
    button "Fechar Anilhas"
    region "Peso da barra" ...
    region "Anilhas disponíveis" ...
    region "Calculadora" ...
  ```
  Fundo `/ajustes` (perfil, Coach, Modelos, Sair, Excluir conta) continuou presente por trás da dialog. Confirmado: folha (intercepting route), não navegação de página cheia. Aprovado.

- [x] **AJU-06** Acessar `/ajustes/anilhas` direto pela URL (ou F5 dentro da folha). Esperado: renderiza como página completa normal (sem folha) — intercepting route só ativa em navegação client-side.
  PROVA (`navigate` direto para `http://localhost:3002/ajustes/anilhas`, `read_page` all):
  ```
  main
    link "Voltar para Ajustes" href="/ajustes"
    heading "Anilhas"
    region "Peso da barra" / "Anilhas disponíveis" / "Calculadora"
  ```
  Sem `dialog`, sem overlay — página completa normal com link "Voltar para Ajustes" no lugar do botão "Fechar". Confirmado. Aprovado.

- [x] **AJU-07** Peso da barra: digitar negativo. Esperado: `min=0` do input bloqueia nativamente ou a validação de "Salvar" pega — documentar qual dos dois.
  PROVA: digitei `-5` no campo "Peso da barra em kg" — o valor `-5` foi aceito no input (native `min` **não** bloqueou a digitação/preenchimento). Cliquei "Salvar configuração" → `read_page` mostrou `alert "Peso da barra precisa ser um número positivo." [ref_34]`. **A validação JS customizada é quem pega o erro, não o `min` nativo do HTML — nesse formulário o padrão é OPOSTO ao encontrado em registro/edição de série** (onde o `required`/`min` nativo bloqueava e a mensagem customizada nunca aparecia). Vale registrar como contraste com o achado 1 do contexto da auditoria: aqui a mensagem customizada aparece normalmente. Aprovado (documentado, não é falha).

- [x] **AJU-08** Adicionar anilha com peso 0 ou negativo. Esperado: erro "Peso da anilha precisa ser um número positivo."
  PROVA: campo "Peso da barra" com valor válido (20), campo "Adicionar anilha (kg)" com `-2`, clique em "Adicionar" → `get_page_text`:
  ```
  Peso da anilha precisa ser um número positivo.
  ```
  Aprovado.

- [x] **AJU-09** Adicionar anilha com peso que já existe na lista. Esperado: campo limpa silenciosamente, sem duplicar, sem mensagem de erro (comportamento documentado como intencional — confirmar que é isso mesmo que acontece).
  PROVA: recarreguei a página (estado limpo, sem erro residual), digitei `20` (peso já existente na grade) em "Adicionar anilha (kg)", cliquei "Adicionar". `read_page` all resultante:
  ```
  Anilhas disponíveis: 20, 15, 10, 5, 2.5, 1.25 kg (sem duplicata, sem novo "20" extra)
  textbox "Adicionar anilha (kg)" [ref_4] — sem valor
  (nenhum alert presente)
  ```
  Confirmado comportamento documentado: limpa silenciosamente, sem duplicar, sem erro. Aprovado.
  ACHADO MENOR (não bloqueante, fora do escopo estrito do item): testei a mesma ação **logo depois** de um erro anterior (`-2` inválido) sem recarregar a página — nesse caso a mensagem de erro anterior ("Peso da anilha precisa ser um número positivo.") **ficou visível na tela mesmo após o "Adicionar" com valor duplicado válido ter sido processado com sucesso** (campo limpou, sem duplicata, mas o alert antigo não foi limpo). Ou seja, o alerta de erro não é resetado ao rodar uma ação bem-sucedida subsequente — só some em reload/nova navegação. É um achado real de UX (mensagem de erro "grudada"), mas não invalida o comportamento esperado do item quando testado isoladamente.

- [x] **AJU-10** Ativar modo de edição das anilhas, remover uma (lixeira, sem confirmação). Esperado: some da grade local imediatamente, mas não persiste até clicar "Salvar configuração" — recarregar sem salvar deve trazer a anilha de volta.
  PROVA: cliquei "Editar" → grade passou a mostrar ícones de lixeira por anilha, link virou "Concluído". Cliquei na lixeira da anilha de 5 kg → `read_page`/zoom confirmaram que a 5 kg sumiu da grade imediatamente (sem qualquer diálogo de confirmação). Recarreguei a página **sem clicar em "Salvar configuração"** → `read_page` all mostrou a anilha de 5 kg de volta na lista (`button "Remover anilha de 5 kg"` presente de novo). Confirmado: remoção é só local até salvar. Aprovado.

- [x] **AJU-11** Clicar "Salvar configuração" com peso da barra vazio/inválido. Esperado: erro "Peso da barra precisa ser um número positivo.", não salva.
  PROVA: mesmo teste do AJU-07 (peso da barra `-5`, clique em "Salvar configuração") já produziu exatamente essa mensagem via `alert [ref_34]`: "Peso da barra precisa ser um número positivo." Aprovado (evidência compartilhada com AJU-07).

- [x] **AJU-12** Salvar configuração válida. Esperado: "Configuração salva." (`aria-live="polite"` — checar que um leitor de tela seria notificado, ou ao menos que o texto aparece sem precisar de foco).
  PROVA: com peso da barra = 20 (válido), cliquei "Salvar configuração". `read_page` capturado no instante certo mostrou `button "Salvando…"` e, logo em seguida, `generic "Configuração salva." [ref_33]`.
  Verificação de acessibilidade via `javascript_tool` (inspecionando o elemento com esse texto exato):
  ```json
  { "ariaLive": "polite", "tag": "P", "role": null, "parentAriaLive": null }
  ```
  Confirmado: `<p aria-live="polite">Configuração salva.</p>` — leitor de tela seria notificado sem precisar de foco. Aprovado.

## Calculadora de anilhas

Peso da barra = 20 kg. Anilhas disponíveis: 20, 15, 10, 5, 2.5, 1.25 kg (config salva no AJU-12).

- [x] **AJU-13** Calculadora: peso alvo que bate exato com a barra + combinação de anilhas. Esperado: "De cada lado: ... Total: {alvo} kg" sem a nota de aproximação.
  PROVA: alvo = 40 → `get_page_text`: `"De cada lado: 1× 10 kg. Total: 40 kg."` — sem nota de aproximação. Aprovado.

- [x] **AJU-14** Calculadora: peso alvo que não bate exato. Esperado: mesma saída + nota "(mais próximo do alvo com as anilhas que você tem)".
  PROVA: alvo = 43 → `get_page_text`: `"De cada lado: 1× 10 kg + 1× 1.25 kg. Total: 42.5 kg (mais próximo do alvo com as anilhas que você tem)."` Aprovado.

- [x] **AJU-15** Calculadora: peso alvo igual ao peso da barra (sem anilha necessária). Esperado: "Só a barra, sem anilha de cada lado."
  PROVA: alvo = 20 → `get_page_text`: `"Só a barra, sem anilha de cada lado. Total: 20 kg."` (texto igual ao esperado, com complemento "Total: 20 kg." anexado — não contradiz o esperado). Aprovado.

- [x] **AJU-16** Calculadora: peso alvo menor que o peso da barra. Esperado: documentar o comportamento real (não há trava óbvia no código mapeado — pode gerar resultado estranho, é candidato a achado se ficar visivelmente errado).
  PROVA: alvo = 15 (< barra de 20) → `get_page_text`: `"Só a barra, sem anilha de cada lado. Total: 20 kg (mais próximo do alvo com as anilhas que você tem)."`
  Comportamento real: a calculadora trata alvo abaixo do peso da barra como "não dá pra ir mais baixo que a barra", cai no caso "só a barra" e anexa a nota de aproximação porque 20 ≠ 15. **Não é um resultado visivelmente quebrado** (não retorna negativo, não trava, não mostra erro) — é um fallback razoável, ainda que o alvo "15" nunca seja alcançável fisicamente com peso livre abaixo da barra. Documentado como comportamento aceitável, não é bug.

## `/ajustes/modelos`, `/ajustes/modelos/novo` e folha

- [x] **AJU-17** `/ajustes/modelos` vazio (sem modelo criado ainda pro usuário de teste). Esperado: "Nenhum modelo criado ainda."
  PROVA (`get_page_text` em `/ajustes/modelos`, antes de qualquer criação):
  ```
  Modelos
  Nenhum modelo criado ainda.
  + Criar modelo
  ```
  Aprovado.

- [x] **AJU-18** Criar modelo via "+ Criar modelo" (folha, `naFolha=true`): passo 1 grupo muscular (chip), passo 2 lista de exercícios (checkbox) + nome. Submeter sem nome. Esperado: "Dê um nome ao modelo."
  PROVA: cliquei "Criar modelo" a partir de `/ajustes/modelos` → abriu como `dialog "Novo modelo"` (folha). Passo 1: selecionei chip "Peito" (clique real no elemento, confirmado via `javascript_tool` que `btn.disabled` virou `false` só após o clique real registrar — checkbox toggle via `form_input` programático **não** disparava o evento que o React escuta, tive que usar `computer left_click` no próprio elemento). Cliquei "Continuar" → passo 2. Marquei um exercício ("Crucifixo reto com halteres"), deixei "Nome do modelo" vazio, cliquei "Salvar modelo".
  `read_page` resultante: `alert "Dê um nome ao modelo." [ref_81]`. Aprovado.

- [x] **AJU-19** Submeter sem nenhum exercício marcado. Esperado: "Escolha pelo menos um exercício."
  PROVA: desmarquei o exercício selecionado, preenchi nome "Peito QA", cliquei "Salvar modelo" → `read_page`: `alert "Escolha pelo menos um exercício." [ref_81]`. Aprovado.

- [x] **AJU-20** Criar modelo válido dentro da folha. Esperado: ao salvar, fecha com `router.back()` (não `push` — checar que não empilha uma rota nova; voltar do navegador depois não deveria cair de novo na folha de criação, ver `DECISIONS.md` 2026-08-16 H1).
  PROVA: marquei o exercício de novo (nome "Peito QA" já preenchido), cliquei "Salvar modelo" → `tabs_context_mcp` confirmou URL final `http://localhost:3002/ajustes/modelos` (folha fechou, sem dialog). `get_page_text` mostrou o modelo "Peito QA" na lista.
  Teste do histórico: `navigate({url:"back"})` a partir de `/ajustes/modelos` → foi para `http://localhost:3002/ajustes/modelos` mesmo (permaneceu na lista, **não** reabriu a folha de criação nem empilhou uma entrada extra pra `/novo`). Confirma uso de `router.back()`/substituição de rota consistente com a decisão do DECISIONS.md 2026-08-16 H1. Aprovado.

- [x] **AJU-21** Repetir AJU-18/19/20 acessando `/ajustes/modelos/novo` **direto pela URL** (fora da folha, `naFolha=false`). Esperado: ao salvar, `router.push("/ajustes/modelos")` em vez de `back()`.
  PROVA: `navigate` direto para `http://localhost:3002/ajustes/modelos/novo` → `read_page` confirmou página completa (`main > link "Voltar para Modelos de treino"`, sem `dialog`). Completei o fluxo (grupo "Bíceps", exercício "Rosca direta", nome "Biceps QA URL") e salvei → `tabs_context_mcp` confirmou URL final `/ajustes/modelos`, modelo "Biceps QA URL" apareceu na lista.
  Teste decisivo de `push` vs `back()`: `navigate({url:"back"})` a partir de `/ajustes/modelos` **voltou para `/ajustes/modelos/novo`** (não para `/ajustes` ou além) — prova que `/ajustes/modelos` foi empilhado como uma **nova** entrada de histórico via `router.push`, não substituição/back. Confirma exatamente o esperado no item. Aprovado.

- [x] **AJU-22** Modo de edição em `/ajustes/modelos`, excluir um modelo. Esperado: confirmação com nome do modelo no texto, "os treinos já registrados a partir dela não são afetados" — confirmar que treinos antigos continuam intactos depois.
  PROVA: cliquei "Editar" na lista de modelos → lixeiras apareceram por modelo, link virou "Concluído". Cliquei na lixeira de "Peito QA" → `get_page_text`:
  ```
  Excluir o modelo "Peito QA"? A lista de exercícios some — os treinos já registrados a partir dela não são afetados. Não dá para desfazer.
  Cancelar
  Excluir
  ```
  Cliquei "Excluir" → `get_page_text` confirmou modelo removido da lista (só "Biceps QA URL" restou).
  Verificação de treinos intactos: `navigate` para `/treino` do usuário principal → `get_page_text` mostrou as **15 sessões seedadas ainda presentes e com as mesmas contagens de séries** (14 ago 10 séries, 12 ago 10 séries, ... 13 jul 8 séries), sem qualquer alteração. Aprovado.

## Folhas em geral (`Folha`)

- [x] **AJU-23** Abrir qualquer folha, clicar no fundo (fora do conteúdo). Esperado: fecha (`router.back()`).
  PROVA: abri a folha "Anilhas" a partir de `/ajustes` (URL virou `/ajustes/anilhas`, `dialog` presente). Cliquei fora do conteúdo, na área do backdrop escurecido (topo da tela, sobre o cabeçalho "Ajustes" visível atrás). `tabs_context_mcp` confirmou URL voltou para `http://localhost:3002/ajustes`, e `read_page` confirmou ausência de `dialog` — página normal de Ajustes. Aprovado.

- [x] **AJU-24** Abrir folha, tecla `Escape`. Esperado: fecha.
  PROVA: reabri a folha "Anilhas" (URL `/ajustes/anilhas`, dialog confirmado), pressionei `Escape` via `computer key`. `tabs_context_mcp` confirmou URL voltou para `http://localhost:3002/ajustes`. Aprovado.

- [x] **AJU-25** Abrir folha, arrastar pra baixo além do limiar (~96px). Esperado: fecha. Arrastar menos que isso. Esperado: volta pro lugar, não fecha.
  PROVA parte 1 (abaixo do limiar): reabri a folha, arrastei o handle do topo (`left_click_drag` de `[242,108]` até `[242,158]`, ou seja ~50px) → `tabs_context_mcp` confirmou URL **permaneceu** `/ajustes/anilhas`; screenshot antes/depois mostrou a folha na mesma posição visual (voltou pro lugar, não fechou).
  PROVA parte 2 (acima do limiar): arrastei de `[242,108]` até `[242,300]` (~192px, bem acima de 96px) → `tabs_context_mcp` confirmou URL virou `http://localhost:3002/ajustes` (folha fechou). Aprovado — comportamento do limiar de ~96px confirmado nos dois sentidos.

---

## Resumo de achados (não bloqueantes, contextualizados)

1. **AJU-07/AJU-11**: neste formulário (peso da barra em `/ajustes/anilhas`), a validação JS customizada funciona normalmente e a mensagem aparece — **ao contrário** do padrão já visto 2x em áreas anteriores da auditoria (registro/edição de série), onde `required`/`min` nativo bloqueava a mensagem customizada antes dela aparecer. Contraste registrado, não é falha nova.
2. **AJU-09 (achado menor)**: o alerta de erro do formulário de anilhas ("Peso da anilha precisa ser um número positivo.") não é limpo automaticamente quando uma ação subsequente bem-sucedida ocorre (ex.: adicionar peso duplicado válido logo após um erro) — só some em reload/nova navegação. UX menor, não bloqueante.
3. **Nota de ferramenta (não é achado de produto)**: durante os testes dos chips de grupo muscular/checkboxes de exercício em `/ajustes/modelos/novo`, setar o valor via `form_input` programático não disparava o `onChange` que o React escuta (o estado React não atualizava, botão "Continuar" ficava disabled mesmo com o DOM `checked=true`). Cliques reais (`computer left_click`) funcionaram normalmente. Limitação da ferramenta de automação, não do app.
