// lastro · backlog C3 — configurar anilhas + calculadora.
import { obterConfigAnilhas } from "@/lib/dados/config-anilhas";
import AnilhasForm from "@/components/anilhas-form";
import AbaInferior from "@/components/aba-inferior";
import TituloTela from "@/components/titulo-tela";
import VoltarFlutuante from "@/components/voltar-flutuante";

export default async function PaginaAnilhas() {
  const config = await obterConfigAnilhas();

  return (
    <main className="tela">
      <VoltarFlutuante href="/ajustes" rotulo="Ajustes" />
      <TituloTela contexto="Ajustes" titulo="Anilhas" comVoltar />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo">
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
