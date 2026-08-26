import { describe, it, expect } from "vitest";
import { calcularMetricasSessao, type SerieParaMetricas } from "./metricas-treino";

describe("calcularMetricasSessao", () => {
  it("calcula corretamente tonelagem, duração, séries e PRs", () => {
    const inicio = new Date(Date.now() - 45 * 60 * 1000).toISOString(); // 45 min atrás
    const series: SerieParaMetricas[] = [
      {
        id: "1",
        exercicioId: "supino",
        exercicioNome: "Supino Reto",
        reps: 10,
        peso: 20,
        tipo: "aquecimento",
      },
      {
        id: "2",
        exercicioId: "supino",
        exercicioNome: "Supino Reto",
        reps: 8,
        peso: 80,
        tipo: "valendo",
      },
      {
        id: "3",
        exercicioId: "supino",
        exercicioNome: "Supino Reto",
        reps: 8,
        peso: 85,
        tipo: "valendo",
        ehRecordePessoal: true,
      },
      {
        id: "4",
        exercicioId: "rosca-halter",
        exercicioNome: "Rosca com Halter",
        reps: 10,
        peso: 14,
        tipo: "valendo",
        pesoPorLado: true, // 14kg cada lado = 28kg total
      },
    ];

    const metricas = calcularMetricasSessao(series, inicio);

    expect(metricas.duracaoMinutos).toBe(45);
    expect(metricas.totalSeriesValendo).toBe(3);
    expect(metricas.totalSeriesAquecimento).toBe(1);
    expect(metricas.totalExercicios).toBe(2);
    // Tonelagem: (8*80) + (8*85) + (10*28) = 640 + 680 + 280 = 1600 kg
    expect(metricas.tonelagemTotalKg).toBe(1600);
    expect(metricas.prsBatidos).toHaveLength(1);
    expect(metricas.prsBatidos[0].exercicioNome).toBe("Supino Reto");
    expect(metricas.prsBatidos[0].peso).toBe(85);
  });

  it("lida com lista vazia de séries sem quebrar", () => {
    const inicio = new Date().toISOString();
    const metricas = calcularMetricasSessao([], inicio);

    expect(metricas.duracaoMinutos).toBe(1);
    expect(metricas.tonelagemTotalKg).toBe(0);
    expect(metricas.totalSeriesValendo).toBe(0);
    expect(metricas.totalExercicios).toBe(0);
    expect(metricas.prsBatidos).toEqual([]);
  });
});
