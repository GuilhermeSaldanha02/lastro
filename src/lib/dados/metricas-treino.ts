/**
 * lastro · Métricas determinísticas do treino finalizado (Relatório Pós-Treino).
 *
 * Calcula tonelagem total (volume em kg), duração real da sessão,
 * contagem de séries válidas e celebração de recordes (PRs) do dia.
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
  prsBatidos: { exercicioNome: string; reps: number; peso: number }[];
};

export function calcularMetricasSessao(
  series: SerieParaMetricas[],
  iniciadoEmIso: string,
  finalizadoEmIso?: string
): MetricasSessao {
  const inicio = new Date(iniciadoEmIso).getTime();
  const fim = finalizadoEmIso ? new Date(finalizadoEmIso).getTime() : Date.now();
  
  // Duração mínima de 1 minuto para exibição coerente
  const duracaoMs = Math.max(0, fim - inicio);
  const duracaoMinutos = Math.max(1, Math.round(duracaoMs / 60000));

  let tonelagemTotalKg = 0;
  let totalSeriesValendo = 0;
  let totalSeriesAquecimento = 0;
  const exerciciosUnicos = new Set<string>();
  const prsBatidos: { exercicioNome: string; reps: number; peso: number }[] = [];

  for (const s of series) {
    exerciciosUnicos.add(s.exercicioId);
    
    const pesoEfetivo = s.pesoPorLado ? s.peso * 2 : s.peso;
    const volumeSerie = s.reps * pesoEfetivo;

    if (s.tipo === "valendo") {
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
    totalExercicios: exerciciosUnicos.size,
    prsBatidos,
  };
}
