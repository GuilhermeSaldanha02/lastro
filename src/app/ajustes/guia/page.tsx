// lastro · PU-09 — o manual completo do app, sempre acessível. Diferente do
// onboarding (PU-08, aparece uma vez na conta nova), esta tela é consulta:
// índice no topo e uma seção por assunto. O texto mora em `lib/guia/manual.ts`.
import Link from "next/link";
import { redirect } from "next/navigation";
import AbaInferior from "@/components/aba-inferior";
import CabecalhoPro from "@/components/cabecalho-pro";
import { cascaDaBarra, exigirTipoEscolhido } from "@/lib/dados/casca";
import { obterPerfil } from "@/lib/dados/perfil";
import { SECOES_GUIA, SECOES_GUIA_PERSONAL } from "@/lib/guia/manual";
import { t } from "@/lib/texto/i18n";

export default async function PaginaGuia() {
  const perfil = await obterPerfil();
  if (!perfil) redirect("/login?proximo=/ajustes/guia");
  exigirTipoEscolhido(perfil);
  const idioma = perfil.idioma ?? "pt-BR";

  // A área de trabalho é de quem nasceu personal; usuário nunca vê essas seções.
  const secoes =
    perfil.tipoConta === "personal" ? [...SECOES_GUIA_PERSONAL, ...SECOES_GUIA] : SECOES_GUIA;

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Como usar o lastro", idioma)}
        destaque={t("Manual", idioma)}
        voltarHref="/ajustes"
        perfil={perfil}
        idioma={idioma}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        <div className="pilha">
          <nav aria-label={t("Índice", idioma)}>
            <h2 className="doc__secao">{t("Índice", idioma)}</h2>
            <ol>
              {secoes.map((secao) => (
                <li key={secao.id}>
                  <a href={`#${secao.id}`}>{t(secao.titulo, idioma)}</a>
                </li>
              ))}
            </ol>
          </nav>

          {secoes.map((secao) => (
            <section key={secao.id} id={secao.id}>
              <h2 className="doc__secao">{t(secao.titulo, idioma)}</h2>
              {secao.paragrafos.map((p) => (
                <p key={p}>{t(p, idioma)}</p>
              ))}
              {secao.link && (
                <Link href={secao.link.href} className="botao-secundario">
                  {t(secao.link.rotulo, idioma)}
                </Link>
              )}
            </section>
          ))}
        </div>
      </div>

      <AbaInferior ativa="ajustes" idioma={idioma} tipoConta={cascaDaBarra(perfil)} />
    </main>
  );
}
