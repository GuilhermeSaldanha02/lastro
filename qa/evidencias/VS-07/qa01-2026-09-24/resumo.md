# VS-07 — URL inexistente mostra página do app (produção, 2026-09-24)

Leitura pura, sem login, produção. `main` em 06a2c90.

`https://lastro-pi.vercel.app/rota-que-nao-existe-abc123` → HTTP 404, mas a página é a do próprio app:
"Página não encontrada · 404" / "Este endereço não existe ou não é da sua conta. Nada foi perdido." / link "Voltar ao início".

Não é mais o 404 padrão do Next em inglês (relato original de 13/set). Console: só o próprio erro 404 da navegação (esperado).

Print: vs07-404.png
