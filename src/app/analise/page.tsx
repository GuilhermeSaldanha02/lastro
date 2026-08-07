// lastro · SDD.md §7.1 — casca de servidor da tela da Análise Semanal.
// Vira Server Component na pendência 4 (PROGRESS.md) pra poder buscar o
// perfil (nome/foto) com `cookies()` antes de renderizar a barra de topo;
// a parte interativa (perguntas, chamada à API, parecer) vive em
// `components/analise-interativa.tsx`.
import { obterPerfil } from "@/lib/dados/perfil";
import AbaInferior from "@/components/aba-inferior";
import Avatar from "@/components/avatar";
import AnaliseInterativa from "@/components/analise-interativa";

export default async function PaginaAnalise() {
  const perfil = await obterPerfil();

  return (
    <main className="tela">
      <header className="barra-topo">
        <div className="barra-topo__acoes">
          <div>
            <p className="barra-topo__contexto">Análise semanal</p>
            <h1 className="barra-topo__titulo">Semana fechada</h1>
          </div>
          {perfil && <Avatar nome={perfil.nome} avatarUrl={perfil.avatarUrl} />}
        </div>
      </header>

      <AnaliseInterativa />

      <AbaInferior ativa="analise" />
    </main>
  );
}
