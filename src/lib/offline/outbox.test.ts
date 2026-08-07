import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { contarPendentes, enfileirar, sincronizar } from "./outbox";

beforeEach(async () => {
  await db.outbox.clear();
});

describe("outbox", () => {
  it("enfileirar grava a mutação e conta como pendente sem tocar rede", async () => {
    await enfileirar("criar_treino", { data: "2026-08-05" });
    expect(await contarPendentes()).toBe(1);
  });

  it("sincronizar processa em ordem FIFO e esvazia a fila em sucesso total", async () => {
    await enfileirar("criar_treino", { id: "t1" });
    await enfileirar("criar_serie", { treinoId: "t1", reps: 8 });

    const ordem: string[] = [];
    const resultado = await sincronizar({
      criar_treino: async () => {
        ordem.push("treino");
      },
      criar_serie: async () => {
        ordem.push("serie");
      },
      atualizar_serie: async () => {},
      excluir_serie: async () => {},
      excluir_treino: async () => {},
    });

    expect(ordem).toEqual(["treino", "serie"]);
    expect(resultado).toEqual({ sincronizados: 2, falhou: false });
    expect(await contarPendentes()).toBe(0);
  });

  it("item que falha para o flush e preserva a ordem — não sincroniza o que vem depois", async () => {
    await enfileirar("criar_treino", { id: "t1" });
    await enfileirar("criar_serie", { treinoId: "t1", reps: 8 });

    const executado: string[] = [];
    const resultado = await sincronizar({
      criar_treino: async () => {
        throw new Error("sem rede");
      },
      criar_serie: async () => {
        executado.push("serie");
      },
      atualizar_serie: async () => {},
      excluir_serie: async () => {},
      excluir_treino: async () => {},
    });

    expect(executado).toEqual([]);
    expect(resultado).toEqual({ sincronizados: 0, falhou: true });
    expect(await contarPendentes()).toBe(2);
  });

  it("item que falhou tem `tentativas` incrementado, pra próxima chamada saber que já tentou antes", async () => {
    await enfileirar("criar_treino", { id: "t1" });

    await sincronizar({
      criar_treino: async () => {
        throw new Error("sem rede");
      },
      criar_serie: async () => {},
      atualizar_serie: async () => {},
      excluir_serie: async () => {},
      excluir_treino: async () => {},
    });

    const [item] = await db.outbox.toArray();
    expect(item.tentativas).toBe(1);
  });

  it("chamada seguinte de sincronizar retoma do que ficou pendente, sem duplicar o que já saiu", async () => {
    await enfileirar("criar_treino", { id: "t1" });
    await enfileirar("criar_serie", { treinoId: "t1", reps: 8 });

    let falharPrimeiraVez = true;
    const executores = {
      criar_treino: async () => {
        if (falharPrimeiraVez) {
          falharPrimeiraVez = false;
          throw new Error("sem rede");
        }
      },
      criar_serie: async () => {},
      atualizar_serie: async () => {},
      excluir_serie: async () => {},
      excluir_treino: async () => {},
    };

    const primeira = await sincronizar(executores);
    expect(primeira).toEqual({ sincronizados: 0, falhou: true });

    const segunda = await sincronizar(executores);
    expect(segunda).toEqual({ sincronizados: 2, falhou: false });
    expect(await contarPendentes()).toBe(0);
  });
});
