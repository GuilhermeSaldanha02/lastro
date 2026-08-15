"use client";

// lastro · pedido do dono (2026-08-07) — antes de aparecer a lista inteira
// de exercícios pra registrar série, a pessoa escolhe o(s) grupo(s)
// musculares do dia ("peito e ombro", "só perna"). A lista de exercícios
// do formulário filtra por isso. Começa sem nada marcado, de propósito —
// mesma regra do formulário de série (DECISIONS.md 2026-08-07, "sempre
// iniciar em branco").
import { useState } from "react";

export type OpcaoGrupo = { id: string; nome: string };

export default function SeletorGrupoMuscular({
  opcoes,
  onConfirmar,
}: {
  opcoes: OpcaoGrupo[];
  onConfirmar: (grupos: string[]) => void;
}) {
  const [selecionados, setSelecionados] = useState<string[]>([]);

  function alternar(id: string) {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((g) => g !== id) : [...atual, id],
    );
  }

  return (
    <section className="grupo">
      <div className="grupo__cab">
        <h2 className="grupo__nome">Grupo muscular de hoje</h2>
      </div>
      <p className="campo__nota">
        Escolha um ou mais — a lista de exercícios mostra só esses grupos.
      </p>

      {/* Chips (DESIGN.md §6.5, peça 5, M7) — substitui a grade de caixas
          de seleção. */}
      <div className="chips" role="group" aria-label="Grupos musculares de hoje">
        {opcoes.map((opcao) => (
          <label key={opcao.id} className="chip">
            <input
              type="checkbox"
              checked={selecionados.includes(opcao.id)}
              onChange={() => alternar(opcao.id)}
            />
            {opcao.nome}
          </label>
        ))}
      </div>

      <button
        type="button"
        className="botao-primario"
        disabled={selecionados.length === 0}
        onClick={() => onConfirmar(selecionados)}
      >
        Continuar
      </button>
    </section>
  );
}
