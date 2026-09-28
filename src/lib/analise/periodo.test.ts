import { describe, expect, it } from "vitest";
import {
  anteriorEquivalente,
  contem,
  diasNoPeriodo,
  mesDe,
  periodoLivre,
  semanaDe,
  ultimosDias,
  variacao,
} from "./periodo";

describe("semanaDe", () => {
  it("vai de segunda a domingo (ISO-8601), a partir de qualquer dia", () => {
    expect(semanaDe("2026-09-28")).toEqual({ tipo: "semana", inicio: "2026-09-28", fim: "2026-10-04" });
    expect(semanaDe("2026-10-04")).toEqual({ tipo: "semana", inicio: "2026-09-28", fim: "2026-10-04" });
  });

  it("atravessa a virada do ano", () => {
    expect(semanaDe("2027-01-01")).toEqual({ tipo: "semana", inicio: "2026-12-28", fim: "2027-01-03" });
  });
});

describe("mesDe", () => {
  it("cobre o mês de calendário inteiro, inclusive fevereiro de ano bissexto", () => {
    expect(mesDe("2026-09-15")).toEqual({ tipo: "mes", inicio: "2026-09-01", fim: "2026-09-30" });
    expect(mesDe("2028-02-10")).toEqual({ tipo: "mes", inicio: "2028-02-01", fim: "2028-02-29" });
  });
});

describe("ultimosDias e periodoLivre", () => {
  it("conta o dia de hoje dentro da janela", () => {
    const p = ultimosDias("2026-09-28", 28);
    expect(p).toEqual({ tipo: "dias", inicio: "2026-09-01", fim: "2026-09-28" });
    expect(diasNoPeriodo(p)).toBe(28);
  });

  it("período livre com início depois do fim é erro de quem chamou", () => {
    expect(() => periodoLivre("2026-09-10", "2026-09-01")).toThrow();
  });
});

describe("anteriorEquivalente", () => {
  it("semana → a semana imediatamente anterior", () => {
    expect(anteriorEquivalente(semanaDe("2026-09-28"))).toEqual(semanaDe("2026-09-21"));
  });

  it("mês → o mês de calendário anterior, com o tamanho dele (não o do atual)", () => {
    expect(anteriorEquivalente(mesDe("2026-03-20"))).toEqual({ tipo: "mes", inicio: "2026-02-01", fim: "2026-02-28" });
    expect(anteriorEquivalente(mesDe("2026-01-05"))).toEqual({ tipo: "mes", inicio: "2025-12-01", fim: "2025-12-31" });
  });

  it("janela em dias → mesmo número de dias, colado antes", () => {
    const anterior = anteriorEquivalente(ultimosDias("2026-09-28", 28));
    expect(anterior).toEqual({ tipo: "dias", inicio: "2026-08-04", fim: "2026-08-31" });
    expect(diasNoPeriodo(anterior)).toBe(28);
  });
});

describe("contem", () => {
  it("é inclusivo nas duas pontas", () => {
    const p = semanaDe("2026-09-28");
    expect(contem(p, "2026-09-28")).toBe(true);
    expect(contem(p, "2026-10-04")).toBe(true);
    expect(contem(p, "2026-10-05")).toBe(false);
    expect(contem(p, "2026-09-27")).toBe(false);
  });
});

describe("variacao", () => {
  it("dá delta e percentual arredondado a uma casa", () => {
    expect(variacao(11200, 10000)).toEqual({ atual: 11200, anterior: 10000, delta: 1200, deltaPct: 12 });
    expect(variacao(2, 3)).toEqual({ atual: 2, anterior: 3, delta: -1, deltaPct: -33.3 });
  });

  it("sem base (anterior 0) não inventa percentual: o campo não existe", () => {
    const v = variacao(500, 0);
    expect(v).toEqual({ atual: 500, anterior: 0, delta: 500 });
    expect("deltaPct" in v).toBe(false);
  });
});
