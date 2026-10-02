import { describe, expect, it } from "vitest";
import { compararComMedia, MINIMO_DE_DIAS } from "./media";

describe("compararComMedia", () => {
  it("não compara sem histórico suficiente", () => {
    expect(compararComMedia(5, [3, 3, 3])).toBeNull();
    expect(compararComMedia(5, [3, 3, 3, null, null])).toBeNull();
    expect(MINIMO_DE_DIAS).toBe(4);
  });

  it("não compara se a pessoa não respondeu o sinal hoje", () => {
    expect(compararComMedia(null, [3, 3, 3, 3, 3])).toBeNull();
  });

  it("acima, abaixo e na média, com folga de 1 ponto sobre a média dos dias anteriores", () => {
    const base = [3, 3, 3, 3, 3];
    expect(compararComMedia(4, base)).toBe("acima");
    expect(compararComMedia(5, base)).toBe("acima");
    expect(compararComMedia(2, base)).toBe("abaixo");
    expect(compararComMedia(1, base)).toBe("abaixo");
    expect(compararComMedia(3, base)).toBe("na-media");
  });

  it("dentro da folga fica na média (média 3,4, hoje 4: diferença 0,6)", () => {
    expect(compararComMedia(4, [3, 3, 4, 3, 4])).toBe("na-media");
  });

  it("ignora dias em que o sinal não foi respondido, sem contá-los como zero", () => {
    expect(compararComMedia(5, [2, null, 2, null, 2, 2])).toBe("acima");
  });

  it("usa só os 14 dias mais recentes (o array vem do mais novo para o mais antigo)", () => {
    const recentes = Array(14).fill(3);
    const velhos = Array(30).fill(1);
    expect(compararComMedia(3, [...recentes, ...velhos])).toBe("na-media");
  });
});
