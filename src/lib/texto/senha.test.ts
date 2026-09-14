import { describe, expect, it } from "vitest";
import { SENHA_MAXIMO, SENHA_MINIMO, validarSenhaNova } from "./senha";

describe("validarSenhaNova", () => {
  it("aceita senha com 10 caracteres, minúscula, maiúscula e número", () => {
    expect(validarSenhaNova("Treino2026")).toEqual({ ok: true });
  });

  it("aceita símbolo e acento, sem exigir nenhum dos dois", () => {
    expect(validarSenhaNova("Supino#Reto9")).toEqual({ ok: true });
    expect(validarSenhaNova("AgachamentoÉ1")).toEqual({ ok: true });
  });

  it("aceita os extremos de tamanho", () => {
    expect(validarSenhaNova("Aa1" + "x".repeat(SENHA_MINIMO - 3)).ok).toBe(true);
    expect(validarSenhaNova("Aa1" + "x".repeat(SENHA_MAXIMO - 3)).ok).toBe(true);
  });

  it("recusa senha curta, com a mensagem do tamanho", () => {
    expect(validarSenhaNova("Treino26")).toEqual({
      ok: false,
      erro: "A senha precisa ter pelo menos 10 caracteres.",
    });
  });

  it("recusa senha acima do limite do Supabase", () => {
    expect(validarSenhaNova("Aa1" + "x".repeat(SENHA_MAXIMO)).ok).toBe(false);
  });

  it.each([
    ["sem maiúscula", "treino2026x"],
    ["sem minúscula", "TREINO2026X"],
    ["sem número", "TreinoForte"],
    ["só números", "12345678901"],
  ])("recusa senha %s", (_nome, senha) => {
    expect(validarSenhaNova(senha)).toEqual({
      ok: false,
      erro: "A senha precisa ter letra minúscula, letra maiúscula e número.",
    });
  });
});
