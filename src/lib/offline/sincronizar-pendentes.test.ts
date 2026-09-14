import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// As Server Functions reais falam com o Supabase; aqui só importa o CONTRATO
// delas: recusa do banco volta como valor, falha transitória lança.
vi.mock("@/lib/dados/treino", () => ({
  criarSerieRemoto: vi.fn(),
  atualizarSerieRemoto: vi.fn(),
  excluirSerieRemoto: vi.fn(),
  excluirTreinoRemoto: vi.fn(),
}));

import { atualizarSerieRemoto, criarSerieRemoto } from "@/lib/dados/treino";
import { db } from "./db";
import { contarFalhas, contarPendentes, enfileirar } from "./outbox";
import { sincronizarPendentes } from "./sincronizar-pendentes";

const recusa = (restricao: string) => ({
  ok: false as const,
  permanente: true as const,
  mensagem: `Falha ao registrar série: violates check constraint "${restricao}"`,
});

beforeEach(async () => {
  vi.mocked(criarSerieRemoto).mockReset();
  vi.mocked(atualizarSerieRemoto).mockReset();
  await db.outbox.clear();
  await db.falhas.clear();
});

describe("sincronizarPendentes (achado A1)", () => {
  it("série recusada pelo banco sai para `falhas` e a série válida seguinte sincroniza", async () => {
    vi.mocked(criarSerieRemoto).mockImplementation(async (serie) =>
      serie.reps === 201 ? recusa("serie_reps_positiva") : { ok: true },
    );
    await enfileirar("criar_serie", { id: "s1", reps: 201 });
    await enfileirar("criar_serie", { id: "s2", reps: 10 });

    const resultado = await sincronizarPendentes();

    expect(resultado).toEqual({ sincronizados: 1, falhou: false, descartados: 1 });
    expect(criarSerieRemoto).toHaveBeenCalledTimes(2);
    expect(await contarPendentes()).toBe(0);
    const [falha] = await db.falhas.toArray();
    expect(falha.payload).toEqual({ id: "s1", reps: 201 });
    expect(falha.erro).toContain("serie_reps_positiva");
  });

  it("edição recusada pelo banco sai para `falhas` em vez de travar a fila (A2)", async () => {
    vi.mocked(atualizarSerieRemoto).mockResolvedValue(recusa("serie_reps_positiva"));
    vi.mocked(criarSerieRemoto).mockResolvedValue({ ok: true });
    await enfileirar("atualizar_serie", { id: "s1", reps: 999 });
    await enfileirar("criar_serie", { id: "s2", reps: 10 });

    const resultado = await sincronizarPendentes();

    expect(resultado).toEqual({ sincronizados: 1, falhou: false, descartados: 1 });
    expect(await contarFalhas()).toBe(1);
  });

  it("erro lançado sem o prefixo (como o `digest` do build de produção) continua sendo transitório", async () => {
    vi.mocked(criarSerieRemoto).mockRejectedValue(
      new Error("An error occurred in the Server Components render. digest: 2357073175"),
    );
    await enfileirar("criar_serie", { id: "s1", reps: 8 });

    const resultado = await sincronizarPendentes();

    expect(resultado).toEqual({ sincronizados: 0, falhou: true, descartados: 0 });
    expect(await contarPendentes()).toBe(1);
    expect(await contarFalhas()).toBe(0);
  });
});
