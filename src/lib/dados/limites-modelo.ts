// lastro · limites do plano de um exercício no modelo de treino espelham as
// constraints de `modelo_treino_exercicio`
// (supabase/migrations/0015_modelo_treino_reps_peso.sql): `reps is null or
// (reps > 0 and reps <= 100)` em `smallint`, e `peso is null or (peso >= 0
// and peso <= 1000)`. Não são os limites da série (reps até 200, ver
// `limites-serie.ts`): o plano é mais estreito.
//
// Achado M4 (QA, 2026-09-13): o formulário convertia o campo com um
// "positivo e finito" e mandava reps 150, reps 2,5 ou peso 1000,5 para o
// banco, que recusava — depois de o cabeçalho do modelo já estar gravado.
export const REPS_MAXIMO_PLANO = 100;
export const PESO_MAXIMO_PLANO = 1000;

export type PlanoLido = { reps: number | null; peso: number | null };

/**
 * Lê o plano como foi DIGITADO (texto dos campos). Vazio, zero ou não
 * numérico = `null`, o estado honesto de "não cadastrado" (ADR-010), nunca
 * 0 — igual ao comportamento de antes. Número fora da faixa do banco é
 * recusado com a mensagem PT-BR (chave de `t()`, quem chama traduz).
 */
export function lerPlanoDoModelo(
  texto: { reps?: string; peso?: string } | undefined,
): ({ ok: true } & PlanoLido) | { ok: false; erro: string } {
  const reps = numeroOuNulo(texto?.reps);
  if (reps !== null && (!Number.isInteger(reps) || reps > REPS_MAXIMO_PLANO)) {
    return { ok: false, erro: "Reps do plano precisa ser um número inteiro entre 1 e 100." };
  }

  const peso = numeroOuNulo(texto?.peso);
  if (peso !== null && peso > PESO_MAXIMO_PLANO) {
    return { ok: false, erro: "Peso do plano precisa estar entre 0 e 1000 kg." };
  }

  return { ok: true, reps, peso };
}

function numeroOuNulo(valor: string | undefined): number | null {
  if (valor === undefined || valor.trim() === "") return null;
  const n = Number(valor.replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}
