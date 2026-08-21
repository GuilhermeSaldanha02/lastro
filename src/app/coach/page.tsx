// lastro · PRD §4.4 — casca de servidor do coach 24h. Vira Server
// Component na pendência 4 (PROGRESS.md) pra buscar o perfil (nome/foto)
// antes de renderizar a barra de topo; a conversa em si vive em
// `components/coach-interativo.tsx`.
import { obterPerfil } from "@/lib/dados/perfil";
import AbaInferior from "@/components/aba-inferior";
import CabecalhoPro from "@/components/cabecalho-pro";
import CoachInterativo from "@/components/coach-interativo";

export default async function PaginaCoach() {
  const perfil = await obterPerfil();

  return (
    <main className="tela">
      <CabecalhoPro
        titulo="Coach"
        destaque="Consultoria"
        voltarHref="/ajustes"
        perfil={perfil}
      />

      <CoachInterativo />

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
