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
import { unstable_rethrow } from "next/navigation";
import { alternarModo } from "@/lib/dados/personal-acoes";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";
import { apresentarErroPersonal } from "@/lib/texto/erro-personal";

export default function SeletorModo({ modo, idioma }: { modo: "treino" | "trabalho"; idioma: Idioma }) {
  const [trocando, setTrocando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function trocar(novo: "treino" | "trabalho") {
    if (novo === modo || trocando) return;
    setErro(null);
    setTrocando(true);
    try {
      // Sucesso não volta: a ação redireciona para a casa do novo modo.
      const resultado = await alternarModo(novo);
      if (resultado && !resultado.ok) setErro(apresentarErroPersonal(resultado.erro, idioma));
    } catch (falha) {
      unstable_rethrow(falha);
      setErro(apresentarErroPersonal("Não foi possível concluir a ação. Tente de novo.", idioma));
    } finally {
      setTrocando(false);
    }
  }

  return (
    <section aria-label={t("Modo do app", idioma)}>
      <div className="seletor-conta" role="radiogroup" aria-label={t("Modo", idioma)}>
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
            {opcao === "treino" ? t("TREINO", idioma) : t("TRABALHO", idioma)}
          </button>
        ))}
      </div>

      <p className="seletor-conta__nota">
        {modo === "treino"
          ? t("Modo treino: Início, Treinos e Análise. Toque em TRABALHO para abrir a fila de alunos.", idioma)
          : t("Modo trabalho: Fila e Alunos. Toque em TREINO para registrar seu próprio treino.", idioma)}
      </p>

      {erro && (
        <p className="aviso-erro" role="alert">
          {erro}
        </p>
      )}
    </section>
  );
}
