# OF-08 — QA-01 2026-09-24 (auditoria independente, produção, conta do dono, 375×812)

**Prova:** série recusada pelo banco não trava as séries válidas registradas depois no mesmo aparelho.

## Método e resultado
Mesmo teste e mesma evidência bruta do item OF-02 (ver `OF-02/resumo.md`, `console.txt`, `rede.txt`,
`print.png`): o mecanismo que OF-08 pede provado — item inválido não bloqueia item válido atrás dele na
fila FIFO do mesmo aparelho — é exatamente o exercido em `src/lib/offline/outbox.ts` (`sincronizar`) e
validado ali. Não há um segundo mecanismo distinto para OF-08; a diferença entre os dois IDs no QA.md é
histórica (OF-02 nasceu da fila travando; OF-08 é a "consequência A1" documentada quando o prefixo
`[erro-permanente]` sumia em produção, corrigido em `7e6f025`).

- Fila offline com 2 itens: 1 com `reps: 9999` (violação do check `serie_reps_positiva`), 1 válido
  (`reps: 8`), ambos no treino de QA.
- Rede religada: `outbox` = 0, `falhas` = 1 (só o item inválido), banco confirma a série válida gravada
  (`930157a3-4805-...`, 8 reps, 20 kg).
- Nenhuma tela "salvo no aparelho" presa, nenhum travamento de 30 s — a sincronização terminou em ~4 s.

## Veredito
PASSOU. Reproduz e confirma a correção de OF-08/A1: a série recusada pelo banco (permanentemente inválida)
não trava a série válida registrada depois dela no mesmo navegador.
