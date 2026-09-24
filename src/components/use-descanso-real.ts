"use client";

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

import { agendarAvisoDescanso } from "@/lib/dados/aviso-descanso";
import { avisoDescansoLigado } from "@/lib/push/cliente";
import { segundosAteOAviso } from "@/lib/treino/aviso-descanso";

import {
  desbloquearAudio,
  tocarBipConclusao,
  vibrarConclusao,
} from "@/lib/audio/som-timer";
import {
  adicionarTempoAoDescanso,
  concluirDescanso,
  iniciarDescanso,
  marcarAvisoEmitido,
  painelDoDescanso,
  pausarDescanso,
  podeIniciarDescanso,
  retomarDescanso,
  type DescansoConcluido,
} from "@/lib/treino/descanso-real";
import {
  apagarDescansoLocal,
  assinarDescansoLocal,
  chaveDescansoReal,
  lerDescansoLocal,
  salvarDescansoLocal,
} from "@/lib/treino/descanso-real-local";

export type ControleDescansoReal = {
  ativo: boolean;
  pausado: boolean;
  metaAtingida: boolean;
  segundosRestantes: number;
  segundosReais: number;
  serieId: string | null;
  podeIniciar: boolean;
  iniciar: () => void;
  pausar: () => void;
  retomar: () => void;
  adicionarTempo: (segundos: number) => void;
  concluir: () => Promise<void>;
  cancelarSePertence: (serieId: string) => void;
};

function assinarSegundo(aoMudar: () => void): () => void {
  const id = window.setInterval(aoMudar, 1_000);
  return () => window.clearInterval(id);
}

const snapshotServidor = () => "";
const segundoServidor = () => 0;
const segundoAtual = () => Math.floor(Date.now() / 1_000);

export function useDescansoReal({
  treinoId,
  ultimaSerieId,
  ultimaSerieJaTemDescanso,
  aoConcluir,
  metaPadraoSegundos = 90,
}: {
  treinoId: string;
  ultimaSerieId?: string;
  ultimaSerieJaTemDescanso: boolean;
  aoConcluir: (resultado: DescansoConcluido) => Promise<void>;
  metaPadraoSegundos?: number;
}): ControleDescansoReal {
  const lerSnapshot = useCallback(
    () => window.localStorage.getItem(chaveDescansoReal(treinoId)) ?? "",
    [treinoId],
  );
  const serializado = useSyncExternalStore(
    assinarDescansoLocal,
    lerSnapshot,
    snapshotServidor,
  );
  const segundo = useSyncExternalStore(assinarSegundo, segundoAtual, segundoServidor);
  const estado = useMemo(() => {
    if (!serializado || typeof window === "undefined") return null;
    return lerDescansoLocal(window.localStorage, treinoId);
  }, [serializado, treinoId]);
  const painel = estado ? painelDoDescanso(estado, segundo * 1_000) : null;

  const iniciar = useCallback(() => {
    const atual = lerDescansoLocal(window.localStorage, treinoId);
    if (!podeIniciarDescanso(atual, ultimaSerieId, ultimaSerieJaTemDescanso)) return;

    desbloquearAudio();
    salvarDescansoLocal(
      window.localStorage,
      iniciarDescanso(treinoId, ultimaSerieId!, metaPadraoSegundos, Date.now()),
    );
  }, [metaPadraoSegundos, treinoId, ultimaSerieId, ultimaSerieJaTemDescanso]);

  const pausar = useCallback(() => {
    const atual = lerDescansoLocal(window.localStorage, treinoId);
    if (atual) salvarDescansoLocal(window.localStorage, pausarDescanso(atual, Date.now()));
  }, [treinoId]);

  const retomar = useCallback(() => {
    const atual = lerDescansoLocal(window.localStorage, treinoId);
    if (!atual) return;
    desbloquearAudio();
    salvarDescansoLocal(window.localStorage, retomarDescanso(atual, Date.now()));
  }, [treinoId]);

  const adicionarTempo = useCallback((segundos: number) => {
    const atual = lerDescansoLocal(window.localStorage, treinoId);
    if (!atual) return;
    desbloquearAudio();
    salvarDescansoLocal(
      window.localStorage,
      adicionarTempoAoDescanso(atual, segundos),
    );
  }, [treinoId]);

  const concluir = useCallback(async () => {
    const atual = lerDescansoLocal(window.localStorage, treinoId);
    if (!atual) return;

    const resultado = concluirDescanso(atual, Date.now());
    apagarDescansoLocal(window.localStorage, treinoId);
    await aoConcluir(resultado);
  }, [aoConcluir, treinoId]);

  const cancelarSePertence = useCallback((serieId: string) => {
    const atual = lerDescansoLocal(window.localStorage, treinoId);
    if (atual?.serieId === serieId) apagarDescansoLocal(window.localStorage, treinoId);
  }, [treinoId]);

  // Aviso fora do app (pedido do dono, 2026-09-23): toda mudança do descanso
  // — iniciar, pausar, retomar, +30s, encerrar — reagenda ou cancela o aviso
  // no servidor. Depende de `estado` (muda só nas ações), não do tique de
  // segundo. Sem rede o agendamento falha e o aviso não sai; o bip do app
  // continua valendo. Na montagem sem descanso não manda nada: não há o
  // que cancelar que este aparelho saiba.
  const ultimoAgendado = useRef<number | null | undefined>(undefined);
  useEffect(() => {
    if (!avisoDescansoLigado()) return;
    const segundos = segundosAteOAviso(estado, Date.now());
    if (ultimoAgendado.current === undefined && segundos === null) {
      ultimoAgendado.current = null;
      return;
    }
    ultimoAgendado.current = segundos;
    void agendarAvisoDescanso(treinoId, segundos);
  }, [estado, treinoId]);

  useEffect(() => {
    if (!estado || !painel?.metaAtingida || estado.avisoMetaEmitido) return;

    tocarBipConclusao();
    vibrarConclusao();
    salvarDescansoLocal(window.localStorage, marcarAvisoEmitido(estado));
  }, [estado, painel?.metaAtingida]);

  return {
    ativo: estado !== null,
    pausado: painel?.pausado ?? false,
    metaAtingida: painel?.metaAtingida ?? false,
    segundosRestantes: painel?.segundosRestantes ?? metaPadraoSegundos,
    segundosReais: painel?.segundosReais ?? 0,
    serieId: estado?.serieId ?? null,
    podeIniciar: podeIniciarDescanso(estado, ultimaSerieId, ultimaSerieJaTemDescanso),
    iniciar,
    pausar,
    retomar,
    adicionarTempo,
    concluir,
    cancelarSePertence,
  };
}
