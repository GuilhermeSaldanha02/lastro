// lastro · Trilha A, item A1 — o nome do parâmetro de retorno e a única
// função que decide se o valor dele pode virar destino de redirecionamento.
//
// Existia um parâmetro morto de cada lado: `src/proxy.ts` escrevia
// `?proximo=` e ninguém lia; `auth/callback` lia `?next=` e ninguém
// escrevia. Resultado: abrir /analise sem sessão levava ao login e, depois
// de entrar, caía em `/`. O nome agora é um só, e mora aqui — quem escreve
// e quem lê importam a mesma constante, então as duas pontas não podem mais
// divergir em silêncio.

/** Nome do parâmetro de consulta, em todas as pontas. */
export const PARAM_RETORNO = "proximo";

/** Destino quando não há retorno pedido, ou quando o pedido é inseguro. */
const ROTA_PADRAO = "/";

/**
 * O valor vem da URL, ou seja, de fora — qualquer um pode forjar o link.
 * Sem esta trava, `?proximo=//site-malicioso` transformaria o login num
 * redirecionamento aberto, usando o domínio do lastro como fachada.
 *
 * Só passa caminho relativo à própria origem. Além do par que o callback já
 * exigia (começa com `/` e não começa com `//`), rejeita:
 *
 * - **barra invertida** — o navegador trata `\` como `/` ao normalizar, então
 *   `/\evil.com` vira `//evil.com` e escapa da checagem de prefixo sozinho;
 * - **caractere de controle** (tab, CR, LF, NUL) — são descartados na
 *   normalização da URL, então tab entre as barras também vira `//evil.com`.
 *
 * As duas passariam pela checagem original. Isto aperta, nunca afrouxa.
 */
export function sanitizarRotaDeRetorno(
  bruto: string | null | undefined,
): string {
  if (!bruto) return ROTA_PADRAO;
  for (const caractere of bruto) {
    const codigo = caractere.codePointAt(0) ?? 0;
    if (codigo < 0x20 || codigo === 0x7f) return ROTA_PADRAO;
  }
  if (bruto.includes("\\")) return ROTA_PADRAO;
  if (!bruto.startsWith("/") || bruto.startsWith("//")) return ROTA_PADRAO;
  return bruto;
}
