import { COBERTURA_RIR_MINIMA, RIR_SERIE_DIFICIL } from "./limiares";
import type { SerieValendo } from "./tipos";

export type ResultadoSeriesDificeis =
  | {
      series_dificeis: {
        total: number;
        series_valendo_com_rir: number;
        series_valendo: number;
      };
      cobertura_rir_insuficiente?: undefined;
    }
  | {
      series_dificeis?: undefined;
      cobertura_rir_insuficiente: {
        series_valendo_com_rir: number;
        series_valendo: number;
      };
    };

/**
 * Série difícil (SDD §D3): RIR ≤ RIR_SERIE_DIFICIL, INCLUI RIR 0.
 * Escopo: as séries valendo recebidas (a chamadora passa só a SEMANA
 * ATUAL — SDD corrigiu o escopo, não é a janela de comparação).
 * RIR ausente nunca conta como difícil, mas permanece no denominador
 * `series_valendo` (D3 — o agregador trata ausência como ausência, não
 * como série fácil).
 * Piso de cobertura: abaixo de COBERTURA_RIR_MINIMA, o campo inteiro some
 * (Regra da Presença) e `cobertura_rir_insuficiente` aparece no lugar.
 */
export function calcularSeriesDificeis(
  series: SerieValendo[],
): ResultadoSeriesDificeis {
  const seriesValendo = series.length;
  const comRir = series.filter((serie) => serie.rir !== undefined);
  const seriesValendoComRir = comRir.length;
  const total = comRir.filter(
    (serie) => (serie.rir as number) <= RIR_SERIE_DIFICIL,
  ).length;

  const cobertura =
    seriesValendo === 0 ? 0 : seriesValendoComRir / seriesValendo;

  if (seriesValendo > 0 && cobertura >= COBERTURA_RIR_MINIMA) {
    return {
      series_dificeis: {
        total,
        series_valendo_com_rir: seriesValendoComRir,
        series_valendo: seriesValendo,
      },
    };
  }

  return {
    cobertura_rir_insuficiente: {
      series_valendo_com_rir: seriesValendoComRir,
      series_valendo: seriesValendo,
    },
  };
}
