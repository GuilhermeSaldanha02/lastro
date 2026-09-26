// lastro · PU-06 — o aceite dos Termos e da Política, no FIM do texto. Quem
// ainda não aceitou a versão vigente (conta nova, conta antiga, ou texto
// atualizado) cai aqui pelo guarda de `casca.ts`, lê e toca em "Aceito e
// continuar". Sem barra inferior: nenhuma aba abriu. Esta página não chama o
// guarda de aceite (seria um laço).
import { redirect } from "next/navigation";
import AceiteTermos from "@/components/aceite-termos";
import { CorpoDocumento } from "@/components/documento-legal";
import { obterPerfil } from "@/lib/dados/perfil";
import { ESCOLHA_DO_TIPO } from "@/lib/dados/casca";
import { PRIVACIDADE, TERMOS } from "@/lib/legal/documentos";

export default async function PaginaAceite() {
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login?proximo=/aceite");
  if (!perfil.tipoEscolhido) redirect(ESCOLHA_DO_TIPO);
  if (perfil.termosAceitos) redirect("/");
  const idioma = perfil.idioma ?? "pt-BR";

  return (
    <main className="tela">
      <div className="corpo corpo--titulo-conteudo">
        <div className="pilha">
          <CorpoDocumento documento={TERMOS} id="termos" />
          <CorpoDocumento documento={PRIVACIDADE} id="privacidade" />
          <AceiteTermos idioma={idioma} destino="/" />
        </div>
      </div>
    </main>
  );
}
