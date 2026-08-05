import { E1RM_REPS_MAX } from "./limiares";

/**
 * e1RM (SDD §D1) — fórmula de Epley, com identidade em 1 rep.
 * `reps === 1` usa o peso puro: Epley cru infla uma single verdadeira em
 * ~3,3% (100kg -> 103,3kg), o que é mentira numérica para uma marca já
 * conhecida com exatidão.
 * Valor em precisão plena — arredondamento só na borda de saída
 * (ver `agregar.ts`), para que um `Math.max` entre e1RMs não dependa de
 * arredondamento intermediário.
 */
export function calcularE1rm(reps: number, peso: number): number {
  if (reps === 1) return peso;
  return peso * (1 + reps / 30);
}

/**
 * Teto de reps (SDD §D1): acima de `E1RM_REPS_MAX` a série mede
 * resistência muscular, não força máxima — reportar e1RM seria mentira
 * numérica. A série continua elegível para volume/frequência/série
 * difícil; só o e1RM some (Regra da Presença).
 */
export function elegivelParaE1rm(reps: number): boolean {
  return reps <= E1RM_REPS_MAX;
}
