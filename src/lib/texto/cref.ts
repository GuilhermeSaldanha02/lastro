/**
 * lastro · CREF — o registro profissional de quem tem conta de personal
 * (PRD §11, emenda de 2026-09-11).
 *
 * FONTE DO FORMATO: Resolução CONFEF 053/2003, como publicada pelos
 * conselhos regionais — "a palavra CREF, seguida de 06 dígitos
 * correspondentes ao número de registro, hífen, a letra G (graduado) ou P
 * (provisionado), barra, sigla da UF" e sufixo `-S` para registro
 * secundário. Não é convenção inventada aqui: o número é impresso assim na
 * carteira e é assim que o profissional escreve nas redes.
 *
 * O QUE ESTE ARQUIVO NÃO FAZ, e é a parte que importa: **não verifica se o
 * registro existe.** Verificar exigiria consultar o CONFEF, que não expõe
 * API pública. Validar forma e chamar isso de credencial verificada seria
 * o lastro emprestando confiança que não apurou — e alguém um dia
 * escolheria um profissional com base nisso. Toda tela que exibir o CREF
 * diz que ele foi INFORMADO, não verificado.
 *
 * Aqui a validação é ESTRITA (seis dígitos, UF que existe), ao contrário
 * da check do banco (`usuario_cref_formato`, migração 0024), que é frouxa
 * de propósito. A razão é a mesma do telefone: no formulário a pessoa LÊ o
 * erro e corrige; no banco, regra apertada vira porta trancada sem
 * mensagem, dentro de um insert em `auth.users` que não pode falhar.
 */

/** As 27 unidades federativas. Sem elas, "000000-G/XX" passaria. */
const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
  "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
  "SP", "SE", "TO",
] as const;

/** Seis dígitos · categoria G ou P · UF · sufixo -S opcional (registro secundário). */
const FORMATO = /^([0-9]{6})-([GP])\/([A-Z]{2})(-S)?$/;

/**
 * Tira o prefixo "CREF", espaços e caixa baixa, devolvendo a forma que vai
 * ao banco. Não valida — quem valida é `crefValido`.
 *
 * Aceita o que a pessoa realmente digita: "CREF 123456-G/PB",
 * "cref123456g/pb" não (falta a pontuação, e inventar onde colocá-la seria
 * adivinhar o número dos outros).
 */
export function normalizarCref(bruto: string): string {
  return bruto
    .trim()
    .toUpperCase()
    .replace(/^CREF\s*/i, "")
    .replace(/\s+/g, "");
}

export function crefValido(valor: string): boolean {
  const m = FORMATO.exec(normalizarCref(valor));
  if (!m) return false;
  return (UFS as readonly string[]).includes(m[3]);
}

/** Como o CREF aparece na tela: com o prefixo, como na carteira. */
export function formatarCref(cref: string): string {
  return `CREF ${normalizarCref(cref)}`;
}

/**
 * A frase que acompanha o número em QUALQUER tela que o exiba.
 *
 * Mora aqui, e não solta no componente, porque é uma afirmação sobre o que
 * o produto apurou — se um dia o lastro passar a verificar de verdade,
 * muda num lugar só, e nenhuma tela fica dizendo o contrário.
 */
export const AVISO_CREF_NAO_VERIFICADO =
  "Informado pelo profissional. O lastro não verifica registro no CONFEF.";
