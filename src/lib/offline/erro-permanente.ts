// lastro · distingue falha que NUNCA vai se resolver tentando de novo
// (dado inválido, rejeitado pela constraint do banco) de falha
// transitória (rede fora, sessão expirando) — só a primeira deve sair da
// fila offline sem esperar retry. Achado OF-02 (QA.md, 2026-08-28): sem
// essa distinção, um item permanentemente inválido travava toda série
// registrada depois dele, pra sempre, porque a fila é FIFO e para no
// primeiro item que falha (outbox.ts) — retry infinito não resolve erro
// de validação, só o esconde.
//
// O sinal é um PREFIXO na mensagem do erro, não uma subclasse, e é posto
// NO CLIENTE (`src/lib/offline/sincronizar-pendentes.ts`), a partir do
// valor que a Server Function devolve. Erro nenhum atravessa a fronteira
// de "use server" com a informação de que precisamos: a subclasse vira
// `Error` genérico, e no build de PRODUÇÃO nem a mensagem atravessa — o
// Next troca por um `digest`. A versão anterior deste comentário dizia
// que a mensagem atravessava intacta; valia só no `next dev`, e a fila
// travava em produção (achado A1, QA, 2026-09-13).
const PREFIXO = "[erro-permanente] ";

/** Marca uma mensagem de erro como permanente (nunca vai se resolver com retry). */
export function marcarComoPermanente(mensagem: string): string {
  return `${PREFIXO}${mensagem}`;
}

/** Detecta o marcador do lado de quem trata o erro (outbox.ts, no cliente). */
export function ehErroPermanente(erro: unknown): boolean {
  return erro instanceof Error && erro.message.startsWith(PREFIXO);
}

/**
 * Classes de erro do Postgres que nunca se resolvem tentando de novo:
 * `22` = data exception (ex.: tipo/formato inválido), `23` = integrity
 * constraint violation (ex.: check, not-null, foreign key, unique).
 * Referência: https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export function ehErroPermanenteDoPostgres(codigo: string | undefined): boolean {
  return codigo !== undefined && (codigo.startsWith("22") || codigo.startsWith("23"));
}
