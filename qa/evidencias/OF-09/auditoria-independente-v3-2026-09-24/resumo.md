# OF-09 v3 — auditoria independente (2026-09-24)

Produção https://lastro-pi.vercel.app, Chromium do Playwright MCP, 375×812, conta do dono.
Método por tentativa: abrir /treino online → `context.setOffline(true)` → `page.goto(alvo)` → conferir `lang`/título/texto → esperar N s → `setOffline(false)` → sem tocar em nada, sondar a cada 100 ms se o texto "Sem conexão" sumiu (limite 10 s).

Cache do SW (`caches.keys()`): `["lastro-offline-v3"]` (antes e depois). SW ativo: /sw.js.

| # | alvo | offline (s) | página offline (lang · título) | voltou sozinha? | tempo |
|---|---|---|---|---|---|
| 1 | /ajustes | 0,2 | pt-BR · lastro — sem conexão | sim | 917 ms |
| 2 | /treino | 1 | pt-BR · idem | sim | 718 ms |
| 3 | / | 3 | pt-BR · idem | sim | 1012 ms |
| 4 | /ajustes | 0,5 | pt-BR · idem | sim | 578 ms |
| 5 | /treino | 8 | pt-BR · idem | sim | 612 ms |
| 6 | /ajustes | 2 | pt-BR · idem | sim | 465 ms |
| 7 | / | 15 | pt-BR · idem | sim | 562 ms |
| 8 | /treino | 0,1 | pt-BR · idem | sim | 469 ms |
| 9 | /ajustes | 30 | pt-BR · idem | sim | 687 ms |
| 10 | / | 4,9 | pt-BR · idem | sim | 563 ms |
| 11 | /treino | 6,05 | pt-BR · idem | sim | 609 ms |
| 12 | /ajustes | 0,05 | pt-BR · idem | sim | 461 ms |
| 13 | /treino | 45 | pt-BR · idem | sim | 1286 ms |
| 14 | / | 1,95 | pt-BR · idem | sim | 2578 ms |
| 15 | /ajustes | 12,3 | pt-BR · idem | sim | 889 ms |

15/15 voltaram sozinhas; mín 461 ms, máx 2578 ms (todas < 6 s).
Granularidade da medição: 100 ms. "Voltou" = texto "Sem conexão" ausente do body (a URL já é a do app porque a página offline é servida na própria URL).

Não verificado: iPhone/Safari real (só Chromium com rede emulada); rede instável/parcial (só liga/desliga total).

**Veredito: PASSOU.**

Prints: OF09-offline-t1.png, OF09-voltou-t1.png, OF09-final.png. console.txt, rede.txt.
