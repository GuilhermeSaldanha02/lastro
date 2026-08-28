# Correção aplicada — 2026-08-28

## Causa raiz

`criarSerieRemoto`/`atualizarSerieRemoto`/`excluirSerieRemoto`
(`src/lib/dados/treino.ts`) gravam direto no Supabase a partir do cliente
(D6 — offline-first, sem `await` de rede no caminho crítico) e **nunca
chamavam `revalidatePath`** — decisão original documentada no código:
"quem chama já atualizou a UI de forma otimista". Isso cobre a sessão
ATUAL (quem acabou de registrar vê a série na hora, via estado local do
React), mas não avisa o cache de dados do Next de que a página mudou. Uma
navegação FUTURA pra essa mesma URL (recarregar, voltar depois, abrir em
outro aparelho) podia servir a versão cacheada antiga — a série nunca se
perdia no banco, só a tela mentia por um tempo, até o cache expirar
sozinho.

## O que mudou

As três funções (`criarSerieRemoto`, `atualizarSerieRemoto`,
`excluirSerieRemoto`) agora chamam `revalidatePath("/treino/[id]", "page")`
(o padrão do template dinâmico, sem precisar do id específico) **e**
`revalidatePath("/")` (a Home mostra volume/sessões de hoje, sujeita à
mesma classe de bug) depois de uma escrita bem-sucedida. Continua sem
`await` de rede: `revalidatePath` só marca o cache do servidor como velho,
síncrono, na mesma chamada que já grava a série — não força re-render de
quem está no meio do treino agora, só garante que a PRÓXIMA navegação vê
o dado real.

## Prova

**Reprodução ao vivo (Playwright, mesma sequência do achado original):**
registrei uma série real (reps=9, peso=65) no treino de teste, confirmei
no Postgres direto (`select` via Supabase MCP, `criado_em` 14:05:10), e
recarreguei a página **imediatamente** (`page.goto`, ~16s depois).
Resultado: "2 séries valendo" — as duas séries aparecem corretas de
cara, sem esperar minutos. Confirmado também na Home (`/`): volume
1,3t / 2 séries, atualizado no mesmo reload.

**Suite completa:** `npx tsc --noEmit` limpo, 238/238 testes, `npm run
lint` 0 erros, `npm run build` sem falhas.
