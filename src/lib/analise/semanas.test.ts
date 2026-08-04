import { describe, expect, it } from "vitest";
import {
  paraISO,
  segundaFeiraDaSemana,
  semanaAnaliseAtual,
  semanaInicioDoTreino,
  somarDias,
} from "./semanas";

// Fixture F1 (SDD §4.5): agora = 2026-08-03T10:00:00Z (segunda-feira).
// "Semana analisada" (semana_atual_inicio) precisa cair em 2026-07-27 —
// a última semana ISO COMPLETA antes da semana corrente de `agora`, não a
// semana que contém `agora` (que ainda está começando). Ver SDD §8, item 1
// aberto: "a semana fecha na segunda?" — resolvido aqui como sim.
describe("semanaAnaliseAtual", () => {
  it("é a segunda-feira da última semana completa antes de `agora`", () => {
    const agora = new Date("2026-08-03T10:00:00Z");
    expect(semanaAnaliseAtual(agora)).toBe("2026-07-27");
  });
});

describe("segundaFeiraDaSemana", () => {
  it("uma segunda-feira mapeia para si mesma", () => {
    expect(paraISO(segundaFeiraDaSemana(new Date("2026-07-27T00:00:00Z")))).toBe(
      "2026-07-27",
    );
  });

  it("um domingo mapeia para a segunda anterior", () => {
    expect(paraISO(segundaFeiraDaSemana(new Date("2026-08-02T00:00:00Z")))).toBe(
      "2026-07-27",
    );
  });
});

describe("semanaInicioDoTreino", () => {
  it("deriva a segunda-feira ISO a partir da data do treino", () => {
    expect(semanaInicioDoTreino("2026-07-30")).toBe("2026-07-27");
  });
});

describe("somarDias", () => {
  it("soma dias em aritmética de calendário UTC, sem deriva de fuso", () => {
    expect(paraISO(somarDias(new Date("2026-07-27T00:00:00Z"), 7))).toBe(
      "2026-08-03",
    );
    expect(paraISO(somarDias(new Date("2026-07-27T00:00:00Z"), -7))).toBe(
      "2026-07-20",
    );
  });
});
