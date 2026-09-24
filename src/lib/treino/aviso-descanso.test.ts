import { describe, expect, it } from "vitest";

import {
  adicionarTempoAoDescanso,
  iniciarDescanso,
  marcarAvisoEmitido,
  pausarDescanso,
  retomarDescanso,
} from "./descanso-real";
import { segundosAteOAviso } from "./aviso-descanso";

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
