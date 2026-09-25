"use client";

// lastro · PU-07 — a tela de erro do app. Sem este arquivo o Next mostra a
// dele: em inglês, sem marca e sem caminho de volta (mesmo problema que o
// `not-found.tsx` resolveu para a 404). Relata o erro para `/api/erros`.
import { useEffect } from "react";
import Link from "next/link";
import { relatarErroCliente } from "@/lib/monitoramento/relatar-erro-cliente";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

function idiomaDaPagina(): Idioma {
  const lang = typeof document !== "undefined" ? document.documentElement.lang : "";
  return lang === "en" || lang === "es" ? lang : "pt-BR";
}

export default function ErroDoApp({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    relatarErroCliente(error, error.digest);
  }, [error]);

  const idioma = idiomaDaPagina();
  return (
    <main className="tela">
      <div className="corpo corpo--titulo-conteudo">
        <div className="pilha">
          <h1>{t("Algo deu errado", idioma)}</h1>
          <p className="vazio">
            {t("Não foi possível abrir esta tela. Seus treinos salvos estão a salvo. Tente de novo.", idioma)}
          </p>
          <button type="button" className="botao-primario" onClick={reset}>
            {t("Tentar de novo", idioma)}
          </button>
          <Link href="/" className="botao-secundario">
            {t("Voltar ao início", idioma)}
          </Link>
        </div>
      </div>
    </main>
  );
}
