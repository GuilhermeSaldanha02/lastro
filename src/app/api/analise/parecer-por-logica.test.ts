import { describe, expect, it } from "vitest";
import type { ExercicioBruto, TreinoBruto } from "@/lib/analise/tipos";
import { parecerPorLogica, respondidaPorLogica } from "./parecer-por-logica";

const EXERCICIOS: ExercicioBruto[] = [
  { id: "supino", nome: "Supino reto", grupoMuscularPrimario: "Peito", unilateral: false, pesoPorLado: false },
];
const TREINOS: TreinoBruto[] = [
  {
    id: "t1",
    data: "2026-09-15",
    series: [{ id: "s1", exercicioId: "supino", tipo: "valendo", reps: 10, peso: 50, pesoPorLado: false }],
  },
];
const base = { treinos: TREINOS, exercicios: EXERCICIOS, hojeISO: "2026-09-30", idioma: "pt-BR" as const };

describe("respondidaPorLogica", () => {
  it("todas menos a 5 (prescrição)", () => {
    expect(([1, 2, 3, 4, 6, 7] as const).every(respondidaPorLogica)).toBe(true);
    expect(respondidaPorLogica(5)).toBe(false);
  });
});

describe("parecerPorLogica", () => {
  it("perguntas semanais: evidência sem tipo de período (o cabeçalho segue 'Semana de')", () => {
    const { evidencia } = parecerPorLogica({ ...base, pergunta: 3 });
    expect(evidencia.periodo.tipo_periodo).toBeUndefined();
    expect(evidencia.periodo.semana_atual_inicio).toBe("2026-09-21");
  });

  it("6: o mês até hoje, marcado como período", () => {
    const { texto, evidencia } = parecerPorLogica({ ...base, pergunta: 6 });
    expect(texto).toMatch(/^Setembro 2026: 1 treino até hoje\./);
    expect(evidencia).toEqual({
      periodo: { semana_atual_inicio: "2026-09-01", semana_atual_fim: "2026-09-30", janela_semanas: 5, tipo_periodo: "mes" },
      blocos: [],
    });
  });

  it("7: desde o primeiro treino", () => {
    const { texto, evidencia } = parecerPorLogica({ ...base, pergunta: 7 });
    expect(texto).toMatch(/^Desde 15 set 2026: 1 treino\./);
    expect(evidencia.periodo.tipo_periodo).toBe("historico");
    expect(evidencia.periodo.semana_atual_inicio).toBe("2026-09-15");
  });

  it("7 sem nenhum treino ainda: texto honesto e período ancorado em hoje", () => {
    const { texto, evidencia } = parecerPorLogica({ ...base, treinos: [], pergunta: 7 });
    expect(texto).toBe("Você ainda não registrou nenhuma série valendo.");
    expect(evidencia.periodo.semana_atual_inicio).toBe("2026-09-30");
  });
});
