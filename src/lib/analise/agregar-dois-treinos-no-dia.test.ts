import { describe, expect, it } from "vitest";
import { montarResumoCompacto } from "./agregar";
import type { ExercicioBruto, TreinoBruto } from "./tipos";

// Desde 2026-09-24, finalizar o treino e tocar "Iniciar treino de hoje" cria
// um SEGUNDO treino no mesmo dia. A tendência de e1RM agrupa por dia: um dia
// só, mesmo com dois treinos, não é tendência (T-E6).

const agora = new Date("2026-08-03T10:00:00Z");
const supino: ExercicioBruto = {
  id: "supino",
  nome: "Supino reto com barra",
  grupoMuscularPrimario: "peito",
  unilateral: false,
  pesoPorLado: false,
};

describe("montarResumoCompacto — dois treinos no mesmo dia", () => {
  it("dois treinos no mesmo dia contam como UMA sessão na tendência de e1RM", () => {
    const treinos: TreinoBruto[] = [
      {
        id: "manha",
        data: "2026-07-30",
        series: [{ id: "a", exercicioId: "supino", tipo: "valendo", reps: 8, peso: 50, pesoPorLado: false }],
      },
      {
        id: "noite",
        data: "2026-07-30",
        series: [{ id: "b", exercicioId: "supino", tipo: "valendo", reps: 8, peso: 60, pesoPorLado: false }],
      },
    ];
    const resumo = montarResumoCompacto({ treinos, exercicios: [supino], agora });
    expect(resumo.tendencia_e1rm.some((t) => t.exercicio === supino.nome)).toBe(false);
  });

  it("dias diferentes continuam formando tendência, com o máximo do dia", () => {
    const treinos: TreinoBruto[] = [
      {
        id: "ontem",
        data: "2026-07-28",
        series: [{ id: "a", exercicioId: "supino", tipo: "valendo", reps: 8, peso: 50, pesoPorLado: false }],
      },
      {
        id: "manha",
        data: "2026-07-30",
        series: [{ id: "b", exercicioId: "supino", tipo: "valendo", reps: 8, peso: 55, pesoPorLado: false }],
      },
      {
        id: "noite",
        data: "2026-07-30",
        series: [{ id: "c", exercicioId: "supino", tipo: "valendo", reps: 8, peso: 60, pesoPorLado: false }],
      },
    ];
    const resumo = montarResumoCompacto({ treinos, exercicios: [supino], agora });
    const tendencia = resumo.tendencia_e1rm.find((t) => t.exercicio === supino.nome);
    expect(tendencia?.sessoes).toBe(2);
    expect(tendencia!.e1rm_atual).toBeGreaterThan(tendencia!.e1rm_inicial);
  });
});
