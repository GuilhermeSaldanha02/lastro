import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn();
const eq2 = vi.fn(() => ({ maybeSingle }));
const eq1 = vi.fn(() => ({ eq: eq2 }));
const select = vi.fn(() => ({ eq: eq1 }));
const from = vi.fn(() => ({ select }));

vi.mock("@/lib/supabase/cliente-servidor", () => ({
  criarClienteServidor: async () => ({ from }),
}));

import { dicaTraduzidaDoExercicio } from "./traducao";

beforeEach(() => {
  maybeSingle.mockReset();
  from.mockClear();
});

describe("dicaTraduzidaDoExercicio (A1)", () => {
  it("pt-BR não consulta nada: a dica em português já é a do exercício", async () => {
    expect(await dicaTraduzidaDoExercicio("e1", "pt-BR")).toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it("devolve a dica do idioma pedido", async () => {
    maybeSingle.mockResolvedValue({ data: { dica_execucao: "Keep your back straight." }, error: null });
    expect(await dicaTraduzidaDoExercicio("e1", "en")).toBe("Keep your back straight.");
    expect(eq1).toHaveBeenCalledWith("exercicio_id", "e1");
    expect(eq2).toHaveBeenCalledWith("idioma", "en");
  });

  it("sem tradução (null) devolve null para a tela cair no português", async () => {
    maybeSingle.mockResolvedValue({ data: { dica_execucao: null }, error: null });
    expect(await dicaTraduzidaDoExercicio("e1", "es")).toBeNull();
    maybeSingle.mockResolvedValue({ data: null, error: null });
    expect(await dicaTraduzidaDoExercicio("e2", "es")).toBeNull();
  });

  it("erro de leitura não derruba a tela: cai no português", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    maybeSingle.mockResolvedValue({ data: null, error: { message: "x" } });
    expect(await dicaTraduzidaDoExercicio("e1", "en")).toBeNull();
  });
});
