/**
 * lastro · regras PURAS do fim de treino no servidor (migration
 * 20260924152633_treino_finalizado_em). Ficam fora de `treino.ts` porque
 * arquivo "use server" só exporta função assíncrona, e fora de
 * `marcos-treino.ts` porque aqui não há `localStorage` nenhum — é a parte
 * que erra em silêncio e o ambiente de teste é `node`.
 */

/**
 * Instante de fim que o servidor aceita: o que o aparelho mandou, preso
 * entre o início do treino e agora. Sem valor (ou inválido), é agora.
 * Relógio do aparelho adiantado não grava fim no futuro; atrasado não grava
 * fim antes do início.
 */
export function limitarFimMs(
  fimIso: string | undefined,
  inicioMs: number,
  agoraMs: number,
): number {
  const pedido = fimIso ? new Date(fimIso).getTime() : NaN;
  const fim = Number.isNaN(pedido) ? agoraMs : pedido;
  return Math.min(agoraMs, Math.max(inicioMs, fim));
}

/**
 * Duração do cronômetro do aparelho, validada: inteiro, ≥ 0 e nunca maior
 * que `fim − início`. O CHECK do banco só barra negativo. Fora disso,
 * `null` — o banco guarda "não medido", nunca um chute.
 */
export function limitarDuracao(
  duracaoSegundos: number | undefined,
  inicioMs: number,
  fimMs: number,
): number | null {
  if (duracaoSegundos === undefined || !Number.isFinite(duracaoSegundos)) return null;
  const teto = Math.max(0, Math.floor((fimMs - inicioMs) / 1000));
  return Math.min(teto, Math.max(0, Math.floor(duracaoSegundos)));
}

/**
 * O que fazer com a marca LOCAL de fim ao abrir o treino.
 *
 * A marca local tem um significado só: espelho do servidor. A exceção é a
 * marca SEM confirmação (`lastro_fim_servidor_<id>` ausente): ela nasceu
 * do código antigo (só localStorage) ou de um "Finalizar" que não chegou ao
 * servidor (offline). Só nesse caso o aparelho manda o fim para o banco.
 *
 * Marca confirmada nunca é reenviada. Sem isso, um aparelho com espelho
 * velho refinalizaria um treino que foi REABERTO em outro aparelho.
 */
export function decidirReconciliacao({
  fimLocalMs,
  fimServidorMs,
  confirmadoPeloServidor,
}: {
  fimLocalMs: number | null;
  fimServidorMs: number | null;
  confirmadoPeloServidor: boolean;
}): "enviar" | "espelhar" {
  if (!confirmadoPeloServidor && fimLocalMs !== null && fimServidorMs === null) {
    return "enviar";
  }
  return "espelhar";
}
