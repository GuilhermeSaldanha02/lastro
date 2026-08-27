import { describe, it, expect } from "vitest";
import { gruposConhecidos } from "./grupos-conhecidos";

const CATALOGO = [
  { id: "supino-reto", grupoMuscularPrimario: "peito" },
  { id: "supino-inclinado", grupoMuscularPrimario: "peito" },
  { id: "triceps-pulley", grupoMuscularPrimario: "triceps" },
  { id: "agachamento", grupoMuscularPrimario: "quadriceps" },
];

describe("gruposConhecidos", () => {
  it("deduz os grupos do modelo escolhido ao iniciar o treino", () => {
    // O caso do bug: treino vindo de modelo, ainda sem série nenhuma.
    const grupos = gruposConhecidos(CATALOGO, [], [
      { exercicioId: "supino-reto" },
      { exercicioId: "supino-inclinado" },
      { exercicioId: "triceps-pulley" },
    ]);

    expect(grupos.sort()).toEqual(["peito", "triceps"]);
  });

  it("deduz os grupos das séries já registradas quando o modelo saiu de cena", () => {
    // Recarregar no meio do treino: `treino/[id]/page.tsx` zera a
    // pré-seleção assim que existe série, mas as séries já dizem o grupo.
    const grupos = gruposConhecidos(CATALOGO, [
      { exercicioId: "supino-reto" },
      { exercicioId: "supino-reto" },
    ]);

    expect(grupos).toEqual(["peito"]);
  });

  it("une as duas fontes sem repetir grupo", () => {
    const grupos = gruposConhecidos(
      CATALOGO,
      [{ exercicioId: "supino-reto" }],
      [{ exercicioId: "supino-inclinado" }, { exercicioId: "triceps-pulley" }],
    );

    expect(grupos.sort()).toEqual(["peito", "triceps"]);
  });

  it("devolve vazio no Treino novo puro — só aí perguntar é legítimo", () => {
    expect(gruposConhecidos(CATALOGO, [])).toEqual([]);
    expect(gruposConhecidos(CATALOGO, [], [])).toEqual([]);
  });

  it("ignora exercício fora do catálogo em vez de inventar grupo", () => {
    // Inventar filtraria a lista errada; ignorar deixa o seletor aparecer,
    // que é o comportamento honesto quando o grupo é mesmo desconhecido.
    const grupos = gruposConhecidos(CATALOGO, [{ exercicioId: "exercicio-fantasma" }]);

    expect(grupos).toEqual([]);
  });
});
