// lastro · sub-tela de Ajustes — editar foto de perfil. Nome é somente
// leitura por ora (fora de escopo — pedido foi upload de foto, não
// edição de nome).
import { obterPerfil } from "@/lib/dados/perfil";
import AbaInferior from "@/components/aba-inferior";
import EditarPerfil from "@/components/editar-perfil";
import CabecalhoPro from "@/components/cabecalho-pro";
import { t } from "@/lib/texto/i18n";

export default async function PaginaPerfil() {
  const perfil = await obterPerfil();
  const idioma = perfil?.idioma ?? "pt-BR";

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Ajustes", idioma)}
        destaque={t("Perfil", idioma)}
        voltarHref="/ajustes"
        idioma={idioma}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo">
        {perfil ? (
          <EditarPerfil nome={perfil.nome} avatarUrlInicial={perfil.avatarUrl} idioma={idioma} />
        ) : (
          <p className="vazio">{t("Entre para editar seu perfil.", idioma)}</p>
        )}
      </div>

      <AbaInferior ativa="ajustes" idioma={idioma} />
    </main>
  );
}
