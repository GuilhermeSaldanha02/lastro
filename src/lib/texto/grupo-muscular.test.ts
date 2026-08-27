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

  // O helper já estava certo em 2026-08-24 — o que faltava era CHAMÁ-LO.
  // Em pt-BR, `mapaTraducaoGrupos` devolve mapa vazio (é o idioma de
  // origem), e três consultas caíam num `?? id` que imprimia a chave do
  // banco: os chips do histórico liam "posterior_coxa" e o resumo do
  // parecer recebia a mesma chave crua (achado do dono, 2026-08-27).
  // Estas travas fixam o contrato nos 10 grupos que existem de verdade.
  describe("chave crua nunca chega à tela", () => {
    const CHAVES_DO_CATALOGO = [
      "abdomen",
      "biceps",
      "costas",
      "gluteo",
      "ombro",
      "panturrilha",
      "peito",
      "posterior_coxa",
      "quadriceps",
      "triceps",
    ];

    it("nenhum grupo real devolve underscore, em nenhum idioma", () => {
      for (const idioma of ["pt-BR", "en", "es"] as const) {
        for (const chave of CHAVES_DO_CATALOGO) {
          expect(formatarGrupoMuscular(chave, idioma)).not.toContain("_");
        }
      }
    });

    it("nenhum grupo real volta igual à chave do banco", () => {
      // Pega o caso silencioso: "peito"/"costas" "passariam" no teste de
      // underscore mesmo sem tradução nenhuma, porque a chave já é uma
      // palavra. O que se exige aqui é rótulo, não identificador.
      for (const chave of CHAVES_DO_CATALOGO) {
        expect(formatarGrupoMuscular(chave, "pt-BR")).not.toBe(chave);
      }
    });

    it("traduz as chaves do banco em minúscula, como elas vêm", () => {
      expect(formatarGrupoMuscular("posterior_coxa")).toBe("Posterior de coxa");
      expect(formatarGrupoMuscular("posterior_coxa", "en")).toBe("Hamstrings");
      expect(formatarGrupoMuscular("posterior_coxa", "es")).toBe("Isquiotibiales");
    });
  });
});
