// lastro · SDD.md §9.3 — criar um modelo de treino novo.
import { listarCatalogo } from "@/lib/dados/treino";
import ModeloTreinoForm from "@/components/modelo-treino-form";
import AbaInferior from "@/components/aba-inferior";
import TituloTela from "@/components/titulo-tela";
import VoltarFlutuante from "@/components/voltar-flutuante";

export default async function PaginaNovoModelo() {
  const exercicios = await listarCatalogo();

  return (
    <main className="tela">
      <VoltarFlutuante href="/ajustes/modelos" rotulo="Modelos de treino" />
      <TituloTela contexto="Ajustes" titulo="Novo modelo" comVoltar />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo">
        <ModeloTreinoForm exercicios={exercicios} />
      </div>

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
