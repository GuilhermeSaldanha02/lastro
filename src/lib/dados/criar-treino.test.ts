// lastro · `criarTreino` depois de 2026-09-24: só reaproveita o treino de
// hoje EM ABERTO. Com o de hoje finalizado, cria outro (decisão do dono).
// A cadeia do Supabase é falsa: o que se confere é a CONSULTA pedida e o
// destino do redirect.
import { beforeEach, describe, expect, it, vi } from "vitest";

type Chamada = { metodo: string; args: unknown[] };

const estado = vi.hoisted(() => ({
  chamadas: [] as { metodo: string; args: unknown[] }[],
  emAberto: null as { id: string } | null,
}));

function cadeia(): Record<string, unknown> {
  const alvo: Record<string, unknown> = {};
  for (const metodo of ["from", "select", "eq", "is", "order", "limit", "insert"]) {
    alvo[metodo] = (...args: unknown[]) => {
      estado.chamadas.push({ metodo, args });
      return alvo;
    };
  }
  alvo.maybeSingle = async () => ({ data: estado.emAberto, error: null });
  alvo.single = async () => ({ data: { id: "novo" }, error: null });
  return alvo;
}

vi.mock("@/lib/supabase/cliente-servidor", () => ({
  criarClienteServidor: async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "dono" } }, error: null }) },
    from: (...args: unknown[]) => (cadeia().from as (...a: unknown[]) => unknown)(...args),
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (destino: string) => {
    throw new Error(`REDIRECT:${destino}`);
  },
}));
vi.mock("@/lib/tempo", () => ({ dataLocalBrasil: () => "2026-09-24" }));
vi.mock("@/lib/dados/idioma", () => ({ obterIdioma: async () => "pt-BR" }));
vi.mock("@/lib/dados/traducao", () => ({
  mapaTraducaoExercicios: async () => new Map(),
  mapaTraducaoGrupos: async () => new Map(),
}));

import { criarTreino } from "./treino";

const chamadas = (): Chamada[] => estado.chamadas;

describe("criarTreino", () => {
  beforeEach(() => {
    estado.chamadas = [];
    estado.emAberto = null;
  });

  it("procura só o treino de hoje EM ABERTO, o mais recente, uma linha", async () => {
    estado.emAberto = { id: "aberto" };
    await expect(criarTreino()).rejects.toThrow("REDIRECT:/treino/aberto");
    expect(chamadas()).toContainEqual({ metodo: "eq", args: ["data", "2026-09-24"] });
    expect(chamadas()).toContainEqual({ metodo: "eq", args: ["usuario_id", "dono"] });
    expect(chamadas()).toContainEqual({ metodo: "is", args: ["finalizado_em", null] });
    expect(chamadas()).toContainEqual({
      metodo: "order",
      args: ["iniciado_em", { ascending: false }],
    });
    expect(chamadas()).toContainEqual({ metodo: "limit", args: [1] });
    expect(chamadas().some((c) => c.metodo === "insert")).toBe(false);
  });

  it("com o treino de hoje finalizado (nenhum em aberto), cria outro", async () => {
    await expect(criarTreino()).rejects.toThrow("REDIRECT:/treino/novo");
    expect(chamadas()).toContainEqual({
      metodo: "insert",
      args: [{ usuario_id: "dono", data: "2026-09-24" }],
    });
  });
});
