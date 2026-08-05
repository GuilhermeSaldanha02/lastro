import { calcularE1rm, elegivelParaE1rm } from "./e1rm";
import { calcularFrequencia } from "./frequencia";
import { calcularEstagnacoes, type ValoresSemanaisExercicio } from "./estagnacao";
import {
  FAIXA_SERIES_SEMANAIS,
  JANELA_SEMANAS,
  LOOKBACK_ESTAGNACAO_SEMANAS,
  MAX_GRUPOS,
  MAX_TENDENCIA_E1RM,
} from "./limiares";
import { calcularPrs, type EntradaPr } from "./prs";
import { calcularSeriesDificeis } from "./series-dificeis";
import { listarSemanas, semanaAnaliseAtual, semanaInicioDoTreino, somarDias, paraDataUTC, paraISO } from "./semanas";
import type {
  ExercicioBruto,
  ResumoCompacto,
  SerieValendo,
  TreinoBruto,
} from "./tipos";
import { calcularVolume, volumePorGrupoMuscular } from "./volume";

function arredondar(valor: number, casas: number): number {
  const fator = 10 ** casas;
  return Math.round(valor * fator) / fator;
}

/**
 * ÚNICO ponto do agregador onde `tipo === 'aquecimento'` é descartado
 * (FF4). Todo módulo downstream recebe apenas o resultado desta função —
 * nunca `TreinoBruto`/`SerieBruta` crus.
 */
function achatarSeriesValendo(
  treinos: TreinoBruto[],
  exerciciosPorId: Map<string, ExercicioBruto>,
): SerieValendo[] {
  const resultado: SerieValendo[] = [];
  for (const treino of treinos) {
    const semanaInicio = semanaInicioDoTreino(treino.data);
    for (const serie of treino.series) {
      if (serie.tipo !== "valendo") continue;
      const exercicio = exerciciosPorId.get(serie.exercicioId);
      if (!exercicio) continue;
      resultado.push({
        treinoId: treino.id,
        exercicioId: serie.exercicioId,
        exercicio: exercicio.nome,
        grupoMuscular: exercicio.grupoMuscularPrimario,
        unilateral: exercicio.unilateral,
        reps: serie.reps,
        peso: serie.peso,
        rir: serie.rir,
        pesoCorporalIncluso: serie.pesoCorporalIncluso,
        data: treino.data,
        semanaInicio,
      });
    }
  }
  return resultado;
}

function posicaoNaFaixa(
  seriesValendo: number,
): "abaixo" | "dentro" | "acima" {
  const [minimo, maximo] = FAIXA_SERIES_SEMANAIS;
  if (seriesValendo < minimo) return "abaixo";
  if (seriesValendo > maximo) return "acima";
  return "dentro";
}

/** e1RM máximo elegível entre séries de uma única sessão (treino) de um exercício — é um MÁXIMO, não média (SDD §D1). */
function e1rmMaximoDaSessao(series: SerieValendo[]): number | undefined {
  const elegiveis = series.filter((s) => elegivelParaE1rm(s.reps));
  if (elegiveis.length === 0) return undefined;
  return Math.max(...elegiveis.map((s) => calcularE1rm(s.reps, s.peso)));
}

