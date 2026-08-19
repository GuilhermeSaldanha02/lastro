import { describe, expect, it } from "vitest";
import { detalheParaLog, respostaDeFalha } from "./falha";

// Regressão do achado do teste de aparelho (2026-08-17): a Gemini devolveu
// 503 "This model is currently experiencing high demand" e a tela do coach
// mostrou só "Falha ao consultar o coach", indistinguível de app quebrado.

describe("respostaDeFalha", () => {
  it("trata 503 do provedor como transitório e manda tentar de novo", () => {
    expect(respostaDeFalha({ status: 503 })).toEqual({
      erro: "O coach está sobrecarregado agora. Tente de novo em instantes.",
      status: 503,
    });
  });

  it("trata 429 (limite de requisição) igual a 503 — também passa sozinho", () => {
    expect(respostaDeFalha({ status: 429 }).status).toBe(503);
  });

  it("mantém a mensagem genérica para erro permanente", () => {
    expect(respostaDeFalha({ status: 400 })).toEqual({
      erro: "Falha ao consultar o coach.",
      status: 502,
    });
  });

  it("mantém a mensagem genérica quando o erro não tem status", () => {
    expect(respostaDeFalha(new Error("socket hang up"))).toEqual({
      erro: "Falha ao consultar o coach.",
      status: 502,
    });
  });

  it("nunca devolve a mensagem do provedor ao cliente", () => {
    const erroComDetalhe = Object.assign(
      new Error('{"error":{"message":"projeto xyz sem cota, chave ...abc"}}'),
      { status: 403 },
    );
    const resposta = respostaDeFalha(erroComDetalhe);
    expect(resposta.erro).toBe("Falha ao consultar o coach.");
    expect(resposta.erro).not.toContain("chave");
    expect(resposta.erro).not.toContain("xyz");
  });
});

describe("detalheParaLog", () => {
  it("preserva status e mensagem, que é o que permite diagnosticar", () => {
    const erro = Object.assign(new Error("high demand"), { status: 503 });
    expect(detalheParaLog(erro)).toEqual({ status: 503, mensagem: "high demand" });
  });

  it("trunca mensagem longa para não inundar o log", () => {
    const erro = new Error("x".repeat(1000));
    expect(detalheParaLog(erro).mensagem).toHaveLength(300);
  });

  it("aguenta erro que não é Error (provedor pode rejeitar com string)", () => {
    expect(detalheParaLog("caiu")).toEqual({ status: undefined, mensagem: "caiu" });
  });
});
