import type { SerieValendo } from "./tipos";
import { volumePorGrupoMuscular } from "./volume";

export type GrupoComSeries = { grupo: string; series: number };
export type GrupoComVolume = { grupo: string; volumeKg: number };

/**
 * Distribuição de séries valendo por grupo muscular.
 *
 * Alimenta a aba "Grupos" da Home, que responde à pergunta que o próprio
 * Coach sugere na tela: qual grupo está ficando para trás. É a métrica
 * que substituiu a aba "Cargas" — carga não é somável entre grupos
 * (110 kg de agachamento e 20 kg de rosca não formam uma série
 * comparável), série é.
 *
 * Ordena do mais treinado para o menos, e desempata pelo nome do grupo
 * para a ordem não oscilar entre renderizações com a mesma contagem.
 */
export function calcularSeriesPorGrupo(
  seriesValendo: SerieValendo[],
): GrupoComSeries[] {
  const porGrupo = new Map<string, number>();

  for (const serie of seriesValendo) {
    const grupo = serie.grupoMuscular;
    if (!grupo) continue; // série sem exercício resolvido não vira barra
    porGrupo.set(grupo, (porGrupo.get(grupo) ?? 0) + 1);
  }

  return Array.from(porGrupo, ([grupo, series]) => ({ grupo, series })).sort(
    (a, b) => b.series - a.series || a.grupo.localeCompare(b.grupo),
  );
}

/**
 * Mesma distribuição, mas por volume (kg) em vez de contagem de séries —
 * usa `volumePorGrupoMuscular` (já validada pela Análise Semanal) para não
 * duplicar a aritmética de volume numa segunda fonte de verdade.
 */
export function calcularVolumePorGrupo(
  seriesValendo: SerieValendo[],
): GrupoComVolume[] {
  const porGrupo = volumePorGrupoMuscular(seriesValendo);

  return Array.from(porGrupo, ([grupo, volumeKg]) => ({ grupo, volumeKg }))
    .filter((g) => g.grupo)
    .sort((a, b) => b.volumeKg - a.volumeKg || a.grupo.localeCompare(b.grupo));
}
