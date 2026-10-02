/** Geometria dos gráficos por sessão; unidades do viewBox, não pixels de tela. */
export const TOKENS_HISTORICO = {
  largura: 360,
  altura: 170,
  base: 150,
  amplitude: 125,
  grade: { inicio: 8, fim: 352, alturas: [25, 87.5, 150] },
  ponto: { normal: 4, ativo: 6 },
  coluna: { largura: 20, raio: 5 },
} as const;
