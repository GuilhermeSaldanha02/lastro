/**
 * Toque duplo no celular (TR-11 e TR-13, QA.md 2026-09-23). Dois toques em
 * 18–42 ms gravavam duas séries em "Repetir série" e confirmavam
 * "Finalizar Treino" sem a pessoa ler a confirmação, porque o botão de
 * confirmar nasce sob o dedo. Um segundo toque dentro desta janela é o
 * mesmo gesto, não uma decisão nova: ninguém registra outra série nem lê
 * uma confirmação em meio segundo.
 */
export const JANELA_TOQUE_DUPLO_MS = 500;

/** Aceita um toque e recusa os que chegarem na janela do último aceito. */
export function criarGuardaDeToque(janelaMs: number = JANELA_TOQUE_DUPLO_MS) {
  let ultimoAceitoEm: number | null = null;
  return {
    aceitar(agora: number): boolean {
      if (ultimoAceitoEm !== null && agora - ultimoAceitoEm < janelaMs) return false;
      ultimoAceitoEm = agora;
      return true;
    },
  };
}

/** `true` quando o toque chegou cedo demais depois de `desde` (ex.: a confirmação aparecer). */
export function toqueCedoDemais(
  desde: number | null,
  agora: number,
  janelaMs: number = JANELA_TOQUE_DUPLO_MS,
): boolean {
  return desde !== null && agora - desde < janelaMs;
}
