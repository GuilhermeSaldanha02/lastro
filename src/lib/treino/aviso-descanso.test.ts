import { describe, expect, it } from "vitest";

import {
  adicionarTempoAoDescanso,
  iniciarDescanso,
  marcarAvisoEmitido,
  pausarDescanso,
  retomarDescanso,
} from "./descanso-real";
import { ANTECEDENCIA_PRE_AVISO, acaoDoAviso, segundosAteOPreAviso, segundosAteOAviso } from "./aviso-descanso";

// Achado no teste de 2026-09-24: chegar a zero com o app aberto marcava o
// aviso como emitido e CANCELAVA o push no servidor antes de ele sair.
// Chegar ao fim não cancela nada; só pausar e encerrar cancelam.
describe("o que fazer com o aviso no servidor", () => {
  const t0 = 1_000_000;
  const d = iniciarDescanso("t1", "s1", 90, t0);
  it("correndo: agenda o que falta", () => {
    expect(acaoDoAviso(d, t0 + 30_000)).toEqual({ tipo: "agendar", segundos: 60 });
  });
  it("chegou a zero ou o bip já tocou: mantém o que está agendado", () => {
    expect(acaoDoAviso(d, t0 + 90_000)).toEqual({ tipo: "manter" });
    expect(acaoDoAviso(marcarAvisoEmitido(d), t0 + 95_000)).toEqual({ tipo: "manter" });
  });
  it("pausado ou encerrado: cancela", () => {
    expect(acaoDoAviso(pausarDescanso(d, t0 + 10_000), t0 + 20_000)).toEqual({ tipo: "cancelar" });
    expect(acaoDoAviso(null, t0)).toEqual({ tipo: "cancelar" });
  });
});

// Pedido do dono (2026-09-24): "faltam 15 s" antes do fim, para se preparar.
describe("pré-aviso de descanso", () => {
  it("sai 15 s antes do fim", () => {
    expect(ANTECEDENCIA_PRE_AVISO).toBe(15);
    expect(segundosAteOPreAviso(90)).toBe(75);
  });
  it("descanso curto demais (≤ 20 s) ou cancelado não tem pré-aviso", () => {
    expect(segundosAteOPreAviso(20)).toBeNull();
    expect(segundosAteOPreAviso(null)).toBeNull();
  });
});

// Pedido do dono (2026-09-23): saber que o descanso acabou mesmo com o app
// em segundo plano. O servidor recebe "daqui a N segundos" (não um horário,
// para não depender do relógio do aparelho) ou `null` para cancelar.
describe("segundos até o aviso de fim do descanso", () => {
  const inicio = 1_000_000;
  const descanso = iniciarDescanso("t1", "s1", 90, inicio);

  it("sem descanso, não há aviso", () => {
    expect(segundosAteOAviso(null, inicio)).toBeNull();
  });

  it("descanso correndo: o que falta da meta, arredondado para cima", () => {
    expect(segundosAteOAviso(descanso, inicio)).toBe(90);
    expect(segundosAteOAviso(descanso, inicio + 30_500)).toBe(60);
  });

  it("pausado não avisa; ao retomar, conta o que faltava", () => {
    const pausado = pausarDescanso(descanso, inicio + 20_000);
    expect(segundosAteOAviso(pausado, inicio + 50_000)).toBeNull();
    const retomado = retomarDescanso(pausado, inicio + 50_000);
    expect(segundosAteOAviso(retomado, inicio + 50_000)).toBe(70);
  });

  it("+30s empurra o aviso", () => {
    expect(segundosAteOAviso(adicionarTempoAoDescanso(descanso, 30), inicio + 10_000)).toBe(110);
  });

  it("meta já atingida ou aviso já emitido: não agenda", () => {
    expect(segundosAteOAviso(descanso, inicio + 90_000)).toBeNull();
    expect(segundosAteOAviso(marcarAvisoEmitido(descanso), inicio)).toBeNull();
  });
});
