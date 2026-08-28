// lastro · limites de RIR espelham a constraint `serie_rir_valido` do
// schema (supabase/migrations/0001_schema_inicial.sql: `rir is null or
// (rir >= 0 and rir <= 10)`). Fonte única (P7) pro cliente não deixar
// passar valor que o banco vai rejeitar de qualquer jeito — sem essa
// checagem a série entra na fila offline e nunca sincroniza (achado
// OF-02, QA.md, 2026-08-28): a fila é FIFO e para no primeiro item que
// falha, então um RIR fora da faixa trava toda série registrada depois
// dele, pra sempre, sem nenhum aviso ao usuário.
export const RIR_MINIMO = 0;
export const RIR_MAXIMO = 10;
