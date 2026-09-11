/**
 * O telefone e o link — PRD §11.7.
 *
 * Função pura, testada, sem import de rede. Existe separada porque
 * número de WhatsApp malformado falha do pior jeito possível: o
 * `wa.me` ABRE, mostra "número de telefone inválido" ou um contato
 * vazio, e nada no lastro registra erro nenhum. É a forma de falha
 * recorrente deste projeto (o `Intl` caindo para en-US sem lançar, a
 * coluna do PDF espremendo sem avisar) — então a validação é na
 * ESCRITA, com o formato canônico no banco.
 */

/** País padrão quando o número vem sem código. Decisão: o app é pt-BR. */
const CODIGO_BRASIL = "55";

/**
 * Normaliza para E.164 sem o `+` — só dígitos, com código de país. É o
 * formato que o `wa.me` exige e o mesmo que a constraint
 * `usuario_telefone_e164_sem_mais` (migração 0022) aceita.
 *
 * Devolve `null` para o que não dá para salvar, em vez de um palpite:
 * telefone errado silenciosamente é pior do que telefone ausente, porque
 * o ausente a tela consegue pedir de novo.
 *
 * As regras, e por que cada uma:
 *
 * - **10 ou 11 dígitos** → falta o código do país. São `DDD + número`
 *   (fixo antigo de 8 dígitos, ou celular de 9). Prefixa `55`.
 * - **12 ou 13 começando com 55** → já é brasileiro completo, passa.
 * - **12 a 15 dígitos** → já tem algum código de país. Passa sem
 *   reescrever: inventar país para número estrangeiro seria adivinhar.
 * - **Zero à esquerda** é prefixo de operadora ou de DDD digitado com o
 *   zero (`083`), nunca parte do número em E.164 — sai antes de contar.
 */
export function normalizarTelefoneWhatsApp(bruto: string): string | null {
  const digitos = (bruto ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (digitos.length === 0) return null;

  if (digitos.length === 10 || digitos.length === 11) {
    return `${CODIGO_BRASIL}${digitos}`;
  }
  if (digitos.length >= 12 && digitos.length <= 15) {
    return digitos;
  }
  return null;
}

/** Mesma checagem da constraint do banco — a tela não pode ser mais frouxa. */
export function telefoneValidoParaLink(telefone: string): boolean {
  return /^[1-9][0-9]{9,14}$/.test(telefone);
}

/**
 * O link que o botão do §11.7 abre: WhatsApp do PERSONAL, conversa com o
 * aluno, mensagem já escrita. Quem aperta enviar é a pessoa — o lastro
 * compõe e entrega, nunca envia.
 *
 * `wa.me` e não a API do WhatsApp Business: a API cobra por mensagem,
 * exige template aprovado e número dedicado, e nada disso é necessário
 * para um link (DECISIONS.md "2026-09-10 (8)").
 */
export function linkWhatsApp(telefone: string, mensagem: string): string | null {
  if (!telefoneValidoParaLink(telefone)) return null;
  return `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
}

/** Só para exibir de volta a quem digitou: `+55 83 99999-8888`. */
export function formatarTelefoneBrasil(telefone: string): string {
  const brasileiro = /^55(\d{2})(\d{4,5})(\d{4})$/.exec(telefone);
  if (!brasileiro) return `+${telefone}`;
  const [, ddd, inicio, fim] = brasileiro;
  return `+55 ${ddd} ${inicio}-${fim}`;
}
