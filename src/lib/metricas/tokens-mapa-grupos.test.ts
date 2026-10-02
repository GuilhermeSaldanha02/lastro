import { describe, expect, it } from "vitest";
import { GEOMETRIA_ANATOMIA } from "../stickers/anatomia";
import { chamadaGrupo } from "./tokens-mapa-grupos";

describe("chamadas anatômicas", () => {
  it("tem alvo para cada região conhecida nas duas vistas", () => {
    for (const vista of ["frente", "costas"] as const) {
      for (const { grupo } of GEOMETRIA_ANATOMIA[vista]) {
        expect(chamadaGrupo(grupo, vista)).toBeDefined();
      }
    }
    expect(new Set([...GEOMETRIA_ANATOMIA.frente, ...GEOMETRIA_ANATOMIA.costas].map(({ grupo }) => grupo)).size).toBe(15);
  });

  it("não inventa alvos para desconhecidos nem propriedades de Object", () => {
    for (const grupo of ["grupo_novo", "__proto__", "constructor", "toString"]) {
      expect(chamadaGrupo(grupo, "frente")).toBeUndefined();
      expect(chamadaGrupo(grupo, "costas")).toBeUndefined();
    }
  });
});
