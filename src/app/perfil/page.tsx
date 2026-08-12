// lastro · sub-tela de Ajustes — editar foto de perfil. Nome é somente
// leitura por ora (fora de escopo — pedido foi upload de foto, não
// edição de nome).
import { obterPerfil } from "@/lib/dados/perfil";
import AbaInferior from "@/components/aba-inferior";
import EditarPerfil from "@/components/editar-perfil";

export default async function PaginaPerfil() {
  const perfil = await obterPerfil();

  return (
    <main className="tela">
      <header className="barra-topo">
        <div className="barra-topo__acoes">
          <div className="barra-topo__info">
            <p className="barra-topo__contexto">Ajustes</p>
            <h1 className="barra-topo__titulo">Perfil</h1>
          </div>
        </div>
      </header>

      <div className="corpo corpo--com-nav">
        {perfil ? (
          <EditarPerfil nome={perfil.nome} avatarUrlInicial={perfil.avatarUrl} />
        ) : (
          <p className="vazio">Entre para editar seu perfil.</p>
        )}
      </div>

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
