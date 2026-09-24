// lastro · aviso de fim de descanso fora do app (pedido do dono, 2026-09-23).
// Arquivo próprio porque `"use server"` vale para o arquivo inteiro.
//
// As duas ações escrevem SÓ linhas da conta logada, pela RLS (nunca pela
// chave de service role): a inscrição de push deste aparelho e o aviso
// pendente do descanso. Quem dispara é o banco (pg_cron), não estas funções.
//
// Nenhuma das duas lança: o aviso é conveniência. Sem rede, sem sessão ou
// com as tabelas ainda não criadas, o treino segue igual e o bip do próprio
// app continua funcionando.
"use server";

import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";

export type InscricaoPush = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type ResultadoAviso = { ok: true } | { ok: false; motivo: "sessao" | "invalido" | "falha" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/** O descanso mais longo que faz sentido avisar; o resto é dado errado. */
const MAX_SEGUNDOS = 60 * 30;

export async function salvarInscricaoPush(inscricao: InscricaoPush): Promise<ResultadoAviso> {
  if (
    !inscricao?.endpoint?.startsWith("https://") ||
    !inscricao.keys?.p256dh ||
    !inscricao.keys?.auth
  ) {
    return { ok: false, motivo: "invalido" };
  }
  try {
    const supabase = await criarClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, motivo: "sessao" };

    const { error } = await supabase.from("push_inscricao").upsert(
      {
        usuario_id: user.id,
        endpoint: inscricao.endpoint,
        p256dh: inscricao.keys.p256dh,
        auth: inscricao.keys.auth,
      },
      { onConflict: "endpoint" },
    );
    return error ? { ok: false, motivo: "falha" } : { ok: true };
  } catch {
    return { ok: false, motivo: "falha" };
  }
}

export async function removerInscricaoPush(endpoint: string): Promise<ResultadoAviso> {
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
    return { ok: false, motivo: "invalido" };
  }
  try {
    const supabase = await criarClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, motivo: "sessao" };
    const { error } = await supabase
      .from("push_inscricao")
      .delete()
      .eq("usuario_id", user.id)
      .eq("endpoint", endpoint);
    return error ? { ok: false, motivo: "falha" } : { ok: true };
  } catch {
    return { ok: false, motivo: "falha" };
  }
}

/**
 * `segundos` = quanto falta para o descanso acabar; `null` cancela.
 * O horário do disparo é calculado AQUI, pelo relógio do servidor.
 */
export async function agendarAvisoDescanso(
  treinoId: string,
  segundos: number | null,
): Promise<ResultadoAviso> {
  if (!UUID.test(treinoId)) return { ok: false, motivo: "invalido" };
  if (segundos !== null && (!Number.isInteger(segundos) || segundos < 1 || segundos > MAX_SEGUNDOS)) {
    return { ok: false, motivo: "invalido" };
  }
  try {
    const supabase = await criarClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, motivo: "sessao" };

    const { error } =
      segundos === null
        ? await supabase.from("aviso_descanso").delete().eq("usuario_id", user.id)
        : await supabase.from("aviso_descanso").upsert(
            {
              usuario_id: user.id,
              treino_id: treinoId,
              dispara_em: new Date(Date.now() + segundos * 1000).toISOString(),
              enviado_em: null,
            },
            { onConflict: "usuario_id" },
          );
    return error ? { ok: false, motivo: "falha" } : { ok: true };
  } catch {
    return { ok: false, motivo: "falha" };
  }
}
