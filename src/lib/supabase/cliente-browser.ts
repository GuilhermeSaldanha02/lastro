// lastro · SDD.md §3.1 — cliente Supabase de navegador.
// E12: assinatura confirmada em @supabase/ssr via context7 (2026-08-04),
// biblioteca /supabase/ssr — createBrowserClient(url, anonKey) sem opção
// de cookies obrigatória (o browser lida com cookies nativamente).
import { createBrowserClient } from "@supabase/ssr";

function envObrigatoria(nome: string, valor: string | undefined): string {
  if (!valor) {
    throw new Error(
      `Variável de ambiente ${nome} ausente — configure .env.local (ver .env.example).`,
    );
  }
  return valor;
}

export function criarClienteBrowser() {
  return createBrowserClient(
    envObrigatoria("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    envObrigatoria(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  );
}
