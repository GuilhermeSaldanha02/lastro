import { describe, expect, it } from "vitest";
import type { ComparacaoPadrao } from "./fora-do-padrao";
import { formatarToneladas, frasePercebida, textosBlocoPadrao } from "./texto-fora-do-padrao";

const acima: ComparacaoPadrao = {
  treinoId: "t1",
  data: "2026-09-12",
  familia: "empurrar",
  volume: 14_602,
  padrao: 10_419,
  sessoesComparadas: 6,
  desvio: 0.4015,
  direcao: "acima",
};
const abaixo: ComparacaoPadrao = { ...acima, familia: "pernas", volume: 8_232, padrao: 12_096, desvio: -0.3194, direcao: "abaixo" };

const junta = (f: { antes: string; numero: string; depois: string }) => f.antes + f.numero + f.depois;

describe("frasePercebida", () => {
  it("pt-BR, acima e abaixo, com o número separado para destaque", () => {
    const f = frasePercebida(acima, "pt-BR");
    expect(f.numero).toBe("14,6 t");
    expect(junta(f)).toBe("No treino de empurrar de 12 set você moveu 14,6 t, 40% acima do seu padrão.");
    expect(junta(frasePercebida(abaixo, "pt-BR"))).toBe("O treino de pernas de 12 set ficou em 8,2 t, 32% abaixo do seu padrão.");
  });

  it("en e es", () => {
    expect(junta(frasePercebida(acima, "en"))).toMatch(/^Your push workout on .+ moved 14\.6 t, 40% above your usual\.$/);
    expect(junta(frasePercebida(abaixo, "es"))).toMatch(/^El entrenamiento de piernas del .+ quedó en 8,2 t, 32% por debajo de tu patrón\.$/);
  });

  it("nunca fala em risco, lesão ou causa", () => {
    for (const idioma of ["pt-BR", "en", "es"] as const) {
      for (const c of [acima, abaixo]) {
        expect(junta(frasePercebida(c, idioma))).not.toMatch(/risco|lesão|risk|injur|riesgo|lesión|porque|because/i);
      }
    }
  });
});

describe("textosBlocoPadrao", () => {
  it("rótulo, percentual com sinal, legenda da régua e janela", () => {
    expect(textosBlocoPadrao(acima, "pt-BR")).toEqual({
      rotulo: "Volume vs. seu padrão",
      pct: "+40%",
      legenda: "seu padrão de empurrar: 10,4 t",
      janela: "últimas 6",
    });
    expect(textosBlocoPadrao(abaixo, "en").pct).toBe("−32%");
    expect(textosBlocoPadrao(abaixo, "es").legenda).toBe("tu patrón de piernas: 12,1 t");
  });
});

describe("formatarToneladas", () => {
  it("uma casa, no separador do idioma", () => {
    expect(formatarToneladas(12_996, "pt-BR")).toBe("13 t");
    expect(formatarToneladas(8_232, "en")).toBe("8.2 t");
  });
});
