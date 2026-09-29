import { describe, expect, it } from "vitest";
import { achatarSeriesValendo, montarResumoCompacto } from "@/lib/analise/agregar";
import { paraDataUTC } from "@/lib/analise/semanas";
import type { ExercicioBruto, TreinoBruto } from "@/lib/analise/tipos";
import type { Idioma } from "@/lib/dados/idioma";
import { responder, textoDeRecusa, type ContextoResposta } from "./responder";

// Quarta, 30/09/2026. A semana em andamento começa na segunda, 28/09.
const HOJE = "2026-09-30";

const EXERCICIOS: ExercicioBruto[] = [
  { id: "supino", nome: "Supino reto", grupoMuscularPrimario: "Peito", unilateral: false, pesoPorLado: false },
  { id: "remada", nome: "Remada", grupoMuscularPrimario: "Costas", unilateral: false, pesoPorLado: false },
  { id: "bulgaro", nome: "Búlgaro", grupoMuscularPrimario: "Quadríceps", unilateral: true, pesoPorLado: false },
];

let seq = 0;
function treino(data: string, series: Array<[string, number, number]>): TreinoBruto {
  seq += 1;
  return {
    id: `t${seq}`,
    data,
    series: series.map(([exercicioId, reps, peso], i) => ({
      id: `t${seq}-s${i}`,
      exercicioId,
      tipo: "valendo" as const,
      reps,
      peso,
      pesoPorLado: false,
    })),
  };
}

const TREINOS: TreinoBruto[] = [
  treino("2026-08-20", [["bulgaro", 10, 20]]),
  treino("2026-09-15", [["supino", 10, 45]]),
  treino("2026-09-22", [["supino", 10, 50], ["remada", 10, 40]]),
  treino("2026-09-24", [["supino", 8, 60]]),
  treino("2026-09-29", [["supino", 10, 50], ["remada", 10, 40]]),
  treino("2026-09-30", [["remada", 12, 40]]),
];

function contexto(parcial: Partial<ContextoResposta> = {}, idioma: Idioma = "pt-BR"): ContextoResposta {
  return {
    series: achatarSeriesValendo(TREINOS, new Map(EXERCICIOS.map((e) => [e.id, e]))),
    resumo: montarResumoCompacto({ treinos: TREINOS, exercicios: EXERCICIOS, agora: paraDataUTC(HOJE) }),
    hojeISO: HOJE,
    metaSemana: null,
    idioma,
    ...parcial,
  };
}

