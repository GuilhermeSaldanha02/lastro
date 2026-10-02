// lastro · AN-08 A2 (prontidão, versão mínima) — o sinal de hoje contra a média
// da PRÓPRIA pessoa. Sem índice único de 0 a 100, sem dizer se é bom ou ruim
// (dor "acima" é mais dor, sono "acima" é mais sono) e sem recomendar nada:
// só o fato, em palavras. Módulo puro; nunca vai para a IA.

/** Dias anteriores necessários, por sinal, antes de mostrar qualquer comparação. */
export const MINIMO_DE_DIAS = 4;
/** Quantos dias anteriores entram na média. */
export const JANELA_DE_DIAS = 14;
/** Diferença (em pontos) a partir da qual a nota conta como acima ou abaixo da média. */
export const FOLGA = 1;

export type ComparacaoComMedia = "acima" | "abaixo" | "na-media";

/**
 * `anteriores`: as notas do mesmo sinal nos dias ANTERIORES a hoje (as nulas, de
 * dia sem resposta nesse sinal, são ignoradas). Devolve `null` quando a
 * pessoa ainda não tem histórico suficiente ou não respondeu o sinal hoje.
 */
export function compararComMedia(hoje: number | null, anteriores: Array<number | null>): ComparacaoComMedia | null {
  if (hoje === null) return null;
  const validas = anteriores.filter((n): n is number => n !== null).slice(0, JANELA_DE_DIAS);
  if (validas.length < MINIMO_DE_DIAS) return null;
  const media = validas.reduce((soma, n) => soma + n, 0) / validas.length;
  const diferenca = hoje - media;
  if (diferenca >= FOLGA) return "acima";
  if (diferenca <= -FOLGA) return "abaixo";
  return "na-media";
}
