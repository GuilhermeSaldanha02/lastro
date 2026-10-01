import { describe, expect, it } from "vitest";
import { proximaOrdem } from "./ordem-serie";

describe("proximaOrdem (TR-17)", () => {
  it("treino vazio começa em 1", () => {
    expect(proximaOrdem([])).toBe(1);
  });

  it("segue a maior ordem existente", () => {
    expect(proximaOrdem([{ ordem: 1 }, { ordem: 2 }, { ordem: 3 }])).toBe(4);
  });

  it("apagar a 2ª série não faz a próxima repetir a 3 (o bug: length + 1 dava 3)", () => {
    const depoisDeApagar = [{ ordem: 1 }, { ordem: 3 }];
    expect(proximaOrdem(depoisDeApagar)).toBe(4);
  });

  it("apagar a última série também não reaproveita a ordem dela", () => {
    expect(proximaOrdem([{ ordem: 1 }, { ordem: 2 }], 3)).toBe(4);
  });

  it("a última ordem usada vence quando a lista ainda não re-renderizou", () => {
    expect(proximaOrdem([{ ordem: 1 }], 5)).toBe(6);
  });

  it("não depende da posição na lista", () => {
    expect(proximaOrdem([{ ordem: 7 }, { ordem: 2 }])).toBe(8);
  });
});
