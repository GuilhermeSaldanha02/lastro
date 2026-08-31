# Correção aplicada — 2026-08-30

## O achado

O dono relatou que a sincronização offline não acontecia. Investigação confirmou:
o listener `window.addEventListener("online", ...)` e o aviso de Background Sync
do service worker estavam ligados **só dentro de `treino-detalhe.tsx`**
(`/treino/[id]`). Cenário de falha: registrar série offline, sair da tela do
treino (ex.: ir pra Home), a rede voltar em **qualquer outra tela** → a fila
(`src/lib/offline/outbox.ts`, IndexedDB via Dexie) não drenava sozinha. O dado
não se perdia (continuava no aparelho), mas não subia até o dono reabrir aquele
treino específico.

## O que mudou

1. **`sincronizarPendentes`** (wiring dos executores reais: `criarSerieRemoto`,
   `atualizarSerieRemoto`, `excluirSerieRemoto`, `excluirTreinoRemoto`) extraído
   de `treino-detalhe.tsx` para `src/lib/offline/sincronizar-pendentes.ts`,
   importável de dois lugares.
2. **`src/components/sincronizador-global.tsx`** — componente novo, sem UI
   própria, montado no layout raiz (`src/app/layout.tsx`). Escuta `online` e o
   aviso do SW em qualquer tela do app, não só `/treino/[id]`.
3. `treino-detalhe.tsx` passa a importar a função compartilhada em vez de ter
   cópia local; mantém seu próprio efeito local pro indicador visual "salvo"/
   "sincronizado" (D7).

## Achado da 1ª rodada de auditoria independente — corrigido na mesma PR

Com os dois listeners (global + local) coexistindo em `/treino/[id]`, o evento
`online` disparava **duas chamadas concorrentes** de `sincronizarPendentes()`.
`sincronizar()` lê a fila sem lock — as duas pegavam o mesmo item pendente, uma
vencia no servidor e a outra recebia `duplicate key` do Postgres. Esse erro bate
no padrão de `ehErroPermanente`, então a chamada perdedora descartava para
`db.falhas` uma série **já gravada com sucesso** pela vencedora — dado íntegro
no banco, mas o registro da fila mentindo que ela tinha se perdido.

**Correção:** mutex de módulo em `sincronizar-pendentes.ts` — uma segunda
chamada enquanto a primeira roda recebe a mesma `Promise` em vez de iniciar
outra passada pela fila.

## Prova

- **Verificação minha (implementador — ALEGADO até a auditoria confirmar):**
  série registrada com rede bloqueada em `/treino/[id]`, navegado para a Home
  (desmontando `treino-detalhe.tsx`), rede restaurada e evento `online`
  disparado **na Home** — fila drenou sem reabrir o treino. Dado persistiu no
  servidor sem duplicata.
- **Auditoria independente, 2 rodadas** (`auditoria-independente/relatorio.md`):
  1ª rodada REPROVOU (achou a corrida acima, offline real via CDP
  `page.context().setOffline(true)`, não `window.fetch` sobrescrito — método
  mais confiável que o meu, que não bloqueava o fetch do service worker).
  2ª rodada, após o mutex, **PASSOU**: mesmo cenário de corrida repetido, só 1
  POST após reconectar (era 3-4 concorrentes antes), nenhum item novo em
  `db.falhas`.
- **4 gates verdes**, medidos por mim e de novo pela auditoria, no commit final
  `d810293`: `tsc --noEmit` · `test` 238/238 · `lint` 0 erros · `build`.

## O que NÃO foi verificado, registrado por transparência

- Caminho via Background Sync do Service Worker isolado (aba fechada,
  reabrindo só depois) — testado só o listener `online` em primeiro/segundo
  plano com aba aberta.
- Disparos triplos ou mais agressivos do evento `online` além do que o
  DevTools Protocol produz naturalmente numa transição offline→online.

## Screenshots

Não capturados como arquivo local — a auditoria independente rodou em sessão
de agente separada, com seu próprio navegador efêmero; o relatório textual
(rede e IndexedDB, citado verbatim em `auditoria-independente/relatorio.md`) é
a evidência disponível. Registrado aqui em vez de inventar prova visual que não
existe (E3).
