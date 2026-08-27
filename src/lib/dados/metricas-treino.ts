/**
 * lastro · Métricas determinísticas do treino finalizado (Relatório Pós-Treino).
 *
 * Calcula tonelagem total (volume em kg), duração real da sessão,
 * contagem de séries válidas, detalhamento por exercício e PRs do dia.
 */

export type SerieParaMetricas = {
  id: string;
  exercicioId: string;
  exercicioNome: string;
  reps: number;
  peso: number;
  tipo: "aquecimento" | "valendo";
  pesoPorLado?: boolean;
  ehRecordePessoal?: boolean;
};

export type MetricasSessao = {
  duracaoMinutos: number;
  tonelagemTotalKg: number;
  totalSeriesValendo: number;
  totalSeriesAquecimento: number;
  totalExercicios: number;
  exerciciosDetalhados: { exercicioNome: string; totalSeries: number; pesoMaximo: number }[];
  prsBatidos: { exercicioNome: string; reps: number; peso: number }[];
};

export function calcularMetricasSessao(
  series: SerieParaMetricas[],
  iniciadoEmOuSegundos: string | number,
  finalizadoEmIso?: string
): MetricasSessao {
  let duracaoMinutos = 1;
  if (typeof iniciadoEmOuSegundos === "number") {
    duracaoMinutos = Math.max(1, Math.round(iniciadoEmOuSegundos / 60));
  } else {
    const inicio = new Date(iniciadoEmOuSegundos).getTime();
    const fim = finalizadoEmIso ? new Date(finalizadoEmIso).getTime() : Date.now();
    const duracaoMs = Math.max(0, fim - inicio);
    duracaoMinutos = Math.max(1, Math.round(duracaoMs / 60000));
  }

  let tonelagemTotalKg = 0;
  let totalSeriesValendo = 0;
  let totalSeriesAquecimento = 0;
  const exerciciosUnicosValendo = new Set<string>();
  const mapaExercicios = new Map<string, { exercicioNome: string; totalSeries: number; pesoMaximo: number }>();
  const prsBatidos: { exercicioNome: string; reps: number; peso: number }[] = [];

  for (const s of series) {
    const pesoEfetivo = s.pesoPorLado ? s.peso * 2 : s.peso;
    const volumeSerie = s.reps * pesoEfetivo;

    let ex = mapaExercicios.get(s.exercicioId);
    if (!ex) {
      ex = { exercicioNome: s.exercicioNome, totalSeries: 0, pesoMaximo: 0 };
      mapaExercicios.set(s.exercicioId, ex);
    }
    ex.totalSeries++;
    ex.pesoMaximo = Math.max(ex.pesoMaximo, s.peso);

    if (s.tipo === "valendo") {
      exerciciosUnicosValendo.add(s.exercicioId);
      totalSeriesValendo++;
      tonelagemTotalKg += volumeSerie;
      
      if (s.ehRecordePessoal) {
        prsBatidos.push({
          exercicioNome: s.exercicioNome,
          reps: s.reps,
          peso: s.peso,
        });
      }
    } else {
      totalSeriesAquecimento++;
    }
  }

  return {
    duracaoMinutos,
    tonelagemTotalKg: Math.round(tonelagemTotalKg * 10) / 10,
    totalSeriesValendo,
    totalSeriesAquecimento,
    totalExercicios: exerciciosUnicosValendo.size || (series.length > 0 ? 1 : 0),
    exerciciosDetalhados: Array.from(mapaExercicios.values()),
    prsBatidos,
  };
}
