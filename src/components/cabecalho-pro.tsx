import Link from "next/link";
import Avatar from "@/components/avatar";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

type CabecalhoProProps = {
  titulo: string;
  destaque?: string;
  voltarHref?: string;
  mostrarLogo?: boolean;
  perfil?: { nome: string; avatarUrl: string | null } | null;
  idioma: Idioma;
};

export default function CabecalhoPro({
  titulo,
  destaque,
  voltarHref,
  mostrarLogo = !voltarHref,
  perfil,
  idioma,
}: CabecalhoProProps) {
  return (
    <header className="topo-pro">
      <div className="topo-pro__esquerda">
        {voltarHref ? (
          <Link href={voltarHref} className="topo-pro__voltar" aria-label={t("Voltar", idioma)}>
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
        ) : mostrarLogo ? (
          <div className="topo-pro__logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-lastro.png" alt="LASTRO" className="topo-pro__logo" width={38} height={38} />
          </div>
        ) : null}

        <div className="topo-pro__data-pill">
          {titulo}
          {destaque && (
            <>
              {" · "}
              <span>{destaque}</span>
            </>
          )}
        </div>
      </div>

      {/* UX3-14: sem sessão não há perfil a abrir. A 404 de quem não entrou
          mostrava um avatar "AT" ligado a `/perfil`, que só devolvia ao login. */}
      {perfil && (
        <Link href="/perfil" className="topo-pro__avatar-link" aria-label={t("Perfil do atleta", idioma)}>
          <Avatar nome={perfil.nome} avatarUrl={perfil.avatarUrl} />
        </Link>
      )}
    </header>
  );
}
