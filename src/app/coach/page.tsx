// lastro · PRD §4.4 — casca de servidor do coach 24h. Vira Server
// Component na pendência 4 (PROGRESS.md) pra buscar o perfil (nome/foto)
// antes de renderizar a barra de topo; a conversa em si vive em
// `components/coach-interativo.tsx`.
import { obterPerfil } from "@/lib/dados/perfil";
import AbaInferior from "@/components/aba-inferior";
import Avatar from "@/components/avatar";
import CoachInterativo from "@/components/coach-interativo";
import TituloTela from "@/components/titulo-tela";
import VoltarFlutuante from "@/components/voltar-flutuante";

export default async function PaginaCoach() {
  const perfil = await obterPerfil();

  return (
    <main className="tela">
      <VoltarFlutuante href="/ajustes" rotulo="Ajustes" />
      <TituloTela
        contexto="Coach"
        titulo="Tirar uma dúvida"
        acessorio={perfil && <Avatar nome={perfil.nome} avatarUrl={perfil.avatarUrl} />}
        comVoltar
      />

      <CoachInterativo />

      <AbaInferior ativa="ajustes" />
    </main>
  );
}
