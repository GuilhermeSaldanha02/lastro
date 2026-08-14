// lastro · backlog C5 — exclusão de conta. Cliente com a service_role key,
// que ignora RLS.
//
// LIMITES DE SEGURANÇA, não negociáveis:
// - NUNCA importado por Client Component nem por qualquer arquivo sem
//   `"use server"` no topo — `SUPABASE_SERVICE_ROLE_KEY` não tem prefixo
//   `NEXT_PUBLIC_`, então o Next não a inclui no bundle do cliente por
//   padrão, mas isso só protege se este arquivo também nunca for
//   importado do lado client.
// - Quem chama este cliente nunca decide QUEM é afetado a partir de um
//   parâmetro vindo do cliente (ex.: um `userId` no corpo da requisição)
//   — o alvo é sempre o usuário já autenticado pela sessão (obtido via
//   `criarClienteServidor().auth.getUser()` ANTES de chamar este
//   arquivo). Ver `src/lib/dados/conta.ts`.
// - Único uso hoje: `auth.admin.deleteUser` — apagar a própria conta.
//   Não usar para nada além disso sem repassar pelo mesmo crivo de
//   segurança (ADR-010).
import { createClient } from "@supabase/supabase-js";

function envObrigatoria(nome: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(
      `Variável de ambiente ${nome} ausente — configure .env.local (ver .env.example).`,
    );
  }
  return valor;
}

export function criarClienteAdmin() {
  return createClient(
    envObrigatoria("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    envObrigatoria("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
