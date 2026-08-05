import { MAX_PRS } from "./limiares";

/**
 * Entrada já reduzida pela camada de agregação: os máximos precisam vir
 * comparados contra o HISTÓRICO COMPLETO do exercício (SDD §D2), não a
 * janela de 4 semanas — um máximo de 4 semanas não é recorde.
 */
export type EntradaPr = {
  exercicio: string;
  e1rmSemanaAtual?: number;
  e1rmMaximoHistoricoAnterior?: number;
  volumeSemanaAtual?: number;
  volumeMaximoHistoricoAnterior?: number;
};

export type Pr = {
  exercicio: string;
  tipo: "e1rm" | "volume";
  valor: number;
  valor_anterior: number;
};

/**
 * PR = recorde contra TODO o histórico do exercício (excluindo a semana
 * atual da marca anterior), não contra a janela de comparação (SDD §D2,
 * T-P2). Um exercício pode gerar até dois PRs (e1RM e volume).
 */
export function calcularPrs(entradas: EntradaPr[]): Pr[] {
  const prs: Pr[] = [];

  for (const entrada of entradas) {
    if (
      entrada.e1rmSemanaAtual !== undefined &&
      entrada.e1rmMaximoHistoricoAnterior !== undefined &&
      entrada.e1rmSemanaAtual > entrada.e1rmMaximoHistoricoAnterior
    ) {
      prs.push({
        exercicio: entrada.exercicio,
        tipo: "e1rm",
        valor: entrada.e1rmSemanaAtual,
        valor_anterior: entrada.e1rmMaximoHistoricoAnterior,
      });
    }

    if (
      entrada.volumeSemanaAtual !== undefined &&
      entrada.volumeMaximoHistoricoAnterior !== undefined &&
      entrada.volumeSemanaAtual > entrada.volumeMaximoHistoricoAnterior
    ) {
      prs.push({
        exercicio: entrada.exercicio,
        tipo: "volume",
        valor: entrada.volumeSemanaAtual,
        valor_anterior: entrada.volumeMaximoHistoricoAnterior,
      });
    }
  }

  return prs.slice(0, MAX_PRS);
}
