import { describe, expect, it } from "vitest";
import {
  adicionarTempoAoDescanso,
  concluirDescanso,
  iniciarDescanso,
  marcarAvisoEmitido,
  painelDoDescanso,
  pausarDescanso,
  podeIniciarDescanso,
  retomarDescanso,
} from "./descanso-real";

describe("descanso real", () => {
  it("mede somente o tempo ativo", () => {
    const iniciado = iniciarDescanso("treino-1", "serie-1", 90, 10_000);
    const pausado = pausarDescanso(iniciado, 40_000);
    const retomado = retomarDescanso(pausado, 70_000);

    expect(painelDoDescanso(retomado, 100_000).segundosReais).toBe(60);
  });

  it("altera a meta sem reiniciar o tempo acumulado", () => {
    const iniciado = iniciarDescanso("treino-1", "serie-1", 90, 10_000);
    const ampliado = adicionarTempoAoDescanso(iniciado, 30);

    expect(painelDoDescanso(ampliado, 70_000)).toEqual({
      segundosReais: 60,
      segundosRestantes: 60,
      metaAtingida: false,
      pausado: false,
    });
  });

  it("continua medindo depois de a contagem regressiva chegar a zero", () => {
    const estado = iniciarDescanso("treino-1", "serie-1", 90, 0);

    expect(painelDoDescanso(estado, 103_000)).toMatchObject({
      segundosReais: 103,
      segundosRestantes: 0,
      metaAtingida: true,
    });
    expect(concluirDescanso(estado, 103_000)).toEqual({
      treinoId: "treino-1",
      serieId: "serie-1",
      descansoRealSegundos: 103,
    });
  });

  it("marca o aviso sem mudar o estado duas vezes", () => {
    const estado = iniciarDescanso("treino-1", "serie-1", 1, 0);
    const avisado = marcarAvisoEmitido(estado);

    expect(avisado.avisoMetaEmitido).toBe(true);
    expect(marcarAvisoEmitido(avisado)).toBe(avisado);
  });

  it("não produz duração negativa com relógio invertido", () => {
    const estado = iniciarDescanso("treino-1", "serie-1", 90, 20_000);

    expect(concluirDescanso(estado, 10_000).descansoRealSegundos).toBe(0);
  });

  it("só inicia quando existe uma série livre de descanso", () => {
    const ativo = iniciarDescanso("t1", "s1", 90, 0);

    expect(podeIniciarDescanso(null, undefined, false)).toBe(false);
    expect(podeIniciarDescanso(null, "s1", false)).toBe(true);
    expect(podeIniciarDescanso(ativo, "s1", false)).toBe(false);
    expect(podeIniciarDescanso(null, "s1", true)).toBe(false);
  });

  it("mantém pausa e retomada idempotentes", () => {
    const iniciado = iniciarDescanso("t1", "s1", 90, 0);
    const pausado = pausarDescanso(iniciado, 10_000);
    const pausadoDeNovo = pausarDescanso(pausado, 20_000);
    const retomado = retomarDescanso(pausadoDeNovo, 30_000);
    const retomadoDeNovo = retomarDescanso(retomado, 40_000);

    expect(concluirDescanso(retomadoDeNovo, 50_000).descansoRealSegundos).toBe(30);
  });
});
