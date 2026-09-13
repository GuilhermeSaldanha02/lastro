// lastro · PRD §4.4 — casca de servidor do coach 24h. Vira Server
// Component na pendência 4 (PROGRESS.md) pra buscar o perfil (nome/foto)
// antes de renderizar a barra de topo; a conversa em si vive em
// `components/coach-interativo.tsx`.
import { obterPerfil } from "@/lib/dados/perfil";
import { cascaDaBarra, exigirCascaDeAluno } from "@/lib/dados/casca";
import AbaInferior from "@/components/aba-inferior";
import CabecalhoPro from "@/components/cabecalho-pro";
import CoachInterativo from "@/components/coach-interativo";
import { t } from "@/lib/texto/i18n";

export default async function PaginaCoach() {
  const perfil = await obterPerfil();
  exigirCascaDeAluno(perfil);
  const idioma = perfil?.idioma ?? "pt-BR";

  return (
    <main className="tela">
      <CabecalhoPro
        titulo={t("Coach", idioma)}
        destaque={t("Consultoria", idioma)}
        voltarHref="/ajustes"
        perfil={perfil}
        idioma={idioma}
      />

      <CoachInterativo idioma={idioma} />

      <AbaInferior ativa="ajustes" idioma={idioma} tipoConta={cascaDaBarra(perfil)} />
    </main>
  );
}
