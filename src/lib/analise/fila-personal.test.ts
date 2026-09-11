import { describe, expect, it } from "vitest";
import { montarFilaDoAluno, type AlertaEmitido } from "./fila-personal";
import {
  DIAS_SEM_ESTIMULO_PARA_ALERTA,
  SEMANAS_ESTAGNACAO,
  TETO_ALERTAS_ALUNO_SEMANA,
} from "./limiares";
import type { ResumoCompacto } from "./tipos";

const SEMANA = "2026-09-07";

/** Resumo mínimo válido — sem sinal nenhum. Cada teste acrescenta o seu. */
function resumoSemSinal(): ResumoCompacto {
  return {
    versao: 1,
    periodo: {
      semana_atual_inicio: SEMANA,
      semanas_com_dados: 4,
      janela_semanas: 4,
    },
    faixa_referencia_series: [10, 20],
    volume_semanal: [
      { semana_inicio: "2026-08-17", volume_total: 5000 },
      { semana_inicio: "2026-08-24", volume_total: 5000 },
      { semana_inicio: "2026-08-31", volume_total: 5000 },
      { semana_inicio: SEMANA, volume_total: 5000 },
    ],
    volume_por_grupo_muscular: [],
    volume_por_exercicio: [],
    tendencia_e1rm: [],
    frequencia: { treinos_semana_atual: 3, grupos_sem_estimulo: [] },
    estagnacoes: [],
    prs: [],
  };
}

function montar(parcial: {
  resumo?: ResumoCompacto;
  recencia?: Array<{ grupo: string; diasSemEstimulo: number }>;
  alertasEmitidos?: AlertaEmitido[];
}) {
  return montarFilaDoAluno({
    resumo: parcial.resumo ?? resumoSemSinal(),
    recencia: parcial.recencia ?? [],
    semanaInicio: SEMANA,
    alertasEmitidos: parcial.alertasEmitidos ?? [],
  });
}

describe("montarFilaDoAluno — seletividade (PRD §11.4.6)", () => {
  it("aluno sem nenhum sinal não gera alerta — silêncio é resposta válida", () => {
    expect(montar({})).toEqual([]);
  });

  /**
   * O MODO DE MORTE NOMEADO PELO P2, literal: "Peito: atenção / Bíceps:
   * atenção / Costas: atenção / Tríceps: atenção — aí sim vira notificação
   * que eu começo a ignorar." Este é o teste que prova que
   * "seletividade é o produto" não é só uma frase no PRD.
   */
  it("aluno com TODOS os grupos parados devolve no máximo o teto, não oito cards", () => {
    const recencia = [
      { grupo: "PEITO", diasSemEstimulo: 30 },
      { grupo: "BICEPS", diasSemEstimulo: 40 },
      { grupo: "COSTAS", diasSemEstimulo: 50 },
      { grupo: "TRICEPS", diasSemEstimulo: 25 },
      { grupo: "OMBRO", diasSemEstimulo: 60 },
      { grupo: "QUADRICEPS", diasSemEstimulo: 22 },
      { grupo: "GLUTEO", diasSemEstimulo: 35 },
      { grupo: "ABDOMEN", diasSemEstimulo: 28 },
    ];

    const fila = montar({ recencia });

    expect(fila).toHaveLength(TETO_ALERTAS_ALUNO_SEMANA);
    // E são os DOIS PIORES, na ordem certa — cortar no teto sem priorizar
    // seria cortar no acaso.
    expect(fila.map((a) => a.alvo)).toEqual(["OMBRO", "COSTAS"]);
  });

  it("a ordem entre tipos é a da AÇÃO: grupo parado > estagnação > queda de volume", () => {
    const resumo = resumoSemSinal();
    resumo.estagnacoes = [
      { exercicio: "Supino reto", semanas_sem_progresso: SEMANAS_ESTAGNACAO },
    ];
    resumo.volume_semanal = [
      { semana_inicio: "2026-08-17", volume_total: 9000 },
      { semana_inicio: "2026-08-24", volume_total: 7000 },
      { semana_inicio: "2026-08-31", volume_total: 5000 },
      { semana_inicio: SEMANA, volume_total: 3000 },
    ];

    const fila = montar({
      resumo,
      recencia: [{ grupo: "COSTAS", diasSemEstimulo: 25 }],
    });

    expect(fila.map((a) => a.tipo)).toEqual([
      "grupo_sem_estimulo",
      "estagnacao_exercicio",
    ]);
  });

  it("ordem é estável entre chamadas com prioridade empatada", () => {
    const recencia = [
      { grupo: "TRICEPS", diasSemEstimulo: 30 },
      { grupo: "BICEPS", diasSemEstimulo: 30 },
      { grupo: "COSTAS", diasSemEstimulo: 30 },
    ];

    const primeira = montar({ recencia }).map((a) => a.alvo);
    const segunda = montar({ recencia: [...recencia].reverse() }).map(
      (a) => a.alvo,
    );

    expect(primeira).toEqual(segunda);
    expect(primeira).toEqual(["BICEPS", "COSTAS"]);
  });
});

