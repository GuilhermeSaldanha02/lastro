// lastro · backlog C3 — calculadora de anilhas: quanto pôr de cada lado da
// barra pra chegar no peso alvo. Elimina conta de cabeça entre séries
// (cena de uso, DESIGN.md §1: em pé, suado, com pressa). Configurável —
// o inventário de anilhas varia por academia (decisão do dono, 2026-08-13).

export type AnilhaPorLado = { peso: number; quantidade: number };

export type ResultadoCalculadoraAnilhas = {
  porLado: AnilhaPorLado[];
  pesoTotalAlcancado: number;
  /** false quando o inventário disponível não fecha exato no alvo —
   * mostra o mais próximo por baixo, nunca inventa uma anilha que não
   * existe no inventário configurado. */
  exato: boolean;
};

const TOLERANCIA = 0.001;

/**
 * Greedy: da maior anilha pra menor, encaixa o que couber no peso
 * restante de UM lado da barra. Sempre por baixo do alvo — nunca
 * ultrapassa (não faz sentido "quase" o peso pesando mais que o pedido).
 */
export function calcularAnilhas(
  pesoAlvo: number,
  pesoBarra: number,
  anilhasDisponiveis: number[],
): ResultadoCalculadoraAnilhas {
  if (pesoAlvo <= pesoBarra) {
    return {
      porLado: [],
      pesoTotalAlcancado: pesoBarra,
      exato: Math.abs(pesoAlvo - pesoBarra) < TOLERANCIA,
    };
  }

  let pesoPorLado = (pesoAlvo - pesoBarra) / 2;
  const disponiveisOrdenadas = [...new Set(anilhasDisponiveis)]
    .filter((p) => p > 0)
    .sort((a, b) => b - a);

  const porLado: AnilhaPorLado[] = [];
  for (const peso of disponiveisOrdenadas) {
    let quantidade = 0;
    while (pesoPorLado - peso >= -TOLERANCIA) {
      quantidade++;
      pesoPorLado -= peso;
    }
    if (quantidade > 0) porLado.push({ peso, quantidade });
  }

  const somaPorLado = porLado.reduce((soma, a) => soma + a.peso * a.quantidade, 0);
  const pesoTotalAlcancado = pesoBarra + 2 * somaPorLado;

  return {
    porLado,
    pesoTotalAlcancado,
    exato: Math.abs(pesoTotalAlcancado - pesoAlvo) < TOLERANCIA,
  };
}
