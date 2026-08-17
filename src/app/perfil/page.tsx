// lastro · sub-tela de Ajustes — editar foto de perfil. Nome é somente
// leitura por ora (fora de escopo — pedido foi upload de foto, não
// edição de nome).
import { obterPerfil } from "@/lib/dados/perfil";
import AbaInferior from "@/components/aba-inferior";
import EditarPerfil from "@/components/editar-perfil";
import TituloTela from "@/components/titulo-tela";
import VoltarFlutuante from "@/components/voltar-flutuante";

export default async function PaginaPerfil() {
  const perfil = await obterPerfil();

  return (
    <main className="tela">
      <VoltarFlutuante href="/ajustes" rotulo="Ajustes" />
      <TituloTela contexto="Ajustes" titulo="Perfil" comVoltar />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo">
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
