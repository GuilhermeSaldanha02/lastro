import { MAX_ESTAGNACOES, SEMANAS_ESTAGNACAO } from "./limiares";

/** Valores agregados de UM exercício em UMA semana, já calculados por volume.ts/e1rm.ts. */
export type ValoresSemanaisExercicio = {
  semanaInicio: string;
  /** e1RM máximo elegível da semana para o exercício. `undefined` = sem sessão elegível. */
  e1rm?: number;
  /** `undefined` = nenhuma série do exercício nesta semana (ausente, não "0 estável" — Regra da Presença). */
  volume?: number;
};

export type EntradaEstagnacao = {
  exercicio: string;
  /**
   * Semanas em ordem cronológica (mais antiga primeiro), cobrindo
   * LOOKBACK_ESTAGNACAO_SEMANAS semanas — a semana mais antiga é a linha
   * de base, não entra na contagem de "sem progresso".
   */
  semanas: ValoresSemanaisExercicio[];
};

export type Estagnacao = {
  exercicio: string;
  semanas_sem_progresso: number;
  e1rm_estavel_em?: number;
  volume_estavel_em?: number;
};

/**
 * Estagnação (KNOWLEDGE.md §1 / SDD §4.2): exercício sem melhora em e1RM
 * NEM em volume por SEMANAS_ESTAGNACAO semanas consecutivas.
 * A primeira semana da janela recebida é a linha de base (define o
 * recorde inicial); as demais são candidatas a "sem progresso". Uma
 * melhora em QUALQUER uma das duas métricas reinicia a contagem — o
 * glossário exige as duas paradas ao mesmo tempo.
 */
export function calcularEstagnacoes(
  entradas: EntradaEstagnacao[],
): Estagnacao[] {
  const resultado: Estagnacao[] = [];

  for (const entrada of entradas) {
    // Semana sem sessão (`volume === undefined`) é ausência, não "0 estável"
    // — a Regra da Presença exige que ela fique fora da conta de progresso
    // em vez de contar como "sem melhora" (achado real, revisão estática
    // qa-treino, 2026-08-05). Só semanas com sessão real entram no streak.
    const semanas = entrada.semanas.filter((s) => s.volume !== undefined) as
      (ValoresSemanaisExercicio & { volume: number })[];
    if (semanas.length < 2) continue;

    let maxE1rm = semanas[0].e1rm ?? -Infinity;
    let maxVolume = semanas[0].volume;
    let streak = 0;
    let ultimoE1rmEstavel: number | undefined = semanas[0].e1rm;
    let ultimoVolumeEstavel = semanas[0].volume;

    for (let i = 1; i < semanas.length; i++) {
      const semana = semanas[i];
      const progrediuE1rm =
        semana.e1rm !== undefined && semana.e1rm > maxE1rm;
      const progrediuVolume = semana.volume > maxVolume;

      if (!progrediuE1rm && !progrediuVolume) {
        streak += 1;
        ultimoE1rmEstavel = semana.e1rm ?? ultimoE1rmEstavel;
        ultimoVolumeEstavel = semana.volume;
      } else {
        streak = 0;
      }

      if (semana.e1rm !== undefined) maxE1rm = Math.max(maxE1rm, semana.e1rm);
      maxVolume = Math.max(maxVolume, semana.volume);
    }

    if (streak >= SEMANAS_ESTAGNACAO) {
      const entradaResultado: Estagnacao = {
        exercicio: entrada.exercicio,
        semanas_sem_progresso: streak,
      };
      if (ultimoE1rmEstavel !== undefined) {
        entradaResultado.e1rm_estavel_em = ultimoE1rmEstavel;
      }
      entradaResultado.volume_estavel_em = ultimoVolumeEstavel;
      resultado.push(entradaResultado);
    }
  }

  return resultado.slice(0, MAX_ESTAGNACOES);
}
