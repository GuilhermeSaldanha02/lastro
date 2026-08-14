// lastro · SDD.md §9.3 — criar um modelo de treino novo.
import { listarCatalogo } from "@/lib/dados/treino";
import ModeloTreinoForm from "@/components/modelo-treino-form";
import AbaInferior from "@/components/aba-inferior";

export default async function PaginaNovoModelo() {
  const exercicios = await listarCatalogo();

  return (
    <main className="tela">
      <header className="barra-topo">
        <div className="barra-topo__acoes">
          <div className="barra-topo__info">
            <p className="barra-topo__contexto">Ajustes</p>
            <h1 className="barra-topo__titulo">Novo modelo</h1>
          </div>
        </div>
      </header>

      <div className="corpo corpo--com-nav">
        <ModeloTreinoForm exercicios={exercicios} />
      </div>

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
