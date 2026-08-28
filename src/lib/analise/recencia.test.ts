import { describe, expect, it } from "vitest";
import { diasSemEstimuloPorGrupo } from "./recencia";
import type { SerieValendo } from "./tipos";

function serie(grupoMuscular: string, data: string): SerieValendo {
  return {
    treinoId: "t",
    exercicioId: "e",
    exercicio: "x",
    grupoMuscular,
    unilateral: false,
    pesoPorLado: false,
    reps: 10,
    peso: 50,
    data,
    semanaInicio: "2026-08-17",
  } as SerieValendo;
}

describe("diasSemEstimuloPorGrupo", () => {
  it("devolve lista vazia sem séries", () => {
    expect(diasSemEstimuloPorGrupo([], "2026-08-28")).toEqual([]);
  });

  it("conta dias desde a série mais recente de cada grupo", () => {
    const r = diasSemEstimuloPorGrupo(
      [serie("PEITO", "2026-08-20"), serie("COSTAS", "2026-08-26")],
      "2026-08-28",
    );
    expect(r).toEqual([
      { grupo: "PEITO", diasSemEstimulo: 8 },
      { grupo: "COSTAS", diasSemEstimulo: 2 },
    ]);
  });

  it("ordena do mais tempo parado para o mais recente", () => {
    const r = diasSemEstimuloPorGrupo(
      [
        serie("PEITO", "2026-08-27"),
        serie("COSTAS", "2026-08-10"),
        serie("BICEPS", "2026-08-20"),
      ],
      "2026-08-28",
    );
    expect(r.map((g) => g.grupo)).toEqual(["COSTAS", "BICEPS", "PEITO"]);
  });

  it("usa a série mais recente quando o grupo aparece mais de uma vez", () => {
    const r = diasSemEstimuloPorGrupo(
      [serie("PEITO", "2026-08-10"), serie("PEITO", "2026-08-25")],
      "2026-08-28",
    );
    expect(r).toEqual([{ grupo: "PEITO", diasSemEstimulo: 3 }]);
  });

  it("ignora série sem grupo resolvido", () => {
    const r = diasSemEstimuloPorGrupo(
      [serie("", "2026-08-25"), serie("PEITO", "2026-08-25")],
      "2026-08-28",
    );
    expect(r).toEqual([{ grupo: "PEITO", diasSemEstimulo: 3 }]);
  });

  it("dia zero quando o grupo foi treinado hoje", () => {
    const r = diasSemEstimuloPorGrupo([serie("PEITO", "2026-08-28")], "2026-08-28");
    expect(r).toEqual([{ grupo: "PEITO", diasSemEstimulo: 0 }]);
  });
});
