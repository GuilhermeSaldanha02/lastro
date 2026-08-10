import { describe, expect, it } from "vitest";
import { separarVeredito } from "./separar-veredito";

describe("separarVeredito", () => {
  it("corta na primeira frase (ponto final), resto vira corpo", () => {
    const r = separarVeredito(
      "Você empacou na Remada curvada com barra. O Levantamento terra também não evoluiu.",
    );
    expect(r.veredito).toBe("Você empacou na Remada curvada com barra.");
    expect(r.corpo).toBe("O Levantamento terra também não evoluiu.");
  });

  it("texto real capturado da API (2026-08-10) — vírgulas decimais não quebram o corte", () => {
    const texto =
      "Você está progredindo de forma parcial, destacando-se o avanço de 11,5% no e1RM do Supino reto com barra, enquanto outros movimentos oscilam entre a estabilidade e a queda.\n\nNo Agachamento livre, houve um ganho de 7,9% no e1RM.";
    const r = separarVeredito(texto);
    expect(r.veredito).toBe(
      "Você está progredindo de forma parcial, destacando-se o avanço de 11,5% no e1RM do Supino reto com barra, enquanto outros movimentos oscilam entre a estabilidade e a queda.",
    );
    expect(r.corpo).toBe("No Agachamento livre, houve um ganho de 7,9% no e1RM.");
  });

  it("sem pontuação de fim de frase — tudo vira veredito, corpo vazio", () => {
    const r = separarVeredito("dado insuficiente para gerar leitura");
    expect(r.veredito).toBe("dado insuficiente para gerar leitura");
    expect(r.corpo).toBe("");
  });

  it("frase única com ponto final — corpo fica vazio, não quebra", () => {
    const r = separarVeredito("Você progrediu no supino.");
    expect(r.veredito).toBe("Você progrediu no supino.");
    expect(r.corpo).toBe("");
  });

  it("string vazia não lança", () => {
    expect(() => separarVeredito("")).not.toThrow();
    expect(separarVeredito("").veredito).toBe("");
  });
});
