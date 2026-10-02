type Chamada = { x: number; y: number; lado: "esquerda" | "direita"; rotuloY: number };

/** Coordenadas do SVG existente (160 × 350); chamadas espaçadas para rótulos a 320px. */
export const TOKENS_MAPA_GRUPOS = {
  largura: 360,
  altura: 520,
  compacto: { altura: 380, topoCorpo: 15, intervalo: 95 },
  deslocamentoCorpo: 100,
  topoCorpo: 80,
  fimEsquerda: 102,
  fimDireita: 258,
  marcador: { tamanho: 5, referencia: 4, caminho: "M0 0 L5 2.5 L0 5" },
  frente: {
    ombro: { x: 41, y: 83, lado: "esquerda", rotuloY: 65 },
    peito: { x: 97, y: 88, lado: "direita", rotuloY: 65 },
    biceps: { x: 33, y: 123, lado: "esquerda", rotuloY: 160 },
    antebraco: { x: 23, y: 159, lado: "esquerda", rotuloY: 255 },
    abdomen: { x: 90, y: 137, lado: "direita", rotuloY: 160 },
    abdutor: { x: 112, y: 171, lado: "direita", rotuloY: 255 },
    quadriceps: { x: 58, y: 216, lado: "esquerda", rotuloY: 350 },
    adutor: { x: 87, y: 210, lado: "direita", rotuloY: 350 },
    panturrilha: { x: 101, y: 285, lado: "direita", rotuloY: 445 },
  } satisfies Record<string, Chamada>,
  costas: {
    ombro: { x: 41, y: 83, lado: "esquerda", rotuloY: 65 },
    trapezio: { x: 88, y: 75, lado: "direita", rotuloY: 65 },
    costas: { x: 96, y: 113, lado: "direita", rotuloY: 160 },
    triceps: { x: 33, y: 123, lado: "esquerda", rotuloY: 160 },
    antebraco: { x: 23, y: 159, lado: "esquerda", rotuloY: 255 },
    lombar: { x: 90, y: 153, lado: "direita", rotuloY: 255 },
    gluteo: { x: 61, y: 184, lado: "esquerda", rotuloY: 350 },
    posterior_coxa: { x: 102, y: 228, lado: "direita", rotuloY: 350 },
    panturrilha: { x: 59, y: 285, lado: "esquerda", rotuloY: 445 },
  } satisfies Record<string, Chamada>,
} as const;

export type VistaAnatomia = "frente" | "costas";
export function chamadaGrupo(grupo: string, vista: VistaAnatomia): Chamada | undefined {
  const chamadas = TOKENS_MAPA_GRUPOS[vista];
  return Object.hasOwn(chamadas, grupo) ? (chamadas as Record<string, Chamada>)[grupo] : undefined;
}
