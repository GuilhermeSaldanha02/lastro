# Auditoria independente — TR-02

**Data:** 2026-08-28 · **Auditor:** Claude (sessão isolada, "Inspetor QA") · **SHA sob auditoria:** 0f6465e

## O que testei

Login via `/login` com `qa.persona@lastro.test`. No treino real
`9c060043-de06-421b-ad9e-3886706fd6df`:

1. Registrei uma série nova em "Supino reto com barra" (reps=9, peso=65,
   tipo "Valendo"). O indicador de sincronização mudou para "sincronizado".
2. Confirmei direto no Postgres (Supabase MCP, tabela `serie`, filtrado por
   `treino_id`): linha `683641c5-a4d5-4017-a683-f77ab80101d0`, reps=9,
   peso=65.00, `criado_em = 2026-08-28 15:12:33.181301+00`.
3. Recarreguei a página (`browser_navigate` para a mesma URL — reload
   completo, não SPA) às 15:12:45, ~12s depois da gravação.

## O que vi

A tela pós-reload já mostra "2 séries valendo" em Supino reto com barra,
com a série nova (9×65 kg) listada — não caiu no cache antigo de "1 série".
Confirmado também na Home: antes de registrar a série (15:05:42) a Home
mostrava "1,1t · 1 sessão"; numa navegação posterior à Home (15:13:59,
depois de outras interações no mesmo treino) já mostrava "PEITO TRÍCEPS
hoje · 1,7 t · 3 séries" — reflete as séries novas, sem cache antigo.
Screenshot: `tr-02-reload-mostra-serie.png`.

## Veredito

**PASSOU.** `revalidatePath` nas funções de escrita de série resolve o
cache desatualizado do Next — reload imediato após registrar já reflete o
estado real do banco.
