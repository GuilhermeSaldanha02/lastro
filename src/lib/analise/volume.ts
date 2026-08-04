import type { SerieValendo } from "./tipos";

/**
 * Volume de uma série valendo (SDD §D3.5):
 * - unilateral (atributo do EXERCÍCIO): dobra reps x peso.
 * - peso_corporal_incluso: a série não contribui NADA ao volume, nem a
 *   carga externa — volume parcial seria número tecnicamente correto mas
 *   enganoso lado a lado com séries de volume completo.
 */
function volumeDaSerie(serie: SerieValendo): number {
  if (serie.pesoCorporalIncluso) return 0;
  const multiplicador = serie.unilateral ? 2 : 1;
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
