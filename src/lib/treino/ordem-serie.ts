/**
 * `ordem` da próxima série de um treino (TR-17, 2026-10-01).
 *
 * Antes era `series.length + 1`: apagar uma série encolhia a lista e a série
 * seguinte repetia uma `ordem` que já existia no banco (Voador e Crucifixo com
 * `ordem = 3`). O carregador ordena por `ordem`, então o empate deixava
 * imprevisíveis a ordem na tela, o "Repetir série" e o descanso real.
 *
 * `ultimaUsada` cobre o caso de duas séries registradas antes de a lista
 * re-renderizar (a lista da closure ainda não tem a primeira).
 */
export function proximaOrdem(
  series: ReadonlyArray<{ ordem: number }>,
  ultimaUsada = 0,
): number {
  let maior = ultimaUsada;
  for (const serie of series) {
    if (serie.ordem > maior) maior = serie.ordem;
  }
  return maior + 1;
}
