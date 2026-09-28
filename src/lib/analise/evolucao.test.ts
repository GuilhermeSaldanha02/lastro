import { describe, expect, it } from "vitest";
import { evolucaoPorMetades } from "./evolucao";

describe("evolucaoPorMetades", () => {
  it("com 2 sessões é a primeira contra a última, como antes", () => {
    expect(evolucaoPorMetades([80, 90])).toEqual({ inicial: 80, atual: 90 });
  });

  it("um treino leve no fim não derruba a evolução (o caso do -72% no QA)", () => {
    // Antes: 100 → 28 = -72%. Agora: melhor de [100, 104] contra melhor de [110, 28].
    expect(evolucaoPorMetades([100, 104, 110, 28])).toEqual({ inicial: 104, atual: 110 });
  });

  it("um treino leve no começo também não infla a evolução", () => {
    expect(evolucaoPorMetades([30, 100, 101, 102])).toEqual({ inicial: 100, atual: 102 });
  });

  it("número ímpar: a sessão do meio conta na segunda metade", () => {
    expect(evolucaoPorMetades([100, 90, 95])).toEqual({ inicial: 100, atual: 95 });
  });

  it("queda real continua aparecendo como queda", () => {
    expect(evolucaoPorMetades([100, 100, 80, 82])).toEqual({ inicial: 100, atual: 82 });
  });

  it("menos de 2 sessões ou base zero: sem evolução (não inventa)", () => {
    expect(evolucaoPorMetades([100])).toBeNull();
    expect(evolucaoPorMetades([])).toBeNull();
    expect(evolucaoPorMetades([0, 50])).toBeNull();
  });
});
