import { describe, expect, it } from "vitest";
import {
  ehRecorde,
  marcarRecordesHistoricos,
  type SerieHistoricaParaComparar,
} from "./recorde-serie";

function historicoDe(n: number, reps: number, peso: number): SerieHistoricaParaComparar[] {
  return Array.from({ length: n }, (_, i) => ({
    reps,
    peso,
    treinoId: `treino-${i}`,
  }));
}

describe("ehRecorde", () => {
  it("T-R1: e1RM acima do máximo histórico, com sessões suficientes -> recorde", () => {
    const historico = historicoDe(3, 8, 80); // e1rm = 80 * (1 + 8/30) ≈ 101.33
    expect(ehRecorde({ reps: 8, peso: 90 }, historico)).toBe(true);
  });

  it("T-R2: e1RM abaixo do máximo histórico -> não é recorde", () => {
    const historico = historicoDe(3, 8, 90);
    expect(ehRecorde({ reps: 8, peso: 80 }, historico)).toBe(false);
  });

  it("T-R3: menos sessões anteriores que o piso -> nunca é recorde, mesmo com e1RM maior", () => {
    const historico = historicoDe(2, 8, 50);
    expect(ehRecorde({ reps: 8, peso: 90 }, historico)).toBe(false);
  });

  it("T-R4: histórico vazio -> não é recorde (sem sessões suficientes)", () => {
    expect(ehRecorde({ reps: 8, peso: 90 }, [])).toBe(false);
  });

  it("T-R5: série nova acima do teto de reps confiável -> nunca é recorde", () => {
    const historico = historicoDe(3, 8, 50);
    expect(ehRecorde({ reps: 20, peso: 90 }, historico)).toBe(false);
  });

  it("T-R6: série histórica acima do teto não contamina o máximo (fica de fora da comparação)", () => {
    // A série de 20 reps não é elegível e não deveria contar como "o máximo".
    const historico: SerieHistoricaParaComparar[] = [
      { reps: 20, peso: 200, treinoId: "t1" }, // fora do teto — ignorada
      { reps: 8, peso: 60, treinoId: "t2" },
      { reps: 8, peso: 60, treinoId: "t3" },
    ];
    // e1rm de 8x70 > e1rm de 8x60, então deve entrar mesmo sem bater 200kg.
    expect(ehRecorde({ reps: 8, peso: 70 }, historico)).toBe(true);
  });

  it("T-R7: múltiplas séries no mesmo treino contam como UMA sessão", () => {
    const historico: SerieHistoricaParaComparar[] = [
      { reps: 8, peso: 50, treinoId: "t1" },
      { reps: 8, peso: 55, treinoId: "t1" },
      { reps: 8, peso: 50, treinoId: "t2" },
    ];
    // Só 2 treinos distintos — abaixo do piso de 3.
    expect(ehRecorde({ reps: 8, peso: 90 }, historico)).toBe(false);
  });

  it("T-R8: e1RM empatado com o máximo histórico -> não é recorde (precisa superar, não igualar)", () => {
    const historico = historicoDe(3, 8, 80);
    expect(ehRecorde({ reps: 8, peso: 80 }, historico)).toBe(false);
  });
});

describe("marcarRecordesHistoricos", () => {
  it("T-R9: marca cada série como recorde do PRÓPRIO momento, não só a maior de todas", () => {
    const cronologico: SerieHistoricaParaComparar[] = [
      { reps: 8, peso: 50, treinoId: "t1" },
      { reps: 8, peso: 55, treinoId: "t2" },
      { reps: 8, peso: 60, treinoId: "t3" },
      { reps: 8, peso: 65, treinoId: "t4" }, // 3 sessões anteriores, piso ok, supera 60 -> PR
      { reps: 8, peso: 60, treinoId: "t5" }, // abaixo do máximo anterior (65) -> não é PR
      { reps: 8, peso: 70, treinoId: "t6" }, // supera 65 -> PR
    ];
    expect(marcarRecordesHistoricos(cronologico)).toEqual([
      false,
      false,
      false,
      true,
      false,
      true,
    ]);
  });

  it("T-R10: histórico vazio -> array vazio", () => {
    expect(marcarRecordesHistoricos([])).toEqual([]);
  });
});
