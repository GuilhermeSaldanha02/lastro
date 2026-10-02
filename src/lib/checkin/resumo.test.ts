import { describe, expect, it } from "vitest";
import { CAMPOS_CHECKIN, type NotaCheckin } from "./escala";
import { descreverNotaCheckin } from "./resumo";

const NOTAS: NotaCheckin[] = [1, 2, 3, 4, 5];

describe("descreverNotaCheckin", () => {
  it("expressa a qualidade do sono em ordem crescente", () => {
    expect(NOTAS.map((nota) => descreverNotaCheckin("sono", nota))).toEqual(["Péssimo", "Ruim", "Regular", "Bom", "Ótimo"]);
  });

  it("expressa a quantidade de energia e dor sem inverter a dor alta", () => {
    for (const campo of ["energia", "dor_muscular"] as const) {
      expect(NOTAS.map((nota) => descreverNotaCheckin(campo, nota))).toEqual(["Nenhuma", "Pouca", "Moderada", "Bastante", "Muita"]);
    }
  });

  it("mantém estresse alto como alto, sem reinterpretar como prontidão", () => {
    expect(NOTAS.map((nota) => descreverNotaCheckin("estresse", nota))).toEqual(["Baixo", "Leve", "Moderado", "Elevado", "Alto"]);
  });

  it("distingue uma resposta ausente da menor nota em todos os campos", () => {
    for (const campo of CAMPOS_CHECKIN) {
      expect(descreverNotaCheckin(campo, null)).toBe("Não informado");
      expect(descreverNotaCheckin(campo, null)).not.toBe(descreverNotaCheckin(campo, 1));
    }
  });
});
