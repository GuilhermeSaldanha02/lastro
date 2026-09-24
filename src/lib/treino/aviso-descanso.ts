import { painelDoDescanso, type EstadoDescanso } from "./descanso-real";

export type AcaoDoAviso = { tipo: "agendar"; segundos: number } | { tipo: "cancelar" } | { tipo: "manter" };

/**
 * O que o app manda ao servidor quando o descanso muda. Chegar ao fim NÃO
 * cancela: com o app aberto o bip toca e o estado vira "aviso emitido", e
 * cancelar ali apagava o push antes de o cron enviá-lo (teste de
 * 2026-09-24). Só pausar e encerrar cancelam.
 */
export function acaoDoAviso(estado: EstadoDescanso | null, agoraMs: number): AcaoDoAviso {
  if (!estado || estado.iniciadoEmMs === null) return { tipo: "cancelar" };
  const segundos = segundosAteOAviso(estado, agoraMs);
  return segundos === null ? { tipo: "manter" } : { tipo: "agendar", segundos };
}

/** "Faltam 15 s" (pedido do dono, 2026-09-24): hora de se preparar. */
export const ANTECEDENCIA_PRE_AVISO = 15;

/**
 * A partir dos segundos até o fim, quando sai o pré-aviso. Descanso de 20 s
 * ou menos não tem: o pré-aviso chegaria quase junto com o do fim.
 */
export function segundosAteOPreAviso(segundosAteOFim: number | null): number | null {
  if (segundosAteOFim === null || segundosAteOFim <= ANTECEDENCIA_PRE_AVISO + 5) return null;
  return segundosAteOFim - ANTECEDENCIA_PRE_AVISO;
}

/**
 * Quantos segundos faltam para o aviso de "descanso acabou" — ou `null`
 * para cancelar (pedido do dono, 2026-09-23: saber que o descanso acabou
 * com o app em segundo plano).
 *
 * O servidor recebe a DURAÇÃO, não um horário, e calcula o disparo pelo
 * próprio relógio: assim o relógio errado de um aparelho não adianta nem
 * atrasa o aviso.
 *
 * Não agenda quando: não há descanso, ele está pausado, a meta já foi
 * atingida (o bip do próprio app já tocou) ou o aviso já foi emitido.
 */
export function segundosAteOAviso(estado: EstadoDescanso | null, agoraMs: number): number | null {
  if (!estado || estado.avisoMetaEmitido) return null;
  const painel = painelDoDescanso(estado, agoraMs);
  if (painel.pausado || painel.metaAtingida) return null;

  const decorridoMs =
    estado.acumuladoAtivoMs + (estado.iniciadoEmMs === null ? 0 : Math.max(0, agoraMs - estado.iniciadoEmMs));
  const faltaMs = estado.metaSegundos * 1000 - decorridoMs;
  return faltaMs > 0 ? Math.ceil(faltaMs / 1000) : null;
}
