import { describe, expect, it } from "vitest";

import { JANELA_TOQUE_DUPLO_MS, criarGuardaDeToque, toqueCedoDemais } from "./toque-duplo";

// TR-11 e TR-13 (QA.md, 2026-09-23): dois toques em 18–42 ms gravavam duas
// séries em "Repetir série" e passavam direto pela confirmação de
// "Finalizar Treino". Um segundo toque dentro da janela é o mesmo gesto.
describe("guarda de toque duplo", () => {
  it("aceita o primeiro toque e recusa o segundo dentro da janela", () => {
    const guarda = criarGuardaDeToque();
    expect(guarda.aceitar(1_000)).toBe(true);
    expect(guarda.aceitar(1_018)).toBe(false);
    expect(guarda.aceitar(1_000 + JANELA_TOQUE_DUPLO_MS - 1)).toBe(false);
  });

  it("aceita de novo depois da janela, contada do último toque ACEITO", () => {
    const guarda = criarGuardaDeToque();
    expect(guarda.aceitar(1_000)).toBe(true);
    expect(guarda.aceitar(1_300)).toBe(false);
    // 1_300 foi recusado e não reinicia a janela: 1_500 já passa.
    expect(guarda.aceitar(1_000 + JANELA_TOQUE_DUPLO_MS)).toBe(true);
  });

  it("toqueCedoDemais mede desde o momento em que a confirmação apareceu", () => {
    expect(toqueCedoDemais(null, 5_000)).toBe(false);
    expect(toqueCedoDemais(5_000, 5_042)).toBe(true);
    expect(toqueCedoDemais(5_000, 5_000 + JANELA_TOQUE_DUPLO_MS)).toBe(false);
  });
});
