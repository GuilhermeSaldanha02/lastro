// lastro · PRD §4.5 — catálogo curado de exercícios com busca e filtros musculares.
import { listarCatalogo } from "@/lib/dados/treino";
import { obterPerfil } from "@/lib/dados/perfil";
import AbaInferior from "@/components/aba-inferior";
import CabecalhoPro from "@/components/cabecalho-pro";
import CatalogoInterativo from "@/components/catalogo-interativo";

export default async function PaginaCatalogo() {
  const [exercicios, perfil] = await Promise.all([listarCatalogo(), obterPerfil()]);
  const semDica = exercicios.filter((e) => !e.dicaExecucao).length;

  return (
    <main className="tela">
      <CabecalhoPro
        titulo="Catálogo"
        destaque={`${exercicios.length} Exercícios`}
        mostrarLogo={true}
        perfil={perfil}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        <CatalogoInterativo exercicios={exercicios} semDicaCount={semDica} />
      </div>

      <AbaInferior ativa="catalogo" />
    </main>
  );
}
