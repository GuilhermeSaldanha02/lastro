import { beforeEach, describe, expect, it, vi } from "vitest";
import { VERSAO_DOCUMENTOS } from "@/lib/legal/documentos";

const signUp = vi.fn();

vi.mock("@/lib/supabase/cliente-servidor", () => ({
  criarClienteServidor: async () => ({ auth: { signUp } }),
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { criarContaComEmail } from "./auth";

beforeEach(() => signUp.mockReset());

describe("criarContaComEmail — aceite dos Termos (PU-06)", () => {
  it("recusa sem o aceite e não chama o Supabase", async () => {
    const r = await criarContaComEmail(
      "ana@exemplo.com", "SenhaForte123", "Ana", "83 99999-8888", "aluno", "", false,
    );
    expect(r.ok).toBe(false);
    expect(signUp).not.toHaveBeenCalled();
  });

  it("com o aceite, grava a versão e o instante no metadado da conta", async () => {
    signUp.mockResolvedValue({ data: { session: null }, error: null });
    const r = await criarContaComEmail(
      "ana@exemplo.com", "SenhaForte123", "Ana", "83 99999-8888", "aluno", "", true,
    );
    expect(r.ok).toBe(true);
    const dados = signUp.mock.calls[0][0].options.data;
    expect(dados.termos_versao).toBe(VERSAO_DOCUMENTOS);
    expect(Number.isNaN(Date.parse(dados.termos_aceitos_em))).toBe(false);
  });

  it("telefone inválido continua sendo o erro mostrado, antes do aceite", async () => {
    const r = await criarContaComEmail(
      "ana@exemplo.com", "SenhaForte123", "Ana", "abc", "aluno", "", false,
    );
    expect(r).toMatchObject({ ok: false });
    expect((r as { erro: string }).erro).toMatch(/Telefone inválido/);
  });
});
