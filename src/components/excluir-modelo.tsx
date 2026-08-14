"use client";

// lastro · excluir modelo é destrutivo (some a lista de exercícios), mas
// NÃO afeta nenhum treino já criado a partir dele (SDD §9.4, sem vínculo
// entre modelo_treino e treino). Mesmo padrão de confirmação inline de
// `excluir-treino.tsx` — nada de `window.confirm`.
import { useState, useTransition } from "react";
import { excluirModelo } from "@/lib/dados/modelo-treino";

export default function ExcluirModelo({ id, nome }: { id: string; nome: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function excluir() {
    setErro(null);
    iniciar(async () => {
      try {
        await excluirModelo(id);
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
          aria-label={`Excluir modelo ${nome}`}
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
        Excluir o modelo &ldquo;{nome}&rdquo;? A lista de exercícios some — os
        treinos já registrados a partir dela não são afetados. Não dá para
        desfazer.
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
