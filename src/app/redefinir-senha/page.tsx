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
        <div className="cartao cartao--vidro">
          <FormRedefinirSenha idioma={idioma} />
        </div>
      </div>
    </main>
  );
}
