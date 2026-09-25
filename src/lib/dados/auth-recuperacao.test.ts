import { beforeEach, describe, expect, it, vi } from "vitest";

const resetPasswordForEmail = vi.fn();
const getUser = vi.fn();
const updateUser = vi.fn();

vi.mock("@/lib/supabase/cliente-servidor", () => ({
  criarClienteServidor: async () => ({
    auth: { resetPasswordForEmail, getUser, updateUser },
  }),
}));
vi.mock("next/headers", () => ({
  headers: async () =>
    new Headers({ "x-forwarded-host": "lastro-pi.vercel.app" }),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { pedirRecuperacaoSenha, redefinirSenha } from "./auth";

beforeEach(() => {
  resetPasswordForEmail.mockReset();
  getUser.mockReset();
  updateUser.mockReset();
});

describe("pedirRecuperacaoSenha", () => {
  it("manda o link para o callback com retorno em /redefinir-senha", async () => {
    resetPasswordForEmail.mockResolvedValue({ error: null });
    const r = await pedirRecuperacaoSenha(" ana@exemplo.com ");
    expect(r).toEqual({ ok: true });
    const [email, opcoes] = resetPasswordForEmail.mock.calls[0];
    expect(email).toBe("ana@exemplo.com");
    const destino = new URL(opcoes.redirectTo);
    expect(destino.origin).toBe("https://lastro-pi.vercel.app");
    expect(destino.pathname).toBe("/auth/callback");
    expect(destino.searchParams.get("proximo")).toBe("/redefinir-senha");
  });

  it("responde igual quando o Supabase falha (não revela se a conta existe)", async () => {
    resetPasswordForEmail.mockResolvedValue({
      error: { status: 400, message: "User not found" },
    });
    expect(await pedirRecuperacaoSenha("ninguem@exemplo.com")).toEqual({ ok: true });
  });

  it("avisa do limite de envio, que não revela nada sobre o e-mail", async () => {
    resetPasswordForEmail.mockResolvedValue({ error: { status: 429, message: "rate" } });
    const r = await pedirRecuperacaoSenha("ana@exemplo.com");
    expect(r.ok).toBe(false);
  });

  it("recusa texto que não é e-mail sem chamar o Supabase", async () => {
    const r = await pedirRecuperacaoSenha("abc");
    expect(r.ok).toBe(false);
    expect(resetPasswordForEmail).not.toHaveBeenCalled();
  });
});

describe("redefinirSenha", () => {
  it("recusa senha fraca antes de qualquer chamada", async () => {
    const r = await redefinirSenha("curta");
    expect(r.ok).toBe(false);
    expect(getUser).not.toHaveBeenCalled();
  });

  it("sem sessão (link vencido) não troca nada", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const r = await redefinirSenha("SenhaForte123");
    expect(r.ok).toBe(false);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it("com sessão, grava a senha nova", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    updateUser.mockResolvedValue({ error: null });
    expect(await redefinirSenha("SenhaForte123")).toEqual({ ok: true });
    expect(updateUser).toHaveBeenCalledWith({ password: "SenhaForte123" });
  });

  it("explica quando a senha é igual à atual", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    updateUser.mockResolvedValue({ error: { code: "same_password", message: "x" } });
    const r = await redefinirSenha("SenhaForte123");
    expect(r).toEqual({ ok: false, erro: "Escolha uma senha diferente da atual." });
  });
});
