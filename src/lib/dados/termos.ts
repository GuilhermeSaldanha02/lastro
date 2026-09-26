// lastro · PU-06 — registra que a conta aceitou os Termos e a Política.
"use server";

import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { VERSAO_DOCUMENTOS } from "@/lib/legal/documentos";

/**
 * Grava a versão VIGENTE e o instante. A versão vem do servidor, nunca do
 * cliente: aceitar "a versão que a tela disse" seria aceitar o que o navegador
 * mandar. Sem cookie de reserva como no onboarding: aceite é consentimento, e
 * se a gravação falhar a pessoa vê o erro e tenta de novo, não segue sem
 * registro.
 */
export async function aceitarTermos(): Promise<{ ok: true } | { ok: false; erro: string }> {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, erro: "Sessão expirada. Entre novamente." };

  const { error } = await supabase
    .from("usuario")
    .update({
      termos_versao_aceita: VERSAO_DOCUMENTOS,
      termos_aceitos_em: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("[termos] falha ao gravar aceite:", error.message);
    return { ok: false, erro: "Não foi possível registrar o aceite. Tente de novo." };
  }
  return { ok: true };
}
