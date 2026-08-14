// lastro · backlog C3 — configurar anilhas + calculadora.
import { obterConfigAnilhas } from "@/lib/dados/config-anilhas";
import AnilhasForm from "@/components/anilhas-form";
import AbaInferior from "@/components/aba-inferior";

export default async function PaginaAnilhas() {
  const config = await obterConfigAnilhas();

  return (
    <main className="tela">
      <header className="barra-topo">
        <div className="barra-topo__acoes">
          <div className="barra-topo__info">
            <p className="barra-topo__contexto">Ajustes</p>
            <h1 className="barra-topo__titulo">Anilhas</h1>
          </div>
        </div>
      </header>

      <div className="corpo corpo--com-nav">
        {config ? (
          <AnilhasForm configInicial={config} />
        ) : (
          <p className="vazio">Entre para configurar suas anilhas.</p>
        )}
      </div>

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
