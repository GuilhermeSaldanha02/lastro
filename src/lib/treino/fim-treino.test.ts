import { describe, expect, it } from "vitest";
import { decidirReconciliacao, limitarDuracao, limitarFimMs } from "./fim-treino";

const inicio = Date.parse("2026-09-24T10:00:00Z");
const agora = Date.parse("2026-09-24T11:00:00Z");

describe("limitarFimMs", () => {
  it("sem valor, o fim é agora", () => {
    expect(limitarFimMs(undefined, inicio, agora)).toBe(agora);
  });
  it("valor inválido vira agora", () => {
    expect(limitarFimMs("nao-e-data", inicio, agora)).toBe(agora);
  });
  it("fim no futuro (relógio adiantado) é preso em agora", () => {
    expect(limitarFimMs("2026-09-24T12:00:00Z", inicio, agora)).toBe(agora);
  });
  it("fim antes do início é preso no início", () => {
    expect(limitarFimMs("2026-09-24T09:00:00Z", inicio, agora)).toBe(inicio);
  });
  it("fim dentro da janela é mantido", () => {
    expect(limitarFimMs("2026-09-24T10:40:00Z", inicio, agora)).toBe(
      Date.parse("2026-09-24T10:40:00Z"),
    );
  });
});

describe("limitarDuracao", () => {
  const fim = Date.parse("2026-09-24T10:30:00Z");
  it("sem valor é null (não medido)", () => {
    expect(limitarDuracao(undefined, inicio, fim)).toBeNull();
    expect(limitarDuracao(Number.NaN, inicio, fim)).toBeNull();
  });
  it("negativo vira 0", () => {
    expect(limitarDuracao(-5, inicio, fim)).toBe(0);
  });
  it("nunca passa de fim − início", () => {
    expect(limitarDuracao(99999, inicio, fim)).toBe(1800);
  });
  it("fração é truncada", () => {
    expect(limitarDuracao(1200.9, inicio, fim)).toBe(1200);
  });
});

describe("decidirReconciliacao", () => {
  it("marca local sem confirmação e servidor aberto: envia (legado ou offline)", () => {
    expect(
      decidirReconciliacao({ fimLocalMs: agora, fimServidorMs: null, confirmadoPeloServidor: false }),
    ).toBe("enviar");
  });
  it("marca local CONFIRMADA e servidor aberto: reaberto em outro aparelho — espelha, não refinaliza", () => {
    expect(
      decidirReconciliacao({ fimLocalMs: agora, fimServidorMs: null, confirmadoPeloServidor: true }),
    ).toBe("espelhar");
  });
  it("servidor já finalizado: espelha", () => {
    expect(
      decidirReconciliacao({ fimLocalMs: null, fimServidorMs: agora, confirmadoPeloServidor: false }),
    ).toBe("espelhar");
    expect(
      decidirReconciliacao({ fimLocalMs: inicio, fimServidorMs: agora, confirmadoPeloServidor: false }),
    ).toBe("espelhar");
  });
  it("nada local e servidor aberto: espelha (nada a fazer)", () => {
    expect(
      decidirReconciliacao({ fimLocalMs: null, fimServidorMs: null, confirmadoPeloServidor: false }),
    ).toBe("espelhar");
  });
});
