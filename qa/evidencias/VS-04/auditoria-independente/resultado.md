# Auditoria independente — VS-04

**Data:** 2026-08-28 · **Auditor:** Claude (sessão isolada, "Inspetor QA") · **SHA sob auditoria:** a7e1a59

## O que testei

Login via `/login` com `qa.persona@lastro.test`. Naveguei diretamente
(URL) para as 5 páginas listadas na correção e li o DOM do link
`a[href="/perfil"]` (`document.querySelector('a[href="/perfil"]').outerHTML`)
em cada uma:

| Página | `outerHTML` do avatar |
|---|---|
| `/perfil` | `<span class="avatar avatar--iniciais" ...>Q</span>` |
| `/ajustes/temas` | `<span class="avatar avatar--iniciais" ...>Q</span>` |
| `/ajustes/modelos` | `<span class="avatar avatar--iniciais" ...>Q</span>` |
| `/ajustes/modelos/novo` | `<span class="avatar avatar--iniciais" ...>Q</span>` |
| `/ajustes/anilhas` | `<span class="avatar avatar--iniciais" ...>Q</span>` |

## O que vi

Todas as 5 páginas mostram a inicial real "Q" (de `qa.persona`), igual ao
resto do app (Home, treino). Nenhuma mostra o placeholder cravado "AT".
Screenshot de `/ajustes/anilhas` anexo (`vs-04-ajustes-anilhas-avatar-Q.png`)
confirma visualmente.

## Nota — "AT" observado uma vez, fora do escopo desta correção

Durante o restante da auditoria (item VS-03), o treino real de hoje
(`9c060043-de06-421b-ad9e-3886706fd6df`) mostrou o avatar "AT" uma vez,
no meio de um erro de hidratação do React (`Hydration failed...`,
registrado em `qa/evidencias/VS-03/auditoria-independente/resultado.md`).
Recarreguei a mesma URL logo em seguida, limpo, e o avatar voltou a
mostrar "Q" normalmente. Trato isso como sintoma do problema de
hidratação (achado novo, fora do escopo dos 5 itens), não como falha de
VS-04 — a verificação acima, nas 5 páginas do escopo, foi sempre em
carregamento limpo e consistente.

## Veredito

**PASSOU.** As 5 páginas indicadas repassam `perfil` para `<CabecalhoPro>`
e mostram a inicial real do usuário.
