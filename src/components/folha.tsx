"use client";

// lastro · backlog Nível 3, H1 (D6, DECISIONS.md 2026-08-15) — tarefa curta
// sobe como folha em vez de navegar pra rota cheia. Vive dentro de uma rota
// interceptada (`(.)perfil`, parallel route `@modal`): fechar = histórico
// voltar, então o botão voltar do navegador/Android já funciona de graça,
// sem lógica própria — é o próprio mecanismo de rota fazendo o trabalho.
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

const LIMIAR_ARRASTE_PX = 96;

export default function Folha({ titulo, children }: { titulo: string; children: ReactNode }) {
  const router = useRouter();
  const arraste = useRef<{ inicioY: number; atual: number } | null>(null);
  const [deslocamento, setDeslocamento] = useState(0);

  function fechar() {
    router.back();
  }

  useEffect(() => {
    function aoTeclar(evento: KeyboardEvent) {
      if (evento.key === "Escape") fechar();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function aoIniciarArraste(evento: React.PointerEvent) {
    arraste.current = { inicioY: evento.clientY, atual: 0 };
    evento.currentTarget.setPointerCapture(evento.pointerId);
  }

  function aoMoverArraste(evento: React.PointerEvent) {
    if (!arraste.current) return;
    const delta = Math.max(0, evento.clientY - arraste.current.inicioY);
    arraste.current.atual = delta;
    setDeslocamento(delta);
  }

  function aoSoltarArraste() {
    if (!arraste.current) return;
    const passouLimiar = arraste.current.atual > LIMIAR_ARRASTE_PX;
    arraste.current = null;
    if (passouLimiar) {
      fechar();
    } else {
      setDeslocamento(0);
    }
  }

  return (
    <div className="folha-fundo" onClick={fechar}>
      <div
        className="folha"
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        style={
          deslocamento
            ? { transform: `translateY(${deslocamento}px)`, animation: "none" }
            : undefined
        }
        onClick={(evento) => evento.stopPropagation()}
      >
        {/* Zona de arraste — 48px inteiros (D1), não só o traço visual de
            4px dentro dela. Quem fecha por teclado ou leitor de tela usa o
            botão ✕ abaixo, ou Esc, ou o próprio voltar do navegador. */}
        <div
          className="folha__pega"
          onPointerDown={aoIniciarArraste}
          onPointerMove={aoMoverArraste}
          onPointerUp={aoSoltarArraste}
          onPointerCancel={aoSoltarArraste}
        >
          <div className="folha__alca" aria-hidden="true" />
        </div>
        <div className="folha__cabecalho">
          <h2 className="folha__titulo">{titulo}</h2>
          <button
            type="button"
            className="botao-icone"
            aria-label={`Fechar ${titulo}`}
            onClick={fechar}
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
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
