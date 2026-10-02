import type { CampoCheckin, NotaCheckin } from "./escala";

const QUANTIDADE = ["Nenhuma", "Pouca", "Moderada", "Bastante", "Muita"] as const;
const RESPOSTAS: Record<CampoCheckin, readonly [string, string, string, string, string]> = {
  sono: ["Péssimo", "Ruim", "Regular", "Bom", "Ótimo"],
  energia: QUANTIDADE,
  dor_muscular: QUANTIDADE,
  estresse: ["Baixo", "Leve", "Moderado", "Elevado", "Alto"],
};

/** Descreve a resposta original, sem calcular prontidão ou inverter dor/estresse. */
export function descreverNotaCheckin(campo: CampoCheckin, nota: NotaCheckin | null): string {
  return nota === null ? "Não informado" : RESPOSTAS[campo][nota - 1];
}
