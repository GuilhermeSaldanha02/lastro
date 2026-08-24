import type { SerieValendo } from "./tipos";

/**
 * Volume de uma série valendo (SDD §D3.5). Dois atributos do EXERCÍCIO
 * dobram reps × peso, por razões distintas — e NUNCA compõem entre si
 * (nunca ×2 × ×2, mesmo que um exercício acabe marcado com os dois):
 * - `unilateral`: as reps são contadas por lado.
 * - `pesoPorLado`: o peso registrado é de UM implemento (ex.: um halter
 *   em cada mão), não do par — sem a correção, o volume fica pela metade.
 */
function volumeDaSerie(serie: SerieValendo): number {
  const multiplicador = serie.unilateral || serie.pesoPorLado ? 2 : 1;
  return serie.reps * serie.peso * multiplicador;
}

/** Σ(reps × peso) das séries valendo recebidas (já filtradas para o período desejado). */
export function calcularVolume(series: SerieValendo[]): number {
  return series.reduce((soma, serie) => soma + volumeDaSerie(serie), 0);
}

/** Volume somado por grupo muscular, entre as séries valendo recebidas. */
export function volumePorGrupoMuscular(
  series: SerieValendo[],
): Map<string, number> {
  const porGrupo = new Map<string, number>();
  for (const serie of series) {
    const atual = porGrupo.get(serie.grupoMuscular) ?? 0;
    porGrupo.set(serie.grupoMuscular, atual + volumeDaSerie(serie));
  }
  return porGrupo;
}
