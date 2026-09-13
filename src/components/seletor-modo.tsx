"use client";

// lastro · O seletor de modo — direção A do gate de 2026-09-13 ("cápsula em
// Ajustes"), PRD §11 emenda 2026-09-12 (2).
//
// É a MESMA cápsula do cadastro (`.seletor-conta`), de propósito: o dono
// aprovou essa forma para "usuário ou personal", e repetir a forma ensina
// uma coisa só.
//
// Para a conta sem área de trabalho, TRABALHO aparece com cadeado e a nota
// embaixo É o aviso: diz o que falta e leva até lá. Não existe um card de
// aviso separado — o controle travado e a frase que o destrava ficam no
// mesmo lugar.
//
// Trocar de modo é gesto explícito e raro (poucas vezes por dia). Por isso
// mora em Ajustes e não no cabeçalho: um chip no topo de toda tela estaria
// a um toque errado da tela de registrar série.
import { useState } from "react";
import Link from "next/link";
import { alternarModo } from "@/lib/dados/personal-acoes";

export default function SeletorModo({
  modo,
  temAreaDeTrabalho,
}: {
  modo: "treino" | "trabalho";
  /** Conta com CREF informado. Sem ele, TRABALHO fica travado. */
  temAreaDeTrabalho: boolean;
}) {
  const [trocando, setTrocando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function trocar(novo: "treino" | "trabalho") {
    if (novo === modo || trocando) return;
    setErro(null);
    setTrocando(true);
    // Sucesso não volta: a ação redireciona para a casa do novo modo.
    const resultado = await alternarModo(novo);
    setTrocando(false);
    if (resultado && !resultado.ok) setErro(resultado.erro);
  }

  return (
    <section aria-label="Modo do app">
      <div className="seletor-conta" role="radiogroup" aria-label="Modo">
        <button
          type="button"
          role="radio"
          aria-checked={modo === "treino"}
          className={`seletor-conta__opcao${modo === "treino" ? " seletor-conta__opcao--ativa" : ""}`}
          onClick={() => trocar("treino")}
          disabled={trocando}
        >
          TREINO
        </button>

        {temAreaDeTrabalho ? (
          <button
            type="button"
            role="radio"
            aria-checked={modo === "trabalho"}
            className={`seletor-conta__opcao${modo === "trabalho" ? " seletor-conta__opcao--ativa" : ""}`}
            onClick={() => trocar("trabalho")}
            disabled={trocando}
          >
            TRABALHO
          </button>
        ) : (
          <Link
            href="/personal/completar"
            className="seletor-conta__opcao seletor-conta__opcao--travada"
            aria-label="Trabalho, travado. Informe seu CREF para abrir."
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="5" y="11" width="14" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            TRABALHO
          </Link>
        )}
      </div>

      <p className="seletor-conta__nota">
        {!temAreaDeTrabalho ? (
          <>
            É personal?{" "}
            <Link href="/personal/completar" className="seletor-conta__link">
              Informe seu CREF
            </Link>{" "}
            e esta conta ganha a fila de alunos, sem perder seu treino.
          </>
        ) : modo === "treino" ? (
          "Modo treino: Início, Treinos e Análise. Toque em TRABALHO para abrir a fila de alunos."
        ) : (
          "Modo trabalho: Fila e Alunos. Toque em TREINO para registrar seu próprio treino."
        )}
      </p>

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}
    </section>
  );
}
