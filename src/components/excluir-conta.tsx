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
          className="botao-textual botao-textual--destrutivo"
          onClick={() => setConfirmando(true)}
        >
          {t("Excluir conta", idioma)}
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
            className="botao-destrutivo"
            onClick={excluir}
            disabled={pendente}
          >
            {pendente ? t("Excluindo…", idioma) : t("Excluir conta", idioma)}
          </button>
        </div>
      </div>
    </div>
  );
}
