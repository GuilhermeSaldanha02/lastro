import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "./db";
import { marcarComoPermanente } from "./erro-permanente";
import { contarFalhas, contarPendentes, enfileirar, sincronizar } from "./outbox";

beforeEach(async () => {
  await db.outbox.clear();
  await db.falhas.clear();
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
    expect(resultado).toEqual({ sincronizados: 2, falhou: false, descartados: 0 });
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
    expect(resultado).toEqual({ sincronizados: 0, falhou: true, descartados: 0 });
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
    expect(primeira).toEqual({ sincronizados: 0, falhou: true, descartados: 0 });

    const segunda = await sincronizar(executores);
    expect(segunda).toEqual({ sincronizados: 2, falhou: false, descartados: 0 });
    expect(await contarPendentes()).toBe(0);
  });

  describe("item permanentemente inválido (OF-02)", () => {
    it("sai da fila em vez de travar tudo que vem depois pra sempre", async () => {
      await enfileirar("criar_serie", { treinoId: "t1", rir: 99 });
      await enfileirar("criar_serie", { treinoId: "t1", rir: 2 });

      const executado: unknown[] = [];
      const resultado = await sincronizar({
        criar_treino: async () => {},
        criar_serie: async (payload) => {
          if (payload.rir === 99) {
            throw new Error(marcarComoPermanente("violates check constraint \"serie_rir_valido\""));
          }
          executado.push(payload);
        },
        atualizar_serie: async () => {},
        excluir_serie: async () => {},
        excluir_treino: async () => {},
      });

      expect(executado).toEqual([{ treinoId: "t1", rir: 2 }]);
      expect(resultado).toEqual({ sincronizados: 1, falhou: false, descartados: 1 });
      expect(await contarPendentes()).toBe(0);
      expect(await contarFalhas()).toBe(1);
    });

    it("guarda o item descartado em `falhas`, com o erro, em vez de simplesmente apagar", async () => {
      await enfileirar("criar_serie", { treinoId: "t1", rir: 99 });

      await sincronizar({
        criar_treino: async () => {},
        criar_serie: async () => {
          throw new Error(marcarComoPermanente("violates check constraint \"serie_rir_valido\""));
        },
        atualizar_serie: async () => {},
        excluir_serie: async () => {},
        excluir_treino: async () => {},
      });

      const [falha] = await db.falhas.toArray();
      expect(falha.payload).toEqual({ treinoId: "t1", rir: 99 });
      expect(falha.tentativas).toBe(1);
      expect(falha.erro).toContain("serie_rir_valido");
    });

    it("continua parando (não descarta) num erro transitório comum, mesmo depois de várias tentativas", async () => {
      await enfileirar("criar_serie", { treinoId: "t1" });

      const executores = {
        criar_treino: async () => {},
        criar_serie: async () => {
          throw new Error("sem rede");
        },
        atualizar_serie: async () => {},
        excluir_serie: async () => {},
        excluir_treino: async () => {},
      };

      for (let vez = 0; vez < 5; vez++) {
        const resultado = await sincronizar(executores);
        expect(resultado).toEqual({ sincronizados: 0, falhou: true, descartados: 0 });
      }

      expect(await contarPendentes()).toBe(1);
      expect(await contarFalhas()).toBe(0);
      const [item] = await db.outbox.toArray();
      expect(item.tentativas).toBe(5);
    });
  });
});
