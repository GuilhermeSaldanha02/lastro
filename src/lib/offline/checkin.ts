// lastro · AN-08 A1 — o lado do navegador do check-in: grava na fila local e
// tenta subir. A tela do cartão (próxima PR) chama só isto.
//
// Mesma regra de D6 do registro de série: nada espera resposta de rede. A
// resposta fica no aparelho na hora e sobe quando houver sinal; reenviar é
// seguro porque o servidor faz upsert por (conta, dia).
import type { NovoCheckin } from "@/lib/checkin/escala";
import { enfileirar } from "./outbox";
import { pedirSincronizacaoEmSegundoPlano } from "./sincronizacao-em-segundo-plano";
import { sincronizarPendentes } from "./sincronizar-pendentes";

/**
 * Enfileira o check-in e tenta sincronizar. Devolve se a fila ficou com algo
 * pendente (sem rede, sessão caindo), para a tela poder dizer "salvo no
 * aparelho" em vez de "salvo".
 */
export async function registrarCheckinNaFila(dados: NovoCheckin, usuarioId?: string): Promise<{ pendente: boolean }> {
  await enfileirar("registrar_checkin", dados as unknown as Record<string, unknown>, usuarioId);
  try {
    const resultado = await sincronizarPendentes();
    if (resultado.falhou) void pedirSincronizacaoEmSegundoPlano();
    return { pendente: resultado.falhou };
  } catch {
    void pedirSincronizacaoEmSegundoPlano();
    return { pendente: true };
  }
}
