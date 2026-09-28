import { describe, expect, it } from "vitest";
import { anoMesDeData, deslocarAnoMes, gerarGradeMes } from "./calendario-mes";

describe("gerarGradeMes (UX-02)", () => {
  it("setembro de 2026 começa numa terça (1 dia de cauda de agosto)", () => {
    const grade = gerarGradeMes("2026-09");
    expect(grade).toHaveLength(42);
    expect(grade[0]).toEqual({ iso: null, diaNum: 31, foraDoMes: true }); // 31 ago
    expect(grade[1]).toEqual({ iso: "2026-09-01", diaNum: 1, foraDoMes: false });
    expect(grade[30]).toEqual({ iso: "2026-09-30", diaNum: 30, foraDoMes: false });
    expect(grade[31]).toEqual({ iso: null, diaNum: 1, foraDoMes: true }); // 1 out
  });

  it("fevereiro (mês curto) continua com 42 células, sem célula duplicada dentro do mês", () => {
    const grade = gerarGradeMes("2026-02");
    const isosDoMes = grade.filter((c) => !c.foraDoMes).map((c) => c.iso);
    expect(isosDoMes).toHaveLength(28); // 2026 não é bissexto
    expect(new Set(isosDoMes).size).toBe(28);
  });

  it("todo iso dentro do mês bate com o número do dia", () => {
    const grade = gerarGradeMes("2026-01");
    for (const c of grade.filter((c) => !c.foraDoMes)) {
      expect(c.iso).toBe(`2026-01-${String(c.diaNum).padStart(2, "0")}`);
    }
  });
});

describe("anoMesDeData / deslocarAnoMes", () => {
  it("extrai o ano-mês", () => {
    expect(anoMesDeData("2026-09-26")).toBe("2026-09");
  });

  it("desloca para trás e para frente, virando o ano quando preciso", () => {
    expect(deslocarAnoMes("2026-09", -1)).toBe("2026-08");
    expect(deslocarAnoMes("2026-01", -1)).toBe("2025-12");
    expect(deslocarAnoMes("2026-12", 1)).toBe("2027-01");
  });
});
