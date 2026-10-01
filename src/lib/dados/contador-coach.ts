/**
 * lastro · AN-08 F0-CUSTO — conta onde o Coach resolveu cada pergunta
 * (migração 20260929034230). Só a contagem do dia por intent e destino: sem
 * usuário e sem o texto da pergunta, para a Política continuar valendo.
 *
 * Nunca derruba a resposta: o contador é medição, e perder uma contagem é
 * melhor do que o usuário ficar sem resposta. Mas é AGUARDADO (não
 * "dispara e esquece"), porque a Vercel pode matar trabalho pendente quando
 * a resposta já saiu.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** O que a rota fez. Espelha o check `destino` da tabela. */
export type DestinoCoach = "local" | "relatorio" | "recusa" | "erro_local" | "gemini" | "limite";

/** Pergunta que não passou pelo roteador (vai ou iria para a Gemini). */
export const INTENT_ABERTA = "ABERTA";

export async function registrarResolucaoCoach(
  supabase: SupabaseClient,
  intent: string,
  destino: DestinoCoach,
): Promise<void> {
  try {
    const { error } = await supabase.rpc("registrar_resolucao_coach", { p_intent: intent, p_destino: destino });
    if (error) console.error(`[contador-coach] falha ao contar ${intent}/${destino}:`, error.message);
  } catch (erro) {
    console.error(`[contador-coach] falha ao contar ${intent}/${destino}:`, erro);
  }
}
