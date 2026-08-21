import { describe, expect, it } from "vitest";
import { calcularSequenciaAtual } from "./sequencia";

describe("calcularSequenciaAtual", () => {
  it("conta 0 quando não há treino nenhum", () => {
    expect(calcularSequenciaAtual([], "2026-08-21")).toBe(0);
  });

  // O caso que provou o bug: a Home dizia "2 sessões seguidas" para
  // terça + quinta, com quarta vazia no meio. Dados reais do dono,
  // 2026-08-21 (sexta).
  it("terça e quinta, com quarta vazia, NÃO são uma sequência de 2", () => {
    expect(calcularSequenciaAtual(["2026-08-18", "2026-08-20"], "2026-08-21")).toBe(1);
  });

  it("conta dias consecutivos terminando em ontem", () => {
    expect(
      calcularSequenciaAtual(["2026-08-19", "2026-08-20"], "2026-08-21"),
    ).toBe(2);
  });

  it("conta dias consecutivos terminando hoje", () => {
    expect(
      calcularSequenciaAtual(["2026-08-19", "2026-08-20", "2026-08-21"], "2026-08-21"),
    ).toBe(3);
  });

  // Sem esta regra, um treino de duas semanas atrás continuaria sendo
  // anunciado como "sequência" para sempre.
  it("zera quando o último treino é mais velho que ontem", () => {
    expect(calcularSequenciaAtual(["2026-08-18"], "2026-08-21")).toBe(0);
  });

  it("atravessa a virada de semana", () => {
    // domingo 16, segunda 17 — semanas ISO diferentes, sequência real.
    expect(
      calcularSequenciaAtual(["2026-08-16", "2026-08-17"], "2026-08-18"),
    ).toBe(2);
  });

  it("atravessa a virada de mês", () => {
    expect(
      calcularSequenciaAtual(["2026-07-31", "2026-08-01"], "2026-08-01"),
    ).toBe(2);
  });

  it("ignora datas duplicadas do mesmo dia", () => {
    expect(
      calcularSequenciaAtual(["2026-08-20", "2026-08-20", "2026-08-19"], "2026-08-21"),
    ).toBe(2);
  });

  it("ignora treinos futuros", () => {
    expect(
      calcularSequenciaAtual(["2026-08-22", "2026-08-20"], "2026-08-21"),
    ).toBe(1);
  });

  it("conta só a corrida mais recente, não a maior do histórico", () => {
    // corrida antiga de 4 dias, e uma de 1 dia ontem
    const datas = [
      "2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04",
      "2026-08-20",
    ];
    expect(calcularSequenciaAtual(datas, "2026-08-21")).toBe(1);
  });
});
