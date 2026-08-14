import { calcularE1rm, elegivelParaE1rm } from "./e1rm";
import { MINIMO_SESSOES_PARA_RECORDE } from "./limiares";

export type SerieParaComparar = { reps: number; peso: number };
export type SerieHistoricaParaComparar = SerieParaComparar & { treinoId: string };

/**
 * Detecta se `nova` é recorde pessoal daquele exercício, comparando contra
 * `historico` (séries VALENDO anteriores, mesmo exercício — backlog C4,
 * 2026-08-13). Compara e1RM, não peso cru: uma série de menos reps com mais
 * peso pode "parecer" recorde e não ser, e vice-versa.
 *
 * Série fora do teto de reps confiável (`elegivelParaE1rm`, SDD §D1) nunca é
 * recorde nem entra na comparação — nem como candidata, nem como parte do
 * máximo histórico contra o qual outras séries são comparadas.
 *
 * Piso: exige `MINIMO_SESSOES_PARA_RECORDE` SESSÕES (treinos distintos)
 * anteriores daquele exercício, não só séries — sem isso, a primeira série
 * de um exercício novo sempre "bateria recorde" contra um histórico vazio,
 * e o marcador perde o sentido (achado do dono, registrado no backlog).
 */
export function ehRecorde(
  nova: SerieParaComparar,
  historico: SerieHistoricaParaComparar[],
): boolean {
  if (!elegivelParaE1rm(nova.reps)) return false;

  const sessoesAnteriores = new Set(historico.map((s) => s.treinoId)).size;
  if (sessoesAnteriores < MINIMO_SESSOES_PARA_RECORDE) return false;

  const historicoElegivel = historico.filter((s) => elegivelParaE1rm(s.reps));
  if (historicoElegivel.length === 0) return false;

  const e1rmNova = calcularE1rm(nova.reps, nova.peso);
  const e1rmMaximoAnterior = Math.max(
    ...historicoElegivel.map((s) => calcularE1rm(s.reps, s.peso)),
  );

  return e1rmNova > e1rmMaximoAnterior;
}
