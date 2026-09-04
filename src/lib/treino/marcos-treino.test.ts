// lastro · o defeito que originou este módulo veio de RELATO DE USO REAL
// (2026-09-03): o dono apertou "Finalizar Treino" sem querer, o cronômetro
// congelou e não havia como voltar — a marca de fim era escrita por dois
// componentes diferentes e apagada por nenhum. Estes testes fecham a porta
// nos dois lados: a marca sai, e o tempo decorrido sobrevive à volta.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  assinarMarcos,
  chaveFimTreino,
  chaveInicioTreino,
  estaFinalizado,
  garantirInicio,
  inicioAoReabrir,
  lerMarcos,
  marcarFim,
  reabrir,
  segundosDecorridos,
  segundosEntre,
} from "./marcos-treino";

const H = 60 * 60 * 1000;

describe("aritmética dos marcos (pura)", () => {
  it("conta do início até agora enquanto o treino roda", () => {
    expect(segundosEntre({ inicioMs: 0, fimMs: null }, 90_000)).toBe(90);
  });

  it("congela em fim - início quando o treino terminou", () => {
    // Uma hora depois do fim, o valor não pode ter andado.
    const marcos = { inicioMs: 0, fimMs: 90_000 };
    expect(segundosEntre(marcos, 90_000)).toBe(90);
    expect(segundosEntre(marcos, 90_000 + H)).toBe(90);
  });

  it("devolve 0 quando não há início", () => {
    expect(segundosEntre({ inicioMs: null, fimMs: null }, 12_345)).toBe(0);
  });

  it("nunca devolve negativo com marcos invertidos", () => {
    expect(segundosEntre({ inicioMs: 5_000, fimMs: 1_000 }, 9_999)).toBe(0);
  });

  // ESTE é o teste que justifica a função existir. Apagar a marca de fim
  // sem deslocar o início faria um treino de 1h finalizado às 10h e
  // reaberto às 14h mostrar 5 HORAS — o "desfazer" mentiria pior que o bug.
  it("ao reabrir, desloca o início para preservar o decorrido", () => {
    const inicioMs = 0;
    const fimMs = 1 * H; // treino de 1 hora
    const agoraMs = 5 * H; // reaberto 4 horas depois

    const novoInicio = inicioAoReabrir({ inicioMs, fimMs }, agoraMs);

    // O cronômetro volta de onde parou, não pula para 5h.
    expect(segundosEntre({ inicioMs: novoInicio, fimMs: null }, agoraMs)).toBe(3600);
  });

  it("sem marcos completos, reabrir começa do zero em vez de inventar", () => {
    expect(inicioAoReabrir({ inicioMs: null, fimMs: null }, 7_000)).toBe(7_000);
    expect(inicioAoReabrir({ inicioMs: 1_000, fimMs: null }, 7_000)).toBe(7_000);
  });
});

/** localStorage de mentira: o ambiente de teste é `node`, não tem um. */
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

describe("marcos no armazenamento", () => {
  const ID = "treino-1";

  beforeEach(() => {
    // @ts-expect-error — o ambiente de teste é node; montamos o mínimo.
    globalThis.window = { localStorage: armazenamentoFalso() };
  });

  afterEach(() => {
    // @ts-expect-error — desmonta o que o beforeEach montou.
    delete globalThis.window;
  });

  it("grava o início uma vez só e não o reescreve", () => {
    garantirInicio(ID);
    const primeiro = lerMarcos(ID).inicioMs;
    garantirInicio(ID);
    expect(lerMarcos(ID).inicioMs).toBe(primeiro);
  });

  it("marcar fim é idempotente — reapertar Finalizar não move o fim", () => {
    garantirInicio(ID);
    marcarFim(ID);
    const primeiro = lerMarcos(ID).fimMs;
    marcarFim(ID);
    expect(lerMarcos(ID).fimMs).toBe(primeiro);
    expect(estaFinalizado(ID)).toBe(true);
  });

  // O caminho que NÃO EXISTIA e produziu o relato de uso real.
  it("reabrir apaga a marca de fim e destrava o cronômetro", () => {
    garantirInicio(ID);
    marcarFim(ID);
    expect(estaFinalizado(ID)).toBe(true);

    reabrir(ID);

    expect(estaFinalizado(ID)).toBe(false);
    expect(window.localStorage.getItem(chaveFimTreino(ID))).toBeNull();
    expect(window.localStorage.getItem(chaveInicioTreino(ID))).not.toBeNull();
  });

  it("reabrir não perde o tempo que já tinha corrido", () => {
    const store = armazenamentoFalso();
    // @ts-expect-error — ambiente node.
    globalThis.window = { localStorage: store };

    const agora = Date.now();
    store.setItem(chaveInicioTreino(ID), new Date(agora - 2 * H).toISOString());
    store.setItem(chaveFimTreino(ID), new Date(agora - 1 * H).toISOString());
    // Treino de 1 hora, finalizado 1 hora atrás.

    reabrir(ID);

    // Tolerância de 2s: `reabrir` usa o próprio Date.now().
    expect(segundosDecorridos(ID)).toBeGreaterThanOrEqual(3598);
    expect(segundosDecorridos(ID)).toBeLessThanOrEqual(3602);
  });

  it("reabrir um treino em andamento não faz nada", () => {
    garantirInicio(ID);
    const antes = lerMarcos(ID).inicioMs;
    reabrir(ID);
    expect(lerMarcos(ID).inicioMs).toBe(antes);
    expect(estaFinalizado(ID)).toBe(false);
  });

  // A assinatura existe porque `treino-detalhe.tsx` deriva "concluído" de
  // um `useSyncExternalStore`. Antes a assinatura era VAZIA e a releitura
  // dependia de algum outro setState do mesmo handler forçar o render —
  // "reabrir" não teria essa sorte, porque mexe só no localStorage.
  it("avisa quem observa quando a marca de fim entra e quando sai", () => {
    const avisos: string[] = [];
    const cancelar = assinarMarcos(() => avisos.push("mudou"));

    garantirInicio(ID);
    expect(avisos).toHaveLength(0); // início não muda "está finalizado?"

    marcarFim(ID);
    expect(avisos).toHaveLength(1);

    marcarFim(ID); // idempotente: não avisa de novo
    expect(avisos).toHaveLength(1);

    reabrir(ID);
    expect(avisos).toHaveLength(2);

    cancelar();
    marcarFim(ID);
    expect(avisos).toHaveLength(2); // cancelado não recebe mais
  });

  it("treino de outro id não é afetado", () => {
    garantirInicio(ID);
    marcarFim(ID);
    garantirInicio("treino-2");
    reabrir(ID);
    expect(estaFinalizado("treino-2")).toBe(false);
    expect(lerMarcos("treino-2").inicioMs).not.toBeNull();
  });
});
