import { describe, expect, it } from "vitest";
import {
  E1RM_REPS_MAX,
  JANELA_SEMANAS,
  MAX_BYTES_RESUMO,
  MAX_ESTAGNACOES,
  MAX_GRUPOS,
  MAX_PRS,
  MAX_TENDENCIA_E1RM,
} from "./limiares";
import { montarResumoCompacto } from "./agregar";
import type { ExercicioBruto, TreinoBruto } from "./tipos";

const agora = new Date("2026-08-03T10:00:00Z");

const supino: ExercicioBruto = {
  id: "supino",
  nome: "Supino reto com barra",
  grupoMuscularPrimario: "peito",
  unilateral: false,
};
const rosca: ExercicioBruto = {
  id: "rosca",
  nome: "Rosca direta",
  grupoMuscularPrimario: "biceps",
  unilateral: false,
};
const cadeiraExtensora: ExercicioBruto = {
  id: "cadeira-extensora",
  nome: "Cadeira extensora",
  grupoMuscularPrimario: "quadriceps",
  unilateral: false,
};
const puxadaAlta: ExercicioBruto = {
  id: "puxada-alta",
  nome: "Puxada alta",
  grupoMuscularPrimario: "costas",
  unilateral: false,
};

const exercicios: ExercicioBruto[] = [supino, rosca, cadeiraExtensora, puxadaAlta];

/** Fixture base F1 (SDD §4.5). */
const treinosF1: TreinoBruto[] = [
  {
    id: "t0",
    data: "2026-07-21", // semana anterior (2026-07-20)
    series: [
      { id: "s-ant-1", exercicioId: "supino", tipo: "valendo", reps: 10, peso: 50, pesoCorporalIncluso: false },
      { id: "s-ant-2", exercicioId: "supino", tipo: "valendo", reps: 10, peso: 50, pesoCorporalIncluso: false },
    ],
  },
  {
    id: "t1",
    data: "2026-07-30", // semana atual (2026-07-27)
    series: [
      { id: "s0", exercicioId: "supino", tipo: "aquecimento", reps: 10, peso: 20, pesoCorporalIncluso: false },
      { id: "s1", exercicioId: "supino", tipo: "valendo", reps: 10, peso: 50, rir: 2, pesoCorporalIncluso: false },
      { id: "s2", exercicioId: "supino", tipo: "valendo", reps: 8, peso: 50, rir: 0, pesoCorporalIncluso: false },
      { id: "s3", exercicioId: "supino", tipo: "valendo", reps: 6, peso: 50, pesoCorporalIncluso: false },
    ],
  },
  {
    id: "t2",
    data: "2026-07-28", // semana atual
    series: [
      { id: "s4", exercicioId: "rosca", tipo: "valendo", reps: 10, peso: 14, rir: 2, pesoCorporalIncluso: false },
    ],
  },
  {
    id: "t3",
    data: "2026-07-29", // semana atual
    series: [
      { id: "s5", exercicioId: "cadeira-extensora", tipo: "valendo", reps: 10, peso: 40, rir: 1, pesoCorporalIncluso: false },
    ],
  },
  {
    id: "t4",
    data: "2026-07-31", // semana atual — SÓ aquecimento (T-F1)
    series: [
      { id: "s6", exercicioId: "supino", tipo: "aquecimento", reps: 10, peso: 20, pesoCorporalIncluso: false },
    ],
  },
];

