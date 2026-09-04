import { describe, it, expect } from "vitest";
import {
  calcularMetricasSessao,
  duracaoSessaoSegundos,
  ultimaSerieEm,
  type SerieParaMetricas,
} from "./metricas-treino";

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
    expect(metricas.exerciciosDetalhados).toHaveLength(2);
    expect(metricas.exerciciosDetalhados[0].exercicioNome).toBe("Supino Reto");
    expect(metricas.exerciciosDetalhados[0].totalSeries).toBe(3);
  });

  it("lida com lista vazia de séries sem quebrar", () => {
    const inicio = new Date().toISOString();
    const metricas = calcularMetricasSessao([], inicio);

    expect(metricas.duracaoMinutos).toBe(1);
    expect(metricas.tonelagemTotalKg).toBe(0);
    expect(metricas.totalSeriesValendo).toBe(0);
    expect(metricas.totalExercicios).toBe(0);
    expect(metricas.prsBatidos).toEqual([]);
    expect(metricas.focoOuDivisao).toBe("TREINO");
    expect(metricas.identificadorTreino).toBe("TREINO 404B");
  });

  it("infere foco muscular 'PERNAS' quando há exercícios de membros inferiores", () => {
    const series: SerieParaMetricas[] = [
      { id: "1", exercicioId: "agachamento", exercicioNome: "Agachamento Livre", reps: 8, peso: 100, tipo: "valendo" },
      { id: "2", exercicioId: "leg-press", exercicioNome: "Leg Press 45", reps: 10, peso: 200, tipo: "valendo" },
    ];
    const metricas = calcularMetricasSessao(series, 60 * 60);
    expect(metricas.focoOuDivisao).toBe("PERNAS");
  });

  it("infere 'SUPERIORES' pra um dia de empurrar (peito+ombro+tríceps), não 'FULL BODY' (achado do dono, 2026-09-02)", () => {
    const series: SerieParaMetricas[] = [
      { id: "1", exercicioId: "supino", exercicioNome: "Supino Reto", reps: 8, peso: 80, tipo: "valendo", exercicioGrupoMuscular: "peito" },
      { id: "2", exercicioId: "desenvolvimento", exercicioNome: "Desenvolvimento com Halteres", reps: 10, peso: 20, tipo: "valendo", exercicioGrupoMuscular: "ombro" },
      { id: "3", exercicioId: "triceps-corda", exercicioNome: "Tríceps na Corda", reps: 12, peso: 25, tipo: "valendo", exercicioGrupoMuscular: "triceps" },
    ];
    const metricas = calcularMetricasSessao(series, 60 * 60);
    expect(metricas.focoOuDivisao).toBe("SUPERIORES");
  });

  it("infere 'SUPERIORES' pelo fallback de nome (sem exercicioGrupoMuscular) pro mesmo dia de empurrar", () => {
    const series: SerieParaMetricas[] = [
      { id: "1", exercicioId: "supino", exercicioNome: "Supino Reto", reps: 8, peso: 80, tipo: "valendo" },
      { id: "2", exercicioId: "desenvolvimento", exercicioNome: "Desenvolvimento com Halteres", reps: 10, peso: 20, tipo: "valendo" },
      { id: "3", exercicioId: "triceps-corda", exercicioNome: "Tríceps na Corda", reps: 12, peso: 25, tipo: "valendo" },
    ];
    const metricas = calcularMetricasSessao(series, 60 * 60);
    expect(metricas.focoOuDivisao).toBe("SUPERIORES");
  });

  it("infere 'FULL BODY' só quando pernas E algum grupo superior aparecem juntos", () => {
    const series: SerieParaMetricas[] = [
      { id: "1", exercicioId: "agachamento", exercicioNome: "Agachamento Livre", reps: 8, peso: 100, tipo: "valendo", exercicioGrupoMuscular: "quadriceps" },
      { id: "2", exercicioId: "supino", exercicioNome: "Supino Reto", reps: 8, peso: 80, tipo: "valendo", exercicioGrupoMuscular: "peito" },
    ];
    const metricas = calcularMetricasSessao(series, 60 * 60);
    expect(metricas.focoOuDivisao).toBe("FULL BODY");
  });

  it("não confunde pernas + abdômen (sem grupo superior) com 'FULL BODY'", () => {
    const series: SerieParaMetricas[] = [
      { id: "1", exercicioId: "agachamento", exercicioNome: "Agachamento Livre", reps: 8, peso: 100, tipo: "valendo", exercicioGrupoMuscular: "quadriceps" },
      { id: "2", exercicioId: "prancha", exercicioNome: "Prancha Abdominal", reps: 1, peso: 0, tipo: "valendo", exercicioGrupoMuscular: "abdomen" },
    ];
    const metricas = calcularMetricasSessao(series, 60 * 60);
    expect(metricas.focoOuDivisao).toBe("PERNAS");
  });

  it("aceita opções personalizadas de foco e identificador", () => {
    const series: SerieParaMetricas[] = [
      { id: "1", exercicioId: "supino", exercicioNome: "Supino", reps: 8, peso: 80, tipo: "valendo" },
    ];
    const metricas = calcularMetricasSessao(series, 45 * 60, undefined, {
      focoOuDivisao: "PEITO & TRÍCEPS",
      identificadorTreino: "TREINO #042",
      fraseAssinatura: "Foco total.",
    });
    expect(metricas.focoOuDivisao).toBe("PEITO & TRÍCEPS");
    expect(metricas.identificadorTreino).toBe("TREINO #042");
    expect(metricas.fraseAssinatura).toBe("Foco total.");
  });
});

