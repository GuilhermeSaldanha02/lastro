import { describe, expect, it } from "vitest";
import { dominioDoGrafico } from "./dominio-grafico";

describe("dominioDoGrafico (UX3-02)", () => {
  it("série estável: a linha fica no MEIO do domínio, não colada no topo", () => {
    const [baixo, alto] = dominioDoGrafico([50.7, 50.7, 50.7]);
    expect(baixo).toBeLessThan(50.7);
    expect(alto).toBeGreaterThan(50.7);
    expect(50.7 - baixo).toBeCloseTo(alto - 50.7, 6);
  });

  it("série em movimento: o domínio cobre todos os pontos com folga", () => {
    const [baixo, alto] = dominioDoGrafico([50, 55, 60]);
    expect(baixo).toBeLessThan(50);
    expect(alto).toBeGreaterThan(60);
    expect(alto - 60).toBeCloseTo(50 - baixo, 6);
  });

  it("nunca desce abaixo de zero (peso negativo não existe)", () => {
    const [baixo] = dominioDoGrafico([0.2, 0.4]);
    expect(baixo).toBe(0);
  });

  it("ignora valor inválido e não quebra sem dado", () => {
    expect(dominioDoGrafico([Number.NaN, 40, 42])[0]).toBeLessThan(40);
    expect(dominioDoGrafico([])).toEqual([0, 1]);
  });
});
