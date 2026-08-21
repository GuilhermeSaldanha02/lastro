// lastro · Personalização de temas e cores
import AbaInferior from "@/components/aba-inferior";
import CabecalhoPro from "@/components/cabecalho-pro";
import SeletorTemas from "@/components/seletor-temas";

export default function PaginaTemas() {
  return (
    <main className="tela">
      <CabecalhoPro
        titulo="Ajustes"
        destaque="Temas"
        voltarHref="/ajustes"
      />

      <div className="corpo corpo--com-nav corpo--titulo-conteudo">
        <SeletorTemas />
      </div>

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
