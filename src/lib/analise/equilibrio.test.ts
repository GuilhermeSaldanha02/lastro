import { describe, expect, it } from "vitest";
import { calcularSeriesPorGrupo } from "./equilibrio";
import type { SerieValendo } from "./tipos";

function serie(grupoMuscular: string): SerieValendo {
  return {
    treinoId: "t",
    exercicioId: "e",
    exercicio: "x",
    grupoMuscular,
    unilateral: false,
    reps: 10,
    peso: 50,
    pesoCorporalIncluso: false,
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