describe("montarResumoCompacto — fixture F1", () => {
  const resumo = montarResumoCompacto({ treinos: treinosF1, exercicios, agora });

  it("periodo.semana_atual_inicio é a semana analisada (2026-07-27)", () => {
    expect(resumo.periodo.semana_atual_inicio).toBe("2026-07-27");
  });

  // T-V1
  it("T-V1: volume da semana atual = 1200", () => {
    const semana = resumo.volume_semanal.find((w) => w.semana_inicio === "2026-07-27");
    // volume_semanal soma TODOS os grupos; some rosca (280) e cadeira (400) também
    // entram — isolamos via volume_por_grupo_muscular do peito.
    const peito = resumo.volume_por_grupo_muscular.find((g) => g.grupo_muscular === "peito");
    expect(peito?.volume).toBe(1200);
    expect(semana?.volume_total).toBeGreaterThanOrEqual(1200);
  });

  // T-V3
  it("T-V3: delta_volume_pct do peito vs. semana anterior = +20,0%", () => {
    const peito = resumo.volume_por_grupo_muscular.find((g) => g.grupo_muscular === "peito");
    expect(peito?.delta_volume_pct).toBeCloseTo(20.0, 1);
  });

  // T-D1 — fixture ISOLADA (só o supino, sem rosca/cadeira na semana atual),
  // porque series_dificeis é agregado da SEMANA INTEIRA, não por exercício
  // — misturar outros exercícios na mesma semana mudaria os denominadores.
  it("T-D1: series_dificeis = {total:2, com_rir:2, valendo:3} (escopo semana atual)", () => {
    const resumoIsolado = montarResumoCompacto({
      treinos: [treinosF1[0], treinosF1[1]], // t0 (semana anterior) + t1 (semana atual, só supino)
      exercicios,
      agora,
    });
    expect(resumoIsolado.series_dificeis).toEqual({
      total: 2,
      series_valendo_com_rir: 2,
      series_valendo: 3,
    });
  });

  // T-V2 (FF4) — remover os aquecimentos de F1 não muda NADA no resumo.
  // t4 é só-aquecimento: some inteira ao filtrar (prova que também não
  // conta em frequência). t1 perde s0, mas mantém s1/s2/s3.
  it("T-V2 (FF4): resumo idêntico sem os aquecimentos", () => {
    const semAquecimento = treinosF1
      .map((t) => ({
        ...t,
        series: t.series.filter((s) => s.tipo !== "aquecimento"),
      }))
      .filter((t) => t.series.length > 0);
    const resumoSemAquecimento = montarResumoCompacto({
      treinos: semAquecimento,
      exercicios,
      agora,
    });
    expect(resumoSemAquecimento).toEqual(resumo);
  });

  // T-F1
  it("T-F1: treinos_semana_atual = 3 (o treino só-aquecimento não entra)", () => {
    expect(resumo.frequencia.treinos_semana_atual).toBe(3);
  });

  // T-F2
  it("T-F2: grupo muscular sem série valendo na janela aparece em grupos_sem_estimulo", () => {
    expect(resumo.frequencia.grupos_sem_estimulo).toContain("costas");
  });

  // T-E4 (via tendencia_e1rm.e1rm_atual, que usa o MÁXIMO da sessão)
  it("T-E4: e1RM atual do supino é o máximo da sessão (66,7), não a média", () => {
    const supinoTendencia = resumo.tendencia_e1rm.find((t) => t.exercicio === "Supino reto com barra");
    expect(supinoTendencia?.e1rm_atual).toBeCloseTo(66.7, 1);
  });

  // T-E6
  it("T-E6: exercício com 1 só sessão elegível na janela fica ausente de tendencia_e1rm", () => {
    expect(resumo.tendencia_e1rm.some((t) => t.exercicio === "Rosca direta")).toBe(false);
    expect(resumo.tendencia_e1rm.some((t) => t.exercicio === "Cadeira extensora")).toBe(false);
  });

  it("Regra da Presença: cobertura_rir_insuficiente está AUSENTE (não apenas undefined) quando series_dificeis existe", () => {
    expect("cobertura_rir_insuficiente" in resumo).toBe(false);
  });
});

