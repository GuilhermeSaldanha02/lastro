import { describe, expect, it } from "vitest";

import {
  formatarDescansoReal,
  marcadoresDaSerie,
  resumirSeriesValendo,
  unidadeDaCarga,
} from "./apresentacao-series";

const serie = (tipo: "aquecimento" | "valendo", reps: number) => ({ tipo, reps });

describe("apresentação da grade de séries", () => {
  it("exclui aquecimento do resumo e forma a faixa de repetições", () => {
    const series = [serie("aquecimento", 15), serie("valendo", 10), serie("valendo", 8)];

    expect(resumirSeriesValendo(series, "pt-BR")).toBe("2 séries valendo · 8–10 repetições");
    expect(resumirSeriesValendo(series, "en")).toBe("2 working sets · 8–10 reps");
    expect(resumirSeriesValendo(series, "es")).toBe("2 series válidas · 8–10 repeticiones");
  });

  // TR-14 (QA.md, 2026-09-23): "1 série valendo · 12 repetição". O plural
  // de "repetição" depende do número de repetições, não do número de séries.
  it("concorda 'repetição' com o número de repetições, não de séries", () => {
    expect(resumirSeriesValendo([serie("valendo", 12)], "pt-BR")).toBe("1 série valendo · 12 repetições");
    expect(resumirSeriesValendo([serie("valendo", 12)], "en")).toBe("1 working set · 12 reps");
    expect(resumirSeriesValendo([serie("valendo", 1)], "pt-BR")).toBe("1 série valendo · 1 repetição");
    expect(resumirSeriesValendo([serie("valendo", 1), serie("valendo", 1)], "pt-BR")).toBe(
      "2 séries valendo · 1 repetição",
    );
    expect(resumirSeriesValendo([serie("valendo", 10), serie("valendo", 10)], "pt-BR")).toBe(
      "2 séries valendo · 10 repetições",
    );
  });

  // TR-15 (QA.md, 2026-09-23): série com `pesoPorLado` aparecia só como
  // "14 kg", igual a uma carga total — o volume dela é o dobro.
  it("marca a unidade quando a carga é por lado", () => {
    expect(unidadeDaCarga(false, "pt-BR")).toBe("kg");
    expect(unidadeDaCarga(true, "pt-BR")).toBe("kg/lado");
    expect(unidadeDaCarga(true, "en")).toBe("kg/side");
    expect(unidadeDaCarga(true, "es")).toBe("kg/lado");
  });

  it("não inventa faixa sem série valendo", () => {
    expect(resumirSeriesValendo([serie("aquecimento", 15)], "pt-BR")).toBe("0 séries valendo");
  });

  it("mantém tipo e acrescenta recorde no idioma ativo", () => {
    expect(marcadoresDaSerie("valendo", true, "pt-BR").map((m) => m.curto)).toEqual(["VAL", "RP"]);
    expect(marcadoresDaSerie("valendo", true, "es").map((m) => m.curto)).toEqual(["VÁL", "RP"]);
    expect(marcadoresDaSerie("valendo", true, "en").map((m) => m.curto)).toEqual(["WORK", "PR"]);
    expect(marcadoresDaSerie("aquecimento", false, "en").map((m) => m.curto)).toEqual(["WU"]);
  });

  it("distingue ausência, minutos e horas", () => {
    expect(formatarDescansoReal(null)).toBe("—");
    expect(formatarDescansoReal(64)).toBe("01:04");
    expect(formatarDescansoReal(3_723)).toBe("1:02:03");
  });
});
