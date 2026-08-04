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
    reps: 10,
    peso: 50,
    pesoCorporalIncluso: false,
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

  // T-V5 — peso corporal não entra em volume, nem a carga externa
  it("série com peso_corporal_incluso não entra no volume, nem a carga externa", () => {
    const series = [
      serie({ reps: 8, peso: 10, pesoCorporalIncluso: true }),
      serie({ reps: 10, peso: 50 }),
    ];
    expect(calcularVolume(series)).toBe(500);
  });
});

describe("volumePorGrupoMuscular", () => {
  it("agrupa por grupo muscular, respeitando unilateral e peso corporal", () => {
    const series = [
      serie({ grupoMuscular: "peito", reps: 10, peso: 50 }),
      serie({ grupoMuscular: "costas", reps: 10, peso: 14, unilateral: true }),
      serie({
        grupoMuscular: "costas",
        reps: 8,
        peso: 10,
        pesoCorporalIncluso: true,
      }),
    ];
    const resultado = volumePorGrupoMuscular(series);
    expect(resultado.get("peito")).toBe(500);
    expect(resultado.get("costas")).toBe(280);
  });
});
