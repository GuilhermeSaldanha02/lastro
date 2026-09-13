"use client";

// lastro · O seletor de modo — direção A do gate de 2026-09-13 ("cápsula em
// Ajustes"), PRD §11 emendas 2026-09-12 (2) e 2026-09-13.
//
// É a MESMA cápsula do cadastro (`.seletor-conta`), de propósito: o dono
// aprovou essa forma para "usuário ou personal", e repetir a forma ensina
// uma coisa só.
//
// SÓ CONTA QUE NASCEU PERSONAL RECEBE ESTE COMPONENTE. Na primeira versão,
// a conta de usuário via TRABALHO com cadeado e um aviso "É personal?" que
// levava ao CREF — e virava personal. O dono corrigiu a regra em
// 2026-09-13: usuário não vira personal, e o aviso "some de vez". Quem
// decide renderizar é `ajustes/page.tsx`; a trava de verdade é a 0026.
//
// Trocar de modo é gesto explícito e raro (poucas vezes por dia). Por isso
// mora em Ajustes e não no cabeçalho: um chip no topo de toda tela estaria
// a um toque errado da tela de registrar série.
import { useState } from "react";
import { alternarModo } from "@/lib/dados/personal-acoes";

export default function SeletorModo({ modo }: { modo: "treino" | "trabalho" }) {
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
        {(["treino", "trabalho"] as const).map((opcao) => (
          <button
            key={opcao}
            type="button"
            role="radio"
            aria-checked={modo === opcao}
            className={`seletor-conta__opcao${modo === opcao ? " seletor-conta__opcao--ativa" : ""}`}
            onClick={() => trocar(opcao)}
            disabled={trocando}
          >
            {opcao === "treino" ? "TREINO" : "TRABALHO"}
          </button>
        ))}
      </div>

      <p className="seletor-conta__nota">
        {modo === "treino"
          ? "Modo treino: Início, Treinos e Análise. Toque em TRABALHO para abrir a fila de alunos."
          : "Modo trabalho: Fila e Alunos. Toque em TREINO para registrar seu próprio treino."}
      </p>

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}
    </section>
  );
}
