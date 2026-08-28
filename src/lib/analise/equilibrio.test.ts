import { describe, expect, it } from "vitest";
import { calcularSeriesPorGrupo, calcularVolumePorGrupo } from "./equilibrio";
import type { SerieValendo } from "./tipos";

function serie(grupoMuscular: string, peso = 50): SerieValendo {
  return {
    treinoId: "t",
    exercicioId: "e",
    exercicio: "x",
    grupoMuscular,
    unilateral: false,
    pesoPorLado: false,
    reps: 10,
    peso,
    data: "2026-08-20",
    semanaInicio: "2026-08-17",
  } as SerieValendo;
}

describe("calcularSeriesPorGrupo", () => {
  it("devolve lista vazia sem séries", () => {
    expect(calcularSeriesPorGrupo([])).toEqual([]);
  });

  it("conta séries por grupo", () => {
    const r = calcularSeriesPorGrupo([
      serie("PEITO"),
      serie("PEITO"),
      serie("COSTAS"),
    ]);
    expect(r).toEqual([
      { grupo: "PEITO", series: 2 },
      { grupo: "COSTAS", series: 1 },
    ]);
  });

  it("ordena do mais treinado para o menos", () => {
    const r = calcularSeriesPorGrupo([
      serie("BICEPS"),
      serie("PEITO"),
      serie("PEITO"),
      serie("PEITO"),
      serie("COSTAS"),
      serie("COSTAS"),
    ]);
    expect(r.map((g) => g.grupo)).toEqual(["PEITO", "COSTAS", "BICEPS"]);
  });

  // Sem desempate estável, dois grupos com a mesma contagem trocariam de
  // lugar entre renderizações e a barra "pularia" na tela.
  it("desempata pelo nome, de forma estável", () => {
    const r = calcularSeriesPorGrupo([serie("PEITO"), serie("COSTAS")]);
    expect(r.map((g) => g.grupo)).toEqual(["COSTAS", "PEITO"]);
  });

  it("ignora série sem grupo resolvido", () => {
    const r = calcularSeriesPorGrupo([serie(""), serie("PEITO")]);
    expect(r).toEqual([{ grupo: "PEITO", series: 1 }]);
  });
});

describe("calcularVolumePorGrupo", () => {
  it("devolve lista vazia sem séries", () => {
    expect(calcularVolumePorGrupo([])).toEqual([]);
  });

  it("soma volume (reps × peso) por grupo", () => {
    const r = calcularVolumePorGrupo([
      serie("PEITO", 50), // 10 × 50 = 500
      serie("PEITO", 60), // 10 × 60 = 600
      serie("COSTAS", 40), // 10 × 40 = 400
    ]);
    expect(r).toEqual([
      { grupo: "PEITO", volumeKg: 1100 },
      { grupo: "COSTAS", volumeKg: 400 },
    ]);
  });

  it("ordena do maior volume para o menor", () => {
    const r = calcularVolumePorGrupo([serie("BICEPS", 10), serie("PEITO", 100)]);
    expect(r.map((g) => g.grupo)).toEqual(["PEITO", "BICEPS"]);
  });

  it("ignora série sem grupo resolvido", () => {
    const r = calcularVolumePorGrupo([serie(""), serie("PEITO")]);
    expect(r).toEqual([{ grupo: "PEITO", volumeKg: 500 }]);
  });
});
