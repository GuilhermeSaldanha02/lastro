/**
 * lastro · Métricas determinísticas do treino finalizado (Relatório Pós-Treino).
 *
 * Calcula tonelagem total (volume em kg), duração real da sessão,
 * contagem de séries válidas, detalhamento por exercício e PRs do dia.
 */

import { volumeDeSerie } from "@/lib/analise/volume";
import { formatarGrupoMuscular } from "@/lib/texto/grupo-muscular";

/**
 * Duração da SESSÃO em segundos — **definição única**, usada tanto pelo
 * relatório da tela de treino quanto pelo de `/ajustes/relatorios`.
 *
 * POR QUE ESTA FUNÇÃO EXISTE. Os dois relatórios mediam coisas diferentes e
 * por isso nunca batiam (relato de uso real, 2026-09-04): a tela usava o
 * cronômetro ao vivo (`localStorage`, contando desde que o treino foi
 * ABERTO no aparelho) e o servidor reconstruía `última série − primeira
 * série` — que descarta o aquecimento antes da 1ª e tudo depois da última.
 * A diferença era sistemática, não arredondamento.
 *
 * A definição escolhida usa as duas âncoras que **existem no banco** e que
 * os dois lados enxergam igual: `treino.iniciado_em` (migration 0001) e o
 * `criado_em` da última série. Não depende de `localStorage`, então não
 * muda de aparelho para aparelho.
 *
 * Limite conhecido e aceito: o tempo DEPOIS da última série (desmontar,
 * alongar) não entra. Desde a migration 20260924152633 o banco guarda
 * `finalizado_em` e `duracao_segundos`, mas esta definição continua sendo a
 * única dos relatórios e do cronômetro sem marca local — trocar a métrica
 * mudaria números já vistos pelo dono, e isso é decisão dele.
 */
export function duracaoSessaoSegundos(
  iniciadoEmIso: string,
  ultimaSerieEmIso?: string,
): number {
  const inicio = new Date(iniciadoEmIso).getTime();
  const fim = ultimaSerieEmIso ? new Date(ultimaSerieEmIso).getTime() : NaN;
  if (Number.isNaN(inicio) || Number.isNaN(fim)) return 0;
  return Math.max(0, Math.round((fim - inicio) / 1000));
}

/** `criado_em` mais recente entre as séries — o fim da sessão, por ora. */
export function ultimaSerieEm(series: { criadoEm: string }[]): string | undefined {
  let maior: number | undefined;
  let iso: string | undefined;
  for (const s of series) {
    const t = new Date(s.criadoEm).getTime();
    if (Number.isNaN(t)) continue;
    if (maior === undefined || t > maior) {
      maior = t;
      iso = s.criadoEm;
    }
  }
  return iso;
}

export type SerieParaMetricas = {
  id: string;
  exercicioId: string;
  exercicioNome: string;
  reps: number;
  peso: number;
  tipo: "aquecimento" | "valendo";
  pesoPorLado?: boolean;
  /** Reps contadas por lado: dobra o volume, como no agregador. */
  exercicioUnilateral?: boolean;
  ehRecordePessoal?: boolean;
  /** Grupo primário curado do catálogo — nunca inferido pelo nome do exercício. */
  exercicioGrupoMuscular?: string;
};

export type MetricasSessao = {
  duracaoMinutos: number;
  tonelagemTotalKg: number;
  totalSeriesValendo: number;
  totalSeriesAquecimento: number;
  totalExercicios: number;
  exerciciosDetalhados: { exercicioNome: string; totalSeries: number; pesoMaximo: number }[];
  prsBatidos: { exercicioNome: string; reps: number; peso: number }[];
  /** IDs únicos das séries valendo, em minúsculas e na ordem registrada. */
  gruposMuscularesTreinados?: string[];
  focoOuDivisao?: string;
  identificadorTreino?: string;
  fraseAssinatura?: string;
};

export type OpcoesMetricasSessao = {
  focoOuDivisao?: string;
  identificadorTreino?: string;
  fraseAssinatura?: string;
};

export function calcularMetricasSessao(
  series: SerieParaMetricas[],
  iniciadoEmOuSegundos: string | number,
  finalizadoEmIso?: string,
  opcoes?: OpcoesMetricasSessao
): MetricasSessao {
  let duracaoMinutos = 1;
  if (typeof iniciadoEmOuSegundos === "number") {
    duracaoMinutos = Math.max(1, Math.round(iniciadoEmOuSegundos / 60));
  } else {
    const inicio = new Date(iniciadoEmOuSegundos).getTime();
    const fim = finalizadoEmIso ? new Date(finalizadoEmIso).getTime() : Date.now();
    const duracaoMs = Math.max(0, fim - inicio);
    duracaoMinutos = Math.max(1, Math.round(duracaoMs / 60000));
  }

  let tonelagemTotalKg = 0;
  let totalSeriesValendo = 0;
  let totalSeriesAquecimento = 0;
  const exerciciosUnicosValendo = new Set<string>();
  const mapaExercicios = new Map<string, { exercicioNome: string; totalSeries: number; pesoMaximo: number }>();
  const prsBatidos: { exercicioNome: string; reps: number; peso: number }[] = [];
  const gruposMusculares = new Set<string>();

  for (const s of series) {
    const volumeSerie = volumeDeSerie({
      reps: s.reps,
      peso: s.peso,
      unilateral: s.exercicioUnilateral ?? false,
      pesoPorLado: s.pesoPorLado ?? false,
    });

    let ex = mapaExercicios.get(s.exercicioId);
    if (!ex) {
      ex = { exercicioNome: s.exercicioNome, totalSeries: 0, pesoMaximo: 0 };
      mapaExercicios.set(s.exercicioId, ex);
    }
    ex.totalSeries++;
    ex.pesoMaximo = Math.max(ex.pesoMaximo, s.peso);

    if (s.tipo === "valendo") {
      const grupoMuscular = s.exercicioGrupoMuscular?.trim().toLowerCase();
      if (grupoMuscular) gruposMusculares.add(grupoMuscular);
      exerciciosUnicosValendo.add(s.exercicioId);
      totalSeriesValendo++;
      tonelagemTotalKg += volumeSerie;
      
      if (s.ehRecordePessoal) {
        prsBatidos.push({
          exercicioNome: s.exercicioNome,
          reps: s.reps,
          peso: s.peso,
        });
      }
    } else {
      totalSeriesAquecimento++;
    }
  }

  const gruposMuscularesTreinados = Array.from(gruposMusculares);
  const focoOuDivisao = (
    opcoes?.focoOuDivisao ||
    gruposMuscularesTreinados.map((grupo) => formatarGrupoMuscular(grupo)).join(" · ") ||
    "TREINO"
  ).toUpperCase();
  const identificadorTreino = opcoes?.identificadorTreino || "TREINO 404B";
  const fraseAssinatura = opcoes?.fraseAssinatura || "Mais uma sessão no histórico.";

  return {
    duracaoMinutos,
    tonelagemTotalKg: Math.round(tonelagemTotalKg * 10) / 10,
    totalSeriesValendo,
    totalSeriesAquecimento,
    totalExercicios: exerciciosUnicosValendo.size,
    exerciciosDetalhados: Array.from(mapaExercicios.values()),
    prsBatidos,
    gruposMuscularesTreinados,
    focoOuDivisao,
    identificadorTreino,
    fraseAssinatura,
  };
}
