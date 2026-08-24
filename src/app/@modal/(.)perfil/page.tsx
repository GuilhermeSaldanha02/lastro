// lastro · H1 — intercepta a navegação por clique em `<Link href="/perfil">`
// (soft nav) e renderiza como folha em vez de rota cheia. Acesso direto por
// URL/refresh continua caindo em `src/app/perfil/page.tsx`, a rota
// completa de sempre — a interceptação nunca troca o que existe ali.
import { obterPerfil } from "@/lib/dados/perfil";
import EditarPerfil from "@/components/editar-perfil";
import Folha from "@/components/folha";
import { t } from "@/lib/texto/i18n";

export default async function PerfilInterceptado() {
  const perfil = await obterPerfil();
  const idioma = perfil?.idioma ?? "pt-BR";

  return (
    <Folha titulo={t("Perfil", idioma)} idioma={idioma}>
      {perfil ? (
        <EditarPerfil nome={perfil.nome} avatarUrlInicial={perfil.avatarUrl} idioma={idioma} />
      ) : (
        <p className="vazio">{t("Entre para editar seu perfil.", idioma)}</p>
      )}
    </Folha>
  );
}
