# OF-04 — QA-01 2026-09-24

**Prova pedida:** série pendente de uma conta não trava a fila da conta seguinte no MESMO navegador.

## NÃO EXECUTADO (bloqueado)

Reproduzir este cenário exige ter duas contas diferentes logadas em sequência no mesmo navegador (a
fila é por navegador, não por conta — ver comentário em `src/lib/offline/db.ts`). As regras desta auditoria
proíbem explicitamente login/logout na sessão (o navegador já está autenticado na conta real do dono e não
pode ser desconectado). Não há como alternar de conta sem violar essa restrição.

## O que se sabe do código (não testado ao vivo)
`src/lib/offline/outbox.ts` e `conta-da-sessao.ts` implementam o filtro por `usuarioId`: `sincronizar()`
só processa itens da conta da sessão local (ou sem dono); item de outra conta fica intocado na fila. A
correção é de `b9b4813` (fix M1, 2026-09-13) e tem testes unitários (`outbox.test.ts`,
`sincronizar-pendentes.test.ts`) que cobrem exatamente essa regra — não auditados nesta sessão.

Registrado como NÃO EXECUTADO (bloqueado), não como PASSOU nem REPROVOU.
