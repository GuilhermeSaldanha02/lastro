/**
 * lastro · DESIGN.md §3.6.6 — "o delta é o CANAL DE TEXTO obrigatório: cada
 * sinal traz a palavra e o número que o identificam. Dois blocos
 * distinguidos só pela cor reprovam o gate." Esta função monta esse texto
 * a partir do bloco de evidência (`src/app/api/analise/evidencia.ts`).
 */
import type { BlocoEvidencia } from "@/app/api/analise/evidencia";

/** 12.7 → "+12,7%". -8.1 → "-8,1%". Vírgula decimal, sinal explícito. */
export function formatarPercentual(valor: number): string {
  const sinal = valor > 0 ? "+" : "";
  return `${sinal}${valor}`.replace(".", ",") + "%";
}

/** 102.5 → "102,5". 80 → "80". Vírgula decimal, sem casa decimal artificial. */
export function formatarPeso(kg: number): string {
  return String(kg).replace(".", ",");
}

export function formatarDelta(bloco: BlocoEvidencia, janelaSemanas: number): string {
  if (bloco.sinal === "alta") return formatarPercentual(bloco.delta_pct);
  if (bloco.sinal === "queda") {
    return `${formatarPercentual(bloco.delta_pct)} em ${janelaSemanas} semanas`;
  }
  // platô: preferir o streak real de estagnacoes quando existir — é mais
  // específico que a janela de comparação inteira.
  const semanas = bloco.semanas_sem_progresso ?? janelaSemanas;
  return `sem mudança há ${semanas} semana${semanas === 1 ? "" : "s"}`;
}
