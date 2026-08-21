// lastro · SDD.md §7.1 — casca de servidor da tela da Análise Semanal.
// Vira Server Component na pendência 4 (PROGRESS.md) pra poder buscar o
// perfil (nome/foto) com `cookies()` antes de renderizar a barra de topo;
// a parte interativa (perguntas, chamada à API, parecer) vive em
// `components/analise-interativa.tsx`.
import { obterPerfil } from "@/lib/dados/perfil";
import { carregarResumoHome } from "@/lib/dados/resumo-home";
import { dataLocalBrasil } from "@/lib/tempo";
import AbaInferior from "@/components/aba-inferior";
import AnaliseInterativa from "@/components/analise-interativa";
import CabecalhoPro from "@/components/cabecalho-pro";

export default async function PaginaAnalise() {
  const [perfil, resumo] = await Promise.all([
    obterPerfil(),
    carregarResumoHome(dataLocalBrasil()),
  ]);

  return (
    <main className="tela">
      <CabecalhoPro
        titulo="Análise Semanal"
        destaque="Ciclo"
        mostrarLogo={true}
        perfil={perfil}
      />

      <AnaliseInterativa semanasFechadasComTreino={resumo.semanasFechadasComTreino} />

      <AbaInferior ativa="analise" />
    </main>
  );
}
