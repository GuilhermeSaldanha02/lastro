import { TOKENS_STICKER } from "./tokens";

/** Geometria autoral bidimensional: regiões separadas, nunca músculo inferido. */
const SILHUETA = "M68 10 Q80 3 92 10 Q100 17 97 34 L90 47 L90 56 Q113 60 123 72 L131 103 L144 161 L150 186 Q148 194 143 187 L138 170 L132 167 L126 141 L115 113 L112 139 L121 167 L119 208 L111 255 L109 289 L104 324 L114 334 Q116 341 100 340 L90 335 L91 310 L90 271 L81 221 L79 221 L70 271 L69 310 L70 335 L60 340 Q44 341 46 334 L56 324 L51 289 L49 255 L41 208 L39 167 L48 139 L45 113 L34 141 L28 167 L22 170 L17 187 Q12 194 10 186 L16 161 L29 103 L37 72 Q47 60 70 56 L70 47 L63 34 Q60 17 68 10 Z";
type Regiao = { grupo: string; d: string };
const FRENTE: readonly Regiao[] = [
  { grupo: "ombro", d: "M49 64 Q36 65 33 85 L32 99 L45 102 L52 84 Z M111 64 Q124 65 127 85 L128 99 L115 102 L108 84 Z" },
  { grupo: "peito", d: "M54 69 L77 71 L77 102 Q63 110 49 99 L49 82 Z M106 69 L83 71 L83 102 Q97 110 111 99 L111 82 Z" },
  { grupo: "biceps", d: "M32 105 L43 107 L39 126 L32 143 L25 139 Z M128 105 L117 107 L121 126 L128 143 L135 139 Z" },
  { grupo: "antebraco", d: "M24 144 L32 149 L24 168 L17 179 L15 170 Z M136 144 L128 149 L136 168 L143 179 L145 170 Z" },
  { grupo: "abdomen", d: "M64 110 L77 111 L77 126 L63 126 Z M83 111 L96 110 L97 126 L83 126 Z M63 131 L77 131 L77 147 L63 145 Z M83 131 L97 131 L97 145 L83 147 Z M64 152 L77 153 L77 170 L69 174 Z M83 153 L96 152 L91 174 L83 170 Z" },
  { grupo: "quadriceps", d: "M47 180 Q57 175 66 184 L70 211 L63 249 L53 251 L48 224 Z M113 180 Q103 175 94 184 L90 211 L97 249 L107 251 L112 224 Z" },
  { grupo: "adutor", d: "M69 181 L77 183 L76 213 L68 242 L65 224 Z M91 181 L83 183 L84 213 L92 242 L95 224 Z" },
  { grupo: "abdutor", d: "M44 158 L56 164 L49 183 L43 190 Z M116 158 L104 164 L111 183 L117 190 Z" },
  { grupo: "panturrilha", d: "M54 266 L63 263 L66 287 L61 315 L57 308 Z M106 266 L97 263 L94 287 L99 315 L103 308 Z" },
];
const COSTAS: readonly Regiao[] = [
  { grupo: "trapezio", d: "M69 57 L78 60 L78 94 L58 76 Z M91 57 L82 60 L82 94 L102 76 Z" },
  { grupo: "ombro", d: "M49 65 Q35 69 33 86 L32 99 L45 102 L51 85 Z M111 65 Q125 69 127 86 L128 99 L115 102 L109 85 Z" },
  { grupo: "costas", d: "M53 81 L76 99 L76 137 L63 145 L49 112 Z M107 81 L84 99 L84 137 L97 145 L111 112 Z" },
  { grupo: "triceps", d: "M32 105 L43 107 L39 126 L32 143 L25 139 Z M128 105 L117 107 L121 126 L128 143 L135 139 Z" },
  { grupo: "antebraco", d: "M24 144 L32 149 L24 168 L17 179 L15 170 Z M136 144 L128 149 L136 168 L143 179 L145 170 Z" },
  { grupo: "lombar", d: "M66 141 L77 142 L77 166 L62 163 Z M94 141 L83 142 L83 166 L98 163 Z" },
  { grupo: "gluteo", d: "M49 172 Q66 164 77 173 L77 194 Q65 204 46 196 Z M111 172 Q94 164 83 173 L83 194 Q95 204 114 196 Z" },
  { grupo: "posterior_coxa", d: "M47 202 Q64 211 76 199 L69 229 L64 254 L53 254 Z M113 202 Q96 211 84 199 L91 229 L96 254 L107 254 Z" },
  { grupo: "panturrilha", d: "M54 263 Q67 259 66 280 L62 308 L57 310 L53 288 Z M106 263 Q93 259 94 280 L98 308 L103 310 L107 288 Z" },
];

/** A Home reutiliza exatamente as regiões do sticker, sem alterar o desenho exportado. */
export const GEOMETRIA_ANATOMIA = { silhueta: SILHUETA, frente: FRENTE, costas: COSTAS } as const;

export function desenharAnatomia(grupos: readonly string[], ouro: string, base: string, escape: (texto: string) => string): string {
  const ativos = new Set(grupos);
  const a = TOKENS_STICKER.anatomia;
  function vista(nome: string, regioes: readonly Regiao[], x: number) {
    const segmentos = regioes.map(({ grupo, d }) => {
      const ativo = ativos.has(grupo);
      return `<path data-grupo="${grupo}" data-ativo="${ativo}" d="${d}" fill="${escape(ativo ? ouro : base)}" fill-opacity="${ativo ? 1 : a.opacidadeInativa}" stroke="${escape(base)}" stroke-width="${a.contorno}"/>`;
    }).join("");
    return `<g data-vista="${nome}" transform="translate(${x} 0) scale(${a.larguraVista / a.larguraBase})"><path d="${SILHUETA}" fill="none" stroke="${escape(base)}" stroke-width="${a.contorno}"/>${segmentos}</g>`;
  }
  return vista("frente", FRENTE, 0) + vista("costas", COSTAS, a.larguraVista + a.intervalo);
}
