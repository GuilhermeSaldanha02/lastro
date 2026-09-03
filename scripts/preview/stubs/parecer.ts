// Stub das Server Actions de "@/lib/dados/parecer" — o módulo real é
// "use server" e arrasta Supabase/next/headers; a bancada só precisa do
// TIPO (import por caminho relativo, que o alias não intercepta, e que
// some no build por ser type-only) e de ações que resolvem sem rede.
import type { ParecerSalvo } from "../../../src/lib/dados/parecer";

export type { ParecerSalvo };

export async function confirmarParecer(id: string): Promise<void> {
  console.log("[bancada] confirmarParecer", id);
}
export async function excluirParecer(id: string): Promise<void> {
  console.log("[bancada] excluirParecer", id);
}
