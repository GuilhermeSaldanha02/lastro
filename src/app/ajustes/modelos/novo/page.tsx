// lastro · SDD.md §9.3 — criar um modelo de treino novo.
import { listarCatalogo } from "@/lib/dados/treino";
import ModeloTreinoForm from "@/components/modelo-treino-form";
import AbaInferior from "@/components/aba-inferior";
import CabecalhoPro from "@/components/cabecalho-pro";

export default async function PaginaNovoModelo() {
  const exercicios = await listarCatalogo();

  return (
    <main className="tela">
      <CabecalhoPro
        titulo="Modelos"
        destaque="Novo"
        voltarHref="/ajustes/modelos"
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo">
        <ModeloTreinoForm exercicios={exercicios} />
      </div>

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
