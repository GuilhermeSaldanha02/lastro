// lastro · limites de uma série espelham as constraints da tabela `serie`
// (supabase/migrations/0001_schema_inicial.sql): `serie_reps_positiva`
// (`reps > 0 and reps <= 200`, `smallint`), `serie_peso_valido`
// (`peso >= 0 and peso <= 1000`) e `serie_rir_valido` (`rir is null or
// (rir >= 0 and rir <= 10)`, `smallint`). Fonte única (P7) pro cliente não
// deixar passar valor que o banco vai rejeitar de qualquer jeito.
//
// Por que isso importa tanto: a série é confirmada na tela ANTES da rede
// (D6) e sobe pela fila offline. Valor que o banco recusa aparecia
// registrado, nunca sincronizava e sumia ao recarregar — e, no build de
// produção, ainda travava a fila inteira atrás dele (achados OF-02 de
// 2026-08-28 para o RIR; A1/A2 e OF-08 de 2026-09-13 para reps 201,
// reps 2,5, peso > 1000, RIR 1,5 e a edição para reps 999). A outra metade
// da correção está em `src/lib/offline/sincronizar-pendentes.ts`.
export const REPS_MINIMO = 1;
export const REPS_MAXIMO = 200;
export const PESO_MINIMO = 0;
export const PESO_MAXIMO = 1000;
export const RIR_MINIMO = 0;
export const RIR_MAXIMO = 10;

export type NumerosDaSerie = { reps: number; peso: number; rir: number | null };

/**
 * Valida os três números de uma série como chegam do formulário (texto do
 * `FormData`). Devolve os números prontos ou a mensagem PT-BR do primeiro
 * problema — a mensagem é chave do dicionário (`t()`), quem chama traduz.
 *
 * RIR só existe em série valendo (`serie_rir_so_valendo`); campo vazio é
 * `null`, nunca `0` — RIR 0 é valor válido e diferente de ausente
 * (KNOWLEDGE.md §1). Aquecimento ignora o campo.
 */
export function validarNumerosDaSerie(entrada: {
  tipo: "aquecimento" | "valendo";
  reps: unknown;
  peso: unknown;
  rir: unknown;
}): ({ ok: true } & NumerosDaSerie) | { ok: false; erro: string } {
  const reps = paraNumero(entrada.reps);
  if (!Number.isInteger(reps) || reps < REPS_MINIMO || reps > REPS_MAXIMO) {
    return { ok: false, erro: "Reps precisa ser um número inteiro entre 1 e 200." };
  }

  const peso = paraNumero(entrada.peso);
  if (!Number.isFinite(peso) || peso < PESO_MINIMO || peso > PESO_MAXIMO) {
    return { ok: false, erro: "Peso precisa estar entre 0 e 1000 kg." };
  }

  let rir: number | null = null;
  if (entrada.tipo === "valendo" && entrada.rir !== null && entrada.rir !== "") {
    rir = paraNumero(entrada.rir);
    if (!Number.isInteger(rir) || rir < RIR_MINIMO || rir > RIR_MAXIMO) {
      return { ok: false, erro: "RIR precisa ser um número inteiro entre 0 e 10." };
    }
  }

  return { ok: true, reps, peso, rir };
}

// Só texto vira número: `Number(null)` daria 0 e passaria por "peso 0".
// Texto vazio segue virando 0, como antes — peso em branco gravando 0 kg é
// o achado B1, decisão separada do dono.
function paraNumero(valor: unknown): number {
  return typeof valor === "string" ? Number(valor) : Number.NaN;
}