// T-E5 — teto de reps. A série de 25 reps é desenhada para VENCER o
// e1RM da sessão se o teto não fosse aplicado (110 > 40) — assim o teste
// só passa se `elegivelParaE1rm` está de fato excluindo-a.
describe("montarResumoCompacto — teto de reps (T-E5)", () => {
  it("série de 25 reps soma no volume, mas o e1RM da sessão ignora-a (não é 110, é 40)", () => {
    const treinos: TreinoBruto[] = [
      {
        id: "t1",
        data: "2026-07-28", // semana atual
        series: [
          { id: "s1", exercicioId: "supino", tipo: "valendo", reps: 25, peso: 60, pesoCorporalIncluso: false },
          { id: "s2", exercicioId: "supino", tipo: "valendo", reps: 10, peso: 30, pesoCorporalIncluso: false },
        ],
      },
      {
        id: "t2",
        data: "2026-07-21", // semana anterior — 2ª sessão, para aparecer em tendencia_e1rm
        series: [
          { id: "s3", exercicioId: "supino", tipo: "valendo", reps: 10, peso: 30, pesoCorporalIncluso: false },
        ],
      },
    ];
    const resumo = montarResumoCompacto({ treinos, exercicios, agora });
    const peito = resumo.volume_por_grupo_muscular.find((g) => g.grupo_muscular === "peito");
    expect(peito?.volume).toBe(25 * 60 + 10 * 30); // 1500 + 300 = 1800 — a série conta em volume

    const tendenciaSupino = resumo.tendencia_e1rm.find((t) => t.exercicio === "Supino reto com barra");
    expect(tendenciaSupino?.e1rm_atual).toBeCloseTo(40, 1); // não 110 — a série de 25 reps não entra
  });
});

// T-V5 (segunda metade, D3.5) — a série com peso corporal não entra no
// volume, mas CONTA em frequencia e em series_dificeis (o esforço é real).
describe("montarResumoCompacto — peso corporal fora do volume, dentro de frequência/série difícil (T-V5)", () => {
  it("treinos_semana_atual e series_dificeis contam a série; volume do grupo fica ausente", () => {
    const treinos: TreinoBruto[] = [
      {
        id: "t1",
        data: "2026-07-28",
        series: [
          {
            id: "s1",
            exercicioId: "supino",
            tipo: "valendo",
            reps: 8,
            peso: 10,
            rir: 1,
            pesoCorporalIncluso: true,
          },
        ],
      },
    ];
    const resumo = montarResumoCompacto({ treinos, exercicios, agora });
    expect(resumo.frequencia.treinos_semana_atual).toBe(1);
    expect(resumo.series_dificeis?.total).toBe(1);
    // a série CONTA em series_valendo (é uma série valendo real), mas o
    // volume dela é 0 — peso corporal não entra em volume, nem a carga
    // externa de 8x10 (D3.5).
    const peito = resumo.volume_por_grupo_muscular.find((g) => g.grupo_muscular === "peito");
    expect(peito?.series_valendo).toBe(1);
    expect(peito?.volume).toBe(0);
  });
});

// T-R3 — determinismo (C4)
describe("montarResumoCompacto — determinismo (T-R3)", () => {
  it("duas chamadas com o mesmo `agora` produzem saídas idênticas", () => {
    const r1 = montarResumoCompacto({ treinos: treinosF1, exercicios, agora });
    const r2 = montarResumoCompacto({ treinos: treinosF1, exercicios, agora });
    expect(r1).toEqual(r2);
  });
});

// T-R4 — janela sem nenhuma série valendo
describe("montarResumoCompacto — janela vazia (T-R4)", () => {
  it("retorna resumo válido com listas vazias e sem campos de delta, sem lançar", () => {
    expect(() =>
      montarResumoCompacto({ treinos: [], exercicios, agora }),
    ).not.toThrow();
    const resumo = montarResumoCompacto({ treinos: [], exercicios, agora });
    expect(resumo.volume_por_grupo_muscular).toEqual([]);
    expect(resumo.tendencia_e1rm).toEqual([]);
    expect(resumo.estagnacoes).toEqual([]);
    expect(resumo.prs).toEqual([]);
    expect(resumo.volume_semanal.length).toBe(JANELA_SEMANAS);
    expect("series_dificeis" in resumo).toBe(false);
  });
});

