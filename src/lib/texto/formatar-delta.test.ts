import { describe, expect, it } from "vitest";
import { formatarDelta, formatarPercentual, formatarPeso } from "./formatar-delta";
import type { BlocoEvidencia } from "@/app/api/analise/evidencia";

function bloco(parcial: Partial<BlocoEvidencia>): BlocoEvidencia {
  return {
    exercicio: "Supino reto com barra",
    grupo_muscular: "peito",
    sinal: "alta",
    peso_referencia: 80,
    reps_referencia: 6,
    volume: 2000,
    series_valendo: 14,
    delta_pct: 8.2,
    ...parcial,
  };
}

describe("formatarPercentual", () => {
  it("positivo ganha sinal + e vírgula decimal", () => {
    expect(formatarPercentual(8.2)).toBe("+8,2%");
  });
  it("negativo mantém o sinal do próprio número, vírgula decimal", () => {
    expect(formatarPercentual(-4.1)).toBe("-4,1%");
  });
  it("inteiro sem casas decimais não ganha vírgula solta", () => {
    expect(formatarPercentual(12)).toBe("+12%");
  });
});

describe("formatarPeso", () => {
  it("meio quilo vira vírgula, não ponto — achado real na tela (102.5 -> 102,5)", () => {
    expect(formatarPeso(102.5)).toBe("102,5");
  });
  it("peso inteiro não ganha casa decimal artificial", () => {
    expect(formatarPeso(80)).toBe("80");
  });
});

describe("formatarDelta", () => {
  it("alta: só o percentual com sinal", () => {
    expect(formatarDelta(bloco({ sinal: "alta", delta_pct: 8.2 }), 4)).toBe("+8,2%");
  });

  it("queda: percentual + janela de comparação", () => {
    expect(formatarDelta(bloco({ sinal: "queda", delta_pct: -4.1 }), 4)).toBe(
      "-4,1% em 4 semanas",
    );
  });

  it("platô com semanas_sem_progresso: usa o streak real (mais específico)", () => {
    expect(
      formatarDelta(
        bloco({ sinal: "plato", delta_pct: 0, semanas_sem_progresso: 3 }),
        4,
      ),
    ).toBe("sem mudança há 3 semanas");
  });

  it("platô sem semanas_sem_progresso: cai para a janela de comparação", () => {
    expect(formatarDelta(bloco({ sinal: "plato", delta_pct: 0 }), 4)).toBe(
      "sem mudança há 4 semanas",
    );
  });

  it("platô com 1 semana: singular, não 'semanas'", () => {
    expect(
      formatarDelta(bloco({ sinal: "plato", delta_pct: 0, semanas_sem_progresso: 1 }), 4),
    ).toBe("sem mudança há 1 semana");
  });
});
