import { describe, expect, it } from "vitest";
import { distribuirGrupos } from "./distribuicao-grupos";

describe("distribuirGrupos", () => {
  it("calcula participação no total, sem confundir com o maior grupo", () => {
    expect(distribuirGrupos([{ grupo: "peito", valor: 3 }, { grupo: "costas", valor: 1 }])).toEqual([
      { grupo: "peito", valor: 3, percentual: 75 },
      { grupo: "costas", valor: 1, percentual: 25 },
    ]);
  });

  it("normaliza IDs e reúne duplicados antes de calcular", () => {
    expect(distribuirGrupos([{ grupo: " PEITO ", valor: 2 }, { grupo: "peito", valor: 1 }, { grupo: "costas", valor: 3 }])).toEqual([
      { grupo: "peito", valor: 3, percentual: 50 },
      { grupo: "costas", valor: 3, percentual: 50 },
    ]);
  });

  it("ignora valores inválidos, grupos vazios e quantidades sem participação", () => {
    expect(distribuirGrupos([
      { grupo: "peito", valor: 0 }, { grupo: "costas", valor: -2 },
      { grupo: "biceps", valor: NaN }, { grupo: "ombro", valor: Infinity },
      { grupo: " ", valor: 3 },
    ])).toEqual([]);
  });

  it("arredonda em uma casa e mantém grupos desconhecidos no denominador", () => {
    expect(distribuirGrupos([{ grupo: "peito", valor: 1 }, { grupo: "grupo_customizado", valor: 2 }])).toEqual([
      { grupo: "peito", valor: 1, percentual: 33.3 },
      { grupo: "grupo_customizado", valor: 2, percentual: 66.7 },
    ]);
  });

  it("aceita volumes fracionários sem alterar a entrada", () => {
    const entrada = Object.freeze([Object.freeze({ grupo: "PEITO", valor: 2.5 }), Object.freeze({ grupo: "costas", valor: 7.5 })]);
    expect(distribuirGrupos(entrada)[0]).toEqual({ grupo: "peito", valor: 2.5, percentual: 25 });
    expect(entrada[0].grupo).toBe("PEITO");
    expect(distribuirGrupos([])).toEqual([]);
  });
});
