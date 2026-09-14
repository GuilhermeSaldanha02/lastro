import { describe, expect, it } from "vitest";
import { calcularAnilhas, normalizarPesoKg } from "./anilhas";

describe("normalizarPesoKg (achado B5)", () => {
  it("mantém pesos comuns", () => {
    expect(normalizarPesoKg(20)).toBe(20);
    expect(normalizarPesoKg(1.25)).toBe(1.25);
    expect(normalizarPesoKg(0.5)).toBe(0.5);
  });

  it("arredonda para duas casas, como o banco", () => {
    expect(normalizarPesoKg(2.499)).toBe(2.5);
    expect(normalizarPesoKg(1.2549)).toBe(1.25);
  });

  it("recusa o que o banco arredondaria para 0 kg", () => {
    expect(normalizarPesoKg(0.001)).toBeNull();
    expect(normalizarPesoKg(0.004)).toBeNull();
  });

  it("aceita os extremos que a coluna guarda", () => {
    expect(normalizarPesoKg(0.01)).toBe(0.01);
    expect(normalizarPesoKg(9999.99)).toBe(9999.99);
  });

  it.each([
    ["zero", 0],
    ["negativo", -5],
    ["acima da coluna", 99999999],
    ["não número", Number.NaN],
    ["infinito", Number.POSITIVE_INFINITY],
  ])("recusa %s", (_nome, valor) => {
    expect(normalizarPesoKg(valor)).toBeNull();
  });
});

describe("calcularAnilhas", () => {
  it("T-A1: fecha exato com o inventário padrão", () => {
    const resultado = calcularAnilhas(100, 20, [20, 15, 10, 5, 2.5, 1.25]);
    expect(resultado.exato).toBe(true);
    expect(resultado.pesoTotalAlcancado).toBe(100);
    expect(resultado.porLado).toEqual([{ peso: 20, quantidade: 2 }]);
  });

  it("T-A2: greedy usa a combinação de maiores anilhas primeiro", () => {
    const resultado = calcularAnilhas(87.5, 20, [20, 15, 10, 5, 2.5, 1.25]);
    // por lado: 33.75 -> 20+10+2.5+1.25 = 33.75
    expect(resultado.exato).toBe(true);
    expect(resultado.porLado).toEqual([
      { peso: 20, quantidade: 1 },
      { peso: 10, quantidade: 1 },
      { peso: 2.5, quantidade: 1 },
      { peso: 1.25, quantidade: 1 },
    ]);
  });

  it("T-A3: sem anilha pequena o bastante, fecha por baixo (não exato)", () => {
    const resultado = calcularAnilhas(45, 20, [20, 10]);
    // por lado: 12.5 -> só dá pra usar 1x10 = 10, sobra 2.5 sem anilha pra cobrir
    expect(resultado.exato).toBe(false);
    expect(resultado.porLado).toEqual([{ peso: 10, quantidade: 1 }]);
    expect(resultado.pesoTotalAlcancado).toBe(40);
  });

  it("T-A4: alvo igual ao peso da barra -> nenhuma anilha", () => {
    const resultado = calcularAnilhas(20, 20, [20, 10, 5]);
    expect(resultado.exato).toBe(true);
    expect(resultado.porLado).toEqual([]);
    expect(resultado.pesoTotalAlcancado).toBe(20);
  });

  it("T-A5: alvo abaixo do peso da barra -> nenhuma anilha, não exato", () => {
    const resultado = calcularAnilhas(15, 20, [20, 10, 5]);
    expect(resultado.exato).toBe(false);
    expect(resultado.porLado).toEqual([]);
    expect(resultado.pesoTotalAlcancado).toBe(20);
  });

  it("T-A6: sem anilha nenhuma configurada -> só a barra", () => {
    const resultado = calcularAnilhas(100, 20, []);
    expect(resultado.porLado).toEqual([]);
    expect(resultado.pesoTotalAlcancado).toBe(20);
    expect(resultado.exato).toBe(false);
  });

  it("T-A7: anilhas duplicadas no inventário não inflam a quantidade por si só (mas várias unidades da mesma placa contam)", () => {
    const resultado = calcularAnilhas(60, 20, [10, 10, 10]);
    // deduplicado pra [10]; greedy pega quantas 10 couberem em 20 por lado -> 2x10
    expect(resultado.exato).toBe(true);
    expect(resultado.porLado).toEqual([{ peso: 10, quantidade: 2 }]);
  });
});
