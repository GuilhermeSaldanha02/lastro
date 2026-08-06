// lastro · tarefa 2.1 — refresca a sessão a cada requisição e protege as
// rotas privadas. Sem isso, um Server Component/Server Action pode operar
// com um token de acesso já expirado (o SDK só refresca sozinho no
// navegador) — o padrão é da própria doc do @supabase/ssr para Next.js
// App Router.
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PREFIXOS_PRIVADOS = ["/treino", "/analise"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rotaPrivada = PREFIXOS_PRIVADOS.some((prefixo) =>
    request.nextUrl.pathname.startsWith(prefixo),
  );

  if (!user && rotaPrivada) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("proximo", request.nextUrl.pathname);
    // Carrega os cookies que `setAll` já tenha limpado/atualizado (ex.:
    // refresh token inválido) — sem isso, o navegador manteria um cookie
    // morto e o próximo request repetiria o mesmo erro de refresh
    // indefinidamente, mesmo sendo redirecionado pro login.
    const redirecionamento = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirecionamento.cookies.set(cookie);
    });
    return redirecionamento;
  }

  return response;
}

export const config = {
  // Exclui assets estáticos e o service worker/manifest — nenhum precisa
  // de sessão, e rodar o middleware neles é custo de rede sem propósito.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|icon-512.png|apple-touch-icon.png|manifest.webmanifest|sw.js).*)",
  ],
};