export function montarResumoCompacto(entrada: {
  treinos: TreinoBruto[];
  exercicios: ExercicioBruto[];
  agora: Date;
  janelaSemanas?: number;
}): ResumoCompacto {
  const janelaSemanas = entrada.janelaSemanas ?? JANELA_SEMANAS;
  const exerciciosPorId = new Map(entrada.exercicios.map((e) => [e.id, e]));
  const gruposMusculares = Array.from(
    new Set(entrada.exercicios.map((e) => e.grupoMuscularPrimario)),
  );

  const semanaAtual = semanaAnaliseAtual(entrada.agora);
  const semanaAnterior = paraISO(somarDias(paraDataUTC(semanaAtual), -7));
  const semanasComparacao = listarSemanas(semanaAtual, janelaSemanas);
  const semanasAnterioresComparacao = semanasComparacao.filter(
    (s) => s !== semanaAtual,
  );

  // TODAS as séries valendo do histórico completo — necessário para PRs
  // (recorde contra o histórico inteiro, não a janela — SDD §D2).
  const todasSeriesValendo = achatarSeriesValendo(
    entrada.treinos,
    exerciciosPorId,
  );

  const seriesValendoJanela = todasSeriesValendo.filter((s) =>
    semanasComparacao.includes(s.semanaInicio),
  );
  const seriesValendoSemanaAtual = todasSeriesValendo.filter(
    (s) => s.semanaInicio === semanaAtual,
  );
  const seriesValendoSemanaAnterior = todasSeriesValendo.filter(
    (s) => s.semanaInicio === semanaAnterior,
  );

  // ---------- periodo ----------
  const semanasComDados = semanasComparacao.filter((semana) =>
    todasSeriesValendo.some((s) => s.semanaInicio === semana),
  ).length;

  // ---------- volume_semanal ----------
  const volume_semanal = semanasComparacao.map((semana) => ({
    semana_inicio: semana,
    volume_total: arredondar(
      calcularVolume(
        todasSeriesValendo.filter((s) => s.semanaInicio === semana),
      ),
      1,
    ),
  }));

  // ---------- volume_por_grupo_muscular ----------
  const volumeAtualPorGrupo = volumePorGrupoMuscular(seriesValendoSemanaAtual);
  const volumeAnteriorPorGrupo = volumePorGrupoMuscular(
    seriesValendoSemanaAnterior,
  );
  const contagemAtualPorGrupo = new Map<string, number>();
  for (const s of seriesValendoSemanaAtual) {
    contagemAtualPorGrupo.set(
      s.grupoMuscular,
      (contagemAtualPorGrupo.get(s.grupoMuscular) ?? 0) + 1,
    );
  }
  const contagemAnteriorPorGrupo = new Map<string, number>();
  for (const s of seriesValendoSemanaAnterior) {
    contagemAnteriorPorGrupo.set(
      s.grupoMuscular,
      (contagemAnteriorPorGrupo.get(s.grupoMuscular) ?? 0) + 1,
    );
  }

  const volume_por_grupo_muscular = Array.from(volumeAtualPorGrupo.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, MAX_GRUPOS)
    .map(([grupo, volume]) => {
      const seriesValendoGrupo = contagemAtualPorGrupo.get(grupo) ?? 0;
      const volumeAnterior = volumeAnteriorPorGrupo.get(grupo) ?? 0;
      const seriesAnterior = contagemAnteriorPorGrupo.get(grupo) ?? 0;

      const item: ResumoCompacto["volume_por_grupo_muscular"][number] = {
        grupo_muscular: grupo,
        series_valendo: seriesValendoGrupo,
        volume: arredondar(volume, 1),
        posicao_na_faixa: posicaoNaFaixa(seriesValendoGrupo),
      };
      if (seriesAnterior > 0) {
        item.delta_series_pct = arredondar(
          ((seriesValendoGrupo - seriesAnterior) / seriesAnterior) * 100,
          1,
        );
      }
      if (volumeAnterior > 0) {
        item.delta_volume_pct = arredondar(
          ((volume - volumeAnterior) / volumeAnterior) * 100,
          1,
        );
      }
      return item;
    });

  // ---------- tendencia_e1rm ----------
  // Agrupa por exercício -> por sessão (treino), dentro da janela de comparação.
  type Sessao = { data: string; e1rmMaximo: number };
  const sessoesPorExercicio = new Map<string, Sessao[]>();
  const volumeTotalPorExercicioJanela = new Map<string, number>();
  const grupoPorExercicio = new Map<string, string>();
  const nomePorExercicioId = new Map<string, string>();

  const seriesPorExercicioETreino = new Map<string, SerieValendo[]>();
  for (const s of seriesValendoJanela) {
    const chave = `${s.exercicioId}::${s.treinoId}`;
    if (!seriesPorExercicioETreino.has(chave)) {
      seriesPorExercicioETreino.set(chave, []);
    }
    seriesPorExercicioETreino.get(chave)!.push(s);
    grupoPorExercicio.set(s.exercicioId, s.grupoMuscular);
    nomePorExercicioId.set(s.exercicioId, s.exercicio);
    volumeTotalPorExercicioJanela.set(
      s.exercicioId,
      (volumeTotalPorExercicioJanela.get(s.exercicioId) ?? 0) +
        calcularVolume([s]),
    );
  }
  for (const [chave, series] of seriesPorExercicioETreino) {
    const [exercicioId] = chave.split("::");
    const e1rmMaximo = e1rmMaximoDaSessao(series);
    if (e1rmMaximo === undefined) continue;
    if (!sessoesPorExercicio.has(exercicioId)) {
      sessoesPorExercicio.set(exercicioId, []);
    }
    sessoesPorExercicio
      .get(exercicioId)!
      .push({ data: series[0].data, e1rmMaximo });
  }

  const tendencia_e1rm: ResumoCompacto["tendencia_e1rm"] = [];
  for (const [exercicioId, sessoes] of sessoesPorExercicio) {
    if (sessoes.length < 2) continue; // T-E6
    sessoes.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
    const inicial = sessoes[0].e1rmMaximo;
    const atual = sessoes[sessoes.length - 1].e1rmMaximo;
    tendencia_e1rm.push({
      exercicio: nomePorExercicioId.get(exercicioId)!,
      grupo_muscular: grupoPorExercicio.get(exercicioId)!,
      e1rm_atual: arredondar(atual, 1),
      e1rm_inicial: arredondar(inicial, 1),
      delta_pct: arredondar(((atual - inicial) / inicial) * 100, 1),
      sessoes: sessoes.length,
    });
  }
  tendencia_e1rm.sort(
    (a, b) =>
      (volumeTotalPorExercicioJanela.get(
        entrada.exercicios.find((e) => e.nome === b.exercicio)?.id ?? "",
      ) ?? 0) -
      (volumeTotalPorExercicioJanela.get(
        entrada.exercicios.find((e) => e.nome === a.exercicio)?.id ?? "",
      ) ?? 0),
  );
  const tendenciaE1rmFinal = tendencia_e1rm.slice(0, MAX_TENDENCIA_E1RM);

  // ---------- series_dificeis ----------
  const resultadoDificeis = calcularSeriesDificeis(seriesValendoSemanaAtual);

  // ---------- frequencia ----------
  const frequencia = calcularFrequencia({
    seriesValendoJanela,
    semanaAtual,
    semanasAnterioresComparacao,
    gruposMusculares,
  });

  // ---------- estagnacoes ----------
  const semanasLookback = listarSemanas(
    semanaAtual,
    LOOKBACK_ESTAGNACAO_SEMANAS,
  );
  const exerciciosComDadoNoLookback = new Set(
    todasSeriesValendo
      .filter((s) => semanasLookback.includes(s.semanaInicio))
      .map((s) => s.exercicioId),
  );
  const entradasEstagnacao = Array.from(exerciciosComDadoNoLookback).map(
    (exercicioId) => {
      const semanas: ValoresSemanaisExercicio[] = semanasLookback.map(
        (semana) => {
          const seriesDaSemana = todasSeriesValendo.filter(
            (s) => s.exercicioId === exercicioId && s.semanaInicio === semana,
          );
          return {
            semanaInicio: semana,
            e1rm: e1rmMaximoDaSessao(seriesDaSemana),
            // Sem série = sem sessão nesta semana (ausente, não "0 estável"
            // — Regra da Presença; ver estagnacao.ts).
            volume:
              seriesDaSemana.length > 0
                ? calcularVolume(seriesDaSemana)
                : undefined,
          };
        },
      );
      return {
        exercicio: exerciciosPorId.get(exercicioId)?.nome ?? exercicioId,
        semanas,
      };
    },
  );
  const estagnacoes: ResumoCompacto["estagnacoes"] = calcularEstagnacoes(
    entradasEstagnacao,
  ).map((e) => {
    const item: ResumoCompacto["estagnacoes"][number] = {
      exercicio: e.exercicio,
      semanas_sem_progresso: e.semanas_sem_progresso,
    };
    if (e.e1rm_estavel_em !== undefined) {
      item.e1rm_estavel_em = arredondar(e.e1rm_estavel_em, 1);
    }
    if (e.volume_estavel_em !== undefined) {
      item.volume_estavel_em = arredondar(e.volume_estavel_em, 1);
    }
    return item;
  });

  // ---------- prs ----------
  const exerciciosComDadoAlgumaVez = new Set(
    todasSeriesValendo.map((s) => s.exercicioId),
  );
  const semanasHistoricoAntesDaAtual = Array.from(
    new Set(
      todasSeriesValendo
        .filter((s) => s.semanaInicio < semanaAtual)
        .map((s) => s.semanaInicio),
    ),
  );
  const entradasPr: EntradaPr[] = Array.from(exerciciosComDadoAlgumaVez).map(
    (exercicioId) => {
      const seriesAtual = todasSeriesValendo.filter(
        (s) => s.exercicioId === exercicioId && s.semanaInicio === semanaAtual,
      );
      const seriesAnteriores = todasSeriesValendo.filter(
        (s) =>
          s.exercicioId === exercicioId && s.semanaInicio < semanaAtual,
      );

      const e1rmSemanaAtual = e1rmMaximoDaSessao(seriesAtual);
      const e1rmsHistoricos = seriesAnteriores
        .filter((s) => elegivelParaE1rm(s.reps))
        .map((s) => calcularE1rm(s.reps, s.peso));
      const e1rmMaximoHistoricoAnterior =
        e1rmsHistoricos.length > 0 ? Math.max(...e1rmsHistoricos) : undefined;

      const volumeSemanaAtual =
        seriesAtual.length > 0 ? calcularVolume(seriesAtual) : undefined;
      const volumesSemanaisHistoricos = semanasHistoricoAntesDaAtual.map(
        (semana) =>
          calcularVolume(
            seriesAnteriores.filter((s) => s.semanaInicio === semana),
          ),
      );
      const volumeMaximoHistoricoAnterior =
        volumesSemanaisHistoricos.length > 0
          ? Math.max(...volumesSemanaisHistoricos)
          : undefined;

      return {
        exercicio: exerciciosPorId.get(exercicioId)?.nome ?? exercicioId,
        e1rmSemanaAtual,
        e1rmMaximoHistoricoAnterior,
        volumeSemanaAtual,
        volumeMaximoHistoricoAnterior,
      };
    },
  );
  const prs = calcularPrs(entradasPr).map((pr) => ({
    ...pr,
    valor: arredondar(pr.valor, 1),
    valor_anterior: arredondar(pr.valor_anterior, 1),
  }));

  const resumo: ResumoCompacto = {
    versao: 1,
    periodo: {
      semana_atual_inicio: semanaAtual,
      semanas_com_dados: semanasComDados,
      janela_semanas: janelaSemanas,
    },
    faixa_referencia_series: FAIXA_SERIES_SEMANAIS,
    volume_semanal,
    volume_por_grupo_muscular,
    tendencia_e1rm: tendenciaE1rmFinal,
    frequencia,
    estagnacoes,
    prs,
  };

  if (resultadoDificeis.series_dificeis) {
    resumo.series_dificeis = resultadoDificeis.series_dificeis;
  } else if (resultadoDificeis.cobertura_rir_insuficiente) {
    resumo.cobertura_rir_insuficiente = resultadoDificeis.cobertura_rir_insuficiente;
  }

  return resumo;
}
