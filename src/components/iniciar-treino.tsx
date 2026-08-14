"use client";

// lastro · SDD.md §9.3 — quando existe pelo menos um modelo salvo, o botão
// de 1 toque abre um passo intermediário (Treino novo vs. modelo). Sem
// modelo nenhum, quem renderiza este componente nem chega a existir — a
// página usa o <form action={criarTreino}> direto, comportamento idêntico
// ao de sempre (§9.3, "caso que domina numericamente enquanto a feature é
// nova").
import { useState } from "react";
import { criarTreino, criarTreinoComModelo } from "@/lib/dados/treino";
import type { Modelo } from "@/lib/dados/modelo-treino";

export default function IniciarTreino({ modelos }: { modelos: Modelo[] }) {
  const [escolhendo, setEscolhendo] = useState(false);

  if (!escolhendo) {
    return (
      <button
        type="button"
        className="botao-primario"
        onClick={() => setEscolhendo(true)}
      >
        Iniciar treino de hoje
      </button>
    );
  }

  return (
    <section className="grupo">
      <div className="grupo__cab">
        <h2 className="grupo__nome">Como começar?</h2>
      </div>
      <ul className="perguntas">
        <li>
          <form action={criarTreino}>
            <button type="submit" className="pergunta">
              Treino novo
            </button>
          </form>
        </li>
        {modelos.map((modelo) => (
          <li key={modelo.id}>
            <form action={criarTreinoComModelo.bind(null, modelo.id)}>
              <button type="submit" className="pergunta">
                {modelo.nome}
              </button>
            </form>
          </li>
        ))}
      </ul>
    </section>
  );
}
