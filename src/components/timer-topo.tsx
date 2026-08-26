"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  formatarMinutosSegundos,
  tocarBipConclusao,
  vibrarConclusao,
  desbloquearAudio,
} from "@/lib/audio/som-timer";
import type { Idioma } from "@/lib/dados/idioma";
import { t } from "@/lib/texto/i18n";

type TimerTopoProps = {
  treinoId: string;
  idioma: Idioma;
  duracaoPadraoSegundos?: number;
  onTempoTreinoAtualizado?: (segundos: number) => void;
};

export default function TimerTopo({
  treinoId,
  idioma,
  duracaoPadraoSegundos = 90,
  onTempoTreinoAtualizado,
}: TimerTopoProps) {
  // 1. Cronômetro Contínuo da Sessão de Treino (Persistido por treinoId)
  const [segundosTreino, setSegundosTreino] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const chaveStorage = `lastro_inicio_treino_${treinoId}`;
    let inicioIso = localStorage.getItem(chaveStorage);
    if (!inicioIso) {
      inicioIso = new Date().toISOString();
      localStorage.setItem(chaveStorage, inicioIso);
    }

    const inicioMs = new Date(inicioIso).getTime();

    const atualizarTempo = () => {
      const decorridoMs = Math.max(0, Date.now() - inicioMs);
      const seg = Math.floor(decorridoMs / 1000);
      setSegundosTreino(seg);
      onTempoTreinoAtualizado?.(seg);
    };

    atualizarTempo();
    const intervalTreino = setInterval(atualizarTempo, 1000);
    return () => clearInterval(intervalTreino);
  }, [treinoId, onTempoTreinoAtualizado]);

  // 2. Timer de Descanso entre Séries
  const [ativo, setAtivo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(duracaoPadraoSegundos);
  const [duracaoTotal, setDuracaoTotal] = useState(duracaoPadraoSegundos);
  const [finalizado, setFinalizado] = useState(false);

  // Timestamp absoluto para resiliência a bloqueio de tela
  const fimTimestampRef = useRef<number | null>(null);

  const iniciarTimer = useCallback((segundos: number) => {
    desbloquearAudio();
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
    desbloquearAudio();
    fimTimestampRef.current = Date.now() + segundosRestantes * 1000;
    setPausado(false);
  }, [segundosRestantes]);

  const adicionarTempo = useCallback((segundosExtras: number) => {
    desbloquearAudio();
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
        
        // Alertas de conclusão garantidos
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
      <div className="barra-status-treino">
        {/* Esquerda: Tempo Total de Treino Decorrido */}
        <div className="status-tempo-treino" title="Tempo total da sessão de treino">
          <span className="status-tempo-treino__icone">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </span>
          <div className="status-tempo-treino__conteudo">
            <span className="status-tempo-treino__rotulo">{t("Treino", idioma)}</span>
            <span className="status-tempo-treino__valor">
              {formatarMinutosSegundos(segundosTreino)}
            </span>
          </div>
        </div>

        {/* Direita: Módulo de Descanso (Parado, Ativo ou Concluído) */}
        <div className="status-descanso-wrapper">
          {!ativo && !finalizado && (
            <button
              type="button"
              className="timer-topo-botao-disparar"
              onClick={() => iniciarTimer(duracaoPadraoSegundos)}
              title="Iniciar descanso entre séries"
            >
              <span className="timer-topo-disparar-rotulo">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polygon points="5 3 19 12 5 21 5 3" fill="currentColor" />
                </svg>
                <span>{t("Descanso", idioma)}</span>
              </span>
              <span className="timer-topo-duracao-tag">
                {formatarMinutosSegundos(duracaoPadraoSegundos)}
              </span>
            </button>
          )}

          {ativo && (
            <div className="timer-topo-card-ativo">
              <div className="timer-topo-conteudo">
                <div className="timer-topo-tempo-bloco">
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

              {/* Barra de progresso linear fina */}
              <div className="timer-topo-barra-trilho">
                <div
                  className="timer-topo-barra-progresso"
                  style={{ width: `${porcentagemRestante}%` }}
                />
              </div>
            </div>
          )}

          {finalizado && (
            <div className="timer-topo-card-concluido">
              <span className="timer-topo-concluido-txt">
                {t("Pronto!", idioma)}
              </span>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  type="button"
                  className="timer-topo-chip-tempo"
                  onClick={() => iniciarTimer(duracaoPadraoSegundos)}
                >
                  +{formatarMinutosSegundos(duracaoPadraoSegundos)}
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
      </div>
    </div>
  );
}
