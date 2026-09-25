"use client";

// lastro · PU-08 — os passos do onboarding. Estado só de "qual passo".
// Pular e terminar fazem a mesma coisa: marcam como concluído e vão para casa.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { concluirOnboarding } from "@/lib/dados/onboarding";
import type { PassoGuia } from "@/lib/guia/conteudo";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

export default function Onboarding({
  idioma,
  casa,
  passos,
}: {
  idioma: Idioma;
  casa: string;
  passos: PassoGuia[];
}) {
  const router = useRouter();
  const [indice, setIndice] = useState(0);
  const [saindo, setSaindo] = useState(false);
  const passo = passos[indice];
  const ultimo = indice === passos.length - 1;

  async function terminar() {
    if (saindo) return;
    setSaindo(true);
    await concluirOnboarding();
    router.replace(casa);
    router.refresh();
  }

  return (
    <div className="entrada">
      <div className="cartao cartao--vidro">
        <div className="formulario">
          <p className="campo__nota" aria-live="polite">
            {indice + 1} / {passos.length}
          </p>

          <h1 className="campo__rotulo">{t(passo.titulo, idioma)}</h1>
          {passo.paragrafos.map((p) => (
            <p key={p}>{t(p, idioma)}</p>
          ))}

          <div className="pilha">
            <button
              type="button"
              className="botao-primario botao-primario--heroi"
              disabled={saindo}
              onClick={ultimo ? terminar : () => setIndice(indice + 1)}
            >
              {ultimo ? t("Começar", idioma) : t("Próximo", idioma)}
            </button>

            {indice > 0 && (
              <button
                type="button"
                className="botao-secundario"
                disabled={saindo}
                onClick={() => setIndice(indice - 1)}
              >
                {t("Voltar", idioma)}
              </button>
            )}

            {!ultimo && (
              <button type="button" className="botao-texto" disabled={saindo} onClick={terminar}>
                {t("Pular", idioma)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
