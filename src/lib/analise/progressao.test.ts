import { describe, expect, it } from "vitest";
import { calcularSeriesSemanais, detectarPlato } from "./progressao";
import type { SerieValendo } from "./tipos";

function serie(overrides: Partial<SerieValendo>): SerieValendo {
  return {
    treinoId: "t1",
    exercicioId: "supino",
    exercicio: "Supino reto",
    grupoMuscular: "peito",
    unilateral: false,
    reps: 8,
    peso: 40,
    pesoCorporalIncluso: false,
    data: "2026-07-06",
    semanaInicio: "2026-07-06",
    ...overrides,
  };
}

describe("calcularSeriesSemanais", () => {
  it("usa o e1RM MÁXIMO elegível entre as sessões da semana, não a média", () => {
    const pontos = calcularSeriesSemanais(
      [
        serie({ semanaInicio: "2026-07-06", reps: 8, peso: 40, treinoId: "a" }),
        serie({ semanaInicio: "2026-07-06", reps: 5, peso: 50, treinoId: "b" }),
      ],
      ["2026-07-06"],
    );
    // e1RM(8,40) = 40*(1+8/30) ≈ 50.67 · e1RM(5,50) = 50*(1+5/30) ≈ 58.33
    expect(pontos[0].e1rm).toBeCloseTo(58.33, 1);
  });

  it("soma o volume das séries da semana", () => {
    const pontos = calcularSeriesSemanais(
      [
        serie({ semanaInicio: "2026-07-06", reps: 8, peso: 40, treinoId: "a" }),
        serie({ semanaInicio: "2026-07-06", reps: 10, peso: 40, treinoId: "b" }),
      ],
      ["2026-07-06"],
    );
    expect(pontos[0].volume).toBe(8 * 40 + 10 * 40);
  });

  it("semana sem nenhuma série fica com e1rm e volume AUSENTES (Regra da Presença)", () => {
    const pontos = calcularSeriesSemanais(
      [serie({ semanaInicio: "2026-07-06" })],
      ["2026-06-29", "2026-07-06"],
    );
    expect(pontos[0]).toEqual({ semanaInicio: "2026-06-29" });
    expect(pontos[1].e1rm).toBeDefined();
  });

  it("reps acima do teto de e1RM não zeram a semana — volume continua presente, só o e1rm some", () => {
    const pontos = calcularSeriesSemanais(
      [serie({ semanaInicio: "2026-07-06", reps: 20, peso: 40 })], // acima de E1RM_REPS_MAX (12)
      ["2026-07-06"],
    );
    expect(pontos[0].e1rm).toBeUndefined();
    expect(pontos[0].volume).toBe(20 * 40);
  });

  it("preserva a ordem cronológica recebida em `semanas`", () => {
    const pontos = calcularSeriesSemanais(
      [serie({ semanaInicio: "2026-07-13" }), serie({ semanaInicio: "2026-06-29" })],
      ["2026-06-29", "2026-07-06", "2026-07-13"],
    );
    expect(pontos.map((p) => p.semanaInicio)).toEqual([
      "2026-06-29",
      "2026-07-06",
      "2026-07-13",
    ]);
  });
});

describe("detectarPlato", () => {
  function pontos(valores: Array<number | undefined>) {
    return valores.map((valor, i) => ({
      semanaInicio: `semana-${i}`,
      valor,
    }));
  }

  it("detecta platô nas 3 últimas semanas com variação dentro de 2%", () => {
    const resultado = detectarPlato(pontos([100, 100, 100.5, 99.8, 100.2]));
    expect(resultado).toEqual({
      semanaInicio: "semana-2",
      semanaFim: "semana-4",
      semanas: 3,
    });
  });

  it("não detecta platô com só 2 semanas estáveis", () => {
    expect(detectarPlato(pontos([80, 90, 100, 99.8]))).toBeNull();
  });

  it("não detecta platô quando a variação passa de 2%", () => {
    expect(detectarPlato(pontos([100, 103, 106, 109]))).toBeNull();
  });

  it("uma ausência (semana sem sessão) quebra a sequência do platô", () => {
    expect(detectarPlato(pontos([100, 100, undefined, 100, 100]))).toBeNull();
  });

  it("só considera a sequência mais recente — progresso seguido de platô não conta as semanas de progresso", () => {
    const resultado = detectarPlato(pontos([80, 90, 100, 100.5, 99.9]));
    expect(resultado?.semanas).toBe(3);
    expect(resultado?.semanaInicio).toBe("semana-2");
  });

  it("progresso nas últimas semanas não é platô", () => {
    expect(detectarPlato(pontos([100, 105, 110, 115]))).toBeNull();
  });
});
