"use client";

// lastro · pedido do dono (2026-08-07) — antes de aparecer a lista inteira
// de exercícios pra registrar série, a pessoa escolhe o(s) grupo(s)
// musculares do dia ("peito e ombro", "só perna"). A lista de exercícios
// do formulário filtra por isso. Começa sem nada marcado, de propósito —
// mesma regra do formulário de série (DECISIONS.md 2026-08-07, "sempre
// iniciar em branco").
import { useEffect, useRef, useState } from "react";

export type OpcaoGrupo = { id: string; nome: string };

export default function SeletorGrupoMuscular({
  opcoes,
  onConfirmar,
}: {
  opcoes: OpcaoGrupo[];
  onConfirmar: (grupos: string[]) => void;
}) {
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  // Esta seção só existe quando `formularioAberto` liga (treino-detalhe.tsx)
  // — é conteúdo revelado, não uma tela nova. Sem isto, quem navega só por
  // teclado ativa "Adicionar exercício" e o foco não entra aqui: o Tab
  // seguinte pula pro resto da página (achado real, auditoria 2026-08-17,
  // TRANS-07). Padrão WAI-ARIA APG para conteúdo revelado dinamicamente:
  // mover o foco pro título que descreve o que apareceu.
  useEffect(() => {
    tituloRef.current?.focus();
  }, []);

  function alternar(id: string) {
    setSelecionados((atual) =>
      atual.includes(id) ? atual.filter((g) => g !== id) : [...atual, id],
    );
  }

  return (
    <section className="card-obsidian" style={{ marginBottom: "var(--lastro-e-4)" }}>
      <div className="card-obsidian__header">
        <div>
          <span className="card-obsidian__titulo" tabIndex={-1} ref={tituloRef}>
            Grupo Muscular de Hoje
          </span>
          <p style={{ fontSize: "var(--lastro-papel-rotulo)", color: "var(--lastro-txt-3)", margin: "2px 0 0" }}>
            Escolha um ou mais para filtrar a lista de exercícios
          </p>
        </div>
      </div>

      <div className="chips" role="group" aria-label="Grupos musculares de hoje" style={{ margin: "var(--lastro-e-3) 0 var(--lastro-e-4)" }}>
        {opcoes.map((opcao) => (
          <label key={opcao.id} className={`chip${selecionados.includes(opcao.id) ? " chip--ativo" : ""}`}>
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
