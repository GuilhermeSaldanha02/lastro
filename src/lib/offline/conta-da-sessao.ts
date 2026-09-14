// lastro · qual conta está logada NESTE navegador, para a fila offline só
// enviar os itens dela (achado M1, QA, 2026-09-13 — ver
// `MutacaoPendente.usuarioId` em `db.ts`).
//
// Módulo separado de `sincronizar-pendentes.ts` de propósito: o cliente
// Supabase de navegador exige as variáveis de ambiente, e o teste de
// unidade da sincronização troca só esta função.
import { criarClienteBrowser } from "@/lib/supabase/cliente-browser";

/** Id da conta da sessão local; `null` sem sessão ou se a leitura falhar. */
export async function contaDaSessao(): Promise<string | null> {
  try {
    const { data } = await criarClienteBrowser().auth.getSession();
    return data.session?.user.id ?? null;
  } catch {
    return null;
  }
}
