"use client";

import { useState } from "react";
import Image from "next/image";
import { obterMidiaExercicio } from "@/lib/dados/midia-exercicio";
import { t } from "@/lib/texto/i18n";
import type { Idioma } from "@/lib/dados/idioma";

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

  const frame0Url = `/videos/exercicios/frames/${midia.id}/0.jpg`;
  const frame1Url = `/videos/exercicios/frames/${midia.id}/1.jpg`;

  return (
    <div className="player-exercicio-card">
      {/* Barra de controle de abas: Execução vs Aparelho/Posição */}
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
          <span>{t("Ver Execução", idioma)}</span>
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
          <span>{t("Ver Aparelho / Posição", idioma)}</span>
        </button>
      </div>

      {/* Área de Visualização */}
      <div className="player-exercicio-card__display">
        {/* Badge Anatômico de Músculo-Alvo */}
        {midia.musculo_alvo && (
          <div className="player-exercicio-card__badge-foco">
            <span className="player-exercicio-card__ponto-vermelho" />
            <span>
              {t("Foco:", idioma)} {midia.musculo_alvo}
            </span>
          </div>
        )}

        {modo === "execucao" ? (
          <div className="player-exercicio-card__animacao-container">
            {/* Imagem/GIF animado */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={midia.videoUrl}
              alt={`${nomeExercicio} - ${t("Execução do exercício", idioma)}`}
              className="player-exercicio-card__midia"
              loading="lazy"
            />
            <div className="player-exercicio-card__badge-status">
              <span className="player-exercicio-card__ponto-vivo" />
              <span>{t("Execução em Movimento", idioma)}</span>
            </div>
          </div>
        ) : (
          <div className="player-exercicio-card__aparelho-container">
            {/* Visualização de Posição / Aparelho */}
            <div className="player-exercicio-card__frame-wrapper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={faseAtiva === 0 ? frame0Url : frame1Url}
                alt={`${nomeExercicio} - ${
                  faseAtiva === 0
                    ? t("Posição Inicial / Aparelho", idioma)
                    : t("Ponto de Contração / Final", idioma)
                }`}
                className="player-exercicio-card__midia"
                loading="lazy"
              />
            </div>

            {/* Seletor de Fases do Movimento */}
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
          </div>
        )}
      </div>
    </div>
  );
}
