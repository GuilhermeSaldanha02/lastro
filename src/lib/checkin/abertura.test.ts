import { describe, expect, it } from "vitest";
import { deveAbrirSozinha, lerRespostaGuardada } from "./abertura";

const HOJE = "2026-10-02";
const ontem = { dia: "2026-10-01", sono: 4, energia: null, dor_muscular: null, estresse: null };
const hoje = { dia: HOJE, sono: 4, energia: null, dor_muscular: null, estresse: null };

describe("deveAbrirSozinha", () => {
  it("abre quando não há resposta de hoje em lugar nenhum e a folha ainda não subiu", () => {
    expect(deveAbrirSozinha({ hoje: HOJE, respondidoNoServidor: false, guardada: null, folhaVistaNoDia: null })).toBe(true);
  });

  it("a resposta de ontem não conta: um dia novo pede o check-in de novo", () => {
    expect(deveAbrirSozinha({ hoje: HOJE, respondidoNoServidor: false, guardada: ontem, folhaVistaNoDia: "2026-10-01" })).toBe(true);
  });

  it("não abre se o servidor já tem o check-in de hoje (respondeu, fechou o app e abriu de novo)", () => {
    expect(deveAbrirSozinha({ hoje: HOJE, respondidoNoServidor: true, guardada: null, folhaVistaNoDia: null })).toBe(false);
  });

  it("não abre se este aparelho guardou a resposta de hoje (feita sem sinal, ainda na fila)", () => {
    expect(deveAbrirSozinha({ hoje: HOJE, respondidoNoServidor: false, guardada: hoje, folhaVistaNoDia: null })).toBe(false);
  });

  it("depois de um 'Agora não', não sobe de novo na mesma abertura do app", () => {
    expect(deveAbrirSozinha({ hoje: HOJE, respondidoNoServidor: false, guardada: null, folhaVistaNoDia: HOJE })).toBe(false);
  });
});

describe("lerRespostaGuardada", () => {
  it("lê o formato guardado", () => {
    expect(lerRespostaGuardada(JSON.stringify(hoje))).toEqual(hoje);
  });

  it("nota fora da escala vira null, sem derrubar a leitura", () => {
    expect(lerRespostaGuardada(JSON.stringify({ dia: HOJE, sono: 9, energia: 3 }))).toEqual({
      dia: HOJE,
      sono: null,
      energia: 3,
      dor_muscular: null,
      estresse: null,
    });
  });

  it("lixo, vazio e JSON quebrado viram null (nunca lança)", () => {
    expect(lerRespostaGuardada(null)).toBeNull();
    expect(lerRespostaGuardada("")).toBeNull();
    expect(lerRespostaGuardada("{quebrado")).toBeNull();
    expect(lerRespostaGuardada(JSON.stringify({ sono: 3 }))).toBeNull();
    expect(lerRespostaGuardada("123")).toBeNull();
  });
});
