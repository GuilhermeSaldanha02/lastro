// lastro · SDD.md §7.1 — casca de servidor da tela da Análise Semanal.
// Vira Server Component na pendência 4 (PROGRESS.md) pra poder buscar o
// perfil (nome/foto) com `cookies()` antes de renderizar a barra de topo;
// a parte interativa (perguntas, chamada à API, parecer) vive em
// `components/analise-interativa.tsx`.
import { obterPerfil } from "@/lib/dados/perfil";
import { carregarResumoHome } from "@/lib/dados/resumo-home";
import { dataLocalBrasil } from "@/lib/tempo";
import AbaInferior from "@/components/aba-inferior";
import Avatar from "@/components/avatar";
import AnaliseInterativa from "@/components/analise-interativa";
import TituloTela from "@/components/titulo-tela";

export default async function PaginaAnalise() {
  const [perfil, resumo] = await Promise.all([
    obterPerfil(),
    carregarResumoHome(dataLocalBrasil()),
  ]);

  return (
    <main className="tela">
      {/* Aba de nível de topo — sem `VoltarFlutuante`: a aba inferior já É
          a navegação daqui, não existe "voltar" pra uma aba de topo. */}
      <TituloTela
        contexto="Análise semanal"
        titulo="Semana fechada"
        acessorio={perfil && <Avatar nome={perfil.nome} avatarUrl={perfil.avatarUrl} />}
      />

      <AnaliseInterativa semanasFechadasComTreino={resumo.semanasFechadasComTreino} />

      <AbaInferior ativa="analise" />
    </main>
  );
}
