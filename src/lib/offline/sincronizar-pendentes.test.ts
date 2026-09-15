import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// As Server Functions reais falam com o Supabase; aqui só importa o CONTRATO
// delas: recusa do banco volta como valor, falha transitória lança.
vi.mock("@/lib/dados/treino", () => ({
  criarSerieRemoto: vi.fn(),
  atualizarDescansoSerieRemoto: vi.fn(),
  atualizarSerieRemoto: vi.fn(),
  excluirSerieRemoto: vi.fn(),
  excluirTreinoRemoto: vi.fn(),
}));

// A sessão real vem do cliente Supabase de navegador; aqui a conta logada é "b".
vi.mock("./conta-da-sessao", () => ({ contaDaSessao: vi.fn(async () => "b") }));

import {
  atualizarDescansoSerieRemoto,
  atualizarSerieRemoto,
  criarSerieRemoto,
} from "@/lib/dados/treino";
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
  vi.mocked(atualizarDescansoSerieRemoto).mockReset();
  vi.mocked(atualizarSerieRemoto).mockReset();
  await db.outbox.clear();
  await db.falhas.clear();
});

describe("sincronizarPendentes (achado A1)", () => {
  it("sincroniza somente o descanso da série e preserva a ordem FIFO", async () => {
    vi.mocked(criarSerieRemoto).mockResolvedValue({ ok: true });
    vi.mocked(atualizarDescansoSerieRemoto).mockResolvedValue({ ok: true });
    await enfileirar("criar_serie", { id: "s1", reps: 10 }, "b");
    await enfileirar("atualizar_descanso_serie", { id: "s1", descansoRealSegundos: 94 }, "b");
    await enfileirar("criar_serie", { id: "s2", reps: 8 }, "b");

    expect(await sincronizarPendentes()).toEqual({
      sincronizados: 3,
      falhou: false,
      descartados: 0,
    });
    expect(vi.mocked(atualizarDescansoSerieRemoto)).toHaveBeenCalledWith({
      id: "s1",
      descansoRealSegundos: 94,
    });
  });

  it("não envia descanso de outra conta e não bloqueia a conta atual", async () => {
    vi.mocked(criarSerieRemoto).mockResolvedValue({ ok: true });
    vi.mocked(atualizarDescansoSerieRemoto).mockResolvedValue({ ok: true });
    await enfileirar("atualizar_descanso_serie", { id: "de-a", descansoRealSegundos: 80 }, "a");
    await enfileirar("criar_serie", { id: "de-b", reps: 8 }, "b");

    expect(await sincronizarPendentes()).toEqual({ sincronizados: 1, falhou: false, descartados: 0 });
    expect(atualizarDescansoSerieRemoto).not.toHaveBeenCalled();
    expect((await db.outbox.toArray())[0].payload).toEqual({ id: "de-a", descansoRealSegundos: 80 });
  });

  it("retira descanso inválido e continua a fila", async () => {
    vi.mocked(atualizarDescansoSerieRemoto).mockResolvedValue(
      recusa("serie_descanso_real_nao_negativo"),
    );
    vi.mocked(criarSerieRemoto).mockResolvedValue({ ok: true });
    await enfileirar("atualizar_descanso_serie", { id: "s1", descansoRealSegundos: -1 }, "b");
    await enfileirar("criar_serie", { id: "s2", reps: 8 }, "b");

    expect(await sincronizarPendentes()).toEqual({ sincronizados: 1, falhou: false, descartados: 1 });
  });

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

  it("aparelho compartilhado (M1): a série pendente da conta A não é enviada com a sessão de B nem trava a de B", async () => {
    vi.mocked(criarSerieRemoto).mockImplementation(async (serie) => {
      if (serie.id === "de-a") throw new Error("treino_id inexistente");
      return { ok: true };
    });
    await enfileirar("criar_serie", { id: "de-a", reps: 14 }, "a");
    await enfileirar("criar_serie", { id: "de-b", reps: 15 }, "b");

    const resultado = await sincronizarPendentes();

    expect(resultado).toEqual({ sincronizados: 1, falhou: false, descartados: 0 });
    expect(vi.mocked(criarSerieRemoto).mock.calls.map(([serie]) => serie.id)).toEqual(["de-b"]);
    const [restante] = await db.outbox.toArray();
    expect(restante.payload).toEqual({ id: "de-a", reps: 14 });
    expect(await contarFalhas()).toBe(0);
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
