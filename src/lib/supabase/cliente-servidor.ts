// lastro · SDD.md §3.1 — cliente Supabase de servidor (route handlers,
// server components, server actions).
//
// E12: assinatura confirmada em @supabase/ssr via context7 (2026-08-04),
// biblioteca /supabase/ssr:
//   - createServerClient usa cookies.getAll()/setAll() (não mais o antigo
//     get/set/remove por cookie individual).
//   - `cookies()` de `next/headers` é assíncrono no Next 16 (App Router) —
//     precisa de `await`. Por isso esta função é `async`.
//   - Em Server Components (onde não é possível escrever cookie), setAll
//     pode falhar silenciosamente ao tentar `.set()`; a lib já emite um
//     warning nesse caso — o try/catch abaixo é o padrão recomendado pela
//     doc para não derrubar a renderização por causa disso (o middleware,
//     fora do escopo desta tarefa — §3.4 —, é quem de fato refresca a
//     sessão).
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function envObrigatoria(nome: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(
      `Variável de ambiente ${nome} ausente — configure .env.local (ver .env.example).`,
    );
  }
  return valor;
}

export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(
    envObrigatoria("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    envObrigatoria(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component — não é possível escrever
            // cookie aqui. Esperado; a lib já loga o warning (ver acima).
          }
        },
      },
    },
  );
}
