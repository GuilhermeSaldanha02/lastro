import { describe, expect, it } from "vitest";
import { calcularPrs, type EntradaPr } from "./prs";

describe("calcularPrs", () => {
  // T-P1: e1RM da semana atual acima de TODO o histórico -> PR
  it("T-P1: e1RM da semana atual acima do histórico inteiro entra em prs", () => {
    const entradas: EntradaPr[] = [
      {
        exercicio: "Supino reto com barra",
        e1rmSemanaAtual: 80,
        e1rmMaximoHistoricoAnterior: 75,
        volumeSemanaAtual: 1200,
        volumeMaximoHistoricoAnterior: 1400,
      },
    ];
    const resultado = calcularPrs(entradas);
    expect(resultado).toEqual([
      {
        exercicio: "Supino reto com barra",
        tipo: "e1rm",
        valor: 80,
        valor_anterior: 75,
      },
    ]);
  });

  // T-P2: máximo da JANELA (4 semanas), mas menor que uma marca de 6 meses atrás -> NÃO é PR
  it("T-P2: máximo da janela mas abaixo do histórico completo -> não entra em prs", () => {
    const entradas: EntradaPr[] = [
      {
        exercicio: "Supino reto com barra",
        e1rmSemanaAtual: 70,
        e1rmMaximoHistoricoAnterior: 85,
        volumeSemanaAtual: 1200,
        volumeMaximoHistoricoAnterior: 1400,
      },
    ];
    expect(calcularPrs(entradas)).toEqual([]);
  });

  it("PR de volume: volume da semana atual acima do histórico inteiro", () => {
    const entradas: EntradaPr[] = [
      {
        exercicio: "Agachamento livre",
        e1rmSemanaAtual: 70,
        e1rmMaximoHistoricoAnterior: 85,
        volumeSemanaAtual: 2000,
        volumeMaximoHistoricoAnterior: 1500,
      },
    ];
    expect(calcularPrs(entradas)).toEqual([
      {
        exercicio: "Agachamento livre",
        tipo: "volume",
        valor: 2000,
        valor_anterior: 1500,
      },
    ]);
  });
});
