import { describe, expect, it } from "vitest";
import { SEMANAS_ESTAGNACAO } from "./limiares";
import { calcularEstagnacoes, type ValoresSemanaisExercicio } from "./estagnacao";

// T-S1: 5 semanas (LOOKBACK_ESTAGNACAO_SEMANAS = SEMANAS_ESTAGNACAO + 1),
// e1RM e volume idênticos em todas -> a semana 0 é a linha de base; as 4
// seguintes (=SEMANAS_ESTAGNACAO) não batem novo recorde -> estagnação.
describe("calcularEstagnacoes", () => {
  it("T-S1: 5 semanas estáveis em e1RM e volume -> estagnação com semanas_sem_progresso = SEMANAS_ESTAGNACAO", () => {
    const semanas: ValoresSemanaisExercicio[] = [
      { semanaInicio: "2026-06-29", e1rm: 66.7, volume: 1200 },
      { semanaInicio: "2026-07-06", e1rm: 66.7, volume: 1200 },
      { semanaInicio: "2026-07-13", e1rm: 66.7, volume: 1200 },
      { semanaInicio: "2026-07-20", e1rm: 66.7, volume: 1200 },
      { semanaInicio: "2026-07-27", e1rm: 66.7, volume: 1200 },
    ];
    const resultado = calcularEstagnacoes([
      { exercicio: "Supino reto com barra", semanas },
    ]);
    expect(resultado).toEqual([
      {
        exercicio: "Supino reto com barra",
        semanas_sem_progresso: SEMANAS_ESTAGNACAO,
        e1rm_estavel_em: 66.7,
        volume_estavel_em: 1200,
      },
    ]);
  });

  // T-S2: e1RM parado, volume subindo -> não é estagnação (glossário exige as DUAS sem melhora)
  it("T-S2: e1RM parado mas volume subindo -> não é estagnação", () => {
    const semanas: ValoresSemanaisExercicio[] = [
      { semanaInicio: "2026-06-29", e1rm: 66.7, volume: 1000 },
      { semanaInicio: "2026-07-06", e1rm: 66.7, volume: 1100 },
      { semanaInicio: "2026-07-13", e1rm: 66.7, volume: 1200 },
      { semanaInicio: "2026-07-20", e1rm: 66.7, volume: 1300 },
      { semanaInicio: "2026-07-27", e1rm: 66.7, volume: 1400 },
    ];
    const resultado = calcularEstagnacoes([
      { exercicio: "Supino reto com barra", semanas },
    ]);
    expect(resultado).toEqual([]);
  });
});
