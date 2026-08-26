"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  formatarMinutosSegundos,
  tocarBipConclusao,
  vibrarConclusao,
} from "@/lib/audio/som-timer";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

type TimerTopoProps = {
  idioma: Idioma;
  duracaoPadraoSegundos?: number;
};

export default function TimerTopo({
  idioma,
  duracaoPadraoSegundos = 90,
}: TimerTopoProps) {
  // Estado do timer
  const [ativo, setAtivo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(duracaoPadraoSegundos);
  const [duracaoTotal, setDuracaoTotal] = useState(duracaoPadraoSegundos);
  const [finalizado, setFinalizado] = useState(false);

  // Timestamp absoluto para resiliência a bloqueio de tela
  const fimTimestampRef = useRef<number | null>(null);

  const iniciarTimer = useCallback((segundos: number) => {
    setDuracaoTotal(segundos);
    setSegundosRestantes(segundos);
    fimTimestampRef.current = Date.now() + segundos * 1000;
    setAtivo(true);
    setPausado(false);
    setFinalizado(false);
  }, []);

  const pausarTimer = useCallback(() => {
    setPausado(true);
    fimTimestampRef.current = null;
  }, []);

  const retomarTimer = useCallback(() => {
    fimTimestampRef.current = Date.now() + segundosRestantes * 1000;
    setPausado(false);
  }, [segundosRestantes]);

  const adicionarTempo = useCallback((segundosExtras: number) => {
    setSegundosRestantes((atual) => {
      const novoTempo = atual + segundosExtras;
      setDuracaoTotal((tot) => Math.max(tot, novoTempo));
      if (fimTimestampRef.current) {
        fimTimestampRef.current += segundosExtras * 1000;
      }
      return novoTempo;
    });
    setFinalizado(false);
  }, []);

  const fecharTimer = useCallback(() => {
    setAtivo(false);
    setPausado(false);
    setFinalizado(false);
    fimTimestampRef.current = null;
  }, []);

  // Loop de contagem regressiva baseado em timestamp absoluto
  useEffect(() => {
    if (!ativo || pausado) return;

    const intervalo = setInterval(() => {
      if (!fimTimestampRef.current) return;

      const agora = Date.now();
      const restanteMs = fimTimestampRef.current - agora;
      const restanteSeg = Math.ceil(restanteMs / 1000);

      if (restanteSeg <= 0) {
        setSegundosRestantes(0);
        setAtivo(false);
        setFinalizado(true);
        fimTimestampRef.current = null;
        clearInterval(intervalo);
        
        // Alertas de conclusão
        tocarBipConclusao();
        vibrarConclusao();
      } else {
        setSegundosRestantes(restanteSeg);
      }
    }, 250);

    return () => clearInterval(intervalo);
  }, [ativo, pausado]);

  const porcentagemRestante =
    duracaoTotal > 0 ? (segundosRestantes / duracaoTotal) * 100 : 0;

  return (
    <div className="timer-topo-container">
      {/* 1. Modo Normal: Botão pílula elegante de disparo manual no topo */}
      {!ativo && !finalizado && (
        <div className="timer-topo-gatilho">
          <button
            type="button"
            className="timer-topo-botao-disparar"
            onClick={() => iniciarTimer(duracaoPadraoSegundos)}
            title="Iniciar descanso entre séries"
          >
            <span>{t("Descanso", idioma)}</span>
            <span className="timer-topo-duracao-tag">
              {formatarMinutosSegundos(duracaoPadraoSegundos)}
            </span>
          </button>
        </div>
      )}

      {/* 2. Modo Ativo: Cápsula pílula de contagem regressiva no topo */}
      {ativo && (
        <div className="timer-topo-card-ativo">
          <div className="timer-topo-conteudo">
            <div className="timer-topo-tempo-bloco">
              <span className="timer-topo-tempo-label">{t("Descanso", idioma)}</span>
              <span className="timer-topo-tempo-txt">
                {formatarMinutosSegundos(segundosRestantes)}
              </span>
            </div>

            <div className="timer-topo-acoes">
              <button
                type="button"
                className="timer-topo-chip-tempo"
                onClick={() => adicionarTempo(30)}
              >
                +30s
              </button>

              <button
                type="button"
                className="timer-topo-btn-controle"
                onClick={pausado ? retomarTimer : pausarTimer}
              >
                {pausado ? t("Retomar", idioma) : t("Pausar", idioma)}
              </button>

              <button
                type="button"
                className="timer-topo-btn-fechar"
                onClick={fecharTimer}
                aria-label="Pular descanso"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Barra de progresso linear fina no rodapé da cápsula */}
          <div className="timer-topo-barra-trilho">
            <div
              className="timer-topo-barra-progresso"
              style={{ width: `${porcentagemRestante}%` }}
            />
          </div>
        </div>
      )}

      {/* 3. Modo Finalizado: Banner de conclusão sutil */}
      {finalizado && (
        <div className="timer-topo-card-concluido">
          <div className="timer-topo-concluido-info">
            <span className="timer-topo-concluido-txt">
              {t("Descanso finalizado", idioma)}
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              className="timer-topo-chip-tempo"
              onClick={() => iniciarTimer(duracaoPadraoSegundos)}
            >
              + {formatarMinutosSegundos(duracaoPadraoSegundos)}
            </button>
            <button
              type="button"
              className="timer-topo-btn-fechar"
              onClick={fecharTimer}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
