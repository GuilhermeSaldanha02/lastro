export type EstadoDescanso = {
  treinoId: string;
  serieId: string;
  metaSegundos: number;
  acumuladoAtivoMs: number;
  iniciadoEmMs: number | null;
  avisoMetaEmitido: boolean;
};

export type DescansoConcluido = {
  treinoId: string;
  serieId: string;
  descansoRealSegundos: number;
};

const inteiroNaoNegativo = (valor: number) => Math.max(0, Math.floor(valor));

export function iniciarDescanso(
  treinoId: string,
  serieId: string,
  metaSegundos: number,
  agoraMs: number,
): EstadoDescanso {
  return {
    treinoId,
    serieId,
    metaSegundos: inteiroNaoNegativo(metaSegundos),
    acumuladoAtivoMs: 0,
    iniciadoEmMs: agoraMs,
    avisoMetaEmitido: false,
  };
}

export function podeIniciarDescanso(
  estado: EstadoDescanso | null,
  ultimaSerieId: string | undefined,
  ultimaSerieJaTemDescanso: boolean,
): boolean {
  return estado === null && Boolean(ultimaSerieId) && !ultimaSerieJaTemDescanso;
}

function ativoDesdeUltimoMarco(estado: EstadoDescanso, agoraMs: number): number {
  if (estado.iniciadoEmMs === null) return 0;
  return Math.max(0, agoraMs - estado.iniciadoEmMs);
}

export function segundosReais(estado: EstadoDescanso, agoraMs: number): number {
  return Math.floor(
    (estado.acumuladoAtivoMs + ativoDesdeUltimoMarco(estado, agoraMs)) / 1000,
  );
}

export function painelDoDescanso(estado: EstadoDescanso, agoraMs: number) {
  const reais = segundosReais(estado, agoraMs);
  return {
    segundosReais: reais,
    segundosRestantes: Math.max(0, estado.metaSegundos - reais),
    metaAtingida: reais >= estado.metaSegundos,
    pausado: estado.iniciadoEmMs === null,
  };
}

export function pausarDescanso(
  estado: EstadoDescanso,
  agoraMs: number,
): EstadoDescanso {
  if (estado.iniciadoEmMs === null) return estado;
  return {
    ...estado,
    acumuladoAtivoMs:
      estado.acumuladoAtivoMs + ativoDesdeUltimoMarco(estado, agoraMs),
    iniciadoEmMs: null,
  };
}

export function retomarDescanso(
  estado: EstadoDescanso,
  agoraMs: number,
): EstadoDescanso {
  return estado.iniciadoEmMs === null
    ? { ...estado, iniciadoEmMs: agoraMs }
    : estado;
}

export function adicionarTempoAoDescanso(
  estado: EstadoDescanso,
  segundosExtras: number,
): EstadoDescanso {
  return {
    ...estado,
    metaSegundos: estado.metaSegundos + inteiroNaoNegativo(segundosExtras),
  };
}

export function marcarAvisoEmitido(estado: EstadoDescanso): EstadoDescanso {
  return estado.avisoMetaEmitido
    ? estado
    : { ...estado, avisoMetaEmitido: true };
}

export function concluirDescanso(
  estado: EstadoDescanso,
  agoraMs: number,
): DescansoConcluido {
  return {
    treinoId: estado.treinoId,
    serieId: estado.serieId,
    descansoRealSegundos: segundosReais(estado, agoraMs),
  };
}
