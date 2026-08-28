# Correção aplicada — 2026-08-28

## Causa raiz

`src/components/cabecalho-pro.tsx` cai no placeholder cravado
`<div className="topo-avatar">AT</div>` sempre que a página não passa a
prop `perfil`. 5 páginas buscavam `perfil` via `obterPerfil()` (só pra
pegar o idioma) mas esqueciam de repassar pro `<CabecalhoPro>`.

## O que mudou

Adicionado `perfil={perfil}` em `<CabecalhoPro>` nas 5 páginas:
`src/app/perfil/page.tsx`, `src/app/ajustes/temas/page.tsx`,
`src/app/ajustes/modelos/page.tsx`, `src/app/ajustes/modelos/novo/page.tsx`,
`src/app/ajustes/anilhas/page.tsx`.

## Prova

Naveguei pelas 5 páginas ao vivo (Playwright) e conferi o texto do link
`[href="/perfil"]` no cabeçalho — as 5 mostram "Q" (inicial real da
`qa.persona`, igual ao resto do app), nenhuma mostra mais "AT". Ver
`print.png` (achado original) vs. a leitura direta do DOM pós-correção
registrada no commit.

**Nenhuma variante de modal** (`src/app/@modal/(.)perfil`,
`(.)ajustes/anilhas`, `(.)ajustes/modelos/novo`) usa `<CabecalhoPro>` —
confirmado por busca, fora do escopo deste bug.

**Suite completa:** `npx tsc --noEmit` limpo, 238/238 testes, `npm run
lint` 0 erros, `npm run build` sem falhas.
