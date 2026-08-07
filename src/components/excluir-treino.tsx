"use client";

// lastro · excluir treino é DESTRUTIVO e irreversível: o `on delete
// cascade` do schema (SDD §3.2) leva junto todas as séries do dia, e não
// há lixeira. Por isso a confirmação é inline e explícita — nada de
// `window.confirm`, que num celular vira um alerta de sistema fácil de
// tocar sem ler, e que não diz o que exatamente vai sumir.
import { useState, useTransition } from "react";
import { excluirTreino } from "@/lib/dados/treino";

export default function ExcluirTreino({
  id,
  data,
  series,
}: {
  id: string;
  /** Já formatada pela página — este componente não repete regra de data. */
  data: string;
  series: number;
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
        setErro("Não foi possível excluir. Tente de novo.");
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
          aria-label={`Excluir o treino de ${data}`}
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
    <div className="confirma" role="group" aria-label="Confirmar exclusão">
      <p className="confirma__texto">
        Excluir o treino de {data}
        {series > 0 && (
          <>
            {" "}
            e {series === 1 ? "a série dele" : `as ${series} séries dele`}
          </>
        )}
        ? Não dá para desfazer.
      </p>
      <div className="confirma__acoes">
        <button
          type="button"
          className="botao-secundario"
          onClick={() => setConfirmando(false)}
          disabled={pendente}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="botao-destrutivo"
          onClick={excluir}
          disabled={pendente}
        >
          {pendente ? "Excluindo…" : "Excluir"}
        </button>
      </div>
    </div>
  );
}
