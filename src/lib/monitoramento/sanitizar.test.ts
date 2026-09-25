import { describe, expect, it } from "vitest";
import { LIMITE_MENSAGEM, rotaSemQuery, sanitizarErro } from "./sanitizar";

describe("rotaSemQuery", () => {
  it("tira query e fragmento (o código de convite não vai para o log)", () => {
    expect(rotaSemQuery("/ajustes/personal?codigo=ABC123#x")).toBe("/ajustes/personal");
  });
  it("tira o host", () => {
    expect(rotaSemQuery("https://lastro-pi.vercel.app/treino/abc?x=1")).toBe("/treino/abc");
  });
  it("vazio ou não texto vira null", () => {
    expect(rotaSemQuery("")).toBeNull();
    expect(rotaSemQuery(42)).toBeNull();
  });
});

describe("sanitizarErro", () => {
  it("troca e-mail e token por marcadores", () => {
    const r = sanitizarErro({
      mensagem: "falhou para ana@exemplo.com com eyJhbGciOiJIUzI1.eyJzdWIiOiIxMjM0NTY.abcdefghijklmnop",
    });
    expect(r.mensagem).not.toContain("ana@exemplo.com");
    expect(r.mensagem).not.toContain("eyJ");
    expect(r.mensagem).toContain("[e-mail]");
    expect(r.mensagem).toContain("[token]");
  });

  it("limita o tamanho da mensagem e da pilha", () => {
    const r = sanitizarErro({ mensagem: "x ".repeat(2000), pilha: "y ".repeat(5000) });
    expect(r.mensagem.length).toBeLessThanOrEqual(LIMITE_MENSAGEM);
    expect(r.pilha!.length).toBeLessThanOrEqual(4000);
  });

  it("aceita Error e entrada torta sem lançar", () => {
    expect(sanitizarErro({ mensagem: new Error("boom") }).mensagem).toBe("boom");
    const torto = sanitizarErro({ mensagem: { a: 1 }, digest: 5, tipoRota: null });
    expect(torto.mensagem).toBe("erro sem mensagem");
    expect(torto.digest).toBeNull();
  });
});
