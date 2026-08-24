// lastro · H1 — intercepta a navegação por clique em `<Link href="/ajustes/anilhas">`
// (soft nav, a partir de `/ajustes`) e renderiza como folha, mesmo mecanismo
// de `(.)perfil`. `(.)ajustes/anilhas` — `@modal` não conta como segmento,
// então o marcador de "mesmo nível" é relativo à raiz de `app/`, igual ao
// exemplo canônico `(.)photo/[id]` da doc do Next (nested atrás do
// marcador, não um `(..)` por segmento de URL). Acesso direto por URL/refresh
// continua caindo em `src/app/ajustes/anilhas/page.tsx`, a rota completa de
// sempre — intocada.
import { obterConfigAnilhas } from "@/lib/dados/config-anilhas";
import { obterPerfil } from "@/lib/dados/perfil";
import AnilhasForm from "@/components/anilhas-form";
import Folha from "@/components/folha";
import { t } from "@/lib/texto/i18n";

export default async function AnilhasInterceptado() {
  const [config, perfil] = await Promise.all([obterConfigAnilhas(), obterPerfil()]);
  const idioma = perfil?.idioma ?? "pt-BR";

  return (
    <Folha titulo={t("Anilhas", idioma)} idioma={idioma}>
      {config ? (
        <AnilhasForm configInicial={config} idioma={idioma} />
      ) : (
        <p className="vazio">{t("Entre para configurar suas anilhas.", idioma)}</p>
      )}
    </Folha>
  );
}
