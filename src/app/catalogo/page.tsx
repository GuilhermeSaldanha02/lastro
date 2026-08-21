// lastro · PRD §4.5 — catálogo curado de exercícios com busca e filtros musculares.
import { listarCatalogo } from "@/lib/dados/treino";
import { obterPerfil } from "@/lib/dados/perfil";
import AbaInferior from "@/components/aba-inferior";
import Avatar from "@/components/avatar";
import TituloTela from "@/components/titulo-tela";
import CatalogoInterativo from "@/components/catalogo-interativo";

export default async function PaginaCatalogo() {
  const [exercicios, perfil] = await Promise.all([listarCatalogo(), obterPerfil()]);
  const semDica = exercicios.filter((e) => !e.dicaExecucao).length;

  return (
    <main className="tela">
      <TituloTela
        contexto="Catálogo"
        titulo="Exercícios"
        acessorio={perfil && <Avatar nome={perfil.nome} avatarUrl={perfil.avatarUrl} />}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo transicao-pilula">
        <CatalogoInterativo exercicios={exercicios} semDicaCount={semDica} />
      </div>

      <AbaInferior ativa="catalogo" />
    </main>
  );
}
