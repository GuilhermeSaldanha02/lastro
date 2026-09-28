// lastro · testes de montarEvidenciaParaTela e classificarSinal.
import { describe, expect, it } from "vitest";
import type { ResumoCompacto } from "@/lib/analise/tipos";
import { classificarSinal, evidenciaDaPergunta, montarEvidenciaParaTela } from "./evidencia";

function resumoBase(): ResumoCompacto {
  return {
    versao: 1,
    periodo: {
      semana_atual_inicio: "2026-07-27",
      semanas_com_dados: 4,
      janela_semanas: 4,
    },
    faixa_referencia_series: [10, 20],
    volume_semanal: [],
    volume_por_grupo_muscular: [],
    volume_por_exercicio: [
      {
        exercicio: "Supino reto com barra",
        grupo_muscular: "peito",
        series_valendo: 5,
        volume: 2000,
        peso_referencia: 80,
        reps_referencia: 5,
        delta_volume_pct: 8,
      },
      {
        exercicio: "Remada curvada com barra",
        grupo_muscular: "costas",
        series_valendo: 4,
        volume: 2240,
        peso_referencia: 70,
        reps_referencia: 8,
        delta_volume_pct: -3,
      },
    ],
    tendencia_e1rm: [
      {
        exercicio: "Supino reto com barra",
        grupo_muscular: "peito",
        e1rm_atual: 93.3,
        e1rm_inicial: 82.8,
        delta_pct: 12.7,
        sessoes: 5,
      },
      {
        exercicio: "Remada curvada com barra",
        grupo_muscular: "costas",
        e1rm_atual: 88.7,
        e1rm_inicial: 96.3,
        delta_pct: -7.9,
        sessoes: 5,
      },
      {
        exercicio: "Exercício sem série esta semana",
        grupo_muscular: "ombro",
        e1rm_atual: 50,
        e1rm_inicial: 48,
        delta_pct: 4.2,
        sessoes: 3,
      },
    ],
    frequencia: { treinos_semana_atual: 5, grupos_sem_estimulo: [] },
    estagnacoes: [
      {
        exercicio: "Remada curvada com barra",
        semanas_sem_progresso: 4,
        e1rm_estavel_em: 88.7,
        volume_estavel_em: 2240,
      },
    ],
    prs: [],
  };
}

describe("classificarSinal", () => {
  it("delta positivo acima da zona-morta -> alta", () => {
    expect(classificarSinal(12.7)).toBe("alta");
  });
  it("delta negativo abaixo da zona-morta -> queda", () => {
    expect(classificarSinal(-7.9)).toBe("queda");
  });
  it("delta dentro da zona-morta (±1%) -> plato, nos dois sinais", () => {
    expect(classificarSinal(0.4)).toBe("plato");
    expect(classificarSinal(-0.4)).toBe("plato");
    expect(classificarSinal(1)).toBe("plato");
    expect(classificarSinal(-1)).toBe("plato");
  });
});

describe("montarEvidenciaParaTela", () => {
  const evidencia = montarEvidenciaParaTela(resumoBase());

  it("periodo.semana_atual_fim é semana_atual_inicio + 6 dias", () => {
    expect(evidencia.periodo.semana_atual_fim).toBe("2026-08-02");
  });

  it("só entram exercícios com tendencia_e1rm E volume_por_exercicio (Regra da Presença)", () => {
    const nomes = evidencia.blocos.map((b) => b.exercicio);
    expect(nomes).toEqual(["Supino reto com barra", "Remada curvada com barra"]);
    expect(nomes).not.toContain("Exercício sem série esta semana");
  });

  it("Supino: sinal alta, peso/reps/volume vêm de volume_por_exercicio, delta_pct de tendencia_e1rm", () => {
    const supino = evidencia.blocos.find((b) => b.exercicio === "Supino reto com barra");
    expect(supino).toEqual({
      exercicio: "Supino reto com barra",
      grupo_muscular: "peito",
      sinal: "alta",
      peso_referencia: 80,
      reps_referencia: 5,
      volume: 2000,
      series_valendo: 5,
      delta_pct: 12.7,
    });
  });

  it("Remada: sinal QUEDA (não platô) mesmo estando em estagnacoes — cor vem só do delta, estagnação vira campo qualificado", () => {
    const remada = evidencia.blocos.find((b) => b.exercicio === "Remada curvada com barra");
    expect(remada?.sinal).toBe("queda");
    expect(remada?.semanas_sem_progresso).toBe(4);
  });

  it("Supino não tem semanas_sem_progresso (não está em estagnacoes)", () => {
    const supino = evidencia.blocos.find((b) => b.exercicio === "Supino reto com barra");
    expect("semanas_sem_progresso" in supino!).toBe(false);
  });
});

describe("evidenciaDaPergunta", () => {
  const bloco = (exercicio: string, sinal: "alta" | "plato" | "queda", semanas?: number) => ({
    exercicio,
    grupo_muscular: "Peito",
    sinal,
    peso_referencia: 80,
    reps_referencia: 6,
    volume: 1440,
    series_valendo: 3,
    delta_pct: sinal === "alta" ? 5 : sinal === "queda" ? -5 : 0,
    ...(semanas ? { semanas_sem_progresso: semanas } : {}),
  });
  const evidencia = {
    periodo: { semana_atual_inicio: "2026-09-21", semana_atual_fim: "2026-09-27", janela_semanas: 4 },
    blocos: [bloco("Supino", "alta"), bloco("Remada", "plato", 5), bloco("Leg press", "queda")],
  };

  it("1 e 5 mostram todos os blocos", () => {
    expect(evidenciaDaPergunta(evidencia, 1).blocos).toHaveLength(3);
    expect(evidenciaDaPergunta(evidencia, 5).blocos).toHaveLength(3);
  });

  it("2 mostra só quem não está em alta", () => {
    expect(evidenciaDaPergunta(evidencia, 2).blocos.map((b) => b.exercicio)).toEqual(["Remada", "Leg press"]);
  });

  it("3 e 4 ficam sem blocos, mas mantêm o período que data o parecer", () => {
    for (const p of [3, 4]) {
      const e = evidenciaDaPergunta(evidencia, p);
      expect(e.blocos).toEqual([]);
      expect(e.periodo).toEqual(evidencia.periodo);
    }
  });
});
