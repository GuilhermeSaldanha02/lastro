// lastro · tarefa 2.1 — troca o código do OAuth (Google) por uma sessão.
// Supabase redireciona pra cá depois do consentimento do Google, com
// `?code=...` na URL — padrão PKCE do @supabase/ssr.
import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // `next` vem da URL — só aceita caminho relativo. Sem esta trava, um
  // link forjado (`?next=//site-malicioso`) transformaria o callback num
  // redirecionamento aberto, usando o domínio do lastro como fachada.
  //
  // A home ("/") é a porta de entrada única do app (2026-08-06) — login
  // com Google também volta pra lá, não direto pro treino.
  const bruto = searchParams.get("next") ?? "/";
  const proximo = bruto.startsWith("/") && !bruto.startsWith("//")
    ? bruto
    : "/";

  /**
   * Na Vercel o app roda atrás de um balanceador: `new URL(request.url).origin`
   * traz o host interno, não o domínio público. Redirecionar pro host errado
   * descarta os cookies de sessão recém-criados (eles pertencem ao domínio
   * público), e o dono cai de volta na tela de login como se nada tivesse
   * acontecido — exatamente o sintoma relatado no teste em celular
   * (2026-08-06). `x-forwarded-host` carrega o domínio original; em
   * desenvolvimento não há balanceador, então `origin` já está certo.
   * Padrão da doc oficial do Supabase para Next.js.
   */
  function destino(caminho: string): string {
    const hostEncaminhado = request.headers.get("x-forwarded-host");
    if (process.env.NODE_ENV === "development" || !hostEncaminhado) {
      return `${origin}${caminho}`;
    }
    return `https://${hostEncaminhado}${caminho}`;
  }

  if (code) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(destino(proximo));
    }
    console.error("[auth/callback] falha ao trocar código por sessão", {
      mensagem: error.message,
      status: error.status,
    });
    return NextResponse.redirect(destino("/login?erro=troca"));
  }

  const descricaoDoProvedor = searchParams.get("error_description");
  console.error("[auth/callback] chamado sem código", {
    erro: searchParams.get("error"),
    descricao: descricaoDoProvedor,
  });
  return NextResponse.redirect(destino("/login?erro=sem-codigo"));
}
