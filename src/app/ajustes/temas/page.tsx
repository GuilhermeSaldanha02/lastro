// lastro · Personalização de temas e cores
import AbaInferior from "@/components/aba-inferior";
import CabecalhoPro from "@/components/cabecalho-pro";
import SeletorTemas from "@/components/seletor-temas";
import { obterPerfil } from "@/lib/dados/perfil";
import { t } from "@/lib/texto/i18n";

export default async function PaginaTemas() {
  const perfil = await obterPerfil();
  const idioma = perfil?.idioma ?? "pt-BR";

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Ajustes", idioma)}
        destaque={t("Temas", idioma)}
        voltarHref="/ajustes"
        idioma={idioma}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo">
        <SeletorTemas idioma={idioma} />
      </div>

      <AbaInferior ativa="ajustes" idioma={idioma} />
    </main>
  );
}
