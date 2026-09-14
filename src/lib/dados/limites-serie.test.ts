import { describe, expect, it } from "vitest";
import { validarNumerosDaSerie } from "./limites-serie";

const valendo = (reps: string, peso: string, rir = "") => validarNumerosDaSerie({ tipo: "valendo", reps, peso, rir });

describe("validarNumerosDaSerie", () => {
  it("aceita uma série comum e devolve os números", () => {
    expect(valendo("8", "42.5", "2")).toEqual({ ok: true, reps: 8, peso: 42.5, rir: 2 });
  });

  it("aceita os extremos que o banco aceita", () => {
    expect(valendo("1", "0", "0")).toMatchObject({ ok: true, reps: 1, peso: 0, rir: 0 });
    expect(valendo("200", "1000", "10")).toMatchObject({ ok: true, reps: 200, peso: 1000, rir: 10 });
  });

  // Os valores exatos que passaram pela tela e o banco recusou (A1, A2, OF-08).
  it.each([
    ["reps 201", "201", "40", ""],
    ["reps 2,5", "2.5", "40", ""],
    ["reps 999 (edição)", "999", "40", ""],
    ["peso 1000,01", "5", "1000.01", ""],
    ["peso 99999999", "6", "99999999", ""],
    ["RIR 1,5", "7", "40", "1.5"],
    ["RIR 11", "7", "40", "11"],
  ])("recusa %s", (_nome, reps, peso, rir) => {
    expect(valendo(reps, peso, rir).ok).toBe(false);
  });

  it.each([
    ["reps vazio", "", "40"],
    ["reps zero", "0", "40"],
    ["reps negativo", "-3", "40"],
    ["reps com letras", "abc", "40"],
    ["peso negativo", "8", "-1"],
    ["peso com letras", "8", "abc"],
  ])("continua recusando %s", (_nome, reps, peso) => {
    expect(valendo(reps, peso).ok).toBe(false);
  });

  it("RIR vazio é ausente (null), não zero", () => {
    expect(valendo("8", "40", "")).toMatchObject({ ok: true, rir: null });
  });

  it("aquecimento ignora o RIR, mesmo fora da faixa", () => {
    expect(validarNumerosDaSerie({ tipo: "aquecimento", reps: "8", peso: "40", rir: "99" })).toMatchObject({
      ok: true,
      rir: null,
    });
  });

  it("campo ausente do formulário (null) não vira zero", () => {
    expect(validarNumerosDaSerie({ tipo: "valendo", reps: "8", peso: null, rir: null }).ok).toBe(false);
  });

  it("devolve a mensagem de cada campo", () => {
    expect(valendo("201", "40")).toEqual({ ok: false, erro: "Reps precisa ser um número inteiro entre 1 e 200." });
    expect(valendo("8", "1001")).toEqual({ ok: false, erro: "Peso precisa estar entre 0 e 1000 kg." });
    expect(valendo("8", "40", "1.5")).toEqual({ ok: false, erro: "RIR precisa ser um número inteiro entre 0 e 10." });
  });
});
