import { beforeEach, describe, expect, it, vi } from "vitest";

const signInWithPassword = vi.fn();

vi.mock("@/lib/supabase/cliente-servidor", () => ({
  criarClienteServidor: async () => ({ auth: { signInWithPassword } }),
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { entrarComEmail } from "./auth";

beforeEach(() => signInWithPassword.mockReset());

describe("entrarComEmail (PU-10)", () => {
  it("e-mail ainda não confirmado: diz para confirmar, não que a senha está errada", async () => {
    signInWithPassword.mockResolvedValue({ error: { code: "email_not_confirmed", message: "Email not confirmed" } });
    const r = await entrarComEmail("ana@exemplo.com", "SenhaForte123");
    expect(r).toMatchObject({ ok: false });
    expect((r as { erro: string }).erro).toMatch(/Confirme seu e-mail/);
  });

  it("credencial errada continua genérica (não revela se a conta existe)", async () => {
    signInWithPassword.mockResolvedValue({ error: { code: "invalid_credentials", message: "x" } });
    expect(await entrarComEmail("ana@exemplo.com", "errada")).toEqual({
      ok: false,
      erro: "E-mail ou senha inválidos.",
    });
  });

  it("entra quando as credenciais valem", async () => {
    signInWithPassword.mockResolvedValue({ error: null });
    expect(await entrarComEmail("ana@exemplo.com", "SenhaForte123")).toEqual({
      ok: true,
      confirmacaoPendente: false,
    });
  });
});
