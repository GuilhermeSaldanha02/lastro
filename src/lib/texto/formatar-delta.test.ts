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
  // es também usa vírgula (separadorDecimal) — sem teste até 2026-09-03,
  // quando o fallback determinístico (route.ts) virou o primeiro
  // consumidor real do idioma "es" nestes helpers.
  it("es usa vírgula, igual pt-BR", () => {
    expect(formatarPercentual(66.7, "es")).toBe("+66,7%");
  });
  it("en usa ponto — não deve ganhar vírgula por engano", () => {
    expect(formatarPercentual(66.7, "en")).toBe("+66.7%");
  });
});

describe("formatarPeso", () => {
  it("meio quilo vira vírgula, não ponto — achado real na tela (102.5 -> 102,5)", () => {
    expect(formatarPeso(102.5)).toBe("102,5");
  });
  it("es usa vírgula, igual pt-BR", () => {
    expect(formatarPeso(349.4, "es")).toBe("349,4");
  });
  it("en mantém o ponto", () => {
    expect(formatarPeso(349.4, "en")).toBe("349.4");
  });
  it("peso inteiro não ganha casa decimal artificial", () => {
    expect(formatarPeso(80)).toBe("80");
  });

  // Agrupamento de milhar (2026-09-10). O volume semanal passa de 10.000 kg
  // com facilidade — é o número grande que mais precisa ser lido rápido.
  it("agrupa milhar com PONTO em pt-BR", () => {
    expect(formatarPeso(7280)).toBe("7.280");
  });
  it("agrupa milhar com PONTO em es", () => {
    expect(formatarPeso(7280, "es")).toBe("7.280");
  });
  it("agrupa milhar com VÍRGULA em en — é o oposto do decimal", () => {
    expect(formatarPeso(7280, "en")).toBe("7,280");
  });
  it("milhar e decimal convivem sem se confundir", () => {
    expect(formatarPeso(12480.5)).toBe("12.480,5");
    expect(formatarPeso(12480.5, "en")).toBe("12,480.5");
  });
  it("agrupa de três em três acima de um milhão", () => {
    expect(formatarPeso(1234567)).toBe("1.234.567");
  });
  it("não agrupa abaixo de mil — 999 não vira 9.99", () => {
    expect(formatarPeso(999)).toBe("999");
    expect(formatarPeso(1000)).toBe("1.000");
  });
  it("negativo mantém o sinal colado, sem separador solto", () => {
    // `\B` não casa entre "-" e o primeiro dígito; sem isso sairia "-.7.280".
    expect(formatarPeso(-7280)).toBe("-7.280");
  });
  it("zero continua zero", () => {
    expect(formatarPeso(0)).toBe("0");
  });

  // O validador do parecer desmonta milhar antes de comparar
  // (api/analise/validador.ts). Este teste trava a convenção nos dois
  // lados: se alguém inverter os separadores aqui, o validador passa a
  // ler 12.480 como 12,48 e rejeita parecer correto como intruso.
  it("milhar e decimal são sempre caracteres OPOSTOS, em todo idioma", () => {
    for (const [idioma, esperado] of [
      ["pt-BR", "12.480,5"],
      ["es", "12.480,5"],
      ["en", "12,480.5"],
    ] as const) {
      expect(formatarPeso(12480.5, idioma)).toBe(esperado);
    }
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
