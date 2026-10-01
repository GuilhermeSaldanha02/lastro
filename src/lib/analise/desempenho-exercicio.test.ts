import { describe, expect, it } from "vitest";
import { desempenhoDoExercicio, type SerieDoExercicio } from "./desempenho-exercicio";

// Rosca concentrada do dono, uma série por sessão (a melhor de cada dia).
const ROSCA: SerieDoExercicio[] = [
  ["2026-08-09", 10, 40],
  ["2026-08-12", 12, 40],
  ["2026-08-16", 12, 24],
  ["2026-08-20", 12, 40],
  ["2026-08-26", 5, 61],
  ["2026-08-29", 10, 40],
  ["2026-09-03", 8, 40],
  ["2026-09-08", 7, 59],
  ["2026-09-13", 12, 20],
  ["2026-09-21", 10, 59],
].map(([data, reps, peso], i) => ({ treinoId: `t${i}`, dataTreino: data as string, reps: reps as number, peso: peso as number }));

describe("desempenhoDoExercicio", () => {
  it("recorde é o maior e1RM; maior carga é outro dado", () => {
    const d = desempenhoDoExercicio(ROSCA);
    expect(d.recorde).toMatchObject({ reps: 10, peso: 59, data: "2026-09-21", sessoesDepois: 0 });
    expect(d.recorde?.e1rm).toBeCloseTo(78.67, 1);
    expect(d.maiorCarga).toEqual({ reps: 5, peso: 61, data: "2026-08-26" });
  });

  it("evolução pelo melhor e1RM de cada metade das sessões", () => {
    // 1ª metade: melhor 71,2 (5×61). 2ª: melhor 78,7 (10×59). +10,5%.
    expect(desempenhoDoExercicio(ROSCA).evolucaoPct).toBeCloseTo(10.5, 0);
  });

  it("conta as sessões depois do recorde", () => {
    const antigo = [...ROSCA.slice(0, 5), ...ROSCA.slice(5).map((s) => ({ ...s, peso: 20 }))];
    expect(desempenhoDoExercicio(antigo).recorde).toMatchObject({ data: "2026-08-26", sessoesDepois: 5 });
  });

  it("série acima de 12 reps não vira recorde, mas conta como maior carga", () => {
    const d = desempenhoDoExercicio([
      { treinoId: "a", dataTreino: "2026-09-01", reps: 20, peso: 50 },
      { treinoId: "b", dataTreino: "2026-09-02", reps: 8, peso: 40 },
    ]);
    expect(d.recorde).toMatchObject({ reps: 8, peso: 40 });
    expect(d.maiorCarga).toEqual({ reps: 20, peso: 50, data: "2026-09-01" });
  });

  it("uma sessão só: sem evolução; sem peso: nada", () => {
    expect(desempenhoDoExercicio([ROSCA[0]]).evolucaoPct).toBeNull();
    expect(desempenhoDoExercicio([{ treinoId: "x", dataTreino: "2026-09-01", reps: 10, peso: 0 }])).toEqual({
      recorde: null,
      maiorCarga: null,
      evolucaoPct: null,
    });
  });
});
