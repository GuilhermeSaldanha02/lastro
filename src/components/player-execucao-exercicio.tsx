"use client";

import { useState } from "react";
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
  // Exercício sem GIF no manifesto (os 116 da ampliação de 2026-09-23):
  // antes o player inventava um caminho, pedia o arquivo (404 no console),
  // e mostrava "Animação Ativa" e um "Foco" genérico sobre o ícone de
  // reserva. Sem mídia cadastrada, a tela diz só o que é verdade.
  const midia = obterMidiaExercicio(exercicioId);

  const [carregando, setCarregando] = useState(true);
  const [erroMidia, setErroMidia] = useState(false);

  if (!midia) {
    return (
      <div className="player-exercicio-card player-exercicio-card--full">
        <div className="player-exercicio-card__display player-exercicio-card__display--full">
          <div className="player-exercicio-card__animacao-container">
            <FallbackSemMidia nomeExercicio={nomeExercicio} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="player-exercicio-card player-exercicio-card--full">
      <div className="player-exercicio-card__display player-exercicio-card__display--full">
        {/* Badge Anatômico de Músculo-Alvo */}
        {midia.musculo_alvo && (
          <div className="player-exercicio-card__badge-foco">
            <span className="player-exercicio-card__ponto-vermelho" />
            <span>
              {t("Foco:", idioma)} {midia.musculo_alvo}
            </span>
          </div>
        )}

        <div className="player-exercicio-card__animacao-container">
          {!erroMidia ? (
            <div className="player-exercicio-card__frame-wrapper">
              <img
                src={midia.videoUrl || `/videos/exercicios/${midia.id}.gif`}
                alt={nomeExercicio}
                className="player-exercicio-card__midia"
                onLoad={() => setCarregando(false)}
                onError={() => {
                  setErroMidia(true);
                  setCarregando(false);
                }}
                loading="eager"
              />
            </div>
          ) : (
            <FallbackSemMidia nomeExercicio={nomeExercicio} />
          )}

          {/* Badge de Status de Animação — só quando a animação carregou. */}
          {!erroMidia && (
            <div className="player-exercicio-card__badge-status">
              <span className="player-exercicio-card__ponto-vivo" />
              <span>{t("Animação Ativa", idioma)}</span>
            </div>
          )}

          {/* Crédito discreto de atribuição visual */}
          <div className="player-exercicio-card__credito">
            <span>{midia.creditos ?? t("Mídia de exercício", idioma)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FallbackSemMidia({ nomeExercicio }: { nomeExercicio: string }) {
  return (
    <div className="player-exercicio-card__fallback">
      <span className="player-exercicio-card__fallback-icone">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="var(--lastro-ouro)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12" />
        </svg>
      </span>
      <p>{nomeExercicio}</p>
    </div>
  );
}
