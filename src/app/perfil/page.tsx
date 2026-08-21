// lastro · sub-tela de Ajustes — editar foto de perfil. Nome é somente
// leitura por ora (fora de escopo — pedido foi upload de foto, não
// edição de nome).
import { obterPerfil } from "@/lib/dados/perfil";
import AbaInferior from "@/components/aba-inferior";
import EditarPerfil from "@/components/editar-perfil";
import CabecalhoPro from "@/components/cabecalho-pro";

export default async function PaginaPerfil() {
  const perfil = await obterPerfil();

  return (
    <main className="tela">
      <CabecalhoPro
        titulo="Ajustes"
        destaque="Perfil"
        voltarHref="/ajustes"
      />

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
