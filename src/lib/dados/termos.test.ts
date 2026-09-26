import { beforeEach, describe, expect, it, vi } from "vitest";
import { VERSAO_DOCUMENTOS } from "@/lib/legal/documentos";

const getUser = vi.fn();
const eq = vi.fn();
const update = vi.fn(() => ({ eq }));

vi.mock("@/lib/supabase/cliente-servidor", () => ({
  criarClienteServidor: async () => ({ auth: { getUser }, from: () => ({ update }) }),
}));

import { aceitarTermos } from "./termos";

beforeEach(() => {
  getUser.mockReset();
  eq.mockReset();
  update.mockClear();
});

describe("aceitarTermos (PU-06)", () => {
  it("grava a versão VIGENTE (do servidor) e o instante", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    eq.mockResolvedValue({ error: null });
    expect(await aceitarTermos()).toEqual({ ok: true });
    const gravado = (update.mock.calls[0] as unknown as [Record<string, string>])[0];
    expect(gravado.termos_versao_aceita).toBe(VERSAO_DOCUMENTOS);
    expect(Number.isNaN(Date.parse(gravado.termos_aceitos_em))).toBe(false);
    expect(eq).toHaveBeenCalledWith("id", "u1");
  });

  it("sem sessão não grava nada", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect((await aceitarTermos()).ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("falha do banco NÃO deixa seguir sem registro", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    eq.mockResolvedValue({ error: { message: "x" } });
    expect((await aceitarTermos()).ok).toBe(false);
  });
});
