import type { SerieValendo } from "./tipos";

export type ResultadoFrequencia = {
  treinos_semana_atual: number;
  media_semanas_anteriores?: number;
  grupos_sem_estimulo: string[];
};

/**
 * Frequência de treino (SDD §D2).
 * `seriesValendoJanela` cobre a JANELA INTEIRA (semana atual + anteriores
 * de comparação) — necessário para `grupos_sem_estimulo`, que é "na
 * janela inteira", não só na semana atual.
 */
export function calcularFrequencia(params: {
  seriesValendoJanela: SerieValendo[];
  semanaAtual: string;
  semanasAnterioresComparacao: string[];
  gruposMusculares: string[];
}): ResultadoFrequencia {
  const {
    seriesValendoJanela,
    semanaAtual,
    semanasAnterioresComparacao,
    gruposMusculares,
  } = params;

  const treinosPorSemana = new Map<string, Set<string>>();
  const gruposComEstimulo = new Set<string>();
  for (const serie of seriesValendoJanela) {
    if (!treinosPorSemana.has(serie.semanaInicio)) {
      treinosPorSemana.set(serie.semanaInicio, new Set());
    }
    treinosPorSemana.get(serie.semanaInicio)!.add(serie.treinoId);
    gruposComEstimulo.add(serie.grupoMuscular);
  }

  const treinosSemanaAtual = treinosPorSemana.get(semanaAtual)?.size ?? 0;

  // Só semanas COM dados entram na média (SDD: "média nas semanas
  // anteriores com dados") — semana sem nenhum treino não é 0 aqui, é
  // excluída do denominador.
  const semanasComDadosAnteriores = semanasAnterioresComparacao.filter(
    (semana) => (treinosPorSemana.get(semana)?.size ?? 0) > 0,
  );

  const grupos_sem_estimulo = gruposMusculares.filter(
    (grupo) => !gruposComEstimulo.has(grupo),
  );

  const base: ResultadoFrequencia = {
    treinos_semana_atual: treinosSemanaAtual,
    grupos_sem_estimulo,
  };

  if (semanasComDadosAnteriores.length === 0) {
    return base;
  }

  const soma = semanasComDadosAnteriores.reduce(
    (acc, semana) => acc + (treinosPorSemana.get(semana)?.size ?? 0),
    0,
  );
  return {
    ...base,
    media_semanas_anteriores: soma / semanasComDadosAnteriores.length,
  };
}
