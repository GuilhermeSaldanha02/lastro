import { describe, expect, it } from "vitest";
import { lerPlanoDoModelo } from "./limites-modelo";

describe("lerPlanoDoModelo", () => {
  it("lê um plano comum", () => {
    expect(lerPlanoDoModelo({ reps: "10", peso: "62.5" })).toEqual({ ok: true, reps: 10, peso: 62.5 });
  });

  it("aceita vírgula decimal no peso", () => {
    expect(lerPlanoDoModelo({ reps: "8", peso: "40,5" })).toEqual({ ok: true, reps: 8, peso: 40.5 });
  });

  it("aceita os extremos que o banco aceita", () => {
    expect(lerPlanoDoModelo({ reps: "100", peso: "1000" })).toEqual({ ok: true, reps: 100, peso: 1000 });
  });

  it("campo vazio, ausente ou zero é 'não cadastrado' (null), nunca 0", () => {
    expect(lerPlanoDoModelo(undefined)).toEqual({ ok: true, reps: null, peso: null });
    expect(lerPlanoDoModelo({ reps: "", peso: "  " })).toEqual({ ok: true, reps: null, peso: null });
    expect(lerPlanoDoModelo({ reps: "0", peso: "0" })).toEqual({ ok: true, reps: null, peso: null });
  });

  // Os valores exatos que deixaram modelo vazio no banco (achado M4).
  it.each([
    ["reps 150", { reps: "150" }],
    ["reps 2,5", { reps: "2.5" }],
    ["reps 101", { reps: "101" }],
    ["peso 1000,5", { peso: "1000.5" }],
  ])("recusa %s", (_nome, plano) => {
    expect(lerPlanoDoModelo(plano).ok).toBe(false);
  });

  it("devolve a mensagem de cada campo", () => {
    expect(lerPlanoDoModelo({ reps: "150" })).toEqual({
      ok: false,
      erro: "Reps do plano precisa ser um número inteiro entre 1 e 100.",
    });
    expect(lerPlanoDoModelo({ peso: "1000.5" })).toEqual({
      ok: false,
      erro: "Peso do plano precisa estar entre 0 e 1000 kg.",
    });
  });
});
