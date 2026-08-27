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
  treinoFinalizado?: boolean;
  onTempoTreinoAtualizado?: (segundos: number) => void;
};

const chaveInicioTreino = (treinoId: string) => `lastro_inicio_treino_${treinoId}`;
const chaveFimTreino = (treinoId: string) => `lastro_fim_treino_${treinoId}`;

/**
 * Quantos segundos o treino já durou, **lido** do localStorage — puro, sem
 * escrever nada. Congelado em `fim - início` quando o treino terminou;
 * corrente (`agora - início`) enquanto roda.
 *
 * Separado de `garantirMarcosTreino` de propósito: esta função roda no
 * inicializador do `useState` (durante o render, onde escrever é proibido)
 * e a cada tique do intervalo. Devolve 0 no servidor, onde não há
 * localStorage — o valor real chega no primeiro render do cliente.
 */
function calcularSegundosTreino(treinoId: string): number {
  if (typeof window === "undefined") return 0;

  const inicioIso = localStorage.getItem(chaveInicioTreino(treinoId));
  if (!inicioIso) return 0;

  const inicioMs = new Date(inicioIso).getTime();
  const fimIso = localStorage.getItem(chaveFimTreino(treinoId));
  const ateMs = fimIso ? new Date(fimIso).getTime() : Date.now();

  return Math.floor(Math.max(0, ateMs - inicioMs) / 1000);
}

/**
 * Grava os marcos do treino no localStorage. É o único lado escritor, e
 * vive dentro de um efeito porque é exatamente o que efeito deve fazer:
 * sincronizar um sistema externo com o estado do React.
 */
function garantirMarcosTreino(treinoId: string, finalizado: boolean): void {
  if (typeof window === "undefined") return;

  const chaveInicio = chaveInicioTreino(treinoId);
  if (!localStorage.getItem(chaveInicio)) {
    localStorage.setItem(chaveInicio, new Date().toISOString());
  }

  const chaveFim = chaveFimTreino(treinoId);
  if (finalizado && !localStorage.getItem(chaveFim)) {
    localStorage.setItem(chaveFim, new Date().toISOString());
  }
}

export default function TimerTopo({
  treinoId,
  idioma,
  duracaoPadraoSegundos = 90,
  treinoFinalizado = false,
  onTempoTreinoAtualizado,
}: TimerTopoProps) {
  // 1. Cronômetro Contínuo da Sessão de Treino (Persistido e Congelável)
  //
  // Inicializador preguiçoso em vez de `useState(0)` + `setState` dentro do
  // efeito: aquele padrão encadeava render (react-hooks/set-state-in-effect,
  // erro que reprovava o `npm run lint` do CI) e ainda piscava "00:00" por
  // um quadro ao voltar pra um treino em andamento. Ler o localStorage aqui
  // é leitura pura — quem escreve é `garantirMarcosTreino`, no efeito.
  const [segundosTreino, setSegundosTreino] = useState(() =>
    calcularSegundosTreino(treinoId),
  );

  // 2. Timer de Descanso entre Séries
  const [ativo, setAtivo] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [segundosRestantes, setSegundosRestantes] = useState(duracaoPadraoSegundos);
  const [duracaoTotal, setDuracaoTotal] = useState(duracaoPadraoSegundos);
  const [finalizado, setFinalizado] = useState(false);

  // Timestamp absoluto para resiliência a bloqueio de tela
  const fimTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Único lado escritor: sincroniza o localStorage com o que o React sabe.
    garantirMarcosTreino(treinoId, treinoFinalizado);

    // `setState` só dentro do callback do intervalo — assíncrono ao render,
    // que é o que a regra do React pede. Quando o treino está congelado,
    // `calcularSegundosTreino` devolve sempre o mesmo número e o React
    // descarta o re-render sozinho, sem precisar parar o intervalo.
    const aplicar = () => {
      const seg = calcularSegundosTreino(treinoId);
      setSegundosTreino(seg);
      onTempoTreinoAtualizado?.(seg);
    };

    const intervalTreino = setInterval(aplicar, 1000);
    return () => clearInterval(intervalTreino);
  }, [treinoId, treinoFinalizado, onTempoTreinoAtualizado]);

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

  // Descanso e treino finalizado não coexistem: acabou o treino, acabou o
  // descanso. Antes isso era `setAtivo(false)` dentro do efeito do
  // cronômetro (o `setState` síncrono que reprovava o lint); derivar entrega
  // o mesmo resultado sem encadear render, e sem perder o estado de quem
  // reabrir a tela — `ativo` continua intacto por baixo.
  const descansoAtivo = ativo && !treinoFinalizado;
  const descansoFinalizado = finalizado && !treinoFinalizado;

  // Loop de contagem regressiva baseado em timestamp absoluto
  useEffect(() => {
    if (!descansoAtivo || pausado) return;

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
  }, [descansoAtivo, pausado]);

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
        <div
          className={
            descansoAtivo || descansoFinalizado
              ? "status-descanso-wrapper status-descanso-wrapper--ativo"
              : "status-descanso-wrapper"
          }
        >
          {!descansoAtivo && !descansoFinalizado && (
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

          {descansoAtivo && (
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

          {descansoFinalizado && (
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
