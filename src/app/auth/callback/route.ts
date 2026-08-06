// lastro · tarefa 2.1 — troca o código do OAuth (Google) por uma sessão.
// Supabase redireciona pra cá depois do consentimento do Google, com
// `?code=...` na URL — padrão PKCE do @supabase/ssr.
import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const proximo = searchParams.get("next") ?? "/treino";

  if (code) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${proximo}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=auth`);
}
