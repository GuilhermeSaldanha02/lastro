# Correção aplicada — 2026-08-30/31

## O pedido

O dono pediu auditoria do dicionário de traduções (`src/lib/texto/i18n.ts`)
depois de usar o dicionário Oxford pra escrever as strings em inglês — bom
pra estudar, não pra aplicação. Queria vocabulário real de app de treino
(Hevy, Strong), não tradução textbook.

## O que foi feito, em duas rodadas

**Rodada 1 (2026-08-30):** script de auditoria (regex de linha única)
cruzando toda chamada `t(..., idioma)` contra o `DICIONARIO` achou 21
chamadas sem entrada — concentradas em `timer-topo.tsx`,
`player-execucao-exercicio.tsx`, `historico-relatorios-pos-treino.tsx`,
`app/ajustes/relatorios/page.tsx`, `app/catalogo/[id]/page.tsx`. Todas
traduzidas. Mais 2 ajustes de vocabulário: `"Usar valores"` (EN `"Use
values"` → `"Use"`, mesmo padrão do botão "Última vez: X×Y kg [Use]" do
Hevy/Strong) e `"Falha de rede..."` (EN `"Network failure"` →
`"Network error"`, 2 ocorrências).

**Rodada 2 (2026-08-31), depois do achado da auditoria independente:** o
script da rodada 1 usava regex sem a flag `/s` (dotAll) e não pegava
chamadas `t(\n "...", \n idioma, \n)` **multi-linha** — 3 chamadas exatas
desse padrão escaparam da varredura e continuavam em português cru mesmo
em EN/ES:
- `app/ajustes/relatorios/page.tsx` (2 strings — texto de instrução e
  estado vazio da tela de Stories)
- `app/catalogo/[id]/page.tsx` (1 string — fallback de dica de execução
  quando o exercício não tem `dica_execucao` cadastrada)

Script reescrito com `/s`, confirmado 0 faltando contra as 283 chamadas
reais do projeto (bateu com a contagem independente da auditoria).

## Não mexido, decisão do dono pendente

O termo `"leitura"`/`en: "readout"` aparece em 3 chaves (`"Toque para ver a
leitura da sua semana."`, `"Consultoria 24h e leitura de ciclo"`,
`"escrevendo a leitura"`). É vocabulário deliberado do PRD — a tese do
produto é "não é dashboard, é uma leitura/interpretação". Trocar isso é
decisão de produto sobre como o conceito central se traduz, não achado de
tradução — não mexido, fica registrado como pergunta em aberto.

## Prova

- Script de auditoria (descartado após uso, `/s` flag): 0 chamadas sem
  tradução, 359 chaves no dicionário, 283 chamadas `t()` no projeto.
- **Verificação ao vivo minha, depois da correção da rodada 2** (usuário QA
  descartável `qa.i18nlive@lastro.test`, apagado ao final via C5 — ver
  AJ-02): idioma trocado pra English em `/ajustes`, confirmado renderizado
  em inglês; `/ajustes/relatorios` mostrando as 2 strings corrigidas
  ("Once you finish your first workout session, it'll show up here with
  full metrics and sticker options." e o texto de instrução); `/catalogo`
  → "Bicycle Crunch" mostrando a 3ª string corrigida ("Perform the movement
  with full joint control, keeping the spine stable and an even tempo
  through the eccentric and concentric phases."), mais "BIOMECHANICS &
  TECHNICAL INSTRUCTIONS", "TARGET MUSCLE", "SYNERGISTS", "JOINT
  MECHANICS", "Set History" — tudo em inglês, zero português cru na tela
  (`get_page_text` inteiro conferido).
- 4 gates verdes (`tsc`/`test` 238/238/`lint`/`build`) nas duas rodadas.

## Auditoria independente

Ver `auditoria-independente/relatorio.md` — achou a lacuna das 3 strings
multi-linha (achado real, corrigido acima) e confirmou a qualidade das
traduções novas contra vocabulário real de anatomia/fitness (ExRx.net,
apps reais). Não conseguiu verificar ao vivo por restrição de permissão do
agente subordinado (criação de usuário QA bloqueada pelo classificador de
auto mode) — verificação ao vivo completada por mim, acima.