describe("montarFilaDoAluno — tendência, nunca oscilação de uma sessão", () => {
  it("grupo parado abaixo do limiar NÃO entra", () => {
    const fila = montar({
      recencia: [
        { grupo: "PEITO", diasSemEstimulo: DIAS_SEM_ESTIMULO_PARA_ALERTA - 1 },
      ],
    });
    expect(fila).toEqual([]);
  });

  it("grupo parado exatamente no limiar entra", () => {
    const fila = montar({
      recencia: [
        { grupo: "PEITO", diasSemEstimulo: DIAS_SEM_ESTIMULO_PARA_ALERTA },
      ],
    });
    expect(fila).toHaveLength(1);
    expect(fila[0].evidencia).toEqual({
      tipo: "grupo_sem_estimulo",
      diasSemEstimulo: DIAS_SEM_ESTIMULO_PARA_ALERTA,
    });
  });

  it("uma semana ruim no meio de semanas boas NÃO gera queda de volume", () => {
    const resumo = resumoSemSinal();
    resumo.volume_semanal = [
      { semana_inicio: "2026-08-17", volume_total: 9000 },
      { semana_inicio: "2026-08-24", volume_total: 2000 },
      { semana_inicio: "2026-08-31", volume_total: 9000 },
      { semana_inicio: SEMANA, volume_total: 8000 },
    ];
    expect(montar({ resumo })).toEqual([]);
  });

  it("queda contínua nas três transições gera queda de volume, com a evidência calculada", () => {
    const resumo = resumoSemSinal();
    resumo.volume_semanal = [
      { semana_inicio: "2026-08-17", volume_total: 10000 },
      { semana_inicio: "2026-08-24", volume_total: 8000 },
      { semana_inicio: "2026-08-31", volume_total: 6000 },
      { semana_inicio: SEMANA, volume_total: 4000 },
    ];

    const fila = montar({ resumo });

    expect(fila).toHaveLength(1);
    expect(fila[0].alvo).toBe("volume_total");
    expect(fila[0].evidencia).toEqual({
      tipo: "queda_volume",
      semanas: 3,
      volumeInicial: 10000,
      volumeAtual: 4000,
      quedaPct: 60,
    });
  });

  it("histórico curto não gera queda de volume — três quedas exigem quatro semanas", () => {
    const resumo = resumoSemSinal();
    resumo.volume_semanal = [
      { semana_inicio: "2026-08-31", volume_total: 8000 },
      { semana_inicio: SEMANA, volume_total: 2000 },
    ];
    expect(montar({ resumo })).toEqual([]);
  });

  it("volume estável não gera alerta, nem quando é igual em todas as semanas", () => {
    expect(montar({})).toEqual([]);
  });
});

