// lastro · distingue falha que NUNCA vai se resolver tentando de novo
// (dado inválido, rejeitado pela constraint do banco) de falha
// transitória (rede fora, sessão expirando) — só a primeira deve sair da
// fila offline sem esperar retry. Achado OF-02 (QA.md, 2026-08-28): sem
// essa distinção, um item permanentemente inválido travava toda série
// registrada depois dele, pra sempre, porque a fila é FIFO e para no
// primeiro item que falha (outbox.ts) — retry infinito não resolve erro
// de validação, só o esconde.
//
// O sinal viaja como PREFIXO na mensagem do erro, não como subclasse: as
// funções que lançam isto (src/lib/dados/treino.ts) rodam atrás de
// "use server" e são chamadas via Server Function a partir do cliente
// (outbox.ts, "use client") — o Next serializa o erro na travessia dessa
// fronteira e reconstrói só um `Error` genérico do lado do cliente, sem
// preservar a subclasse original. `instanceof` quebraria em silêncio.
// A mensagem, essa, atravessa intacta.
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
