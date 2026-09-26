import { beforeEach, describe, expect, it, vi } from "vitest";

const signUp = vi.fn();

vi.mock("@/lib/supabase/cliente-servidor", () => ({
  criarClienteServidor: async () => ({ auth: { signUp } }),
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { criarContaComEmail } from "./auth";

beforeEach(() => signUp.mockReset());

describe("criarContaComEmail", () => {
  it("cria a conta com nome, telefone e tipo no metadado (o aceite dos Termos é depois do login, em /aceite)", async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: null });
    const r = await criarContaComEmail(
      "ana@exemplo.com", "SenhaForte123", "Ana", "83 99999-8888", "aluno", "",
    );
    expect(r).toEqual({ ok: true, confirmacaoPendente: true });
    const dados = signUp.mock.calls[0][0].options.data;
    expect(dados).toMatchObject({ nome: "Ana", tipo_conta: "aluno" });
  });

  it("telefone inválido é recusado antes de chamar o Supabase", async () => {
    const r = await criarContaComEmail(
      "ana@exemplo.com", "SenhaForte123", "Ana", "abc", "aluno", "",
    );
    expect(r).toMatchObject({ ok: false });
    expect((r as { erro: string }).erro).toMatch(/Telefone inválido/);
    expect(signUp).not.toHaveBeenCalled();
  });
});
