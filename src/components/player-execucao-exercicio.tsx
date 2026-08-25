"use client";

import { useState } from "react";
import { obterMidiaExercicio } from "@/lib/dados/midia-exercicio";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";
import IlustracaoAnatomica3D from "./ilustracao-anatomica-3d";

interface PlayerExecucaoExercicioProps {
  exercicioId: string;
  nomeExercicio: string;
  idioma: Idioma;
}

export default function PlayerExecucaoExercicio({
  exercicioId,
  nomeExercicio,
  idioma,
}: PlayerExecucaoExercicioProps) {
  const midia = obterMidiaExercicio(exercicioId);
  const [modo, setModo] = useState<"execucao" | "aparelho">("execucao");
  const [faseAtiva, setFaseAtiva] = useState<0 | 1>(0);

  if (!midia) {
    return null;
  }

  return (
    <div className="player-exercicio-card player-exercicio-card--3d">
      {/* Barra de controle de abas: Execução 3D vs Posição & Aparelho */}
      <div className="player-exercicio-card__seletor">
        <button
          type="button"
          onClick={() => setModo("execucao")}
          className={`player-exercicio-card__tab ${
            modo === "execucao" ? "player-exercicio-card__tab--ativo" : ""
          }`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
          <span>{t("Ver Execução 3D", idioma)}</span>
        </button>

        <button
          type="button"
          onClick={() => setModo("aparelho")}
          className={`player-exercicio-card__tab ${
            modo === "aparelho" ? "player-exercicio-card__tab--ativo" : ""
          }`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
          <span>{t("Posição & Aparelho", idioma)}</span>
        </button>
      </div>

      {/* Área de Visualização Anatômica 3D */}
      <div className="player-exercicio-card__display player-exercicio-card__display--3d">
        {/* Badge Anatômico de Músculo-Alvo */}
        {midia.musculo_alvo && (
          <div className="player-exercicio-card__badge-foco">
            <span className="player-exercicio-card__ponto-vermelho" />
            <span>
              {t("Foco:", idioma)} {midia.musculo_alvo}
            </span>
          </div>
        )}

        {/* Modelo Anatômico 3D Vetorial de Alta Precisão */}
        <div className="player-exercicio-card__canvas-3d">
          <IlustracaoAnatomica3D
            exercicioId={midia.id}
            slug={midia.slug}
            musculoAlvo={midia.musculo_alvo}
            modo={modo}
            fase={faseAtiva}
          />

          {modo === "execucao" && (
            <div className="player-exercicio-card__badge-status">
              <span className="player-exercicio-card__ponto-vivo" />
              <span>{t("Anatomia 3D Ativa", idioma)}</span>
            </div>
          )}
        </div>

        {/* Controles de Fase em Modo Aparelho/Posição */}
        {modo === "aparelho" && (
          <div className="player-exercicio-card__fases-controles">
            <button
              type="button"
              onClick={() => setFaseAtiva(0)}
              className={`player-exercicio-card__fase-btn ${
                faseAtiva === 0 ? "player-exercicio-card__fase-btn--ativo" : ""
              }`}
            >
              1. {t("Posição Inicial", idioma)}
            </button>
            <button
              type="button"
              onClick={() => setFaseAtiva(1)}
              className={`player-exercicio-card__fase-btn ${
                faseAtiva === 1 ? "player-exercicio-card__fase-btn--ativo" : ""
              }`}
            >
              2. {t("Ponto de Contração", idioma)}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
