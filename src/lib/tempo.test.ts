import { describe, expect, it } from "vitest";
import { dataLocalBrasil } from "./tempo";

// Achado real, revisão estática qa-treino (2026-08-05): `new Date().toISOString()`
// usa UTC e empurra treino noturno pro dia UTC seguinte. BRT = UTC-3, então
// 22h de domingo em Brasília já é 01h de segunda em UTC.
describe("dataLocalBrasil", () => {
  it("22h de domingo em Brasília (01h de segunda em UTC) -> ainda é domingo", () => {
    const instante = new Date("2026-08-03T01:00:00Z"); // segunda 01h UTC = domingo 22h BRT
    expect(dataLocalBrasil(instante)).toBe("2026-08-02");
  });

  it("meio-dia em Brasília (15h UTC) -> mesmo dia em ambos os fusos", () => {
    const instante = new Date("2026-08-03T15:00:00Z");
    expect(dataLocalBrasil(instante)).toBe("2026-08-03");
  });
});
