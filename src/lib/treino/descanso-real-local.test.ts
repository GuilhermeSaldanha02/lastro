import { describe, expect, it, vi } from "vitest";
import { iniciarDescanso } from "./descanso-real";
import {
  apagarDescansoLocal,
  assinarDescansoLocal,
  chaveDescansoReal,
  lerDescansoLocal,
  salvarDescansoLocal,
} from "./descanso-real-local";

function armazenamentoFalso(): Storage {
  const mapa = new Map<string, string>();
  return {
    get length() {
      return mapa.size;
    },
    clear: () => mapa.clear(),
    getItem: (chave) => mapa.get(chave) ?? null,
    key: (indice) => [...mapa.keys()][indice] ?? null,
    removeItem: (chave) => void mapa.delete(chave),
    setItem: (chave, valor) => void mapa.set(chave, valor),
  } as Storage;
}

describe("descanso real local", () => {
  it("salva e recupera um descanso por treino", () => {
    const storage = armazenamentoFalso();
    const estado = iniciarDescanso("t1", "s1", 90, 1_000);

    salvarDescansoLocal(storage, estado);

    expect(lerDescansoLocal(storage, "t1")).toEqual(estado);
  });

  it("ignora JSON corrompido", () => {
    const storage = armazenamentoFalso();
    storage.setItem(chaveDescansoReal("t1"), "{");

    expect(lerDescansoLocal(storage, "t1")).toBeNull();
  });

  it("ignora registro cujo treino não corresponde à chave", () => {
    const storage = armazenamentoFalso();
    storage.setItem(
      chaveDescansoReal("t1"),
      JSON.stringify(iniciarDescanso("t2", "s2", 90, 0)),
    );

    expect(lerDescansoLocal(storage, "t1")).toBeNull();
  });

  it("remove somente o descanso do treino informado", () => {
    const storage = armazenamentoFalso();
    salvarDescansoLocal(storage, iniciarDescanso("t1", "s1", 90, 0));
    salvarDescansoLocal(storage, iniciarDescanso("t2", "s2", 90, 0));

    apagarDescansoLocal(storage, "t1");

    expect(lerDescansoLocal(storage, "t1")).toBeNull();
    expect(lerDescansoLocal(storage, "t2")?.serieId).toBe("s2");
  });

  it("notifica escritas locais e deixa de notificar após cancelar a assinatura", () => {
    const storage = armazenamentoFalso();
    const alvo = new EventTarget();
    const aoMudar = vi.fn();
    Object.defineProperty(globalThis, "window", {
      value: alvo,
      configurable: true,
    });

    try {
      const cancelar = assinarDescansoLocal(aoMudar);
      salvarDescansoLocal(storage, iniciarDescanso("t1", "s1", 90, 0));
      expect(aoMudar).toHaveBeenCalledTimes(1);

      cancelar();
      apagarDescansoLocal(storage, "t1");
      expect(aoMudar).toHaveBeenCalledTimes(1);
    } finally {
      Reflect.deleteProperty(globalThis, "window");
    }
  });
});
