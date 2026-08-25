// lastro · PRD §4.5 — catálogo curado de exercícios com busca e filtros musculares.
import { listarCatalogo } from "@/lib/dados/treino";
import { obterPerfil } from "@/lib/dados/perfil";
import AbaInferior from "@/components/aba-inferior";
import CabecalhoPro from "@/components/cabecalho-pro";
import CatalogoInterativo from "@/components/catalogo-interativo";
import { t } from "@/lib/texto/i18n";

export default async function PaginaCatalogo() {
  const [exercicios, perfil] = await Promise.all([listarCatalogo(), obterPerfil()]);
  const semDica = exercicios.filter((e) => !e.dicaExecucao).length;
  const idioma = perfil?.idioma ?? "pt-BR";

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Catálogo", idioma)}
        destaque={`${exercicios.length} ${t("Exercícios", idioma)}`}
        mostrarLogo={true}
        perfil={perfil}
        idioma={idioma}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        <CatalogoInterativo exercicios={exercicios} semDicaCount={semDica} idioma={idioma} />
      </div>

      <AbaInferior ativa="catalogo" idioma={idioma} />
    </main>
  );
}
