// lastro · tarefa 2.1 — troca o código do OAuth (Google) por uma sessão.
// Supabase redireciona pra cá depois do consentimento do Google, com
// `?code=...` na URL — padrão PKCE do @supabase/ssr.
import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/cliente-servidor";
import { sincronizarAvatarGoogle } from "@/lib/dados/perfil";
import { PARAM_RETORNO, sanitizarRotaDeRetorno } from "@/lib/rota-de-retorno";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // O parâmetro de retorno vem da URL — a trava contra redirecionamento
  // aberto mora em `@/lib/rota-de-retorno` e é a mesma nas três pontas.
  //
  // Antes lia-se `next`, que ninguém escrevia; o `proxy.ts` escrevia
  // `proximo`, que ninguém lia (Trilha A, item A1). O nome é um só agora.
  //
  // O padrão continua sendo a home ("/"), porta de entrada única do app
  // (2026-08-06): quem entra com Google sem retorno pedido volta pra lá.
  // O que mudou é que um retorno explícito — posto pelo `proxy.ts` quando
  // barrou uma rota privada e carregado pelo `/login` até aqui — vence o
  // padrão, senão quem tenta abrir /analise sem sessão nunca chega lá.
  const proximo = sanitizarRotaDeRetorno(searchParams.get(PARAM_RETORNO));

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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // PROGRESS.md pendência 4 — baixa o avatar do Google pro Storage na
      // primeira vez. Nunca pode derrubar o login: erro aqui (Google fora
      // do ar, 404 na imagem) só deixa o avatar sem foto, não impede a
      // sessão de existir (DECISIONS.md 2026-08-07).
      if (data.user) {
        try {
          await sincronizarAvatarGoogle(supabase, data.user);
        } catch (erroAvatar) {
          console.error("[auth/callback] falha ao sincronizar avatar", erroAvatar);
        }
      }
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
