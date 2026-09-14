/**
 * lastro · consumo diário da cota da Gemini (migration 0020).
 *
 * A cota do nível gratuito é de 20 requisições/dia (`KNOWLEDGE.md` §3.2) e
 * é **compartilhada** entre a Análise Semanal e o Coach 24h — mesma chave,
 * mesmo projeto. Este módulo é o único lugar que sabe contar e registrar
 * esse consumo, para os dois tetos saírem da mesma fonte.
 *
 * Registra **tentativa**, não sucesso: a cota do Google é consumida pela
 * chamada, mesmo quando ela volta 503.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { dataLocalBrasil } from "@/lib/tempo";

export type OrigemUso = "parecer" | "coach";

/**
 * Tetos por dia, por usuário. Somados dão 15 de 20 — a folga de 5 é
 * deliberada: cobre o retry de 503 (que gasta chamada), a troca de modelo
 * e qualquer chamada de desenvolvimento.
 *
 * O do parecer vem de `DECISIONS.md` 2026-09-05: 5 é o que permite fazer
 * as cinco perguntas padrão do `PRD.md` §3 no mesmo dia. O do coach foi
 * decidido pelo dono em 2026-09-05.
 */
export const TETO_DIARIO: Record<OrigemUso, number> = {
  parecer: 5,
  coach: 10,
};

/**
 * Início do dia LOCAL do Brasil, em ISO. Não é UTC de propósito: às 22h de
 * Brasília já é o dia seguinte em UTC, e a cota renovaria três horas antes
 * da meia-noite do dono.
 */
function inicioDoDiaLocal(): string {
  return `${dataLocalBrasil()}T00:00:00-03:00`;
}

/**
 * Quantas chamadas desta origem o usuário já fez hoje.
 *
 * `null` quando a contagem falha — o chamador deve **deixar passar** nesse
 * caso: negar o uso por causa de um erro nosso é pior do que deixar passar
 * uma chamada a mais.
 */
export async function contarUsoHoje(
  supabase: SupabaseClient,
  usuarioId: string,
  origem: OrigemUso,
): Promise<number | null> {
  const { count, error } = await supabase
    .from("uso_ia")
    .select("id", { count: "exact", head: true })
    .eq("usuario_id", usuarioId)
    .eq("origem", origem)
    .gte("criado_em", inicioDoDiaLocal());

  if (error) {
    console.error(`[uso-ia] falha ao contar uso de ${origem}:`, error.message);
    return null;
  }
  return count ?? 0;
}

/** `true` quando o usuário já bateu o teto desta origem hoje. */
export async function tetoAtingido(
  supabase: SupabaseClient,
  usuarioId: string,
  origem: OrigemUso,
): Promise<boolean> {
  const usadas = await contarUsoHoje(supabase, usuarioId, origem);
  if (usadas === null) return false;
  return usadas >= TETO_DIARIO[origem];
}

/**
 * Reserva UMA vaga da cota de hoje, de forma atômica: conta e grava na
 * mesma transação, na função `consumir_uso_ia` do banco (migração 20260914024607, antiga 0028).
 * `true` = vaga reservada e o uso JÁ está gravado; `false` = teto atingido,
 * nada gravado.
 *
 * Existe porque `tetoAtingido` + `registrarUso` são duas idas ao banco sem
 * nada entre elas: pedidos simultâneos contavam o mesmo número e passavam
 * todos (coach com 12 usos para teto de 10, CI do #251).
 *
 * Falha da chamada DEIXA PASSAR — mesma regra de produto de `tetoAtingido`:
 * negar a IA por um erro nosso é pior do que gastar uma chamada a mais. Nesse
 * caso o uso não fica gravado.
 */
export async function consumirUso(
  supabase: SupabaseClient,
  origem: OrigemUso,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("consumir_uso_ia", {
    p_origem: origem,
    p_teto: TETO_DIARIO[origem],
  });
  if (error) {
    console.error(`[uso-ia] falha ao reservar uso de ${origem}:`, error.message);
    return true;
  }
  return data === true;
}

/**
 * Marca uma chamada consumida. Falha aqui **não** bloqueia a chamada: o
 * dono perder o parecer porque o registro de consumo falhou seria trocar
 * um problema de cota por um problema pior.
 */
export async function registrarUso(
  supabase: SupabaseClient,
  usuarioId: string,
  origem: OrigemUso,
): Promise<void> {
  const { error } = await supabase
    .from("uso_ia")
    .insert({ usuario_id: usuarioId, origem });
  if (error) {
    console.error(`[uso-ia] falha ao registrar uso de ${origem}:`, error.message);
  }
}
