import { describe, expect, it } from "vitest";
import { calcularAnilhas } from "./anilhas";

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
