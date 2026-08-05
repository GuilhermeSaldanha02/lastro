import { describe, expect, it } from "vitest";
import type { SerieValendo } from "./tipos";
import { calcularSeriesDificeis } from "./series-dificeis";

function serie(sobrescritas: Partial<SerieValendo>): SerieValendo {
  return {
    treinoId: "t1",
    exercicioId: "e1",
    exercicio: "Supino reto com barra",
    grupoMuscular: "peito",
    unilateral: false,
    reps: 10,
    peso: 50,
    pesoCorporalIncluso: false,
    data: "2026-07-27",
    semanaInicio: "2026-07-27",
    ...sobrescritas,
  };
}

describe("calcularSeriesDificeis", () => {
  // T-D1
  it("F1: 2 difíceis (rir 2 e rir 0) de 3 valendo, 2 com rir", () => {
    const series = [
      serie({ rir: 2 }),
      serie({ rir: 0 }),
      serie({ rir: undefined }),
    ];
    const resultado = calcularSeriesDificeis(series);
    expect(resultado).toEqual({
      series_dificeis: { total: 2, series_valendo_com_rir: 2, series_valendo: 3 },
    });
  });

  // T-D2 — rir 0 conta como difícil
  it("rir 0 é série difícil, não ignorada", () => {
    const series = [serie({ rir: 0 })];
    const resultado = calcularSeriesDificeis(series);
    expect(resultado.series_dificeis?.total).toBe(1);
  });

  // T-D3 — rir ausente não é fácil nem difícil, mas conta no denominador total
  it("rir ausente não conta como difícil e permanece no denominador total", () => {
    const series = [serie({ rir: 0 }), serie({ rir: undefined }), serie({ rir: undefined })];
    const resultado = calcularSeriesDificeis(series);
    // cobertura = 1/3 = 33% < 60%, então o campo fica ausente aqui —
    // usa-se um fixture com cobertura suficiente para isolar o efeito do rir ausente.
    expect(resultado.cobertura_rir_insuficiente).toBeDefined();
  });

  it("rir ausente com cobertura suficiente: não conta como difícil, mas conta no denominador", () => {
    const series = [
      serie({ rir: 0 }),
      serie({ rir: 1 }),
      serie({ rir: 2 }),
      serie({ rir: undefined }),
    ];
    const resultado = calcularSeriesDificeis(series);
    expect(resultado.series_dificeis).toEqual({
      total: 3,
      series_valendo_com_rir: 3,
      series_valendo: 4,
    });
  });

  // T-D4 — piso de cobertura: 1 de 5 = 20%
  it("cobertura abaixo do piso: series_dificeis ausente, cobertura_rir_insuficiente presente", () => {
    const series = [
      serie({ rir: 0 }),
      serie({ rir: undefined }),
      serie({ rir: undefined }),
      serie({ rir: undefined }),
      serie({ rir: undefined }),
    ];
    const resultado = calcularSeriesDificeis(series);
    expect(resultado.series_dificeis).toBeUndefined();
    expect(resultado.cobertura_rir_insuficiente).toEqual({
      series_valendo_com_rir: 1,
      series_valendo: 5,
    });
  });

  // T-D5 — exatamente no piso (3 de 5 = 60%) conta como presente
  it("cobertura exatamente no piso (60%) conta como suficiente (>=, não >)", () => {
    const series = [
      serie({ rir: 0 }),
      serie({ rir: 1 }),
      serie({ rir: 5 }),
      serie({ rir: undefined }),
      serie({ rir: undefined }),
    ];
    const resultado = calcularSeriesDificeis(series);
    expect(resultado.series_dificeis).toBeDefined();
    expect(resultado.cobertura_rir_insuficiente).toBeUndefined();
  });
});
