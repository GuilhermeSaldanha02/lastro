import { describe, expect, it } from "vitest";

import { quadroDoTimerFlutuante } from "./timer-flutuante";

// Pedido do dono (2026-09-24): o descanso acompanhar a tela fora do app.
describe("o que a janela flutuante mostra", () => {
  it("contagem regressiva enquanto corre", () => {
    expect(quadroDoTimerFlutuante({ segundosRestantes: 75, pausado: false, metaAtingida: false })).toEqual({
      tempo: "01:15",
      rotulo: "Descanso",
      destaque: false,
    });
  });

  it("pausado diz que está pausado", () => {
    expect(quadroDoTimerFlutuante({ segundosRestantes: 40, pausado: true, metaAtingida: false }).rotulo).toBe("Pausado");
  });

  it("no fim, chama para a próxima série em destaque", () => {
    expect(quadroDoTimerFlutuante({ segundosRestantes: 0, pausado: false, metaAtingida: true })).toEqual({
      tempo: "00:00",
      rotulo: "Hora da próxima série",
      destaque: true,
    });
  });
});