// T-R5 — semana anterior sem dados
describe("montarResumoCompacto — semana anterior sem dados (T-R5)", () => {
  it("delta_* ficam AUSENTES (não 0) quando não há semana anterior com dados", () => {
    const treinos: TreinoBruto[] = [
      {
        id: "t1",
        data: "2026-07-28",
        series: [
          { id: "s1", exercicioId: "supino", tipo: "valendo", reps: 10, peso: 50, pesoCorporalIncluso: false },
        ],
      },
    ];
    const resumo = montarResumoCompacto({ treinos, exercicios, agora });
    const peito = resumo.volume_por_grupo_muscular.find((g) => g.grupo_muscular === "peito");
    expect(peito).toBeDefined();
    expect("delta_volume_pct" in peito!).toBe(false);
    expect("delta_series_pct" in peito!).toBe(false);
  });
});

// T-R6 — volume_semanal sempre cobre JANELA_SEMANAS semanas, zero explícito
describe("montarResumoCompacto — volume_semanal (T-R6)", () => {
  it("length = JANELA_SEMANAS, semana sem treino aparece com volume_total = 0 explícito", () => {
    const treinos: TreinoBruto[] = [
      {
        id: "t1",
        data: "2026-07-28",
        series: [
          { id: "s1", exercicioId: "supino", tipo: "valendo", reps: 10, peso: 50, pesoCorporalIncluso: false },
        ],
      },
    ];
    const resumo = montarResumoCompacto({ treinos, exercicios, agora });
    expect(resumo.volume_semanal.length).toBe(JANELA_SEMANAS);
    const semanaVazia = resumo.volume_semanal.find((w) => w.semana_inicio === "2026-07-13");
    expect(semanaVazia).toEqual({ semana_inicio: "2026-07-13", volume_total: 0 });
  });
});

// T-R1 — orçamento de tamanho (C1) com fixture de carga máxima (C2)
describe("montarResumoCompacto — orçamento de tamanho (T-R1)", () => {
  it("JSON.stringify(resumo).length <= MAX_BYTES_RESUMO na carga máxima permitida pelos tetos", () => {
    const exerciciosGrandes: ExercicioBruto[] = [];
    const treinosGrandes: TreinoBruto[] = [];

    // 12 grupos musculares distintos, cada um com um exercício "de volume"
    // para popular volume_por_grupo_muscular até o teto MAX_GRUPOS.
    for (let g = 0; g < MAX_GRUPOS; g++) {
      const id = `grupo-vol-${g}`;
      exerciciosGrandes.push({
        id,
        nome: `Exercicio de volume grupo ${g}`,
        grupoMuscularPrimario: `grupo-muscular-${g}`,
        unilateral: false,
      });
    }

    // 8 exercícios com >=2 sessões elegíveis, para popular tendencia_e1rm
    // até o teto MAX_TENDENCIA_E1RM.
    for (let e = 0; e < MAX_TENDENCIA_E1RM; e++) {
      const id = `tendencia-${e}`;
      exerciciosGrandes.push({
        id,
        nome: `Exercicio de tendencia numero ${e}`,
        grupoMuscularPrimario: `grupo-muscular-${e % MAX_GRUPOS}`,
        unilateral: false,
      });
    }

    // 5 exercícios de estagnação (5 semanas estáveis) — LOOKBACK = 5 semanas.
    for (let s = 0; s < MAX_ESTAGNACOES; s++) {
      const id = `estagnacao-${s}`;
      exerciciosGrandes.push({
        id,
        nome: `Exercicio estagnado numero ${s}`,
        grupoMuscularPrimario: `grupo-muscular-${s}`,
        unilateral: false,
      });
    }

    // 5 exercícios de PR.
    for (let p = 0; p < MAX_PRS; p++) {
      const id = `pr-${p}`;
      exerciciosGrandes.push({
        id,
        nome: `Exercicio recordista numero ${p}`,
        grupoMuscularPrimario: `grupo-muscular-${p}`,
        unilateral: false,
      });
    }

    let contadorTreino = 0;
    const semanas = ["2026-06-29", "2026-07-06", "2026-07-13", "2026-07-20", "2026-07-27"];

    for (const ex of exerciciosGrandes) {
      // estagnacao-*: peso IDÊNTICO nas 5 semanas -> aciona estagnação.
      // pr-*: peso maior na última semana -> aciona PR.
      // demais: peso levemente crescente, só para variar o volume ordenável.
      const ehEstagnacao = ex.id.startsWith("estagnacao-");
      const ehPr = ex.id.startsWith("pr-");

      semanas.forEach((semana, indiceSemana) => {
        contadorTreino += 1;
        const peso = ehEstagnacao
          ? 50
          : ehPr
            ? indiceSemana === semanas.length - 1
              ? 80
              : 50
            : 50 + contadorTreino * 0.1;
        treinosGrandes.push({
          id: `treino-${contadorTreino}`,
          data: semana, // segunda-feira da semana já é uma data válida dela
          series: [
            {
              id: `serie-${contadorTreino}-a`,
              exercicioId: ex.id,
              tipo: "valendo",
              reps: 10,
              peso,
              rir: 2,
              pesoCorporalIncluso: false,
            },
            {
              id: `serie-${contadorTreino}-b`,
              exercicioId: ex.id,
              tipo: "valendo",
              reps: 8,
              peso,
              rir: 1,
              pesoCorporalIncluso: false,
            },
          ],
        });
      });
    }

    const resumo = montarResumoCompacto({
      treinos: treinosGrandes,
      exercicios: exerciciosGrandes,
      agora,
    });

    expect(resumo.volume_por_grupo_muscular.length).toBeLessThanOrEqual(MAX_GRUPOS);
    expect(resumo.tendencia_e1rm.length).toBeLessThanOrEqual(MAX_TENDENCIA_E1RM);
    expect(resumo.estagnacoes.length).toBeLessThanOrEqual(MAX_ESTAGNACOES);
    expect(resumo.prs.length).toBeLessThanOrEqual(MAX_PRS);
    // as 5 estagnacao-* e as 5 pr-* foram desenhadas para DISPARAR cada
    // regra — prova que os tetos foram de fato exercitados no limite, não
    // só respeitados por acaso com listas vazias.
    expect(resumo.estagnacoes.length).toBe(MAX_ESTAGNACOES);
    expect(resumo.prs.length).toBe(MAX_PRS);
    expect(JSON.stringify(resumo).length).toBeLessThanOrEqual(MAX_BYTES_RESUMO);
  });
});

