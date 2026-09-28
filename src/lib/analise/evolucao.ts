/**
 * A régua de EVOLUÇÃO de um exercício num período (decisão do dono,
 * 2026-09-28, depois do QA em produção). Era "primeira sessão × última":
 * um único treino leve no fim derrubava o número (visto: -72%). Agora é o
 * MELHOR e1RM da primeira metade das sessões contra o MELHOR da segunda
 * metade, em ordem de calendário.
 *
 * Com 2 sessões dá o mesmo que antes (1 × 1). Com número ímpar, a sessão do
 * meio fica na segunda metade: a leitura puxa para o momento mais recente.
 */
export function evolucaoPorMetades(
  e1rmsCronologicos: number[],
): { inicial: number; atual: number } | null {
  if (e1rmsCronologicos.length < 2) return null;
  const meio = Math.floor(e1rmsCronologicos.length / 2);
  const inicial = Math.max(...e1rmsCronologicos.slice(0, meio));
  const atual = Math.max(...e1rmsCronologicos.slice(meio));
  if (inicial <= 0) return null;
  return { inicial, atual };
}
