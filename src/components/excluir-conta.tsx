"use client";

// lastro · backlog C5 — excluir a própria conta. Destrutivo e
// irreversível: confirmação inline, NUNCA `window.confirm()` (PRD §4.1,
// critério A13) — o texto precisa dizer exatamente o que some.
import { useState, useTransition } from "react";
import { excluirConta } from "@/lib/dados/conta";

export default function ExcluirConta() {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function excluir() {
    setErro(null);
    iniciar(async () => {
      try {
        await excluirConta();
      } catch {
        setErro("Não foi possível excluir a conta. Tente de novo.");
        setConfirmando(false);
      }
    });
  }

  if (!confirmando) {
    return (
      <>
        <button
          type="button"
          className="botao-textual"
          onClick={() => setConfirmando(true)}
        >
          Excluir conta
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
    <div className="confirma" role="group" aria-label="Confirmar exclusão de conta">
      <p className="confirma__texto">
        Excluir sua conta apaga o perfil, todos os treinos e séries registradas,
        os modelos de treino e a configuração de anilhas — tudo, sem exceção.
        Não dá para desfazer.
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
          {pendente ? "Excluindo…" : "Excluir conta"}
        </button>
      </div>
    </div>
  );
}
