// lastro · PU-08 — passo a passo do primeiro login. NÃO é landing page: o
// login segue sendo a porta de entrada; isto só aparece uma vez, para a
// conta nova, depois que ela já entrou. Sem barra inferior (nenhuma aba).
import { redirect } from "next/navigation";
import Onboarding from "@/components/onboarding";
import { CASA_DO_ALUNO, CASA_DO_PERSONAL, exigirTipoEscolhido } from "@/lib/dados/casca";
import { obterPerfil } from "@/lib/dados/perfil";
import { PASSOS_ALUNO, PASSOS_PERSONAL } from "@/lib/guia/conteudo";

export default async function PaginaOnboarding() {
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login");
  exigirTipoEscolhido(perfil);
  const idioma = perfil.idioma ?? "pt-BR";
  const casa = perfil.modo === "trabalho" ? CASA_DO_PERSONAL : CASA_DO_ALUNO;
  if (perfil.onboardingConcluido) redirect(casa);

  return (
    <main className="tela tela--entrada">
      <Onboarding
        idioma={idioma}
        casa={casa}
        passos={perfil.modo === "trabalho" ? PASSOS_PERSONAL : PASSOS_ALUNO}
      />
    </main>
  );
}