// 2026-09-04, relato de uso real: o relatório da tela de treino e o de
// /ajustes/relatorios davam números diferentes pro MESMO treino, porque
// mediam coisas diferentes (cronômetro ao vivo vs. última série − primeira).
// Esta definição única existe pra eles não poderem mais divergir.
describe("duracaoSessaoSegundos", () => {
  it("mede do início da sessão até a última série", () => {
    expect(
      duracaoSessaoSegundos("2026-09-04T10:00:00Z", "2026-09-04T11:00:00Z"),
    ).toBe(3600);
  });

  it("conta o aquecimento ANTES da primeira série — que era o que o servidor perdia", () => {
    // Sessão às 10:00, primeira série só às 10:15, última às 11:00.
    // `última − primeira` daria 2700s; a definição certa dá 3600s.
    const inicioSessao = "2026-09-04T10:00:00Z";
    const ultima = "2026-09-04T11:00:00Z";
    expect(duracaoSessaoSegundos(inicioSessao, ultima)).toBe(3600);
    expect(
      duracaoSessaoSegundos("2026-09-04T10:15:00Z", ultima),
    ).toBe(2700);
  });

  it("devolve 0 sem série nenhuma, em vez de contar até agora", () => {
    expect(duracaoSessaoSegundos("2026-09-04T10:00:00Z", undefined)).toBe(0);
  });

  it("nunca devolve negativo", () => {
    expect(
      duracaoSessaoSegundos("2026-09-04T11:00:00Z", "2026-09-04T10:00:00Z"),
    ).toBe(0);
  });

  it("ignora data inválida em vez de produzir NaN", () => {
    expect(duracaoSessaoSegundos("nao-e-data", "2026-09-04T10:00:00Z")).toBe(0);
  });
});

describe("ultimaSerieEm", () => {
  it("devolve o criado_em mais recente, não o último da lista", () => {
    expect(
      ultimaSerieEm([
        { criadoEm: "2026-09-04T10:30:00Z" },
        { criadoEm: "2026-09-04T11:00:00Z" },
        { criadoEm: "2026-09-04T10:45:00Z" },
      ]),
    ).toBe("2026-09-04T11:00:00Z");
  });

  it("devolve undefined sem séries", () => {
    expect(ultimaSerieEm([])).toBeUndefined();
  });
});
