import { describe, expect, it } from "vitest";
import { diaAceitavel, ehNota, validarCheckin } from "./escala";

const HOJE = "2026-10-01";

describe("diaAceitavel", () => {
  it("aceita hoje, os 3 dias anteriores e 1 dia à frente (fuso)", () => {
    expect(diaAceitavel("2026-10-01", HOJE)).toBe(true);
    expect(diaAceitavel("2026-09-28", HOJE)).toBe(true);
    expect(diaAceitavel("2026-10-02", HOJE)).toBe(true);
  });

  it("recusa mais antigo que 3 dias e mais à frente que 1", () => {
    expect(diaAceitavel("2026-09-27", HOJE)).toBe(false);
    expect(diaAceitavel("2026-10-03", HOJE)).toBe(false);
  });

  it("recusa formato errado e data que não existe", () => {
    expect(diaAceitavel("01/10/2026", HOJE)).toBe(false);
    expect(diaAceitavel("2026-02-31", "2026-03-01")).toBe(false);
    expect(diaAceitavel("", HOJE)).toBe(false);
  });

  it("vira o mês e o ano certo", () => {
    expect(diaAceitavel("2026-12-30", "2027-01-01")).toBe(true);
    expect(diaAceitavel("2026-12-27", "2027-01-01")).toBe(false);
  });
});

describe("ehNota", () => {
  it("só inteiros de 1 a 5", () => {
    for (const n of [1, 2, 3, 4, 5]) expect(ehNota(n)).toBe(true);
    for (const n of [0, 6, 2.5, -1, NaN, "3", null, undefined]) expect(ehNota(n)).toBe(false);
  });
});

describe("validarCheckin", () => {
  it("aceita uma nota só e devolve só os campos conhecidos", () => {
    const r = validarCheckin({ dia: HOJE, sono: 4, intruso: "x", usuario_id: "outro" }, HOJE);
    expect(r).toEqual({ ok: true, dados: { dia: HOJE, sono: 4 } });
  });

  it("aceita as quatro", () => {
    const r = validarCheckin({ dia: HOJE, sono: 1, energia: 2, dor_muscular: 3, estresse: 5 }, HOJE);
    expect(r).toEqual({ ok: true, dados: { dia: HOJE, sono: 1, energia: 2, dor_muscular: 3, estresse: 5 } });
  });

  it("null apaga o campo, mas ainda precisa de uma nota", () => {
    expect(validarCheckin({ dia: HOJE, sono: null, energia: 3 }, HOJE)).toEqual({
      ok: true,
      dados: { dia: HOJE, sono: null, energia: 3 },
    });
    expect(validarCheckin({ dia: HOJE, sono: null }, HOJE)).toEqual({ ok: false, erro: "vazio" });
  });

  it("recusa sem nenhuma nota", () => {
    expect(validarCheckin({ dia: HOJE }, HOJE)).toEqual({ ok: false, erro: "vazio" });
    expect(validarCheckin(null, HOJE)).toEqual({ ok: false, erro: "vazio" });
  });

  it("recusa nota fora da escala, em qualquer campo", () => {
    expect(validarCheckin({ dia: HOJE, sono: 6 }, HOJE)).toEqual({ ok: false, erro: "nota_invalida" });
    expect(validarCheckin({ dia: HOJE, energia: 3, estresse: 0 }, HOJE)).toEqual({ ok: false, erro: "nota_invalida" });
    expect(validarCheckin({ dia: HOJE, dor_muscular: "alta" }, HOJE)).toEqual({ ok: false, erro: "nota_invalida" });
  });

  it("recusa dia fora da janela", () => {
    expect(validarCheckin({ dia: "2026-01-01", sono: 3 }, HOJE)).toEqual({ ok: false, erro: "dia_invalido" });
    expect(validarCheckin({ sono: 3 }, HOJE)).toEqual({ ok: false, erro: "dia_invalido" });
  });
});