// T-R2 — teto de tendencia_e1rm com 40 exercícios, ordenado por volume desc
describe("montarResumoCompacto — teto de tendencia_e1rm (T-R2)", () => {
  it("40 exercícios distintos -> tendencia_e1rm.length <= 8, ordenado por volume desc", () => {
    const exerciciosGrandes: ExercicioBruto[] = [];
    const treinosGrandes: TreinoBruto[] = [];
    const semanas = ["2026-07-20", "2026-07-27"];

    for (let i = 0; i < 40; i++) {
      const id = `ex-${i}`;
      exerciciosGrandes.push({
        id,
        nome: `Exercicio ${i}`,
        grupoMuscularPrimario: "grupo-x",
        unilateral: false,
      });
      // peso cresce com i -> volume cresce com i -> ordenação verificável
      let contador = 0;
      for (const semana of semanas) {
        contador += 1;
        treinosGrandes.push({
          id: `treino-${id}-${contador}`,
          data: semana,
          series: [
            {
              id: `serie-${id}-${contador}`,
              exercicioId: id,
              tipo: "valendo",
              reps: 10,
              peso: 20 + i,
              pesoCorporalIncluso: false,
            },
          ],
        });
      }
    }

    const resumo = montarResumoCompacto({
      treinos: treinosGrandes,
      exercicios: exerciciosGrandes,
      agora,
    });

    expect(resumo.tendencia_e1rm.length).toBeLessThanOrEqual(MAX_TENDENCIA_E1RM);
    // ordenado por volume desc: exercício 39 (maior peso) deve vir primeiro
    expect(resumo.tendencia_e1rm[0]?.exercicio).toBe("Exercicio 39");
  });
});

describe("E1RM_REPS_MAX documentado", () => {
  it("é 12, conforme SDD §D1", () => {
    expect(E1RM_REPS_MAX).toBe(12);
  });
});
