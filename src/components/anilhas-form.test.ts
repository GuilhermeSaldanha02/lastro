import { describe, expect, it } from "vitest";
import { formatarPeso } from "@/lib/texto/formatar-delta";

// O `formatarKg` do formulário de anilhas é `formatarPeso` sobre o valor
// arredondado a 2 casas (UX3-06). O que importa provar é o separador por idioma.
const kg = (v: number, idioma: "pt-BR" | "en" | "es") => formatarPeso(Number(v.toFixed(2)), idioma);

describe("kg das anilhas por idioma (UX3-06)", () => {
  it("português e espanhol usam vírgula decimal", () => {
    expect(kg(2.5, "pt-BR")).toBe("2,5");
    expect(kg(1.25, "es")).toBe("1,25");
  });
  it("inglês usa ponto", () => {
    expect(kg(2.5, "en")).toBe("2.5");
  });
  it("inteiro não ganha decimal", () => {
    expect(kg(20, "pt-BR")).toBe("20");
  });
  it("ruído de ponto flutuante some (0.1 + 0.2)", () => {
    expect(kg(0.1 + 0.2, "pt-BR")).toBe("0,3");
  });
});
