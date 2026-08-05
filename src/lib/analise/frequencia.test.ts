import { describe, expect, it } from "vitest";
import type { SerieValendo } from "./tipos";
import { calcularFrequencia } from "./frequencia";

function serie(sobrescritas: Partial<SerieValendo>): SerieValendo {
  return {
    treinoId: "t1",
    exercicioId: "e1",
    exercicio: "Supino reto com barra",
    grupoMuscular: "peito",
    unilateral: false,
    reps: 10,
    peso: 50,
    pesoCorporalIncluso: false,
    data: "2026-07-27",
    semanaInicio: "2026-07-27",
    ...sobrescritas,
  };
}

describe("calcularFrequencia", () => {
  // T-F1 — 4 treinos na semana atual, 3 com >=1 valendo, 1 só-aquecimento.
  // O treino só-aquecimento nunca chega aqui (já foi filtrado em SerieValendo).
  it("conta treinos distintos com ao menos 1 série valendo na semana atual", () => {
    const series = [
      serie({ treinoId: "t1", semanaInicio: "2026-07-27" }),
      serie({ treinoId: "t2", semanaInicio: "2026-07-27" }),
      serie({ treinoId: "t3", semanaInicio: "2026-07-27" }),
    ];
    const resultado = calcularFrequencia({
      seriesValendoJanela: series,
      semanaAtual: "2026-07-27",
      semanasAnterioresComparacao: [],
      gruposMusculares: ["peito"],
    });
    expect(resultado.treinos_semana_atual).toBe(3);
  });

  // T-F2 — grupo muscular sem série valendo na janela
  it("grupo muscular sem estímulo na janela aparece em grupos_sem_estimulo", () => {
    const series = [serie({ grupoMuscular: "peito" })];
    const resultado = calcularFrequencia({
      seriesValendoJanela: series,
      semanaAtual: "2026-07-27",
      semanasAnterioresComparacao: [],
      gruposMusculares: ["peito", "costas"],
    });
    expect(resultado.grupos_sem_estimulo).toEqual(["costas"]);
  });

  it("média de semanas anteriores conta treinos distintos por semana", () => {
    const series = [
      serie({ treinoId: "a", semanaInicio: "2026-07-20" }),
      serie({ treinoId: "b", semanaInicio: "2026-07-20" }),
      serie({ treinoId: "c", semanaInicio: "2026-07-13" }),
    ];
    const resultado = calcularFrequencia({
      seriesValendoJanela: series,
      semanaAtual: "2026-07-27",
      semanasAnterioresComparacao: ["2026-07-13", "2026-07-20"],
      gruposMusculares: [],
    });
    expect(resultado.media_semanas_anteriores).toBeCloseTo(1.5, 5);
  });

  it("sem semanas anteriores com dados, media_semanas_anteriores fica ausente", () => {
    const resultado = calcularFrequencia({
      seriesValendoJanela: [],
      semanaAtual: "2026-07-27",
      semanasAnterioresComparacao: [],
      gruposMusculares: [],
    });
    expect("media_semanas_anteriores" in resultado).toBe(false);
  });
});
