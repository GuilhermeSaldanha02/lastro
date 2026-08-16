"use client";

// lastro · H2 (D8, DECISIONS.md 2026-08-15) — "Modo de edição" substitui a
// lixeira sempre visível por linha por um estado explícito de tela: por
// padrão nenhuma linha mostra ação destrutiva, um botão "Editar" liga o
// modo, "Concluído" desliga. Primeiro consumidor do mecanismo — escolhido
// por ser o único caso sem alvo de toque concorrente (`.item` aqui é só
// nome + lixeira, sem `.item__link`; grade de anilhas e lista de treinos
// competem com outro alvo, `.serie` compete com o toque na linha inteira
// pra editar — os três ficam pendentes, ver docs/BACKLOG-REDESENHO.md).
//
// A confirmação em duas etapas de `ExcluirModelo` continua existindo —
// D8 não mexe nela. O que resolve o desalinhamento entre "modo de edição"
// (estado da tela) e "confirmando exclusão" (estado local do componente)
// é não montar `ExcluirModelo` quando o modo de edição está desligado:
// sair do modo de edição desmonta o componente, e o estado `confirmando`
// dele simplesmente deixa de existir — nada de sincronizar dois estados
// à mão.
import { useState } from "react";
import ExcluirModelo from "@/components/excluir-modelo";

export default function ListaModelos({
  modelos,
}: {
  modelos: { id: string; nome: string }[];
}) {
  const [modoEdicao, setModoEdicao] = useState(false);

  return (
    <>
      <div className="grupo__cab">
        <h2 className="grupo__nome">Modelos</h2>
        {modelos.length > 0 && (
          <button
            type="button"
            className="botao-textual"
            onClick={() => setModoEdicao((atual) => !atual)}
          >
            {modoEdicao ? "Concluído" : "Editar"}
          </button>
        )}
      </div>

      {modelos.length === 0 ? (
        <p className="vazio">Nenhum modelo criado ainda.</p>
      ) : (
        <ul className="lista">
          {modelos.map((modelo) => (
            <li key={modelo.id}>
              <div className="item">
                <span className="item__data">{modelo.nome}</span>
                {modoEdicao && <ExcluirModelo id={modelo.id} nome={modelo.nome} />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
