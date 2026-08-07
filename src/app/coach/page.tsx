// lastro · PRD §4.4 — casca de servidor do coach 24h. Vira Server
// Component na pendência 4 (PROGRESS.md) pra buscar o perfil (nome/foto)
// antes de renderizar a barra de topo; a conversa em si vive em
// `components/coach-interativo.tsx`.
import { obterPerfil } from "@/lib/dados/perfil";
import AbaInferior from "@/components/aba-inferior";
import Avatar from "@/components/avatar";
import CoachInterativo from "@/components/coach-interativo";

export default async function PaginaCoach() {
  const perfil = await obterPerfil();

  return (
    <main className="tela">
      <header className="barra-topo">
        <div className="barra-topo__acoes">
          <div>
            <p className="barra-topo__contexto">Coach</p>
            <h1 className="barra-topo__titulo">Tirar uma dúvida</h1>
          </div>
          {perfil && <Avatar nome={perfil.nome} avatarUrl={perfil.avatarUrl} />}
        </div>
      </header>

      <CoachInterativo />

      <AbaInferior ativa="coach" />
    </main>
  );
}
