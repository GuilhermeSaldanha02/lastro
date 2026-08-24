import { describe, expect, it } from "vitest";
import type { SerieValendo } from "./tipos";
import { calcularVolume, volumePorGrupoMuscular } from "./volume";

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
    data: "2026-07-27",
    semanaInicio: "2026-07-27",
    ...sobrescritas,
  };
}

describe("calcularVolume", () => {
  // T-V1
  it("soma reps x peso das séries valendo (s1,s2,s3 do fixture F1)", () => {
    const series = [
      serie({ reps: 10, peso: 50 }),
      serie({ reps: 8, peso: 50 }),
      serie({ reps: 6, peso: 50 }),
    ];
    expect(calcularVolume(series)).toBe(1200);
  });

  // T-V4 — unilateral dobra o volume
  it("exercício unilateral dobra o volume da série (10x14 -> 280, não 140)", () => {
    const series = [serie({ reps: 10, peso: 14, unilateral: true })];
    expect(calcularVolume(series)).toBe(280);
  });

  // T-V6 — pesoPorLado (halter bilateral) dobra o volume, mesma razão de unilateral
  it("exercício com peso por lado dobra o volume da série (10x14 -> 280, não 140)", () => {
    const series = [serie({ reps: 10, peso: 14, pesoPorLado: true })];
    expect(calcularVolume(series)).toBe(280);
  });

  // T-V7 — os dois multiplicadores nunca compõem (nunca ×2 × ×2)
  it("unilateral e pesoPorLado juntos não compõem — dobra só uma vez", () => {
    const series = [serie({ reps: 10, peso: 14, unilateral: true, pesoPorLado: true })];
    expect(calcularVolume(series)).toBe(280);
  });
});

describe("volumePorGrupoMuscular", () => {
  it("agrupa por grupo muscular, respeitando unilateral e peso por lado", () => {
    const series = [
      serie({ grupoMuscular: "peito", reps: 10, peso: 50 }),
      serie({ grupoMuscular: "costas", reps: 10, peso: 14, unilateral: true }),
      serie({
        grupoMuscular: "costas",
        reps: 8,
        peso: 10,
        pesoPorLado: true,
      }),
    ];
    const resultado = volumePorGrupoMuscular(series);
    expect(resultado.get("peito")).toBe(500);
    expect(resultado.get("costas")).toBe(280 + 160);
  });
});
