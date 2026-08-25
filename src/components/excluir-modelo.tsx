"use client";

// lastro · excluir modelo é destrutivo (some a lista de exercícios), mas
// NÃO afeta nenhum treino já criado a partir dele (SDD §9.4, sem vínculo
// entre modelo_treino e treino). Mesmo padrão de confirmação inline de
// `excluir-treino.tsx` — nada de `window.confirm`.
import { useState, useTransition } from "react";
import { excluirModelo } from "@/lib/dados/modelo-treino";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function ExcluirModelo({ id, nome, idioma }: { id: string; nome: string; idioma: Idioma }) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function excluir() {
    setErro(null);
    iniciar(async () => {
      try {
        await excluirModelo(id);
      } catch {
        setErro(t("Não foi possível excluir. Tente de novo.", idioma));
        setConfirmando(false);
      }
    });
  }

  if (!confirmando) {
    return (
      <>
        <button
          type="button"
          className="botao-icone"
          onClick={() => setConfirmando(true)}
          aria-label={`${t("Excluir modelo", idioma)} ${nome}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
          </svg>
        </button>
        {erro && (
          <p className="aviso-erro" role="alert">
            {erro}
          </p>
        )}
      </>
    );
  }

  return (
    <div className="confirma" role="group" aria-label={t("Confirmar exclusão", idioma)}>
      <p className="confirma__texto">
        {t("Excluir o modelo", idioma)} &ldquo;{nome}&rdquo;?{" "}
        {t(
          "A lista de exercícios some — os treinos já registrados a partir dela não são afetados. Não dá para desfazer.",
          idioma,
        )}
      </p>
      <div className="confirma__acoes">
        <button
          type="button"
          className="botao-secundario"
          onClick={() => setConfirmando(false)}
          disabled={pendente}
        >
          {t("Cancelar", idioma)}
        </button>
        <button
          type="button"
          className="botao-destrutivo"
          onClick={excluir}
          disabled={pendente}
        >
          {pendente ? t("Excluindo…", idioma) : t("Excluir", idioma)}
        </button>
      </div>
    </div>
  );
}
