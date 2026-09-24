// lastro · ciclo de vida da marca de confirmação do servidor
// (`lastro_fim_servidor_<id>`). Os testes puros de `decidirReconciliacao`
// não pegam erro aqui: o defeito mora em QUEM grava e apaga a marca.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { decidirReconciliacao } from "./fim-treino";
import {
  chaveFimConfirmado,
  chaveFimTreino,
  chaveInicioTreino,
  espelharServidor,
  estaFinalizadoComServidor,
  fimConfirmadoPeloServidor,
  lerMarcos,
  marcarFim,
  reabrir,
  restaurarMarcos,
} from "./marcos-treino";

function armazenamentoFalso(): Storage {
  const mapa = new Map<string, string>();
  return {
    get length() {
      return mapa.size;
    },
    clear: () => mapa.clear(),
    getItem: (k: string) => mapa.get(k) ?? null,
    key: (i: number) => [...mapa.keys()][i] ?? null,
    removeItem: (k: string) => void mapa.delete(k),
    setItem: (k: string, v: string) => void mapa.set(k, v),
  } as Storage;
}

const ID = "treino-1";

/** O mesmo que o layout effect de `treino-detalhe.tsx` decide ao abrir. */
function decidirAoAbrir(finalizadoEmServidor: string | null) {
  return decidirReconciliacao({
    fimLocalMs: lerMarcos(ID).fimMs,
    fimServidorMs: finalizadoEmServidor === null ? null : Date.parse(finalizadoEmServidor),
    confirmadoPeloServidor: fimConfirmadoPeloServidor(ID),
  });
}

describe("espelho do fim no servidor", () => {
  beforeEach(() => {
    // @ts-expect-error — o ambiente de teste é node; montamos o mínimo.
    globalThis.window = { localStorage: armazenamentoFalso() };
  });

  afterEach(() => {
    // @ts-expect-error — desmonta o que o beforeEach montou.
    delete globalThis.window;
  });

  it("Finalizar sem rede num treino já espelhado continua pendente e é reenviado", () => {
    // Abriu o treino (servidor aberto): espelho grava a confirmação.
    expect(decidirAoAbrir(null)).toBe("espelhar");
    espelharServidor(ID, null);
    expect(fimConfirmadoPeloServidor(ID)).toBe(true);

    // Finalizou; o envio falhou (nenhum espelharServidor depois).
    marcarFim(ID);
    expect(fimConfirmadoPeloServidor(ID)).toBe(false);

    // Próxima abertura: servidor ainda aberto → reenvia, não reabre.
    expect(decidirAoAbrir(null)).toBe("enviar");
    expect(estaFinalizadoComServidor(ID, false)).toBe(true);
  });

  it("reaberto em outro aparelho: marca confirmada é desfeita com o início deslocado", () => {
    window.localStorage.setItem(chaveInicioTreino(ID), "2026-09-24T10:00:00.000Z");
    marcarFim(ID);
    espelharServidor(ID, "2026-09-24T11:00:00.000Z"); // envio aceito
    const antes = lerMarcos(ID);

    expect(decidirAoAbrir(null)).toBe("espelhar");
    espelharServidor(ID, null);

    const depois = lerMarcos(ID);
    expect(depois.fimMs).toBeNull();
    // `reabrir` preserva o decorrido: o início andou para frente.
    expect(depois.inicioMs!).toBeGreaterThan(antes.inicioMs!);
    expect(estaFinalizadoComServidor(ID, false)).toBe(false);
  });

  it("servidor e aparelho finalizados: fica o fim LOCAL (cronômetro que o dono já viu)", () => {
    window.localStorage.setItem(chaveInicioTreino(ID), "2026-09-20T10:00:00.000Z");
    window.localStorage.setItem(chaveFimTreino(ID), "2026-09-20T11:10:00.000Z");
    // Preenchimento do banco: última série, mais cedo que o fim real.
    espelharServidor(ID, "2026-09-20T11:00:00.000Z");
    expect(window.localStorage.getItem(chaveFimTreino(ID))).toBe("2026-09-20T11:10:00.000Z");
    expect(window.localStorage.getItem(chaveFimConfirmado(ID))).toBe("1");
  });

  it("finalizado só no servidor (outro aparelho): o espelho grava o fim do servidor", () => {
    espelharServidor(ID, "2026-09-24T11:00:00.000Z");
    expect(window.localStorage.getItem(chaveFimTreino(ID))).toBe("2026-09-24T11:00:00.000Z");
    expect(estaFinalizadoComServidor(ID, true)).toBe(true);
  });

  it("sem confirmação local, a leitura segue o servidor (sem trocar estado na hidratação)", () => {
    expect(estaFinalizadoComServidor(ID, true)).toBe(true);
    expect(estaFinalizadoComServidor(ID, false)).toBe(false);
  });

  it("reabrir recusado pelo servidor: restaurarMarcos devolve início e fim exatos", () => {
    window.localStorage.setItem(chaveInicioTreino(ID), "2026-09-24T10:00:00.000Z");
    window.localStorage.setItem(chaveFimTreino(ID), "2026-09-24T11:00:00.000Z");
    const antes = lerMarcos(ID);
    reabrir(ID);
    expect(lerMarcos(ID).fimMs).toBeNull();
    restaurarMarcos(ID, antes);
    expect(lerMarcos(ID)).toEqual(antes);
  });
});
