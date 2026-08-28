import { describe, expect, it } from "vitest";
import type { SerieValendo } from "./tipos";
import { avaliarSinalDeload } from "./alerta-deload";

const AGORA = new Date("2026-08-31T12:00:00Z"); // segunda-feira 2026-08-31

function serie(sobrescritas: Partial<SerieValendo>): SerieValendo {
  return {
    treinoId: "t1",
    exercicioId: "e1",
    exercicio: "Supino reto com barra",
    grupoMuscular: "peito",
    unilateral: false,
    pesoPorLado: false,
    reps: 10,
    peso: 50,
    data: "2026-08-20",
    semanaInicio: "2026-08-24",
    ...sobrescritas,
  };
}

/** 6 séries da semana atual (fechada = 2026-08-24), todas com RIR dado. */
function seriesSemanaAtual(rirs: number[]): SerieValendo[] {
  return rirs.map((rir) => serie({ rir, semanaInicio: "2026-08-24" }));
}

/**
 * Séries espalhadas pelas 3 semanas anteriores a 2026-08-24 (JANELA_SEMANAS
 * é 4 no total, contando a semana atual — sobram 3 anteriores).
 */
function seriesJanelaAnterior(rirs: number[]): SerieValendo[] {
  const semanas = ["2026-08-03", "2026-08-10", "2026-08-17"];
  return rirs.map((rir, i) =>
    serie({ rir, semanaInicio: semanas[i % semanas.length] }),
  );
}

describe("avaliarSinalDeload", () => {
  it("null sem séries suficientes na semana atual", () => {
    const r = avaliarSinalDeload(
      [...seriesSemanaAtual([1, 1, 1]), ...seriesJanelaAnterior([3, 3, 3, 3, 3, 3])],
      AGORA,
    );
    expect(r).toBeNull();
  });

  it("null quando a cobertura de RIR é insuficiente na semana atual", () => {
    const semanaAtual = [
      ...seriesSemanaAtual([1, 1]), // só 2 com RIR
      serie({ rir: undefined, semanaInicio: "2026-08-24" }),
      serie({ rir: undefined, semanaInicio: "2026-08-24" }),
      serie({ rir: undefined, semanaInicio: "2026-08-24" }),
      serie({ rir: undefined, semanaInicio: "2026-08-24" }),
    ];
    const r = avaliarSinalDeload(
      [...semanaAtual, ...seriesJanelaAnterior([3, 3, 3, 3, 3, 3])],
      AGORA,
    );
    expect(r).toBeNull();
  });

  it("null quando o aumento de dificuldade é pequeno", () => {
    // Atual: 3/6 difícil (50%). Anterior: 2/6 difícil (33%). Diferença < 30pp.
    const r = avaliarSinalDeload(
      [
        ...seriesSemanaAtual([1, 1, 1, 8, 8, 8]),
        ...seriesJanelaAnterior([2, 2, 8, 8, 8, 8]),
      ],
      AGORA,
    );
    expect(r).toBeNull();
  });

  it("sinaliza quando a proporção de séries difíceis sobe bastante", () => {
    // Atual: 6/6 difícil (100%). Anterior: 1/6 difícil (~17%). Diferença >= 30pp.
    const r = avaliarSinalDeload(
      [
        ...seriesSemanaAtual([0, 1, 1, 2, 2, 3]),
        ...seriesJanelaAnterior([1, 8, 8, 8, 8, 8]),
      ],
      AGORA,
    );
    expect(r).not.toBeNull();
    expect(r!.proporcaoDificeisSemanaAtual).toBeCloseTo(1);
    expect(r!.proporcaoDificeisJanelaAnterior).toBeCloseTo(1 / 6);
  });

  it("null quando a janela anterior não tem cobertura de RIR suficiente", () => {
    const janelaAnteriorFraca: SerieValendo[] = [
      serie({ rir: 1, semanaInicio: "2026-08-17" }),
      serie({ rir: undefined, semanaInicio: "2026-08-17" }),
      serie({ rir: undefined, semanaInicio: "2026-08-10" }),
      serie({ rir: undefined, semanaInicio: "2026-08-10" }),
    ];
    const r = avaliarSinalDeload(
      [...seriesSemanaAtual([0, 0, 0, 1, 1, 1]), ...janelaAnteriorFraca],
      AGORA,
    );
    expect(r).toBeNull();
  });
});
