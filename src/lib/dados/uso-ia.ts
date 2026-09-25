/**
 * lastro · consumo diário da cota da Gemini (migrações 0020 e PU-04).
 *
 * A chave da Gemini está no plano GRATUITO (dono, 2026-09-25): 20
 * requisições/dia e 5/minuto para o projeto INTEIRO (`KNOWLEDGE.md` §3.2),
 * divididas entre a Análise Semanal e o Coach 24h e agora entre todas as
 * contas. Este módulo é o único lugar que reserva um pedaço dessa cota.
 *
 * Registra **tentativa**, não sucesso: a cota do Google é consumida pela
 * chamada, mesmo quando ela volta 503.
 *
 * Os números (teto por conta, teto global do dia e do minuto, peso de cada
 * origem) moram na tabela `config_ia`, não aqui: o dono os ajusta por SQL
 * quando mudar de plano, sem deploy. A decisão é da função `reservar_uso_ia`
 * do banco, atômica e serializada entre todas as contas.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

export type OrigemUso = "parecer" | "coach";

/**
 * Por que a reserva foi negada:
 * - `conta`: a própria conta já usou a parte dela hoje;
 * - `global`: a cota do dia de TODO o lastro acabou;
 * - `minuto`: muita gente pedindo ao mesmo tempo (o Google limita por minuto).
 */
export type MotivoRecusa = "conta" | "global" | "minuto";

export type ReservaUso =
  | { ok: true }
  | { ok: false; motivo: MotivoRecusa; limite: number };

const MOTIVOS: readonly MotivoRecusa[] = ["conta", "global", "minuto"];

/**
 * Reserva UMA vaga da cota, de forma atômica: conta e grava na mesma
 * transação do banco. `ok: true` = vaga reservada e o uso JÁ está gravado;
 * `ok: false` = nada foi gravado, e `motivo` diz por quê.
 *
 * `limite` é o teto DA CONTA (o número que a tela mostra), nunca o global.
 *
 * Falha da chamada DEIXA PASSAR — regra de produto desde a 0020: negar a IA
 * por um erro nosso é pior do que gastar uma chamada a mais. Nesse caso o
 * uso não fica gravado. (Se o Google estourar a cota de verdade, a rota já
 * devolve a falha própria dele.)
 */
export async function reservarUso(
  supabase: SupabaseClient,
  origem: OrigemUso,
): Promise<ReservaUso> {
  const { data, error } = await supabase.rpc("reservar_uso_ia", { p_origem: origem });
  if (error || !data || typeof data !== "object") {
    console.error(`[uso-ia] falha ao reservar uso de ${origem}:`, error?.message ?? "resposta vazia");
    return { ok: true };
  }

  const { status, limite } = data as { status?: string; limite?: number };
  if (status === "ok") return { ok: true };
  if (MOTIVOS.includes(status as MotivoRecusa)) {
    return { ok: false, motivo: status as MotivoRecusa, limite: Number(limite ?? 0) };
  }
  console.error(`[uso-ia] status desconhecido ao reservar ${origem}:`, status);
  return { ok: true };
}
