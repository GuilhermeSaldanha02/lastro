// lastro · A escolha do tipo de conta de quem entrou pelo Google.
//
// Regra do dono (PRD §11, emenda 2026-09-13): o tipo é escolhido no
// nascimento da conta e não muda. O cadastro por e-mail escolhe na cápsula;
// o Google não passa por ela, então a escolha acontece aqui, logo depois do
// primeiro login. Se for PERSONAL, CREF e WhatsApp são obrigatórios nesta
// mesma tela — não existe "personal para completar depois" saindo daqui.
//
// Não tem barra inferior: nenhuma casca abriu ainda.
import { redirect } from "next/navigation";
import CabecalhoPro from "@/components/cabecalho-pro";
import EscolhaTipoConta from "@/components/escolha-tipo-conta";
import { obterPerfil } from "@/lib/dados/perfil";
import { t } from "@/lib/texto/i18n";

export default async function PaginaBoasVindas() {
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login");
  const idioma = perfil.idioma ?? "pt-BR";
  // Já escolheu: a escolha não se refaz. A função do banco recusa também
  // (`tipo já escolhido`).
  if (perfil.tipoEscolhido) redirect(perfil.modo === "trabalho" ? "/personal" : "/");

  return (
    <main className="tela">
      <CabecalhoPro titulo={t("Boas-vindas", idioma)} destaque={t("Sua conta", idioma)} perfil={perfil} idioma={idioma} />

      <div className="corpo corpo--titulo-conteudo transicao-pilula">
        <div className="pilha">
          <EscolhaTipoConta idioma={idioma} />
        </div>
      </div>
    </main>
  );
}
