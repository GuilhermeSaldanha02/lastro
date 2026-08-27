"use client";

// lastro · backlog C5 — excluir a própria conta. Destrutivo e
// irreversível: confirmação inline, NUNCA `window.confirm()` (PRD §4.1,
// critério A13) — o texto precisa dizer exatamente o que some.
import { useState, useTransition } from "react";
import { excluirConta } from "@/lib/dados/conta";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function ExcluirConta({ idioma }: { idioma: Idioma }) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function excluir() {
    setErro(null);
    iniciar(async () => {
      try {
        await excluirConta();
      } catch {
        setErro(t("Não foi possível excluir a conta. Tente de novo.", idioma));
        setConfirmando(false);
      }
    });
  }

  if (!confirmando) {
    return (
      <div className="zona-risco">
        <button
          type="button"
          className="botao-textual-com-icone botao-textual-com-icone--destrutivo"
          onClick={() => setConfirmando(true)}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
          <span>{t("Excluir conta", idioma)}</span>
        </button>
        {erro && (
          <p className="aviso-erro" role="alert">
            {erro}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="zona-risco">
      <div className="confirma" role="group" aria-label={t("Confirmar exclusão de conta", idioma)}>
        <p className="confirma__texto">
          {t(
            "Excluir sua conta apaga o perfil, todos os treinos e séries registradas, os modelos de treino e a configuração de anilhas — tudo, sem exceção. Não dá para desfazer.",
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
            className="botao-destrutivo botao-com-icone"
            onClick={excluir}
            disabled={pendente}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>{pendente ? t("Excluindo…", idioma) : t("Excluir conta", idioma)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
