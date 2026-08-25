"use client";

// lastro · excluir treino é DESTRUTIVO e irreversível: o `on delete
// cascade` do schema (SDD §3.2) leva junto todas as séries do dia, e não
// há lixeira. Por isso a confirmação é inline e explícita — nada de
// `window.confirm`, que num celular vira um alerta de sistema fácil de
// tocar sem ler, e que não diz o que exatamente vai sumir.
import { useState, useTransition } from "react";
import { excluirTreino } from "@/lib/dados/treino";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function ExcluirTreino({
  id,
  data,
  series,
  idioma,
}: {
  id: string;
  /** Já formatada pela página — este componente não repete regra de data. */
  data: string;
  series: number;
  idioma: Idioma;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function excluir() {
    setErro(null);
    iniciar(async () => {
      try {
        await excluirTreino(id);
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
          aria-label={`${t("Excluir o treino de", idioma)} ${data}`}
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
        {t("Excluir o treino de", idioma)} {data}
        {series > 0 && (
          <>
            {" "}
            {t("e", idioma)}{" "}
            {series === 1
              ? t("a série dele", idioma)
              : `${t("as", idioma)} ${series} ${t("séries dele", idioma)}`}
          </>
        )}
        ? {t("Não dá para desfazer.", idioma)}
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
