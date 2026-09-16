import { describe, expect, it } from "vitest";

import {
  formatarDescansoReal,
  marcadoresDaSerie,
  resumirSeriesValendo,
} from "./apresentacao-series";

const serie = (tipo: "aquecimento" | "valendo", reps: number) => ({ tipo, reps });

describe("apresentação da grade de séries", () => {
  it("exclui aquecimento do resumo e forma a faixa de repetições", () => {
    const series = [serie("aquecimento", 15), serie("valendo", 10), serie("valendo", 8)];

    expect(resumirSeriesValendo(series, "pt-BR")).toBe("2 séries valendo · 8–10 repetições");
    expect(resumirSeriesValendo(series, "en")).toBe("2 working sets · 8–10 reps");
    expect(resumirSeriesValendo(series, "es")).toBe("2 series válidas · 8–10 repeticiones");
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