describe("responder", () => {
  it("volume da semana: parcial até hoje, sem percentual contra a semana inteira anterior", () => {
    const texto = responder({ intent: "VOLUME_SEMANA" }, contexto());
    // 29/09: 500 + 400; 30/09: 480 → 1.380 kg em 2 treinos. Semana anterior: 500 + 400 + 480.
    expect(texto).toBe("Nesta semana, até hoje: 1.380 kg em 2 treinos. A semana passada inteira fechou em 1.380 kg.");
    expect(texto).not.toMatch(/%/);
  });

  it("sem série nesta semana diz isso, sem inventar comparação", () => {
    expect(responder({ intent: "VOLUME_SEMANA" }, contexto({ hojeISO: "2026-10-07" }))).toBe(
      "Nenhuma série valendo nesta semana ainda. A semana passada inteira fechou em 1.380 kg.",
    );
  });

  it("grupo com mais volume nesta semana, com as séries", () => {
    expect(responder({ intent: "GRUPO_MAIS_VOLUME" }, contexto())).toBe(
      "Nesta semana, até hoje: Costas 880 kg (2 séries), Peito 500 kg (1 série).",
    );
  });

  it("treinos na semana mostram a meta quando ela existe", () => {
    expect(responder({ intent: "TREINOS_NA_SEMANA" }, contexto({ metaSemana: 4 }))).toBe(
      "Nesta semana, até hoje: 2 treinos. Sua meta é de 4 por semana.",
    );
  });

  it("grupo menos treinado inclui o grupo parado, com a última vez; só grupos já treinados", () => {
    expect(responder({ intent: "GRUPO_MENOS_FREQUENTE" }, contexto())).toBe(
      "Nas últimas 4 semanas, os grupos menos treinados foram: Quadríceps (0 treinos, último há 41 dias), Costas (3 treinos), Peito (4 treinos).",
    );
  });

  it("há quanto tempo não treino um grupo: ontem, e grupo nunca treinado", () => {
    expect(responder({ intent: "DIAS_SEM_GRUPO", grupo: "peito" }, contexto({ nomeGrupoAlvo: "Peito" }))).toBe(
      "Última série valendo de Peito: ontem.",
    );
    expect(responder({ intent: "DIAS_SEM_GRUPO", grupo: "biceps" }, contexto({ nomeGrupoAlvo: "Bíceps" }))).toBe(
      "Você ainda não registrou série valendo de Bíceps.",
    );
  });

  it("volume de um grupo: semana até hoje e a semana passada inteira, sem percentual", () => {
    // Peito: 29/09 10×50. Semana passada: 22/09 10×50 e 24/09 8×60.
    const texto = responder({ intent: "VOLUME_GRUPO", grupo: "peito" }, contexto({ nomeGrupoAlvo: "Peito" }));
    expect(texto).toBe("Peito nesta semana, até hoje: 500 kg em 1 série. Na semana passada inteira: 980 kg em 2 séries.");
    expect(texto).not.toMatch(/%/);
    expect(responder({ intent: "VOLUME_GRUPO", grupo: "quadriceps" }, contexto({ nomeGrupoAlvo: "Quadríceps" }))).toBe(
      "Nenhuma série valendo de Quadríceps nesta semana ainda.",
    );
  });

  it("frequência de um grupo: treinos nas últimas 4 semanas e a última série", () => {
    expect(responder({ intent: "FREQUENCIA_GRUPO", grupo: "peito" }, contexto({ nomeGrupoAlvo: "Peito" }))).toBe(
      "Nas últimas 4 semanas, Peito entrou em 4 treinos. Última série valendo: ontem.",
    );
    expect(
      responder({ intent: "FREQUENCIA_GRUPO", grupo: "quadriceps" }, contexto({ nomeGrupoAlvo: "Quadríceps" })),
    ).toBe("Nas últimas 4 semanas, Quadríceps não entrou em nenhum treino. Última série valendo: há 41 dias.");
    expect(responder({ intent: "FREQUENCIA_GRUPO", grupo: "biceps" }, contexto({ nomeGrupoAlvo: "Bíceps" }))).toBe(
      "Você ainda não registrou série valendo de Bíceps.",
    );
  });

  it("grupo em outro idioma: filtra pelo nome traduzido, não pela chave do banco", () => {
    const traduzidos: Record<string, string> = { Peito: "Chest", Costas: "Back", Quadríceps: "Quadriceps" };
    const exercicios = EXERCICIOS.map((e) => ({ ...e, grupoMuscularPrimario: traduzidos[e.grupoMuscularPrimario] }));
    const series = achatarSeriesValendo(TREINOS, new Map(exercicios.map((e) => [e.id, e])));
    expect(responder({ intent: "VOLUME_GRUPO", grupo: "costas" }, contexto({ series, nomeGrupoAlvo: "Back" }, "en"))).toBe(
      "Back this week so far: 880 kg across 2 sets. All of last week: 400 kg across 1 set.",
    );
    const es = Object.fromEntries(Object.keys(traduzidos).map((k) => [k, k === "Costas" ? "Espalda" : k]));
    const exerciciosEs = EXERCICIOS.map((e) => ({ ...e, grupoMuscularPrimario: es[e.grupoMuscularPrimario] }));
    const seriesEs = achatarSeriesValendo(TREINOS, new Map(exerciciosEs.map((e) => [e.id, e])));
    expect(
      responder({ intent: "FREQUENCIA_GRUPO", grupo: "costas" }, contexto({ series: seriesEs, nomeGrupoAlvo: "Espalda" }, "es")),
    ).toBe("En las últimas 4 semanas, Espalda estuvo en 3 entrenamientos. Última serie válida: hoy.");
  });

  it("semanas seguidas com treino, contando a semana em andamento", () => {
    // Semanas de 14/09, 21/09 e 28/09 com treino; a de 07/09 vazia.
    expect(responder({ intent: "SEMANAS_SEGUIDAS" }, contexto())).toBe(
      "3 semanas seguidas com pelo menos 1 treino, contando esta.",
    );
    // Segunda, 05/10: a semana nova ainda sem treino não quebra.
    expect(responder({ intent: "SEMANAS_SEGUIDAS" }, contexto({ hojeISO: "2026-10-05" }))).toBe(
      "3 semanas seguidas com pelo menos 1 treino, até a semana passada. Nesta semana ainda não há treino.",
    );
    expect(responder({ intent: "SEMANAS_SEGUIDAS" }, contexto({ hojeISO: "2026-10-14" }))).toBe(
      "Sem sequência de semanas: a semana passada ficou sem treino, e esta ainda não tem.",
    );
  });

  it("meta cumprida: semanas fechadas desde o primeiro treino, e a atual à parte", () => {
    // Primeiro treino na semana de 17/08: 6 semanas fechadas até a de 21/09; só a de 21/09 teve 2 treinos.
    expect(responder({ intent: "META_CUMPRIDA" }, contexto({ metaSemana: 2 }))).toBe(
      "Meta de 2 treinos por semana: cumprida em 1 das últimas 6 semanas fechadas. Nesta semana, até hoje: 2 de 2.",
    );
    expect(responder({ intent: "META_CUMPRIDA" }, contexto({ metaSemana: 2 }, "en"))).toBe(
      "Goal of 2 workouts per week: met in 1 of the last 6 closed weeks. This week so far: 2 of 2.",
    );
    expect(responder({ intent: "META_CUMPRIDA" }, contexto())).toBe(
      "Você ainda não definiu uma meta semanal. Ela fica em Ajustes.",
    );
  });

  it("frequência compara a semana fechada com a média, sem chamar uma semana de tendência", () => {
    expect(responder({ intent: "FREQUENCIA_COMPARADA" }, contexto())).toBe(
      "Na última semana fechada foram 2 treinos, contra média de 1 nas semanas anteriores com treino. Uma semana sozinha não é tendência.",
    );
  });

  it("sequência de dias", () => {
    expect(responder({ intent: "SEQUENCIA_DIAS" }, contexto())).toBe(
      "2 dias seguidos de treino, contando até hoje ou ontem.",
    );
    expect(responder({ intent: "SEQUENCIA_DIAS" }, contexto({ hojeISO: "2026-10-05" }))).toBe(
      "Sem sequência ativa: o último treino não foi hoje nem ontem.",
    );
  });

  it("resumo da semana é a mesma leitura determinística da Análise", () => {
    expect(responder({ intent: "RESUMO_SEMANA" }, contexto())).toMatch(/^Semana de /);
  });

  it("sem série nenhuma, qualquer pergunta de dados diz isso", () => {
    expect(responder({ intent: "TREINOS_NA_SEMANA" }, contexto({ series: [] }))).toBe(
      "Você ainda não registrou nenhuma série valendo.",
    );
  });

  it("responde no idioma da conta", () => {
    expect(responder({ intent: "TREINOS_NA_SEMANA" }, contexto({}, "en"))).toBe("This week so far: 2 workouts.");
    expect(responder({ intent: "TREINOS_NA_SEMANA" }, contexto({}, "es"))).toBe(
      "Esta semana, hasta hoy: 2 entrenamientos.",
    );
  });
});

describe("textoDeRecusa", () => {
  it("prescrição aponta para a Análise, ou para o personal sob vínculo", () => {
    expect(textoDeRecusa("PRESCRICAO", "pt-BR", false)).toMatch(/Análise/);
    expect(textoDeRecusa("PRESCRICAO", "pt-BR", true)).toMatch(/personal/);
    expect(textoDeRecusa("PRESCRICAO", "pt-BR", true)).not.toMatch(/Análise/);
  });

  it("saúde manda procurar profissional, nos 3 idiomas", () => {
    expect(textoDeRecusa("SAUDE", "pt-BR", false)).toMatch(/fisioterapeuta ou médico/);
    expect(textoDeRecusa("SAUDE", "en", false)).toMatch(/physical therapist/);
    expect(textoDeRecusa("SAUDE", "es", false)).toMatch(/fisioterapeuta/);
  });
});
