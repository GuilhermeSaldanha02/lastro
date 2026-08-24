// lastro · backlog C3 — configurar anilhas + calculadora.
import { obterConfigAnilhas } from "@/lib/dados/config-anilhas";
import { obterPerfil } from "@/lib/dados/perfil";
import AnilhasForm from "@/components/anilhas-form";
import AbaInferior from "@/components/aba-inferior";
import CabecalhoPro from "@/components/cabecalho-pro";
import { t } from "@/lib/texto/i18n";

export default async function PaginaAnilhas() {
  const [config, perfil] = await Promise.all([obterConfigAnilhas(), obterPerfil()]);
  const idioma = perfil?.idioma ?? "pt-BR";

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Ajustes", idioma)}
        destaque={t("Anilhas", idioma)}
        voltarHref="/ajustes"
        idioma={idioma}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo">
        {config ? (
          <AnilhasForm configInicial={config} idioma={idioma} />
        ) : (
          <p className="vazio">{t("Entre para configurar suas anilhas.", idioma)}</p>
        )}
      </div>

      <AbaInferior ativa="ajustes" idioma={idioma} />
    </main>
  );
}
