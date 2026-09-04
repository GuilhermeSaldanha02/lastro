// lastro · a política nasceu de MEDIÇÃO, não de suposição: 11 de 15
// chamadas voltaram 503 num único dia (DECISIONS.md 2026-09-04). Estes
// testes fixam o que repete e — mais importante — o que NÃO repete.
import { describe, expect, it, vi } from "vitest";
import {
  comRetryTransitorio,
  ehTransitorio,
  motivoDoErro,
  statusDoErro,
} from "./retry-transitorio";

/** Forma do `ApiError` do @google/genai: Error com `status: number`. */
function erroDaApi(status: number, mensagem = "falhou"): Error & { status: number } {
  return Object.assign(new Error(mensagem), { status });
}

describe("statusDoErro", () => {
  it("lê o campo status do ApiError", () => {
    expect(statusDoErro(erroDaApi(503))).toBe(503);
  });

  it("cai para a mensagem quando não há campo status", () => {
    expect(statusDoErro(new Error("Request failed with 429"))).toBe(429);
  });

  it("devolve undefined quando não dá para saber", () => {
    expect(statusDoErro(new Error("deu ruim"))).toBeUndefined();
    expect(statusDoErro(null)).toBeUndefined();
  });
});

describe("ehTransitorio", () => {
  it("503 é transitório — foi o erro dominante na medição", () => {
    expect(ehTransitorio(erroDaApi(503))).toBe(true);
  });

  it("500, 502 e 504 também", () => {
    for (const s of [500, 502, 504]) expect(ehTransitorio(erroDaApi(s))).toBe(true);
  });

  // Estes dois são a razão da política não ser simétrica.
  it("429 NÃO é transitório — repetir queima cota e falha de novo", () => {
    expect(ehTransitorio(erroDaApi(429))).toBe(false);
  });

  it("404 NÃO é transitório — é determinístico, retry só esconderia", () => {
    expect(ehTransitorio(erroDaApi(404))).toBe(false);
  });

  it("erro sem status não repete — o padrão seguro é NÃO repetir", () => {
    expect(ehTransitorio(new Error("timeout de rede"))).toBe(false);
  });
});

describe("comRetryTransitorio", () => {
  const semDormir = { dormir: async () => {} };

  it("não chama duas vezes quando a primeira dá certo", async () => {
    const operacao = vi.fn().mockResolvedValue("parecer");
    await expect(comRetryTransitorio(operacao, semDormir)).resolves.toBe("parecer");
    expect(operacao).toHaveBeenCalledTimes(1);
  });

  it("recupera um 503 na segunda tentativa — o caso que salvaria o dia B", async () => {
    const operacao = vi
      .fn()
      .mockRejectedValueOnce(erroDaApi(503))
      .mockResolvedValue("parecer");
    await expect(comRetryTransitorio(operacao, semDormir)).resolves.toBe("parecer");
    expect(operacao).toHaveBeenCalledTimes(2);
  });

  it("desiste depois de DUAS falhas transitórias, não fica em laço", async () => {
    const operacao = vi.fn().mockRejectedValue(erroDaApi(503));
    await expect(comRetryTransitorio(operacao, semDormir)).rejects.toThrow();
    expect(operacao).toHaveBeenCalledTimes(2);
  });

  it("429 sobe na hora, sem segunda chamada", async () => {
    const operacao = vi.fn().mockRejectedValue(erroDaApi(429));
    await expect(comRetryTransitorio(operacao, semDormir)).rejects.toMatchObject({
      status: 429,
    });
    expect(operacao).toHaveBeenCalledTimes(1);
  });

  it("404 sobe na hora, sem segunda chamada", async () => {
    const operacao = vi.fn().mockRejectedValue(erroDaApi(404));
    await expect(comRetryTransitorio(operacao, semDormir)).rejects.toMatchObject({
      status: 404,
    });
    expect(operacao).toHaveBeenCalledTimes(1);
  });

  it("espera antes de repetir, e só no caminho transitório", async () => {
    const dormir = vi.fn().mockResolvedValue(undefined);

    await comRetryTransitorio(vi.fn().mockResolvedValue("ok"), { dormir });
    expect(dormir).not.toHaveBeenCalled();

    await comRetryTransitorio(
      vi.fn().mockRejectedValueOnce(erroDaApi(503)).mockResolvedValue("ok"),
      { dormir, esperaMs: 900 },
    );
    expect(dormir).toHaveBeenCalledWith(900);
  });
});

// A classificação alimenta `parecer.falha_motivo` (migration 0019). Antes
// dela, 503, 429, 404 e "validador rejeitou" viravam o mesmo booleano.
describe("motivoDoErro", () => {
  it("503 e cia. são indisponibilidade", () => {
    for (const s of [500, 502, 503, 504]) {
      expect(motivoDoErro(erroDaApi(s))).toBe("api_indisponivel");
    }
  });

  it("429 é cota, não indisponibilidade — a diferença muda o que dizer ao dono", () => {
    expect(motivoDoErro(erroDaApi(429))).toBe("cota_excedida");
  });

  it("404 é modelo ausente", () => {
    expect(motivoDoErro(erroDaApi(404))).toBe("modelo_ausente");
  });

  it("status desconhecido cai no balde honesto, não numa causa inventada", () => {
    expect(motivoDoErro(erroDaApi(418))).toBe("api_erro");
    expect(motivoDoErro(new Error("timeout"))).toBe("api_erro");
    expect(motivoDoErro(null)).toBe("api_erro");
  });
});
