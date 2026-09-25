// lastro · PU-07 — grava um erro de produção em `erro_app`.
//
// Só o servidor chama isto (service_role: a tabela não tem policy nenhuma,
// então nem a própria conta lê ou escreve nela). NUNCA importar de Client
// Component — mesmo limite de `supabase/cliente-admin.ts`.
//
// Regra de ouro: monitorar não pode derrubar o que monitora. Toda falha aqui
// é engolida (só `console.error`), e um teto por hora impede que um erro em
// laço (ou alguém batendo em `/api/erros`) encha o banco.
import { criarClienteAdmin } from "@/lib/supabase/cliente-admin";
import { sanitizarErro, type EntradaErro } from "./sanitizar";

/** Teto global de linhas por hora. Passou disso, o resto é descartado (fica no log da Vercel). */
export const TETO_POR_HORA = 300;
/** Teto por conta por minuto, para o relato vindo do navegador. */
export const TETO_POR_CONTA_POR_MINUTO = 10;

export async function registrarErro(
  origem: "servidor" | "cliente",
  entrada: EntradaErro,
  usuarioId: string | null = null,
): Promise<void> {
  try {
    const admin = criarClienteAdmin();

    const umaHoraAtras = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("erro_app")
      .select("id", { count: "exact", head: true })
      .gte("criado_em", umaHoraAtras);
    if ((count ?? 0) >= TETO_POR_HORA) return;

    if (usuarioId) {
      const umMinutoAtras = new Date(Date.now() - 60 * 1000).toISOString();
      const { count: daConta } = await admin
        .from("erro_app")
        .select("id", { count: "exact", head: true })
        .eq("usuario_id", usuarioId)
        .gte("criado_em", umMinutoAtras);
      if ((daConta ?? 0) >= TETO_POR_CONTA_POR_MINUTO) return;
    }

    const { error } = await admin
      .from("erro_app")
      .insert({ origem, usuario_id: usuarioId, ...sanitizarErro(entrada) });
    if (error) console.error("[monitoramento] falha ao gravar erro:", error.message);
  } catch (falha) {
    console.error("[monitoramento] falha ao gravar erro:", falha);
  }
}
