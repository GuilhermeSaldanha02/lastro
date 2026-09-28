// lastro · a métrica de UM treino para o adesivo/relatório pós-treino.
// Extraído de `/ajustes/relatorios` (UX-02) para ser chamado também de
// `/treino`, sem duplicar a conta — "procurar antes de escrever" (`AGENTS.md`).
"use server";

import { buscarTreino } from "@/lib/dados/treino";
import {
  calcularMetricasSessao,
  duracaoSessaoSegundos,
  ultimaSerieEm,
  type MetricasSessao,
} from "@/lib/dados/metricas-treino";

export async function obterMetricasDoTreino(
  treinoId: string,
): Promise<MetricasSessao | null> {
  const treinoComSeries = await buscarTreino(treinoId);
  if (!treinoComSeries) return null;

  const seriesParaMetricas = treinoComSeries.series.map((s) => ({
    id: s.id,
    exercicioId: s.exercicioId,
    exercicioNome: s.exercicioNome,
    reps: s.reps,
    peso: s.peso,
    tipo: s.tipo,
    pesoPorLado: s.pesoPorLado,
    exercicioGrupoMuscular: s.exercicioGrupoMuscular,
  }));

  // Duração pela DEFINIÇÃO ÚNICA (`duracaoSessaoSegundos`), a mesma que a
  // tela de treino usa desde 2026-09-04 — ver histórico em `DECISIONS.md`.
  const duracaoSegundos = duracaoSessaoSegundos(
    treinoComSeries.iniciadoEm,
    ultimaSerieEm(treinoComSeries.series),
  );

  return calcularMetricasSessao(seriesParaMetricas, duracaoSegundos, undefined, {
    identificadorTreino: `TREINO ${treinoId.slice(-4).toUpperCase()}`,
  });
}
