"use client";

// lastro · pedido do dono (2026-08-07) — antes de aparecer a lista inteira
// de exercícios pra registrar série, a pessoa escolhe o(s) grupo(s)
// musculares do dia ("peito e ombro", "só perna"). A lista de exercícios
// do formulário filtra por isso. Começa sem nada marcado, de propósito —
// mesma regra do formulário de série (DECISIONS.md 2026-08-07, "sempre
// iniciar em branco").
import { useEffect, useRef, useState } from "react";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";
import BotaoFecharCartao, { comportamentoDeRolagem } from "./botao-fechar-cartao";

export type OpcaoGrupo = { id: string; nome: string };

export default function SeletorGrupoMuscular({
  opcoes,
  onConfirmar,
  onFechar,
  idioma,
}: {
  opcoes: OpcaoGrupo[];
  onConfirmar: (grupos: string[]) => void;
  /** Só no treino, onde a área de ações some enquanto o cartão está aberto
   *  (TR-12); a folha de modelo tem o próprio fechar. */
  onFechar?: () => void;
  idioma: Idioma;
}) {
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  // Esta seção só existe quando `formularioAberto` liga (treino-detalhe.tsx)
  // — é conteúdo revelado, não uma tela nova. Sem isto, quem navega só por
  // teclado ativa "Adicionar exercício" e o foco não entra aqui: o Tab
  // seguinte pula pro resto da página (achado real, auditoria 2026-08-17,
  // TRANS-07). Padrão WAI-ARIA APG para conteúdo revelado dinamicamente:
  // mover o foco pro título que descreve o que apareceu.
  //
  // O foco sozinho rola só o mínimo — o título aparecia colado no rodapé,
  // com os chips e o "Continuar" abaixo da dobra (TR-12, QA.md 2026-09-23).
  // Um quadro de espera para a área de ações fixa já ter saído de cena.
  useEffect(() => {
    const quadro = requestAnimationFrame(() => {
      const titulo = tituloRef.current;
      if (!titulo) return;
      titulo.focus({ preventScroll: true });
      titulo.scrollIntoView({ block: "start", behavior: comportamentoDeRolagem() });
    });
    return () => cancelAnimationFrame(quadro);
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
            {t("Grupo Muscular de Hoje", idioma)}
          </span>
          <p style={{ fontSize: "var(--lastro-papel-rotulo)", color: "var(--lastro-txt-3)", margin: "2px 0 0" }}>
            {t("Escolha um ou mais para filtrar a lista de exercícios", idioma)}
          </p>
        </div>
        {onFechar && <BotaoFecharCartao onClick={onFechar} idioma={idioma} />}
      </div>

      <div className="chips" role="group" aria-label={t("Grupos musculares de hoje", idioma)} style={{ margin: "var(--lastro-e-3) 0 var(--lastro-e-4)" }}>
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
        {t("Continuar", idioma)}
      </button>
    </section>
  );
}
