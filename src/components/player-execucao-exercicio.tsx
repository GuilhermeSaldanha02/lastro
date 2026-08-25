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
  const midiaCadastrada = obterMidiaExercicio(exercicioId);
  const midia = midiaCadastrada || {
    id: exercicioId,
    nomeEn: nomeExercicio,
    nomeEs: nomeExercicio,
    slug: nomeExercicio
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-"),
    videoUrl: `/videos/exercicios/${exercicioId}.gif`,
    totalFrames: 2,
    musculo_alvo: "Musculatura Alvo Principal",
  };

  const [modo, setModo] = useState<"execucao" | "anatomia">("execucao");
  const [faseAtiva, setFaseAtiva] = useState<0 | 1>(0);
  const [erroMidia, setErroMidia] = useState(false);

  return (
    <div className="player-exercicio-card player-exercicio-card--3d">
      {/* Barra de controle de abas: Execução (GIF Real) vs Anatomia 3D */}
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
          onClick={() => setModo("anatomia")}
          className={`player-exercicio-card__tab ${
            modo === "anatomia" ? "player-exercicio-card__tab--ativo" : ""
          }`}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
          </svg>
          <span>{t("Anatomia & Foco", idioma)}</span>
        </button>
      </div>

      {/* Área de Visualização */}
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

        {modo === "execucao" ? (
          <div className="player-exercicio-card__animacao-container">
            {!erroMidia ? (
              <div className="player-exercicio-card__frame-wrapper">
                <img
                  src={midia.videoUrl || `/videos/exercicios/${midia.id}.gif`}
                  alt={nomeExercicio}
                  className="player-exercicio-card__midia"
                  onError={() => setErroMidia(true)}
                  loading="eager"
                />
              </div>
            ) : (
              /* Fallback para IlustracaoAnatomica3D caso o gif local não esteja acessível */
              <div className="player-exercicio-card__canvas-3d">
                <IlustracaoAnatomica3D
                  exercicioId={midia.id}
                  slug={midia.slug}
                  musculoAlvo={midia.musculo_alvo}
                  modo="execucao"
                  fase={0}
                />
              </div>
            )}

            <div className="player-exercicio-card__badge-status">
              <span className="player-exercicio-card__ponto-vivo" />
              <span>{t("Animação Ativa", idioma)}</span>
            </div>

            {/* Crédito discreto de atribuição visual */}
            <div className="player-exercicio-card__credito">
              <span>Gym Visual</span>
            </div>
          </div>
        ) : (
          <div className="player-exercicio-card__aparelho-container">
            {/* Modelo Anatômico 3D com alternância de fases */}
            <div className="player-exercicio-card__canvas-3d">
              <IlustracaoAnatomica3D
                exercicioId={midia.id}
                slug={midia.slug}
                musculoAlvo={midia.musculo_alvo}
                modo="aparelho"
                fase={faseAtiva}
              />
            </div>

            {/* Controles de Fase em Modo Anatomia/Posição */}
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
