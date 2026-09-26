// lastro · PU-06 — os Termos e a Política dentro do app, em Ajustes. É a
// consulta permanente: mostra qual versão a conta aceitou e quando, e o texto
// completo. O aceite em si acontece em `/aceite`.
import { redirect } from "next/navigation";
import AbaInferior from "@/components/aba-inferior";
import CabecalhoPro from "@/components/cabecalho-pro";
import { CorpoDocumento } from "@/components/documento-legal";
import { cascaDaBarra, exigirTipoEscolhido } from "@/lib/dados/casca";
import { obterPerfil } from "@/lib/dados/perfil";
import { PRIVACIDADE, TERMOS } from "@/lib/legal/documentos";
import { formatarDataCurta } from "@/lib/tempo";
import { t } from "@/lib/texto/i18n";

export default async function PaginaPoliticas() {
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login?proximo=/ajustes/politicas");
  exigirTipoEscolhido(perfil);
  const idioma = perfil.idioma ?? "pt-BR";

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Termos e privacidade", idioma)}
        destaque={t("Políticas", idioma)}
        voltarHref="/ajustes"
        perfil={perfil}
        idioma={idioma}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        <div className="pilha">
          {perfil.termosAceitosEm && (
            <p className="campo__nota" role="status">
              {t("Você aceitou estes documentos em", idioma)}{" "}
              {formatarDataCurta(perfil.termosAceitosEm.slice(0, 10), idioma)}.
            </p>
          )}
          <nav aria-label={t("Índice", idioma)}>
            <ol>
              <li><a href="#termos">{t("Termos de Uso", idioma)}</a></li>
              <li><a href="#privacidade">{t("Política de Privacidade", idioma)}</a></li>
            </ol>
          </nav>
          <CorpoDocumento documento={TERMOS} id="termos" />
          <CorpoDocumento documento={PRIVACIDADE} id="privacidade" />
        </div>
      </div>

      <AbaInferior ativa="ajustes" idioma={idioma} tipoConta={cascaDaBarra(perfil)} />
    </main>
  );
}
