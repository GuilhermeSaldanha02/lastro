"use client";

// lastro · SDD.md §9.3 — quando existe pelo menos um modelo salvo, o botão
// de 1 toque abre um passo intermediário (Treino novo vs. modelo). Sem
// modelo nenhum, quem renderiza este componente nem chega a existir — a
// página usa o `FormIniciarTreino` direto, comportamento idêntico ao de
// sempre (§9.3, "caso que domina numericamente enquanto a feature é
// nova").
import { useState } from "react";
import FormIniciarTreino from "./form-iniciar-treino";
import type { Modelo } from "@/lib/dados/modelo-treino";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

export default function IniciarTreino({ modelos, idioma }: { modelos: Modelo[]; idioma: Idioma }) {
  const [escolhendo, setEscolhendo] = useState(false);

  if (!escolhendo) {
    return (
      <button
        type="button"
        className="botao-primario"
        onClick={() => setEscolhendo(true)}
      >
        {t("Iniciar treino de hoje", idioma)}
      </button>
    );
  }

  return (
    <section className="grupo">
      <div className="grupo__cab">
        <h2 className="grupo__nome">{t("Como começar?", idioma)}</h2>
      </div>
      {/* `.botao-primario`, não `.pergunta`: estes botões vivem dentro do
          card escuro `.destaque`, e o cartão claro da Análise vira uma
          cápsula branca que não tem parentesco nenhum com o botão verde
          que estava ali um toque antes (achado do teste no aparelho,
          2026-08-17). Escolher como começar é a mesma ação de "Iniciar
          treino de hoje", só que ramificada — mesmo peso, mesma cor. */}
      <ul className="perguntas">
        <li>
          <FormIniciarTreino idioma={idioma} classeBotao="botao-primario">
            {t("Treino novo", idioma)}
          </FormIniciarTreino>
        </li>
        {modelos.map((modelo) => (
          <li key={modelo.id}>
            <FormIniciarTreino modeloId={modelo.id} idioma={idioma} classeBotao="botao-primario">
              {modelo.nome}
            </FormIniciarTreino>
          </li>
        ))}
      </ul>
    </section>
  );
}
