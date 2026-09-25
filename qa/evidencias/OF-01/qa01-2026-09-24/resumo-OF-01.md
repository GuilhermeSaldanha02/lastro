# OF-01 — Service Worker / Offline

**Resultado: PASSOU**

Executado via `navigator.serviceWorker.getRegistrations()`, `caches.keys()` e `indexedDB.databases()` na página de produção:

- Service Worker registrado e ativo: scope `https://lastro-pi.vercel.app/`, state `activated`, `navigator.serviceWorker.controller` = true.
- Cache Storage: 1 cache nomeado `lastro-offline-v3`.
- IndexedDB: banco `lastro` versão 20 presente.

Não foi forçado modo offline, apenas confirmado registro e presença de estrutura de persistência, conforme escopo.

Evidência: resultado do browser_evaluate registrado neste resumo (sem screenshot, dado não-visual).
