// lastro · PU-05 — destino do link "Esqueci minha senha".
//
// O link do e-mail passa por `/auth/callback`, que troca o código por uma
// sessão e manda para cá. Sem sessão (link vencido, aberto em outro
// aparelho) o `proxy.ts` já devolve ao login: esta tela só existe para quem
// tem sessão. Não tem barra inferior: nenhuma casca abriu.
import { redirect } from "next/navigation";
import FormRedefinirSenha from "@/components/form-redefinir-senha";
import { obterPerfil } from "@/lib/dados/perfil";

export default async function PaginaRedefinirSenha() {
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login");
  const idioma = perfil.idioma ?? "pt-BR";

  return (
    <main className="tela tela--entrada">
      <div className="entrada">
        {/* UX3-13: a marca, como no login. Sem ela a tela era um cartão solto. */}
        <header className="entrada__marca">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-lastro.png"
            alt="LASTRO"
            className="entrada__logo-img"
            width={150}
            height={150}
          />
        </header>

        <div className="cartao cartao--vidro">
          <FormRedefinirSenha idioma={idioma} />
        </div>
      </div>
    </main>
  );
}
