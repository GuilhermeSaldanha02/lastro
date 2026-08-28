import { calcularSeriesDificeis } from "./series-dificeis";
import { JANELA_SEMANAS } from "./limiares";
import { listarSemanas, semanaAnaliseAtual } from "./semanas";
import type { SerieValendo } from "./tipos";

export type SinalDeload = {
  proporcaoDificeisSemanaAtual: number;
  proporcaoDificeisJanelaAnterior: number;
};

/**
 * Aumento mínimo (pontos percentuais, 0–1) na proporção de séries
 * difíceis pra virar alerta — convenção prática, não limiar estatístico:
 * um salto pequeno é ruído de semana a semana, não sinal de fadiga
 * acumulando. Mesmo espírito de `SEMANAS_ESTAGNACAO`/`PLATO_GRAFICO_*`
 * em `limiares.ts`.
 */
const AUMENTO_MINIMO_PARA_ALERTA = 0.3;
/** Abaixo disso, 1-2 séries difíceis por acaso já disparariam o alerta. */
const MINIMO_SERIES_VALENDO_NA_SEMANA = 6;

/**
 * Sinal PASSIVO de possível deload — nunca decide nada sozinho (PRD §5:
 * "o app analisa o que foi feito; não prescreve programa"). Compara a
 * proporção de séries difíceis (RIR ≤ `RIR_SERIE_DIFICIL`, ver
 * `series-dificeis.ts`) da semana ATUAL contra a média das
 * `JANELA_SEMANAS` semanas fechadas anteriores. `null` sempre que faltar
 * dado suficiente pra confiar na leitura — nunca força um sinal com
 * cobertura de RIR fraca (Regra da Presença).
 */
export function avaliarSinalDeload(
  todasSeriesValendo: SerieValendo[],
  agora: Date,
): SinalDeload | null {
  const semanaAtual = semanaAnaliseAtual(agora);
  const semanasComparacao = listarSemanas(semanaAtual, JANELA_SEMANAS);
  const semanasAnteriores = semanasComparacao.filter((s) => s !== semanaAtual);

  const seriesSemanaAtual = todasSeriesValendo.filter(
    (s) => s.semanaInicio === semanaAtual,
  );
  const seriesJanelaAnterior = todasSeriesValendo.filter((s) =>
    semanasAnteriores.includes(s.semanaInicio),
  );

  if (seriesSemanaAtual.length < MINIMO_SERIES_VALENDO_NA_SEMANA) return null;

  const atual = calcularSeriesDificeis(seriesSemanaAtual);
  const anterior = calcularSeriesDificeis(seriesJanelaAnterior);
  if (!atual.series_dificeis || !anterior.series_dificeis) return null;

  const proporcaoDificeisSemanaAtual =
    atual.series_dificeis.total / atual.series_dificeis.series_valendo_com_rir;
  const proporcaoDificeisJanelaAnterior =
    anterior.series_dificeis.total / anterior.series_dificeis.series_valendo_com_rir;

  if (
    proporcaoDificeisSemanaAtual - proporcaoDificeisJanelaAnterior <
    AUMENTO_MINIMO_PARA_ALERTA
  ) {
    return null;
  }

  return { proporcaoDificeisSemanaAtual, proporcaoDificeisJanelaAnterior };
}
