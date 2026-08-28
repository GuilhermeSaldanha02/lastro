// lastro · SDD.md §9.3 — criar um modelo de treino novo.
import { listarCatalogo } from "@/lib/dados/treino";
import { obterPerfil } from "@/lib/dados/perfil";
import ModeloTreinoForm from "@/components/modelo-treino-form";
import AbaInferior from "@/components/aba-inferior";
import CabecalhoPro from "@/components/cabecalho-pro";
import { t } from "@/lib/texto/i18n";

export default async function PaginaNovoModelo() {
  const [exercicios, perfil] = await Promise.all([listarCatalogo(), obterPerfil()]);
  const idioma = perfil?.idioma ?? "pt-BR";

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Modelos", idioma)}
        destaque={t("Novo", idioma)}
        voltarHref="/ajustes/modelos"
        perfil={perfil}
        idioma={idioma}
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo">
        <ModeloTreinoForm exercicios={exercicios} idioma={idioma} />
      </div>

      <AbaInferior ativa="ajustes" idioma={idioma} />
    </main>
  );
}
