# Auditoria independente — OF-03 (sincronização global da fila offline)

Duas rodadas, agente separado (`general-purpose`, contexto limpo — não viu a
implementação, só o diff e a descrição do achado). Transcrito verbatim das
respostas do agente, sem edição de conteúdo.

---

## Rodada 1 — REPROVADO (commit `dff6830`)

> Usuário QA removido, cascade confirmado (`sobrou: 0`).
>
> **Veredito: REPROVADO**
>
> **O que verifiquei de fato:**
> - Diff real (`git diff main origin/fix/sincronizacao-global`) bate exatamente
>   com a descrição: extração de `sincronizarPendentes` para módulo
>   compartilhado, `SincronizadorGlobal` montado no `layout.tsx`,
>   `treino-detalhe.tsx` mantendo seu próprio listener `online`/SW em paralelo.
> - Reproduzi o cenário original do achado (offline real via
>   `page.context().setOffline(true)` no CDP, não `window.fetch` — confirmei
>   `navigator.onLine === false`): registrei série offline em `/treino/[id]`,
>   saí pra Home, restaurei a rede, e a fila esvaziou **sem reabrir o treino**
>   — o defeito relatado pelo dono está corrigido.
> - **Reproduzi ao vivo a corrida entre os dois listeners** (o risco que o
>   comentário do PR alega ser seguro): fiquei montado em `/treino/[id]` (onde
>   global + local coexistem), registrei uma 2ª série offline, restaurei a
>   rede. Capturei via `browser_network_requests` 3 POSTs concorrentes pro
>   mesmo server action, sendo 1× `200 OK` e 3× `500`. O corpo do erro 500:
>   `"[erro-permanente] Falha ao registrar série: duplicate key value violates
>   unique constraint \"serie_pkey\""`.
> - Confirmei via IndexedDB que **as duas séries realmente sincronizaram no
>   servidor** (Postgres bloqueou a segunda inserção pelo PK, então não há
>   duplicata de dado), mas ambos os itens acabaram indevidamente movidos para
>   `db.falhas` como "erro permanente" — mesmo tendo sido gravados com sucesso.
>   `sincronizar()` não é idempotente contra chamadas concorrentes: ele lê
>   `db.outbox.toArray()` sem lock; duas invocações simultâneas pegam o mesmo
>   item, ambas tentam `criarSerieRemoto`, uma vence e a perdedora trata a
>   rejeição do Postgres como falha permanente e descarta o item da fila para
>   `db.falhas`.
> - Rodei os 4 gates na branch: `tsc --noEmit` (EXIT 0), `npm run test`
>   (238/238, EXIT 0), `npm run lint` (EXIT 0, só avisos pré-existentes em
>   scripts), `npm run build` (EXIT 0).
>
> **O que não verifiquei:** não testei o caminho via Background Sync do
> Service Worker (aba fechada) nem RIR fora de faixa / outros erros
> permanentes reais interagindo com essa corrida; também não medi latência de
> rede real (só o corte determinístico via DevTools Protocol).
>
> **Achado de risco real (bloqueante):**
> - `src/lib/offline/outbox.ts`, função `sincronizar` (linhas ~62-88): não
>   protegida contra chamadas concorrentes. Cenário: dono está em
>   `/treino/[id]` (onde `SincronizadorGlobal` + o listener local de
>   `treino-detalhe.tsx` coexistem, por design do PR), registra série offline,
>   rede volta — os dois listeners disparam `sincronizarPendentes()` quase
>   simultaneamente para o mesmo item pendente. Um dos dois recebe erro de PK
>   duplicada do Postgres, que o app classifica como **erro permanente**,
>   movendo a série (já sincronizada com sucesso) para `db.falhas`. Efeito
>   prático: o indicador de sync/qualquer tela futura que leia
>   `contarFalhas()` reporta uma série como "perdida/descartada" quando na
>   verdade ela está salva no servidor — dado íntegro, mas o registro de fila
>   mente sobre isso. O comentário do PR ("idempotente, sem corrida") está
>   incorreto.
>
> **Gates:** tsc OK · testes 238/238 OK · lint OK · build OK.
>
> **Usuário QA:** criado (`qa-auditor-sync-global@teste.com`) e apagado ao
> final, cascade confirmado = 0.

---

## Rodada 2 — PASSOU (commit `d810293`, após o mutex)

> Usuário QA removido, cascade confirmado (`sobrou: 0`).
>
> **Veredito: PASSOU**
>
> **O que verifiquei de fato:**
> - Puxei o commit novo (`d810293`, "fix(offline): mutex evita corrida entre
>   sincronizador global e local") em `fix/sincronizacao-global`. O código:
>   `sincronizar-pendentes.ts` agora guarda a promise em andamento em
>   `emAndamento` (variável de módulo); uma segunda chamada enquanto a
>   primeira roda recebe a MESMA promise em vez de disparar outra passada,
>   com `.finally()` limpando ao terminar. Correto no princípio — como
>   `treino-detalhe.tsx` e `sincronizador-global.tsx` importam do mesmo
>   módulo compartilhado, ambos veem o mesmo `emAndamento`.
> - Repeti exatamente o teste que reprovou antes, com usuário QA descartável
>   novo (`qa-auditor-mutex-retest@teste.com`), offline real via
>   `page.context().setOffline(true)` (CDP, `navigator.onLine` confirmado
>   `false`): montado em `/treino/[id]`, registrei a 1ª série online
>   (sincronizou, indicador "sincronizado"), fui offline, registrei a 2ª
>   série ("Repetir série") — confirmei via IndexedDB que caiu na fila
>   (1 item, `tentativas:1`). Restaurei a rede com os dois listeners (global
>   + local) coexistindo na mesma tela.
> - Via `browser_network_requests`: dessa vez só **1 POST** após a rede
>   voltar (200 OK) — nenhum concorrente, nenhum 500 de `duplicate key`.
>   Antes da correção eram 3-4 POSTs simultâneos com `duplicate key value
>   violates unique constraint "serie_pkey"`.
> - Via IndexedDB: `outbox` vazio, e **nenhum item novo** foi parar em
>   `db.falhas` para este treino/série (os 4 registros residuais ali
>   pertencem ao teste anterior, de um treino/usuário já apagado — resíduo
>   esperado do IndexedDB do mesmo perfil de browser, não um achado novo).
> - UI final: 2 séries corretas no treino, indicador "sincronizado" — sem
>   duplicidade visível.
>
> **O que não verifiquei:** não repeti o caminho via Background Sync do SW
> isoladamente, nem testei disparos triplos/mais agressivos do evento
> `online` além do que o CDP produziu naturalmente ao alternar
> offline→online uma vez.
>
> **Achados:** nenhum novo. O achado da rodada anterior (corrida global×local
> causando descarte indevido em `db.falhas`) está corrigido.
>
> **Gates (branch atualizada, commit `d810293`):** `tsc --noEmit` EXIT 0 ·
> `npm run test` 238/238 EXIT 0 · `npm run lint` EXIT 0 (só avisos
> pré-existentes em scripts) · `npm run build` EXIT 0.
>
> **Usuário QA:** criado e apagado ao final; cascade confirmado = 0.
