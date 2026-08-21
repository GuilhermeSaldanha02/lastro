import { describe, expect, it } from "vitest";
import { formatarGrupoMuscular } from "./grupo-muscular";

describe("formatarGrupoMuscular", () => {
  it("acentua os grupos conhecidos", () => {
    expect(formatarGrupoMuscular("ABDOMEN")).toBe("Abdômen");
    expect(formatarGrupoMuscular("BICEPS")).toBe("Bíceps");
    expect(formatarGrupoMuscular("QUADRICEPS")).toBe("Quadríceps");
  });

  // O caso que motivou o helper: a UI imprimia a chave crua com
  // underscore direto na tela.
  it("troca underscore por espaço", () => {
    expect(formatarGrupoMuscular("POSTERIOR_COXA")).toBe("Posterior de coxa");
  });

  it("degrada chave desconhecida sem inventar nome", () => {
    expect(formatarGrupoMuscular("GRUPO_NOVO")).toBe("Grupo novo");
  });

  it("aceita caixa baixa", () => {
    expect(formatarGrupoMuscular("peito")).toBe("Peito");
  });

  it("devolve vazio para entrada vazia", () => {
    expect(formatarGrupoMuscular("")).toBe("");
  });
});
