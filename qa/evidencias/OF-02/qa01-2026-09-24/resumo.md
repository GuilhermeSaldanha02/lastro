# OF-02 — QA-01 2026-09-24 (auditoria independente, produção, conta do dono, 375×812)

**Prova:** fila de sincronização (outbox) não trava para sempre quando um item é permanentemente inválido.

## Método
Como a validação no formulário (TR-06/07, já PASSOU) bloqueia entradas inválidas antes de entrarem na fila,
o cenário original de OF-02 (item permanentemente inválido a caminho do servidor) só é reproduzível
escrevendo direto no IndexedDB (`lastro` → `outbox`), contornando a UI — não o servidor. Isso ainda exercita
o mecanismo real (`src/lib/offline/outbox.ts` + `erro-permanente.ts`) contra o Postgres de produção.

1. `page.context().setOffline(true)`.
2. Inseridos 2 itens `criar_serie` na fila, no treino de QA `9db03743-205e-4eaf-95f3-2b45dd3b0ed0`, exercício
   "Puxada triângulo" (`6e536129-e438-4b15-862d-0c3f531b82c5`):
   - item 1 (ordem 1, mais antigo): `reps: 9999` — viola `serie_reps_positiva check (reps > 0 and reps <= 200)`.
   - item 2 (ordem 2): `reps: 8` — válido.
3. `page.context().setOffline(false)` + `window.dispatchEvent(new Event('online'))`.
4. Aguardado 4 s e lida a fila (`outbox`/`falhas`) e o banco.

## Obtido
- `outbox`: 0 itens (drenou por completo).
- `falhas`: 1 item — o de `reps: 9999`, mensagem `[erro-permanente] Falha ao registrar série: new row for
  relation "serie" violates check constraint "serie_reps_positiva"`.
- Banco (`select * from serie where treino_id = '9db03743...'`): a série válida (`930157a3-4805-...`,
  8 reps, 20 kg, ordem 2) **chegou ao banco**, mesmo estando atrás do item inválido na fila FIFO.
- Console: 0 erros.

## Veredito
PASSOU. O item permanentemente inválido saiu para `db.falhas` e não travou a série válida registrada
depois dele — comportamento consistente com o texto do QA.md (correção original de 2026-08-28,
reconfirmada aqui em produção).

Nota: a primeira tentativa deste teste usou um payload próprio inválido por engano (`rir` preenchido em
série tipo "aquecimento", que viola `serie_rir_so_valendo`) — os dois itens foram para `falhas`. Identificado
o erro de setup (não do app), o teste foi refeito com `rir: null` no item "válido", confirmando o resultado
acima.