describe("montarFilaDoAluno — supressão no eixo do TEMPO", () => {
  it("o mesmo sinal não volta na semana seguinte", () => {
    const recencia = [{ grupo: "COSTAS", diasSemEstimulo: 30 }];
    const fila = montar({
      recencia,
      alertasEmitidos: [
        { tipo: "grupo_sem_estimulo", alvo: "COSTAS", semanaInicio: "2026-08-31" },
      ],
    });
    expect(fila).toEqual([]);
  });

  it("volta depois da janela de supressão — lembrar não é amolar", () => {
    const recencia = [{ grupo: "COSTAS", diasSemEstimulo: 60 }];
    const fila = montar({
      recencia,
      alertasEmitidos: [
        { tipo: "grupo_sem_estimulo", alvo: "COSTAS", semanaInicio: "2026-08-17" },
      ],
    });
    expect(fila).toHaveLength(1);
    expect(fila[0].alvo).toBe("COSTAS");
  });

  /**
   * A fila é recalculada e regravada a cada abertura da tela. Se a semana
   * corrente contasse como "já foi dito", o alerta suprimiria a si mesmo e
   * o personal que voltasse à tela no mesmo dia veria a fila vazia.
   */
  it("o alerta gravado NESTA semana não suprime a si mesmo", () => {
    const fila = montar({
      recencia: [{ grupo: "COSTAS", diasSemEstimulo: 30 }],
      alertasEmitidos: [
        { tipo: "grupo_sem_estimulo", alvo: "COSTAS", semanaInicio: SEMANA },
      ],
    });
    expect(fila.map((a) => a.alvo)).toEqual(["COSTAS"]);
  });

  it("a supressão é por (tipo, alvo) — outro grupo passa", () => {
    const fila = montar({
      recencia: [
        { grupo: "COSTAS", diasSemEstimulo: 30 },
        { grupo: "PEITO", diasSemEstimulo: 25 },
      ],
      alertasEmitidos: [
        { tipo: "grupo_sem_estimulo", alvo: "COSTAS", semanaInicio: "2026-08-31" },
      ],
    });
    expect(fila.map((a) => a.alvo)).toEqual(["PEITO"]);
  });

  it("suprimir o pior ABRE espaço para o seguinte, em vez de devolver vaga vazia", () => {
    const recencia = [
      { grupo: "OMBRO", diasSemEstimulo: 60 },
      { grupo: "COSTAS", diasSemEstimulo: 50 },
      { grupo: "PEITO", diasSemEstimulo: 40 },
    ];
    const fila = montar({
      recencia,
      alertasEmitidos: [
        { tipo: "grupo_sem_estimulo", alvo: "OMBRO", semanaInicio: "2026-08-31" },
      ],
    });
    expect(fila.map((a) => a.alvo)).toEqual(["COSTAS", "PEITO"]);
  });
});

describe("montarFilaDoAluno — estagnação é transportada, não recalculada", () => {
  it("leva os números que o agregador já calculou", () => {
    const resumo = resumoSemSinal();
    resumo.estagnacoes = [
      {
        exercicio: "Supino reto",
        semanas_sem_progresso: 6,
        e1rm_estavel_em: 102.5,
        volume_estavel_em: 2400,
      },
    ];

    const fila = montar({ resumo });

    expect(fila).toHaveLength(1);
    expect(fila[0]).toMatchObject({
      tipo: "estagnacao_exercicio",
      alvo: "Supino reto",
    });
    expect(fila[0].evidencia).toEqual({
      tipo: "estagnacao_exercicio",
      semanasSemProgresso: 6,
      e1rmEstavelEm: 102.5,
      volumeEstavelEm: 2400,
    });
  });

  it("entre duas estagnações, a mais antiga vem primeiro", () => {
    const resumo = resumoSemSinal();
    resumo.estagnacoes = [
      { exercicio: "Rosca direta", semanas_sem_progresso: 4 },
      { exercicio: "Supino reto", semanas_sem_progresso: 9 },
    ];

    const fila = montar({ resumo });

    expect(fila.map((a) => a.alvo)).toEqual(["Supino reto", "Rosca direta"]);
  });
});
